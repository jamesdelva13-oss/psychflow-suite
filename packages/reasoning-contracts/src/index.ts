/**
 * @suite/reasoning-contracts
 *
 * Shared semantic contracts for the Psych Suite. Imported by PsychReport as
 * generation constraints and by the QA Engine as detection targets.
 *
 * DEPENDENCY DIRECTION IS ONE-WAY. This package depends on nothing.
 *   reasoning-contracts -> (nothing)
 *   case-model          -> reasoning-contracts
 *   psychreport         -> reasoning-contracts, case-model
 *   qa-engine           -> reasoning-contracts   (NOT case-model, NOT psychreport)
 *   eligibility         -> reasoning-contracts, case-model
 *
 * Neither product may import the other. QA must never assume PsychReport
 * headings, tables, prompts, or provenance.
 *
 * Version: 0.1.0-pilot
 */

export const CONTRACTS_VERSION = "0.1.0-pilot";

/* ------------------------------------------------------------------ *
 * 0. SHARED EPISTEMIC TYPES — OWNED HERE
 *
 * These are vocabulary, not case data. QA assigns EvidenceStatus to
 * prose it has no case model for, so they cannot live in case-model,
 * which QA may not import. case-model imports them from here.
 *
 * DO NOT MOVE THESE TO @suite/case-model.
 * ------------------------------------------------------------------ */

/** Epistemic status of a unit of information in the case. */
export type EvidenceStatus =
  | "DIRECT_FACT"          // explicitly provided
  | "ATTRIBUTED_REPORT"    // stated by a named source
  | "DIRECT_OBSERVATION"   // observed by the examiner in a defined context
  | "DERIVED_CALCULATION"  // mechanically computed from provided data
  | "SUPPORTED_SYNTHESIS"  // convergent evidence supports it
  | "QUALIFIED_SYNTHESIS"  // supported, with material limitation
  | "HYPOTHESIS"           // plausible, not established
  | "UNSUPPORTED";         // must not appear in output

/** How far a source may be pushed. Governs DEPTH of inference. */
export type InterpretiveCeiling =
  | "DO_NOT_INTERPRET"
  | "DESCRIBE_ONLY"
  | "COMPARE_WITHIN_SOURCE"
  | "INTEGRATE_WITH_QUALIFICATION"
  | "FULL_INTERPRETATION";

export type ValidityStatus =
  | "ACCEPTABLE"
  | "ACCEPTABLE_WITH_LIMITATIONS"
  | "INVALID"
  | "NOT_ESTABLISHED";

/**
 * Where, when, and about what a source speaks. Governs BREADTH.
 * Orthogonal to ceiling: a fully valid teacher rating still cannot
 * speak to the home setting.
 */
export type SourceScope = {
  informant?:
    | "PARENT"
    | "CAREGIVER"
    | "TEACHER"
    | "STUDENT"
    | "EXAMINER"
    | "RECORD";
  settings: Array<
    "HOME" | "SCHOOL" | "CLINIC" | "COMMUNITY" | "TESTING" | "OTHER"
  >;
  timeframe?: string;
  constructs: string[];
  observationContext?: string;
};

export type SourceInterpretationPolicy = {
  sourceId: string;
  validityStatus: ValidityStatus;
  interpretiveCeiling: InterpretiveCeiling;
  scope: SourceScope;
  limitationSummary?: string;
  establishedBy: "INSTRUMENT_DEFAULT" | "DETERMINISTIC_RULE" | "PROFESSIONAL";
  professionalReviewRequired: boolean;
  // Reserved. Do not populate before pilot data shows the enum is insufficient.
  permittedUses?: string[];
  prohibitedUses?: string[];
};

/** @deprecated Use SourceInterpretationPolicy. Alias retained for migration. */
export type SourceValidity = SourceInterpretationPolicy;

/**
 * GUARD 1: NOT_ESTABLISHED must never resolve to FULL_INTERPRETATION.
 * Call this rather than reading interpretiveCeiling directly.
 */
