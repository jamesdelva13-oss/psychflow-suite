import type {
  InterpretiveCeiling,
  SectionMode,
  SourceInterpretationPolicy,
} from "@suite/reasoning-contracts";
import type { PolicedSource } from "./source-policy";
import type { ScoreVerification } from "./scores";
import type { SessionEvidenceItem } from "./session-evidence";

/**
 * evidence-snapshot.ts — the record of what was actually supplied to one
 * generation.
 *
 * This is a SNAPSHOT, not a reference list, and that is the whole point.
 * Sources supersede (migration 0007) and sections are scoped to a subset of
 * them (report-plan.ts gateSection), so reconstructing "what did the model
 * see" later from source ids plus current rows is unreliable — it would show
 * today's version of a source, filtered by today's plan, against today's
 * verification state. The snapshot holds the verbatim blocks the model was
 * given, so the question "was this sentence supported by what was supplied"
 * stays answerable a year later.
 *
 * Pure. Persisted to report_sections.evidence_snapshot (migration 0009).
 */

export interface EvidenceSnapshotSource {
  sourceId: string;
  kind: string;
  label: string;
  version: number;
  checksum: string | null;
  collectedOn: string;
  /** The canonical resolver's answer at generation time, not the declared field. */
  ceiling: InterpretiveCeiling;
  reviewBeforeIntegration: boolean;
  policy: SourceInterpretationPolicy;
}

export interface EvidenceSnapshot {
  at: string;
  sectionKey: string;
  mode: SectionMode;
  sources: EvidenceSnapshotSource[];
  /** Verbatim SOURCE LIMITS block as sent. "" when there were no sources. */
  sourceLimits: string;
  /** Verbatim CASE DATA block as sent. */
  caseData: string;
  /** The session evidence the gate judged against. */
  sessionEvidence: SessionEvidenceItem[];
  /** Verification state in force at generation time (it decides ceilings). */
  scoreVerifications: ScoreVerification[];
}

export function buildEvidenceSnapshot(args: {
  sectionKey: string;
  mode: SectionMode;
  sources: PolicedSource[];
  sourceLimits: string;
  caseData: string;
  sessionEvidence: SessionEvidenceItem[];
  scoreVerifications: ScoreVerification[];
}): EvidenceSnapshot {
  return {
    at: new Date().toISOString(),
    sectionKey: args.sectionKey,
    mode: args.mode,
    sources: args.sources.map((s) => ({
      sourceId: s.source.sourceId,
      kind: s.source.kind,
      label: s.label,
      version: s.source.version,
      checksum: s.source.checksum ?? null,
      collectedOn: s.source.collectedOn,
      ceiling: s.ceiling,
      reviewBeforeIntegration: s.reviewBeforeIntegration,
      policy: s.policy,
    })),
    sourceLimits: args.sourceLimits,
    caseData: args.caseData,
    sessionEvidence: args.sessionEvidence,
    scoreVerifications: args.scoreVerifications,
  };
}
