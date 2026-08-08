import {
  QuestionBank,
  type TSource,
} from "@suite/case-model";
import {
  effectiveCeiling,
  isScopeUnestablished,
  requiresReviewBeforeIntegration,
  type InterpretiveCeiling,
  type SourceInterpretationPolicy,
  type SourceScope,
  type ValidityStatus,
} from "@suite/reasoning-contracts";
import bank13raw from "@suite/content/banks/teacher-form.v1.3.0.json" with { type: "json" };
import type { CaseContext, ContextSource } from "./case-context";
import {
  buildScoreRows,
  scoreSetReadConfirmed,
  type ScoreSetPayload,
  type ScoreVerification,
} from "./scores";

/**
 * source-policy.ts — every resolved case Source gets an interpretation
 * policy, and generation consumes sources ONLY through this module.
 *
 * This closes the inherited defect the log makes a binding build
 * requirement (D-099 + D-118): the old prototype's live path called the
 * model with `{data}` alone, so its `sourcePolicyBlock` returned "" and the
 * ceiling resolver — itself a divergent duplicate — was never reached. The
 * running app enforced no interpretive ceiling at all.
 *
 * Two structural defences, not conventions:
 *   1. The ceiling comes from the CANONICAL `effectiveCeiling` in
 *      @suite/reasoning-contracts. No resolver is defined in this repo.
 *      (D-118's second defect was a local divergent copy.)
 *   2. `GenerationInputs` is the only shape the writer accepts, and it
 *      cannot be constructed without policies — so "forgot to pass the
 *      sources" is a type error rather than a silent safety failure.
 */

/** Constructs a WIAT-4 reading battery speaks to. Instrument-level fact. */
const WIAT4_READING_CONSTRUCTS = ["ACAD.READ"];

/** Question-id → constructIds, read from the pinned bank version. */
function bankConstructs(responses: Record<string, unknown>): string[] {
  const bank = QuestionBank.parse(bank13raw);
  const answered = new Set(Object.keys(responses ?? {}));
  const out = new Set<string>();
  for (const mod of bank.modules) {
    for (const q of mod.questions) {
      if (!answered.has(q.id)) continue;
      for (const c of q.constructIds ?? []) out.add(c);
    }
  }
  return [...out];
}

/**
 * A Source with its policy and the resolved ceiling. `ceiling` is always
 * the canonical guard's answer, never the raw `interpretiveCeiling` field —
 * reading that field directly is the mistake `effectiveCeiling` exists to
 * prevent.
 */
export interface PolicedSource {
  source: TSource;
  payload: unknown;
  policy: SourceInterpretationPolicy;
  ceiling: InterpretiveCeiling;
  reviewBeforeIntegration: boolean;
  /** Plain-language label for UI; internal enums never surface (§9.1). */
  label: string;
}

/** The ONLY payload shape the writer accepts. See defence 2 above. */
export interface GenerationInputs {
  caseId: string;
  student: CaseContext["student"];
  evalType: string;
  /** Current, non-superseded, finalized Sources with their policies. */
  sources: PolicedSource[];
}

function scoreSetPolicy(
  cs: ContextSource,
  verifications: ScoreVerification[]
): SourceInterpretationPolicy {
  const payload = cs.payload as ScoreSetPayload;
  const rows = buildScoreRows(payload, verifications, cs.source.sourceId);
  const readConfirmed = scoreSetReadConfirmed(rows);

  /* The score-verification linkage, and the reason verification is
   * consequential rather than decorative: until every low-confidence
   * extraction has been confirmed against the protocol, we do not know we
   * read the instrument correctly, so its validity is NOT_ESTABLISHED and
   * the canonical guard caps the set at DESCRIBE_ONLY. Confirming the score
   * raises it to an integrable source. */
  const validityStatus: ValidityStatus = readConfirmed ? "ACCEPTABLE" : "NOT_ESTABLISHED";

  const scope: SourceScope = {
    informant: "EXAMINER",
    settings: ["TESTING"],
    constructs: WIAT4_READING_CONSTRUCTS,
    timeframe: payload.administeredOn,
  };

  return {
    sourceId: cs.source.sourceId,
    validityStatus,
    interpretiveCeiling: "INTEGRATE_WITH_QUALIFICATION",
    scope,
    limitationSummary: readConfirmed
      ? "Standardized administration; testing-session performance may differ from daily classroom performance."
      : "One or more scores have not been confirmed against the protocol.",
    establishedBy: "INSTRUMENT_DEFAULT",
    professionalReviewRequired: !readConfirmed,
  };
}