export function effectiveCeiling(
  v: SourceInterpretationPolicy
): InterpretiveCeiling {
  if (v.validityStatus === "INVALID") return "DO_NOT_INTERPRET";
  if (v.validityStatus === "NOT_ESTABLISHED") return "DESCRIBE_ONLY";
  if (isScopeUnestablished(v.scope)) return "DESCRIBE_ONLY";
  return v.interpretiveCeiling;
}

/**
 * GUARD 2: an absent or empty scope is UNKNOWN, never UNRESTRICTED.
 * Empty settings/constructs must not be read as "all settings" or
 * "all constructs". Source-faithful description remains permitted;
 * cross-setting extrapolation and integrated use do not.
 */
export function isScopeUnestablished(scope?: SourceScope): boolean {
  if (!scope) return true;
  return scope.settings.length === 0 || scope.constructs.length === 0;
}

/** Integrated use of a source with unestablished scope requires review. */
export function requiresReviewBeforeIntegration(
  v: SourceInterpretationPolicy
): boolean {
  return v.professionalReviewRequired || isScopeUnestablished(v.scope);
}

/* ------------------------------------------------------------------ *
 * 1. SECTION MODES
 *
 * Five base modes. Attached to a CONTENT BLOCK or drafting task, never
 * to a report heading. One section may contain blocks in several modes.
 * Blended modes are prohibited.
 *
 * Kept at five because the QA Engine must INFER mode from arbitrary
 * district prose; classification accuracy degrades with class count.
 * Finer distinctions are expressed as modifiers, which subtract
 * permissions from a known base.
 * ------------------------------------------------------------------ */

export type SectionMode =
  | "SOURCE_FAITHFUL"
  | "DIRECT_OBSERVATION"
  | "DESCRIPTIVE_RESULTS"
  | "INTEGRATED_INTERPRETATION"
  | "RECOMMENDATION";

export type ModeModifier =
  /** SOURCE_FAITHFUL: may consolidate corroborated fact/chronology across
   *  sources, but may not form a psychological interpretation. */
  | "MULTISOURCE_FACTUAL"
  /** DESCRIPTIVE_RESULTS: measures, dates, administration facts only. */
  | "PROCEDURAL_ONLY"
  /** INTEGRATED_INTERPRETATION: compress established findings; introduce
   *  no new construct, interpretation, or recommendation. (Summary) */
  | "NO_NEW_INFERENCE"
  /** INTEGRATED_INTERPRETATION: organize evidence against criteria without
   *  issuing a conclusion reserved to the team. (Eligibility findings) */
  | "TEAM_RESERVED";

export type BlockMode = {
  mode: SectionMode;
  modifiers?: ModeModifier[];
};

export type PermittedOperation =
  | "ATTRIBUTE"
  | "ORGANIZE"
  | "CONDENSE"
  | "PRESERVE_CONTRADICTION"
  | "DESCRIBE_OBSERVED"
  | "REPORT_SCORE"
  | "CLASSIFY"
  | "COMPARE_WITHIN_SOURCE"
  | "SYNTHESIZE_CROSS_SOURCE"
  | "ANALYZE_DISCREPANCY"
  | "FORM_HYPOTHESIS"
  | "STATE_FUNCTIONAL_MEANING"
  | "PRESCRIBE_ACTION";

export type ModeContract = {
  mode: SectionMode;
  synthesis: "NONE" | "WITHIN_SOURCE" | "WITHIN_OBSERVATION" | "WITHIN_MEASURE" | "CROSS_SOURCE";
  inference: "NONE" | "BOUNDED" | "CALIBRATED";
  permitted: PermittedOperation[];
  prohibited: string[];
};

