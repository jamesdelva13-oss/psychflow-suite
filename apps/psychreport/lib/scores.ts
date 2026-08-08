import type { ParserConfidence } from "@suite/reasoning-contracts";
import type { ContextSource } from "./case-context";

/**
 * scores.ts — the deterministic score layer (directive §9.4: "Deterministic
 * calculations and score structures should remain deterministic. The model
 * narrates validated results; it does not invent or silently correct
 * scores.").
 *
 * Everything here is pure. No model ever reaches these numbers: the writer
 * receives narrated, already-validated values, and the verification state
 * below is what decides whether a score set may be interpreted at all
 * (see source-policy.ts).
 *
 * Extraction confidence uses the canonical `ParserConfidence` from
 * @suite/reasoning-contracts — the same vocabulary the QA Engine's parse
 * trust uses. It is deliberately NOT re-minted here.
 */

/** One score as extracted from a score report, before or after review. */
export interface ExtractedScore {
  /** Stable key within the set — the verification target. */
  key: string;
  subtest: string;
  standardScore: number;
  ci95: [number, number];
  percentile: number;
  /** How well the extractor read this row. */
  extraction: ParserConfidence;
  /** Where in the document it was read from, for "View source". */
  location: string;
}

export interface ScoreSetPayload {
  instrument: string;
  administeredOn: string;
  form: string;
  scores: ExtractedScore[];
}

/** A score joined to its verification state. */
export interface ScoreRow extends ExtractedScore {
  /** True once a clinician has confirmed the value against the protocol. */
  verified: boolean;
  /** Set when verified: who and when (audit-trail material, §5.5). */
  verifiedBy?: string;
  verifiedAt?: string;
  /** Needs clinician judgment before the set can be interpreted. */
  needsVerification: boolean;
}

/** A verification act, replayed from the append-only audit trail. */
export interface ScoreVerification {
  sourceId: string;
  scoreKey: string;
  actor: string;
  at: string;
}

export const isScoreSet = (cs: ContextSource): boolean => cs.source.kind === "score_set";

/**
 * Join extracted scores to their verifications. A score needs verification
 * when the extractor was not confident and no clinician has confirmed it;
 * a cleanly parsed score needs no ceremony (the product rule: put human
 * judgment where judgment actually matters, not on every extracted field).
 */
export function buildScoreRows(
  payload: ScoreSetPayload,
  verifications: ScoreVerification[],
  sourceId: string
): ScoreRow[] {
  const byKey = new Map(
    verifications.filter((v) => v.sourceId === sourceId).map((v) => [v.scoreKey, v])
  );
  return payload.scores.map((s) => {
    const v = byKey.get(s.key);
    const verified = Boolean(v);
    return {
      ...s,
      verified,
      verifiedBy: v?.actor,
      verifiedAt: v?.at,
      needsVerification: s.extraction !== "parsed_ok" && !verified,
    };
  });
}

/** Scores still awaiting clinician confirmation. */
export const openVerifications = (rows: ScoreRow[]): ScoreRow[] =>
  rows.filter((r) => r.needsVerification);

/**
 * A score set is READ-CONFIRMED when nothing in it is still awaiting
 * confirmation. This is the single fact source-policy.ts consumes to decide
 * whether the set may be interpreted or only described — which is what makes
 * verification consequential rather than decorative.
 */
export const scoreSetReadConfirmed = (rows: ScoreRow[]): boolean =>
  openVerifications(rows).length === 0;
