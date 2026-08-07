import "server-only";
import { Source, isSuperseded, type TSource } from "@suite/case-model";

/**
 * case-context.ts — the VS-1 case-context resolver (VS-0 map §4 item 3).
 *
 * One authorized server-side read of a case and its finalized Sources
 * (teacher intake + RIE Capture) into one canonical context object, under
 * the D-046 contracts:
 *
 *   - Only FINALIZED Sources enter the context. Unfinalized/unconfirmed
 *     Capture proposals are structurally excluded twice over: a proposal
 *     lives in capture_sessions.summary_proposal and never becomes a
 *     sources row until the clinician confirms finalization; and the
 *     resolver additionally refuses any sources row with locked=false.
 *   - Supersession chains resolve to the current Source; "superseded" is
 *     DERIVED (a newer Source points at the row) exactly as in
 *     @suite/case-model isSuperseded — never read from a status column.
 *   - Every Source is validated through the canonical @suite/case-model
 *     Source schema, so the context is contract-shaped, not row-shaped
 *     (directive §12.1: shared material resolves through the canonical
 *     contracts, no PsychReport-only copy).
 *   - Deleted material (case or source retention deletes) never resolves.
 *
 * Authorization: `resolveCaseContext` runs on a caller-supplied Supabase
 * client. Pass the RLS-scoped client (lib/supabase/server) and row-level
 * security answers cross-account access at the database — a case the caller
 * cannot see resolves to null, indistinguishable from absent. Server code
 * may pass the service client only after authorization has already been
 * established (route ownership check or mayActOnCase).
 */

/** Minimal Supabase shape — real or mocked (same pattern as intake cores). */
export interface SupabaseLike {
  from(table: string): any;
}

export interface CaseRow {
  id: string;
  psychologist_id: string;
  state: string;
  eval_type: string;
  referral_date: string;
  status: string;
  first_name: string | null;
  last_initial: string | null;
  display_initials: string;
  grade: string;
  student_ref: string;
  priority_flag: boolean;
  created_at: string;
  deleted_at: string | null;
}

export interface SourceRow {
  id: string;
  case_id: string;
  informant_id: string | null;
  kind: string;
  collected_on: string;
  instrument: string | null;
  bank_id: string | null;
  bank_version: string | null;
  payload: unknown;
  locked: boolean;
  checksum: string | null;
  version: number;
  supersedes_source_id: string | null;
  created_at: string;
  deleted_at: string | null;
}

/** A finalized Source in context: canonical shape + its locked payload. */
export interface ContextSource {
  /** Canonical @suite/case-model Source (parsed, not merely cast). */
  source: TSource;
  /** The locked payload content (teacher-intake responses, capture record). */
  payload: unknown;
  /** Derived: a newer finalized Source supersedes this one. */
  superseded: boolean;
}

export interface CaseContext {
  caseId: string;
  student: {
    firstName: string | null;
    lastInitial: string | null;
    displayInitials: string;
    grade: string;
  };
  state: string;
  evalType: string;
  referralDate: string;
  status: string;
  priorityFlag: boolean;
  /** Every finalized Source on the case, superseded chains included. */
  sources: ContextSource[];
  /** The consumable view: finalized Sources not superseded by a newer one. */
  currentSources: ContextSource[];
}

/** Postgres timestamptz → the Z-normalized ISO form the zod contract expects. */
const isoZ = (ts: string): string => new Date(ts).toISOString();

/** DB row → canonical @suite/case-model Source. Throws if the row cannot
 *  satisfy the contract — a contract violation must fail loudly, not resolve. */
export function sourceFromRow(row: SourceRow): TSource {
  return Source.parse({
    sourceId: row.id,
    caseId: row.case_id,
    informantId: row.informant_id,
    kind: row.kind,
    collectedOn: row.collected_on,
    instrument: row.instrument,
    bank:
      row.bank_id && row.bank_version
        ? { bankId: row.bank_id, bankVersion: row.bank_version }
        : null,
    payloadRef: row.id,
    locked: row.locked,
    checksum: row.checksum,
    version: row.version,
    supersedesSourceId: row.supersedes_source_id,
    retention: { autoPurgeDays: null, deletedAt: row.deleted_at ? isoZ(row.deleted_at) : null },
    createdAt: isoZ(row.created_at),
  });
}

/**
 * Pure assembly: case row + source rows → canonical context. Network-free
 * and unit-tested; the resolver below is the thin authorized read over it.
 * Rows that are unlocked or deleted are excluded here even if a future
 * query change lets them through — the structural exclusion is defended at
 * both layers.
 */
export function buildCaseContext(caseRow: CaseRow, sourceRows: SourceRow[]): CaseContext {
  const finalizedRows = sourceRows.filter((r) => r.locked && r.deleted_at === null);
  const canonical = finalizedRows.map(sourceFromRow);
  const sources: ContextSource[] = finalizedRows.map((row, i) => ({
    source: canonical[i],
    payload: row.payload,
    superseded: isSuperseded(canonical[i].sourceId, canonical),
  }));

  return {
    caseId: caseRow.id,
    student: {
      firstName: caseRow.first_name,
      lastInitial: caseRow.last_initial,
      displayInitials: caseRow.display_initials,
      grade: caseRow.grade,
    },
    state: caseRow.state,
    evalType: caseRow.eval_type,
    referralDate: caseRow.referral_date,
    status: caseRow.status,
    priorityFlag: caseRow.priority_flag,
    sources,
    currentSources: sources.filter((s) => !s.superseded),
  };
}

/**
 * The authorized read. Returns null when the case does not exist, is
 * deleted, or is not visible to the caller's RLS context — deliberately
 * indistinguishable, so a cross-account probe learns nothing.
 */
export async function resolveCaseContext(
  db: SupabaseLike,
  caseId: string
): Promise<CaseContext | null> {
  const { data: caseRow, error: caseErr } = await db
    .from("cases")
    .select(
      "id, psychologist_id, state, eval_type, referral_date, status, first_name, last_initial, display_initials, grade, student_ref, priority_flag, created_at, deleted_at"
    )
    .eq("id", caseId)
    .is("deleted_at", null)
    .maybeSingle();
  if (caseErr) throw caseErr;
  if (!caseRow) return null;

  const { data: sourceRows, error: srcErr } = await db
    .from("sources")
    .select(
      "id, case_id, informant_id, kind, collected_on, instrument, bank_id, bank_version, payload, locked, checksum, version, supersedes_source_id, created_at, deleted_at"
    )
    .eq("case_id", caseId)
    .eq("locked", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (srcErr) throw srcErr;

  return buildCaseContext(caseRow as CaseRow, (sourceRows ?? []) as SourceRow[]);
}