export const MODE_CONTRACTS: Record<SectionMode, ModeContract> = {
  SOURCE_FAITHFUL: {
    mode: "SOURCE_FAITHFUL",
    synthesis: "WITHIN_SOURCE",
    inference: "NONE",
    permitted: ["ATTRIBUTE", "ORGANIZE", "CONDENSE", "PRESERVE_CONTRADICTION"],
    prohibited: [
      "psychological inference",
      "causal explanation",
      "cross-informant synthesis",
      "reconciling contradictions",
      "escalating certainty, frequency, or severity",
      "treating an omission as a negative finding",
    ],
  },

  DIRECT_OBSERVATION: {
    mode: "DIRECT_OBSERVATION",
    synthesis: "WITHIN_OBSERVATION",
    inference: "BOUNDED",
    permitted: [
      "DESCRIBE_OBSERVED",
      "ORGANIZE",
      "CONDENSE",
      "COMPARE_WITHIN_SOURCE",
    ],
    prohibited: [
      "generalizing beyond the observed conditions",
      "cross-setting claims",
      "attribution of motive",
      "diagnosis",
      "unmarked inference (characterization must read as characterization)",
    ],
  },

  DESCRIPTIVE_RESULTS: {
    mode: "DESCRIPTIVE_RESULTS",
    synthesis: "WITHIN_MEASURE",
    inference: "NONE",
    permitted: [
      "REPORT_SCORE",
      "CLASSIFY",
      "DESCRIBE_OBSERVED",
      "COMPARE_WITHIN_SOURCE",
    ],
    prohibited: [
      "any extrapolation beyond the measure",
      "causal claims",
      "functional or classroom translation",
      "cross-source synthesis",
      "diagnosis",
    ],
  },

  INTEGRATED_INTERPRETATION: {
    mode: "INTEGRATED_INTERPRETATION",
    synthesis: "CROSS_SOURCE",
    inference: "CALIBRATED",
    permitted: [
      "SYNTHESIZE_CROSS_SOURCE",
      "ANALYZE_DISCREPANCY",
      "FORM_HYPOTHESIS",
      "STATE_FUNCTIONAL_MEANING",
      "ATTRIBUTE",
    ],
    prohibited: [
      "claims exceeding a source's effective ceiling",
      "claims outside a source's scope",
      "invented reconciliation of discrepant sources",
      "team-reserved conclusions",
      "eligibility verdicts",
    ],
  },

  RECOMMENDATION: {
    mode: "RECOMMENDATION",
    synthesis: "CROSS_SOURCE",
    inference: "NONE",
    permitted: ["PRESCRIBE_ACTION", "STATE_FUNCTIONAL_MEANING"],
    prohibited: [
      "new findings",
      "new needs asserted to justify a recommendation",
      "new diagnoses",
      "guaranteed outcomes",
    ],
  },
};

/**
 * DESCRIPTIVE_RESULTS inference is binary, not "limited":
 * within-measure pattern description is permitted; all extrapolation
 * beyond the measure is prohibited.
 */

/* ------------------------------------------------------------------ *
 * 2. CONFIDENCE-LANGUAGE POLICY
 *
 * PsychReport: constrains generated wording.
 * QA Engine:   compares observed wording against reconstructed support.
 *
 * STEMS ARE NON-NORMATIVE ANCHORS. The normative content of this policy
 * is the `rank` ordering and its mapping to `condition` and
 * `evidenceStatus`. The `stem` strings are calibration examples that
 * locate each rank on a scale of natural English — they are NOT a
 * closed vocabulary, a required phrasing, or a matchable literal.
 *
 * Consequently:
 *   - PsychReport may generate any wording whose strength sits at or
 *     below the permitted rank. It is not obliged to emit these exact
 *     words, and reproducing them verbatim across reports would produce
 *     precisely the boilerplate the parameter block prohibits.
 *   - QA MUST NOT implement a check as string-matching against these
 *     stems. A report saying "the evidence is consistent with" has not
 *     violated anything by declining to say "the findings suggest".
 *     Detection targets rank overreach, not vocabulary divergence.
 *   - Adding, rewording, or reordering a stem is not a semantic change
 *     and does not require a version bump. Changing a `rank`, a
 *     `condition`, or an `evidenceStatus` is, and does.
 *
 * House conventions may substitute their own stems at layer 7 without
 * touching this file (parameter block §11).
 * ------------------------------------------------------------------ */

