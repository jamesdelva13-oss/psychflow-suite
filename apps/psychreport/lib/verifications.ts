import "server-only";
import type { SupabaseLike } from "./case-context";
import type { ScoreVerification } from "./scores";

/**
 * Score verifications live in the append-only audit trail rather than in a
 * mutable column, for two reasons the repo has already settled elsewhere:
 * Sources are immutable once locked, so a verification cannot write back
 * into the score payload; and §5.5 requires every resolution to be
 * attributed and timestamped. Verification state is therefore DERIVED by
 * replaying `score_verified` events — the same "derived, never mutated"
 * shape supersession uses.
 */

export const SCORE_VERIFIED = "score_verified";

interface AuditRow {
  actor: string;
  created_at: string;
  metadata: { sourceId?: string; scoreKey?: string } | null;
}

/** Replay every score verification recorded on a case. */
export async function listScoreVerifications(
  db: SupabaseLike,
  caseId: string
): Promise<ScoreVerification[]> {
  const { data, error } = await db
    .from("audit_events")
    .select("actor, created_at, metadata")
    .eq("case_id", caseId)
    .eq("event_type", SCORE_VERIFIED)
    .order("created_at", { ascending: true });
  if (error) throw error;

  return ((data ?? []) as AuditRow[]).flatMap((r) => {
    const sourceId = r.metadata?.sourceId;
    const scoreKey = r.metadata?.scoreKey;
    if (!sourceId || !scoreKey) return []; // malformed rows never become state
    return [{ sourceId, scoreKey, actor: r.actor, at: r.created_at }];
  });
}
