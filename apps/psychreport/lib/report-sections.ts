import "server-only";
import type { SupabaseLike } from "./case-context";
import type { GeneratedSection } from "./generate";
import type { DraftStatus } from "@suite/ui";

/**
 * report-sections.ts — persistence for drafted report content (migration
 * 0009).
 *
 * TWO TABLES, mirroring the schema's split (see the migration header):
 *
 *   report_section_generations  one row per DRAFTING ATTEMPT, insert-only,
 *                               every gate column NOT NULL;
 *   report_sections             one row per version AS PRESENTED.
 *
 * A rejected attempt gets a generation row and NO section row: it was refused
 * before the clinician saw it. It is kept, never deleted (D-140), and it can
 * never be the current section because it has no section row to be one.
 *
 * The machine/human discriminator is `generation_id`, which is structural: a
 * section row that references a generation necessarily references a verdict,
 * because the verdict columns cannot be null over there. Nothing here sets a
 * flag that says "this was machine-written."
 *
 * MIGRATION 0009 IS NOT APPLIED YET. Every read and write below reports
 * `unavailable` rather than throwing when the tables are absent, so the
 * writer renders an honest "not yet available" state instead of a stack
 * trace. Remove nothing when the DDL lands — the check costs one comparison
 * and covers the next unapplied migration too.
 */

/** PostgREST/Postgres shapes for "that relation does not exist". */
function isMissingRelation(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  return /relation .* does not exist|could not find the table/i.test(error.message ?? "");
}

export interface StoredGeneration {
  id: string;
  content: string;
  attempt: number;
  gateMode: "shadow" | "enforce";
  gateSpec: string;
  gateOutcome: string;
  wouldEnforce: string;
  adjudication: { verdict: string; unsupportedStatements: string[]; reason: string };
  rejectionReason: string | null;
  promptVersion: string;
  specVersion: string;
  sourceIds: string[];
}

export interface StoredSection {
  id: string;
  sectionKey: string;
  mode: string;
  content: string;
  status: "proposed" | "accepted" | "dismissed";
  version: number;
  /** Null → the clinician wrote this version. */
  generation: StoredGeneration | null;
}

export type Loaded =
  | { available: true; sections: StoredSection[] }
  | { available: false; reason: string };

const GEN_COLUMNS =
  "id, content, attempt, gate_mode, gate_spec, gate_outcome, would_enforce, adjudication, rejection_reason, prompt_version, spec_version, source_ids";

interface GenRow {
  id: string;
  content: string;
  attempt: number;
  gate_mode: "shadow" | "enforce";
  gate_spec: string;
  gate_outcome: string;
  would_enforce: string;
  adjudication: StoredGeneration["adjudication"];
  rejection_reason: string | null;
  prompt_version: string;
  spec_version: string;
  source_ids: string[];
}

const toGeneration = (g: GenRow | null): StoredGeneration | null =>
  g
    ? {
        id: g.id,
        content: g.content,
        attempt: g.attempt,
        gateMode: g.gate_mode,
        gateSpec: g.gate_spec,
        gateOutcome: g.gate_outcome,
        wouldEnforce: g.would_enforce,
        adjudication: g.adjudication,
        rejectionReason: g.rejection_reason,
        promptVersion: g.prompt_version,
        specVersion: g.spec_version,
        sourceIds: g.source_ids ?? [],
      }
    : null;

/**
 * The latest visible version of every section on a case. Reads the
 * `report_sections_latest` view, so "latest" is the schema's definition
 * rather than a filter this module has to remember.
 */
export async function loadReportSections(db: SupabaseLike, caseId: string): Promise<Loaded> {
  const { data, error } = await db
    .from("report_sections_latest")
    .select(
      `id, section_key, mode, content, status, version,
       generation:report_section_generations!generation_id (${GEN_COLUMNS})`
    )
    .eq("case_id", caseId);

  if (error) {
    if (isMissingRelation(error)) {
      return {
        available: false,
        reason: "Migration 0009 has not been applied to this instance yet.",
      };
    }
    throw error;
  }

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    section_key: string;
    mode: string;
    content: string;
    status: StoredSection["status"];
    version: number;
    generation: GenRow | GenRow[] | null;
  }>;

  return {
    available: true,
    sections: rows.map((r) => ({
      id: r.id,
      sectionKey: r.section_key,
      mode: r.mode,
      content: r.content,
      status: r.status,
      version: r.version,
      generation: toGeneration(Array.isArray(r.generation) ? r.generation[0] ?? null : r.generation),
    })),
  };
}

/* ------------------------------------------------------------------ *
 * Writes
 * ------------------------------------------------------------------ */

export type WriteResult = { ok: true; sectionId: string } | { ok: false; unavailable: true };

/**
 * Persist one completed generation.
 *
 * Every attempt becomes a generation row, INCLUDING the rejected first draft
 * — the refused language is kept, and the retry points at what it replaced.
 * Only the surfaced attempt gets a section row.
 *
 * `supersedesSectionId` is the clinician-visible chain: a regeneration
 * supersedes the version it replaces on screen. It is deliberately separate
 * from `supersedes_generation_id`, which is the gate's retry chain — a gate
 * rejection is not a clinician act.
 */