export type EvidenceCondition =
  | "CONVERGENT_INDEPENDENT"
  | "SUPPORTED_WITH_LIMITATION"
  | "SINGLE_SOURCE_OR_PARTIAL"
  | "PLAUSIBLE_UNCONFIRMED"
  | "MATERIALLY_CONFLICTING"
  | "MISSING_NECESSARY_EVIDENCE";

export type ConfidencePolicyEntry = {
  condition: EvidenceCondition;
  /**
   * NON-NORMATIVE. A calibration anchor illustrating where this rank sits
   * in natural English. Never string-match against it; never require it
   * verbatim. See the section header above.
   */
  stem: string;
  evidenceStatus: EvidenceStatus;
  /** NORMATIVE. Wording at or below this rank is permitted; above it is overreach. */
  rank: number;
};

/** `stem` values below are anchors, not required phrasings. */
export const CONFIDENCE_POLICY: ConfidencePolicyEntry[] = [
  {
    condition: "CONVERGENT_INDEPENDENT",
    stem: "The findings indicate",
    evidenceStatus: "SUPPORTED_SYNTHESIS",
    rank: 5,
  },
  {
    condition: "SUPPORTED_WITH_LIMITATION",
    stem: "The available information supports",
    evidenceStatus: "QUALIFIED_SYNTHESIS",
    rank: 4,
  },
  {
    condition: "SINGLE_SOURCE_OR_PARTIAL",
    stem: "The findings suggest",
    evidenceStatus: "QUALIFIED_SYNTHESIS",
    rank: 3,
  },
  {
    condition: "PLAUSIBLE_UNCONFIRMED",
    stem: "One possibility is",
    evidenceStatus: "HYPOTHESIS",
    rank: 2,
  },
  {
    condition: "MATERIALLY_CONFLICTING",
    stem: "The available information does not establish",
    evidenceStatus: "QUALIFIED_SYNTHESIS",
    rank: 1,
  },
  {
    condition: "MISSING_NECESSARY_EVIDENCE",
    stem: "Insufficient information was available to determine",
    evidenceStatus: "UNSUPPORTED",
    rank: 0,
  },
];

/* ------------------------------------------------------------------ *
 * 3. CROSS-SOURCE RELATIONSHIP CLASSES
 *
 * A discrepancy must be CLASSIFIED before it is described. It may be
 * described without explanation; it may not be explained without
 * evidence, and it may never be averaged away.
 * ------------------------------------------------------------------ */

export type SourceRelationship =
  | "CONVERGENT"
  | "PARTIALLY_CONVERGENT"
  | "DIFFERS_IN_SEVERITY"
  | "DIFFERS_IN_CONSTRUCT"
  | "SETTING_SPECIFIC"
  | "CONTRADICTORY"
  | "NOT_COMPARABLE"
  | "INSUFFICIENT_FOR_COMPARISON";

/* ------------------------------------------------------------------ *
 * REMOVED: PRECEDENCE (was section 4) — 2026-07-21
 *
 * The precedence stack orders competing DRAFTING instructions. QA does
 * not draft, so it has no consumer for the ordering; shipping it here
 * made every QA build import a PsychReport authoring opinion.
 *
 * Now sole-sourced in the parameter block, §1 Precedence.
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * 4. RULE PROVENANCE
 *
 * Every shipped rule carries a source status so that a product-generated
 * operationalization is never presented as a published principle.
 * ------------------------------------------------------------------ */

export type SourceStatus =
  | "DIRECT_SOURCE_PRINCIPLE"
  | "SOURCE_DERIVED_OPERATIONALIZATION"
  | "HOUSE_CONVENTION"
  | "LEGAL_OR_REGULATORY_RULE"
  | "CLINICAL_EXPERT_RULE"
  | "PRODUCT_SAFETY_GUARD"
  | "EMPIRICALLY_VALIDATED_RULE"
  | "PROVISIONAL_RULE";