function teacherIntakePolicy(cs: ContextSource): SourceInterpretationPolicy {
  const payload = cs.payload as { responses?: Record<string, unknown> };
  const scope: SourceScope = {
    informant: "TEACHER",
    settings: ["SCHOOL"],
    constructs: bankConstructs(payload.responses ?? {}),
    timeframe: cs.source.collectedOn,
  };
  return {
    sourceId: cs.source.sourceId,
    validityStatus: "ACCEPTABLE",
    interpretiveCeiling: "INTEGRATE_WITH_QUALIFICATION",
    scope,
    limitationSummary:
      "Single classroom informant reporting on the school setting; does not speak to home or community.",
    establishedBy: "INSTRUMENT_DEFAULT",
    professionalReviewRequired: false,
  };
}

function capturePolicy(cs: ContextSource): SourceInterpretationPolicy {
  /* NOTE (verified gap, VS-3): RIE Capture finalization records setting,
   * notes, and the summary — but no construct tags. Construct scope is
   * therefore UNESTABLISHED, and GUARD 2 caps this source at DESCRIBE_ONLY:
   * the interview may be described and quoted faithfully, but not
   * integrated. That is the guard behaving correctly on the data we
   * actually have, not a modelling shortcut. Raising it requires either
   * clinician-declared constructs at Capture finalization or a professional
   * scope establishment — a ruling, not a code change. */
  const payload = cs.payload as { setting?: string; occurredOn?: string };
  const scope: SourceScope = {
    informant: "TEACHER",
    settings: ["SCHOOL"],
    constructs: [],
    timeframe: payload.occurredOn ?? cs.source.collectedOn,
    observationContext: payload.setting,
  };
  return {
    sourceId: cs.source.sourceId,
    validityStatus: "ACCEPTABLE",
    interpretiveCeiling: "INTEGRATE_WITH_QUALIFICATION",
    scope,
    limitationSummary:
      "Clinician-summarized interview; no structured construct coverage was recorded at finalization.",
    establishedBy: "INSTRUMENT_DEFAULT",
    professionalReviewRequired: false,
  };
}

function fallbackPolicy(cs: ContextSource): SourceInterpretationPolicy {
  /* Unknown source kinds fail SAFE: no scope is established, so the
   * canonical guard returns DESCRIBE_ONLY. A source type nobody has
   * modelled must never arrive at the model as interpretable. */
  return {
    sourceId: cs.source.sourceId,
    validityStatus: "NOT_ESTABLISHED",
    interpretiveCeiling: "DESCRIBE_ONLY",
    scope: { settings: [], constructs: [] },
    limitationSummary: "Source type has no interpretation policy; description only.",
    establishedBy: "INSTRUMENT_DEFAULT",
    professionalReviewRequired: true,
  };
}

const LABELS: Record<string, string> = {
  referral_form: "Teacher input",
  interview: "Interview notes and summary",
  score_set: "Assessment results",
  observation: "Observation",
  rating_scale: "Rating scale",
  prior_report: "Prior evaluation",
  records: "Records",
  work_sample: "Work sample",
};

export function policyFor(
  cs: ContextSource,
  verifications: ScoreVerification[]
): SourceInterpretationPolicy {
  switch (cs.source.kind) {
    case "referral_form":
      return teacherIntakePolicy(cs);
    case "interview":
      return capturePolicy(cs);
    case "score_set":
      return scoreSetPolicy(cs, verifications);
    default:
      return fallbackPolicy(cs);
  }
}

export function policeSource(
  cs: ContextSource,
  verifications: ScoreVerification[]
): PolicedSource {
  const policy = policyFor(cs, verifications);
  return {
    source: cs.source,
    payload: cs.payload,
    policy,
    // Canonical guard. Never `policy.interpretiveCeiling` directly.
    ceiling: effectiveCeiling(policy),
    reviewBeforeIntegration: requiresReviewBeforeIntegration(policy),
    label: LABELS[cs.source.kind] ?? cs.source.kind,
  };
}

/**
 * Assemble the writer's inputs. Only current (non-superseded) finalized
 * Sources participate; each arrives carrying its policy and resolved
 * ceiling. There is no code path that yields sources without policies.
 */
export function buildGenerationInputs(
  ctx: CaseContext,
  verifications: ScoreVerification[]
): GenerationInputs {
  return {
    caseId: ctx.caseId,
    student: ctx.student,
    evalType: ctx.evalType,
    sources: ctx.currentSources.map((cs) => policeSource(cs, verifications)),
  };
}

/** True when no current source may be interpreted beyond description. */
export const allDescribeOnly = (inputs: GenerationInputs): boolean =>
  inputs.sources.length > 0 &&
  inputs.sources.every((s) => s.ceiling === "DESCRIBE_ONLY" || s.ceiling === "DO_NOT_INTERPRET");

export { isScopeUnestablished };