export async function persistGeneration(
  svc: SupabaseLike,
  args: {
    caseId: string;
    section: GeneratedSection;
    actor: string;
    supersedesSectionId?: string | null;
    nextVersion: number;
  }
): Promise<WriteResult> {
  const { caseId, section, actor } = args;
  const f = section.fidelity;

  let previousGenerationId: string | null = null;
  let surfacedGenerationId = "";

  for (let i = 0; i < f.attempts.length; i++) {
    const at = f.attempts[i];
    const isLast = i === f.attempts.length - 1;

    // A non-final attempt is by definition the one the gate refused and the
    // retry replaced.
    const gateOutcome = isLast ? f.outcome : "rejected";
    const wouldEnforce = isLast ? f.wouldEnforce : "rejected";
    const cleared = gateOutcome === "passed" || gateOutcome === "passed_after_retry";

    const { data, error }: { data: { id: string } | null; error: { code?: string; message?: string } | null } = await svc
      .from("report_section_generations")
      .insert({
        case_id: caseId,
        section_key: section.sectionKey,
        mode: section.mode,
        content: at.content,
        attempt: at.attempt,
        supersedes_generation_id: previousGenerationId,
        generated_by: at.generatedBy,
        prompt_version: section.promptVersion,
        spec_version: section.specVersion,
        evidence_snapshot: section.evidenceSnapshot,
        source_ids: section.sourceIds,
        gate_mode: f.mode,
        gate_spec: f.gate,
        gate_outcome: gateOutcome,
        would_enforce: wouldEnforce,
        adjudicator: at.adjudication.provenance,
        adjudication: {
          verdict: at.adjudication.verdict,
          pass: at.adjudication.pass,
          unsupportedStatements: at.adjudication.unsupportedStatements,
          reason: at.adjudication.reason,
        },
        rejection_reason: cleared ? null : at.adjudication.reason,
        created_by: actor,
      })
      .select("id")
      .single();

    if (error) {
      if (isMissingRelation(error)) return { ok: false, unavailable: true };
      throw error;
    }
    previousGenerationId = data!.id;
    if (isLast) surfacedGenerationId = previousGenerationId;
  }

  const { data: sec, error: secErr } = await svc
    .from("report_sections")
    .insert({
      case_id: caseId,
      section_key: section.sectionKey,
      mode: section.mode,
      // The trigger requires this to equal the generation's content exactly.
      content: section.content,
      generation_id: surfacedGenerationId,
      status: "proposed",
      version: args.nextVersion,
      supersedes_id: args.supersedesSectionId ?? null,
      created_by: actor,
    })
    .select("id")
    .single();

  if (secErr) {
    if (isMissingRelation(secErr)) return { ok: false, unavailable: true };
    throw secErr;
  }
  return { ok: true, sectionId: (sec as { id: string }).id };
}

/** Record a clinician decision. Append-only; never overwrites a prior act. */
export async function recordReview(
  svc: SupabaseLike,
  args: {
    caseId: string;
    sectionId: string;
    action:
      | "accepted"
      | "dismissed"
      | "edited"
      | "flagged_needs_review"
      | "accepted_over_gate_finding"
      | "regeneration_requested";
    actor: string;
    note?: string;
  }
): Promise<void> {
  const { error } = await svc.from("report_section_reviews").insert({
    case_id: args.caseId,
    section_id: args.sectionId,
    action: args.action,
    actor: args.actor,
    note: args.note ?? null,
  });
  if (error && !isMissingRelation(error)) throw error;
}

export async function setSectionStatus(
  svc: SupabaseLike,
  args: { sectionId: string; status: "accepted" | "dismissed"; actor: string }
): Promise<void> {
  const patch: Record<string, unknown> = { status: args.status };
  if (args.status === "accepted") {
    patch.accepted_at = new Date().toISOString();
    patch.accepted_by = args.actor;
  }
  const { error } = await svc.from("report_sections").update(patch).eq("id", args.sectionId);
  if (error && !isMissingRelation(error)) throw error;
}

/**
 * A clinician edit inserts a NEW version with no generation link. The prior
 * generated version is frozen by the supersession trigger, so the adjudicated
 * text stays intact and distinct from the current text — the edit cannot
 * overwrite what the gate judged.
 */
export async function saveClinicianEdit(
  svc: SupabaseLike,
  args: {
    caseId: string;
    prior: StoredSection;
    content: string;
    actor: string;
  }
): Promise<WriteResult> {
  const { data, error } = await svc
    .from("report_sections")
    .insert({
      case_id: args.caseId,
      section_key: args.prior.sectionKey,
      mode: args.prior.mode,
      content: args.content,
      generation_id: null,
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_by: args.actor,
      version: args.prior.version + 1,
      supersedes_id: args.prior.id,
      created_by: args.actor,
    })
    .select("id")
    .single();

  if (error) {
    if (isMissingRelation(error)) return { ok: false, unavailable: true };
    throw error;
  }
  return { ok: true, sectionId: (data as { id: string }).id };
}

/* ------------------------------------------------------------------ *
 * Presentation
 * ------------------------------------------------------------------ */

/**
 * The DraftSection status dot. `flagged` is reserved for an ENFORCE-mode
 * needs-review generation — a shadow verdict never colours the clinician's
 * screen, which is what "the clinician sees nothing from the gate in shadow"
 * means at the presentation layer.
 */
export function draftStatusOf(section: StoredSection | undefined): DraftStatus {
  if (!section) return "empty";
  if (section.status === "accepted") return "reviewed";
  const g = section.generation;
  if (g && g.gateMode === "enforce" && g.gateOutcome === "needs_review") return "flagged";
  return "unreviewed";
}