/**
 * What is at stake if a report violates the rule. ORTHOGONAL to SourceStatus:
 * provenance answers "where did this rule come from," authority answers "what
 * happens if it is broken." SourceStatus cannot express the second — nothing in
 * it distinguishes "will not survive due process" from "our house prefers it,"
 * and that distinction is what QA output must show a district and what bounds
 * the attorney's review scope.
 *
 * A LEGAL_OR_REGULATORY_RULE maps to "mandated", but the reverse does not hold:
 * a SOURCE_DERIVED_OPERATIONALIZATION of a legal requirement can also be
 * mandated, and a CLINICAL_EXPERT_RULE is usually "defensibility". Populate
 * both fields; never derive one from the other.
 */
export type RuleAuthority =
  /** Required by law or regulation. Cite the provision; never memory. */
  | "mandated"
  /** Not legally required, but a violation weakens the report under challenge. */
  | "defensibility"
  /** House preference. Never phrased as a requirement; never blocks a summary state. */
  | "craft";

export type RuleMetadata = {
  ruleId: string;
  rule: string;
  /** Where the rule came from. */
  sourceStatus: SourceStatus;
  /** What is at stake if it is broken. Not derivable from sourceStatus. */
  authority: RuleAuthority;
  source?: string;
  scope: SectionMode[];
  severity: "INFO" | "WARNING" | "REVISION_REQUIRED";
};

/**
 * Only mandated rules may be phrased as obligations in QA output. A
 * defensibility or craft finding stated as a legal requirement is a defect,
 * regardless of how well sourced it is.
 */
export function mayPhraseAsRequirement(r: RuleMetadata): boolean {
  return r.authority === "mandated";
}

// Attorney-review routing (formerly `inAttorneyReviewScope`) has MOVED to the QA
// package — `packages/core/review-routing.ts` — as of 2026-07-22. It is a QA
// detection/workflow concern, not shared epistemic vocabulary, and its
// definition changed from "mandated ∪ defensibility" to "mandated ∪ flagged"
// (the uncertainty flag lives with QA, not here). This package still owns the
// `authority` tier vocabulary that routing consumes.

/* ------------------------------------------------------------------ *
 * REMOVED: LENGTH GOVERNANCE (was section 6) — 2026-07-21
 *
 * Word targets and section budgets are house judgments about how long a
 * report should be. Encoding them here would let QA flag another
 * evaluator's report for exceeding OUR preferred length.
 *
 * Now sole-sourced in the parameter block, §7 Proportionality.
 *
 * PILOT_METRICS is deliberately RETAINED below: it is measurement
 * instrumentation, not a length rule, and QA consumes it to calibrate
 * empirical targets. Keeping it is what makes the eventual targets
 * evidence-based rather than another house preference.
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * 5. PILOT INSTRUMENTATION
 * ------------------------------------------------------------------ */

/**
 * Instrumentation to collect during pilot, to set empirical targets later.
 *
 * INSTRUMENTATION ONLY; NEVER A QA FINDING. These are measured, not enforced.
 * No check may cite a pilot metric as the basis for a finding, and no metric
 * may acquire a threshold without a superseding decision. The moment a pilot
 * metric becomes something QA flags, it is a length rule wearing a lab coat —
 * which is the exact contamination D-025 removed from this package.
 */
export const PILOT_METRICS = [
  "total_report_words",
  "words_by_section_mode",
  "paragraphs_per_material_finding",
  "sources_per_domain",
  "repeated_conclusions",
  "reading_level",
  "pct_prose_duplicating_tables",
  "psychologist_edit_time",
  "words_deleted_in_review",
] as const;

/* ------------------------------------------------------------------ *
 * 6. ARTIFACT BOUNDARY
 *
 * Enforced by schema, not by prompting. PsychReport has no destination
 * for adverse-impact or SDI language; the section types do not exist.
 * ------------------------------------------------------------------ */

export type PsychReportSection =
  | "evaluation_procedures"
  | "behavioral_observations"
  | "background"
  | "informant_summaries"
  | "cognitive_results"
  | "achievement_results"
  | "social_emotional_results"
  | "adaptive_results"
  | "integrated_interpretation"
  | "eligibility_relevant_findings"
  | "recommendations"
  | "limitations";
