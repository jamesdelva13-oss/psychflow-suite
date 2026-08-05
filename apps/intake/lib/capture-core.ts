import "server-only";
import { createHash } from "node:crypto";

// Capture core (D-125): injectable logic for the clinician notetaking +
// summarization flow. Mirrors submit-core: routes stay thin, everything
// decision-bearing lives here and is unit-tested with a mocked Supabase.

export type CaptureKind = "interview" | "observation" | "call" | "other";
export type CaptureStatus = "open" | "proposal_ready" | "finalized";

export interface SummaryGeneration {
  requestedModel: string;
  servedModel: string;
  promptVersion: string;
  schemaVersion: string;
  pseudonymized: true;
  createdAt: string;
}

export interface SummaryProposal {
  text: string;
  generation: SummaryGeneration;
}

export interface CaptureSessionRow {
  id: string;
  case_id: string;
  psychologist_id: string;
  informant_id: string | null;
  kind: CaptureKind;
  setting: string | null;
  occurred_on: string; // YYYY-MM-DD
  notes: string;
  status: CaptureStatus;
  summary_proposal: SummaryProposal | null;
  summary_final: string | null;
  source_id: string | null;
}

/** Minimal Supabase shape — real or mocked (same pattern as submit-core). */
export interface SupabaseLike {
  from(table: string): any;
}

// ---------------------------------------------------------------------------
// Pseudonymization (data-posture §7): the D-120 identity fields are replaced
// with a neutral placeholder before any model call. This is the committed
// minimum — free text may still contain other names (informants, staff);
// those identify contributors, not the student, and are out of D-120 scope.
// ---------------------------------------------------------------------------

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function pseudonymizeNotes(
  notes: string,
  identity: { firstName: string | null; lastInitial: string | null }
): { text: string; replacements: number } {
  const first = identity.firstName?.trim();
  if (!first) return { text: notes, replacements: 0 };
  let replacements = 0;
  let text = notes;

  // "Avery W." / "Avery W" first, so the bare-name pass doesn't leave " W." behind.
  if (identity.lastInitial) {
    const pair = new RegExp(
      `\\b${esc(first)}\\s+${esc(identity.lastInitial)}\\.?(?![A-Za-z])`,
      "gi"
    );
    text = text.replace(pair, () => {
      replacements++;
      return "the student";
    });
  }
  const bare = new RegExp(`\\b${esc(first)}\\b`, "gi");
  text = text.replace(bare, () => {
    replacements++;
    return "the student";
  });
  return { text, replacements };
}

// ---------------------------------------------------------------------------
// Canonical payload + checksum: stable key order so the locked Source hashes
// identically regardless of object construction order.
// ---------------------------------------------------------------------------

export function canonicalStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalStringify).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonicalStringify(v)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

export function checksumOf(payload: unknown): string {
  return createHash("sha256").update(canonicalStringify(payload)).digest("hex");
}

/** capture kinds → sources.kind (0001 check constraint has no 'call'). */
export function sourceKindFor(kind: CaptureKind): "interview" | "observation" | "other" {
  if (kind === "observation") return "observation";
  if (kind === "other") return "other";
  return "interview"; // interview + call
}

// ---------------------------------------------------------------------------
// Finalize: the accountability gate. Server-enforced, never trusted from the
// client. Rules (D-125 / D-081):
//   * finalize requires the explicit confirmation checkbox;
//   * an unconfirmed proposal NEVER enters the Source — only summaryFinal the
//     clinician explicitly submitted travels;
//   * notes-only finalize (no summary at all) is allowed;
//   * provenance records whether the final summary was the proposal verbatim,
//     an edited proposal, or clinician-authored with no model involvement.
// ---------------------------------------------------------------------------

export interface FinalizeResult {
  status: number;
  body: Record<string, unknown>;
  ok: boolean;
  sourceId?: string;
}

export async function finalizeCapture(deps: {
  svc: SupabaseLike;
  session: CaptureSessionRow;
  body: { summaryFinal?: string | null; confirmed?: boolean };
  now?: Date;
}): Promise<FinalizeResult> {
  const { svc, session, body } = deps;
  const now = deps.now ?? new Date();

  if (session.status === "finalized") {
    return { status: 409, body: { error: "already_finalized" }, ok: false };
  }
  if (body.confirmed !== true) {
    return { status: 422, body: { error: "confirmation_required" }, ok: false };
  }
  if (!session.notes.trim()) {
    return { status: 422, body: { error: "empty_notes" }, ok: false };
  }

  const summaryFinal =
    typeof body.summaryFinal === "string" && body.summaryFinal.trim()
      ? body.summaryFinal.trim()
      : null;

  const proposal = session.summary_proposal;
  const summaryProvenance =
    summaryFinal && proposal
      ? {
          generation: proposal.generation,
          acceptedVerbatim: summaryFinal === proposal.text.trim(),
        }
      : null; // no summary, or clinician-authored with no proposal in play

  const payload = {
    captureSessionId: session.id,
    kind: session.kind,
    setting: session.setting,
    occurredOn: session.occurred_on,
    notes: session.notes,
    summaryFinal,
    summaryProvenance,
    finalizedAt: now.toISOString(),
  };

  const { data: source, error: srcErr } = await svc
    .from("sources")
    .insert({
      case_id: session.case_id,
      informant_id: session.informant_id,
      kind: sourceKindFor(session.kind),
      collected_on: session.occurred_on,
      instrument: "capture",
      payload,
      locked: true,
      checksum: checksumOf(payload),
    })
    .select("id")
    .single();
  if (srcErr || !source) {
    return { status: 500, body: { error: srcErr?.message ?? "source_insert_failed" }, ok: false };
  }

  const { error: updErr } = await svc
    .from("capture_sessions")
    .update({
      status: "finalized",
      summary_final: summaryFinal,
      source_id: source.id,
      updated_at: now.toISOString(),
    })
    .eq("id", session.id);
  if (updErr) {
    return { status: 500, body: { error: updErr.message }, ok: false };
  }

  return { status: 200, body: { sourceId: source.id }, ok: true, sourceId: source.id };
}