// Deliberately absent:
//   | "adverse_impact"
//   | "need_for_specially_designed_instruction"

/** Modes available only to @suite/eligibility-artifacts. Never registered
 *  in PsychReport's section registry. */
export type EligibilityArtifactMode =
  | "ADVERSE_IMPACT_DRAFTING"
  | "SDI_DRAFTING"
  | "ELIGIBILITY_ARTIFACT_REVIEW";

/* ------------------------------------------------------------------ *
 * 7. EVIDENCE-TIER LADDER  (migrated from RIE drafting-spec P29, D-048)
 *
 * The EPISTEMIC core of P29: how strongly a single domain is evidenced by
 * what the instrument actually captured. Shared vocabulary (D-038) — RIE, QA,
 * and PsychReport must agree on it. P29's *render forms*, licensed-sentence
 * counts, and instrument mapping stay in RIE; only the ladder, the
 * no-inference-upgrade rule, and the domain-addressed contract live here.
 *
 * NOT the same axis as `EvidenceStatus` (§0): that classes a unit of
 * information (fact / report / observation / …). This classes how a *domain*
 * was covered by the source instrument.
 *
 * Location note (D-046): this package currently lives in the Sped-QA-Engine
 * repo; case-model lives in psychflow-suite. This vocabulary is canonical here
 * and is NOT duplicated into psychflow-suite; it relocates wholesale when the
 * shared layer is consolidated.
 * ------------------------------------------------------------------ */

/**
 * Domain-coverage tier. Ordered by how much the instrument supplied, but the
 * ordering is NOT a ladder you may climb by inference (see the hard rule below).
 *
 * - `T0`     — not asked / skipped. The domain was not covered at all.
 * - `T1`     — asked; no concern reported. **Evidence of absence.** The bare
 *              negative: the instrument looked and found nothing to flag.
 * - `T1-obs` — asked; informant reports insufficient opportunity to observe.
 *              **Absence of evidence** — the opposite of T1. No finding either
 *              way. Collapsing this into T1 would make an unexamined domain look
 *              cleared; highest-stakes in Adaptive, where a gen-ed teacher may
 *              lack any window and where adaptive functioning carries rule-out
 *              weight for intellectual disability under SC SEED.
 * - `T2`     — asked; affirmatively rated within/above expectations. Requires
 *              the instrument to have supplied affirmative data.
 * - `T3`     — T2 plus descriptive detail supplied by the instrument.
 */
export type Tier = "T0" | "T1" | "T1-obs" | "T2" | "T3";

export const TIERS: readonly Tier[] = ["T0", "T1", "T1-obs", "T2", "T3"] as const;

/** Tiers that require the instrument to have supplied affirmative data. */
export const AFFIRMATIVE_TIERS: readonly Tier[] = ["T2", "T3"] as const;

export function isAffirmativeTier(t: Tier): boolean {
  return t === "T2" || t === "T3";
}

/**
 * THE QA CONTRACT (do not weaken). A "domain addressed" check is satisfied by
 * T1 (and by the affirmative tiers) and is **NOT** satisfied by T1-obs — nor by
 * T0. T1-obs is absence of evidence, not evidence of absence: it must raise a
 * collect-elsewhere flag, never count the domain as covered. This distinction
 * is unrecoverable from rendered prose, so it lives in the IR.
 */
export function satisfiesDomainAddressed(t: Tier): boolean {
  return t === "T1" || t === "T2" || t === "T3";
}

/**
 * HARD RULE: tiers never upgrade by inference. An affirmative tier (T2/T3) is
 * reachable ONLY when the instrument supplied affirmative data — a drafter may
 * not promote T1 → T2 because the overall picture seems positive. Returns true
 * when the assigned tier is legal given whether affirmative data exists.
 */
export function tierAssignmentLegal(t: Tier, instrumentSuppliedAffirmative: boolean): boolean {
  if (isAffirmativeTier(t)) return instrumentSuppliedAffirmative;
  return true; // T0 / T1 / T1-obs never require affirmative data
}
