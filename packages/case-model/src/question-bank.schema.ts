/**
 * question-bank.schema.ts
 * ------------------------------------------------------------------
 * The data contract for all intake question banks (teacher, parent,
 * interventionist, etc.). Content files like teacher-form.v1.json
 * must validate against these schemas.
 *
 * Plain-language map:
 *  - A QuestionBank is a versioned document containing Modules.
 *  - A Module is a themed group of Questions (core, reading, ...).
 *  - A Question knows its construct tags (v0.3 taxonomy), how it is
 *    answered, and when it is visible (showIf conditions).
 *  - Options on select questions may carry their own construct or
 *    topography tags — selecting the option IS the evidence.
 *  - BranchRules decide which modules load, based on answers.
 *  - CompletenessRules detect missing information and queue an
 *    approved follow-up instead of letting the AI improvise.
 *  - FollowUps are the approved clarification question bank
 *    (adaptive Layer 3 selects FROM this list).
 *  - SummaryConstraints are the prohibited-conclusions list that the
 *    narrative stage must obey.
 *
 * Design rules encoded here:
 *  1. Question IDs are permanent (like construct IDs).
 *  2. Published banks are immutable — changes create a new version.
 *  3. Construct IDs must exist in the referenced taxonomy version;
 *     that referential check runs at build time, not here.
 */

import { z } from "zod";

/* ---------- shared primitives ---------- */

/** Dot-path construct ID from the taxonomy, e.g. "ACAD.READ.DECODING" */
export const ConstructId = z.string().regex(/^[A-Z][A-Z_]*(\.[A-Z][A-Z_]*)*$/);

/** Behavior topography vocabulary (v0.3) */
export const Topography = z.enum([
  "noncompliance",
  "avoidance",
  "aggression",
  "withdrawal",
  "disruption",
]);

export const ResponseType = z.enum([
  "single_select",
  "multi_select",
  "open_text",
  "yes_no",
  "likert",
  // v1.5.0 hybrid response model (D-119 / handoff 04): scale kinds carry the
  // construct they measure. Engine semantics are identical to single_select
  // (one option value); the kind exists so authoring review and rendering can
  // enforce "each scale must match its construct".
  "comparison_scale", // skill vs. peers, every level clinically meaningful
  "frequency_scale",  // events the respondent can reliably observe
  "support_scale",    // degree of prompting / independence
]);

/** Developmental band ids (see grade-bands.ts for the versioned mapping). */
export const GradeBand = z.enum(["early_childhood", "elementary", "middle", "secondary"]);

/** A condition over a previously answered question. */
export const Condition = z
  .object({
    questionId: z.string(),
    operator: z.enum([
      "equals",        // answer === value
      "equals_any",    // single-select answer is one of values (T2/T3 detail gating)
      "includes",      // multi_select answer contains value
      "includes_any",  // multi_select answer contains at least one of values
      "excludes",      // multi_select answer does NOT contain value (screener suppression)
      "answered",      // any non-empty answer exists
      "not_answered",  // no answer / empty
      "is_yes",
      "is_no",
    ]),
    value: z.string().optional(),           // required for equals / includes / excludes
    values: z.array(z.string()).optional(), // required for includes_any / equals_any
  })
  .superRefine((c, ctx) => {
    if ((c.operator === "equals" || c.operator === "includes" || c.operator === "excludes") && !c.value)
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${c.operator} requires value` });
    if ((c.operator === "includes_any" || c.operator === "equals_any") && !c.values?.length)
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${c.operator} requires values[]` });
  });

/** all-of semantics; wrap alternatives in separate rules for any-of */
export const ConditionGroup = z.array(Condition).min(1);

/* ---------- options & questions ---------- */

export const Option = z.object({
  value: z.string(),                    // stable machine value
  label: z.string(),                    // informant-facing wording
  constructIds: z.array(ConstructId).optional(),
  topography: Topography.optional(),
});

export const Question = z.object({
  id: z.string().regex(/^[A-Z]{3}-[A-Z]+-(G\d{2}|\d{3}[a-z]?)$/),
  prompt: z.string(),                   // informant-facing wording
  helpText: z.string().optional(),
  responseType: ResponseType,
  options: z.array(Option).optional(),  // required for select/likert
  constructIds: z.array(ConstructId).default([]),
  /** what Evidence polarity this question tends to elicit */
  elicits: z.enum(["concern", "strength", "context", "either"]).default("either"),
  required: z.boolean().default(false),
  showIf: ConditionGroup.optional(),    // visible only if all conditions hold
  /** referral stages where the question applies */
  stages: z
    .array(z.enum(["prereferral", "initial_evaluation", "reevaluation"]))
    .default(["prereferral", "initial_evaluation", "reevaluation"]),
  /**
   * Developmental bands where the question applies (grade/developmental
   * routing, D-119). Absent = applies to every band. Routing removes
   * categorically irrelevant content only — never an applicable domain the
   * respondent simply hasn't observed.
   */
  gradeBands: z.array(GradeBand).optional(),
  /**
   * baseline = always-shown universal-consideration item; depth = shown when
   * a disposition licenses it (rendered in the "Relevant follow-up" step).
   */
  tier: z.enum(["baseline", "depth"]).optional(),
  /**
   * Declares that this always-shown item carries an explicit observation
   * escape (D-119): an option meaning "not enough opportunity to observe".
   * The escape completes the item but is NEVER no-concern (T1-obs, D-049).
   */
  observationEscape: z.boolean().optional(),
  /** Option value that is the observation escape (default "not_observed"). */
  observationEscapeValue: z.string().optional(),
  notes: z.string().optional(),         // authoring notes, never displayed
})
  .superRefine((q, ctx) => {
    if (q.observationEscape) {
      const esc = q.observationEscapeValue ?? "not_observed";
      if (!q.options?.some((o) => o.value === esc))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `observationEscape requires an option with value "${esc}"`,
        });
    }
  });

/* ---------- modules ---------- */

export const RepeatGroup = z.object({
  /** repeat these questions once per selected option of sourceQuestionId */
  sourceQuestionId: z.string(),
  questions: z.array(Question).min(1),
});

export const Module = z.object({
  id: z.string(),                       // "core" | "reading" | ...
  title: z.string(),                    // internal title
  displayLabel: z.string(),             // informant-facing section header
  intro: z.string().optional(),         // informant-facing section intro
  alwaysShown: z.boolean().default(false),
  /** Respondent step (four-step flow, handoff 03) this module renders under. */
  step: z.number().int().min(1).max(4).optional(),
  /** Developmental bands where the whole module applies; absent = all. */
  gradeBands: z.array(GradeBand).optional(),
  questions: z.array(Question),
  repeatGroups: z.array(RepeatGroup).optional(),
});

/* ---------- rules ---------- */

export const BranchRule = z.object({
  id: z.string(),
  when: ConditionGroup,
  action: z.literal("show_module"),
  target: z.string(),                   // module id
});

export const FollowUp = z.object({
  id: z.string().regex(/^FU-[A-Z]+-\d{3}$/),
  prompt: z.string(),
  constructIds: z.array(ConstructId).default([]),
  /** hint for the AI selector describing when this follow-up fits */
  triggerHint: z.string(),
});

export const CompletenessRule = z.object({
  id: z.string().regex(/^CR-\d{3}$/),
  description: z.string(),              // human-readable purpose
  when: ConditionGroup,
  askFollowUpId: z.string(),            // must reference a FollowUp id
});

/* ---------- concern-set derivation (D-028) ---------- */

/**
 * A domain-affirmative screener that can ADD a domain to the derived concern
 * set without mutating the base concern question's stored answer. When the
 * screener's answer equals `whenAnswer`, `addsValue` joins the concern set with
 * provenance `screener` (vs `core-008` for the base selection). The base
 * question's verbatim record is never written to (D-028).
 */
export const ConcernScreener = z.object({
  questionId: z.string(),   // e.g. "TCH-COG-000"
  addsValue: z.string(),    // concern-set member it contributes, e.g. "cognitive"
  whenAnswer: z.string(),   // answer that triggers the add, e.g. "below"
});

/**
 * Declares the derived concern set: the base concern-screen question unioned
 * with any screener contributions. Branch rules reference the computed set via
 * the synthetic question id `$concernSet` (operator `includes`).
 */
export const ConcernSetConfig = z.object({
  baseQuestionId: z.string(),               // "TCH-CORE-008"
  screeners: z.array(ConcernScreener).default([]),
});

/* ---------- summary constraints ---------- */

export const SummaryConstraints = z.object({
  prohibited: z.array(z.string()),      // things narratives must never do
  requiredFraming: z.array(z.string()), // framing rules narratives must follow
});

/* ---------- the bank ---------- */

export const QuestionBank = z.object({
  bankId: z.string(),                   // "teacher-intake"
  respondent: z.enum(["teacher", "parent", "interventionist", "student", "provider"]),
  version: z.string(),                  // semver; published versions immutable
  taxonomyVersion: z.string(),          // e.g. "0.3"
  title: z.string(),
  estimatedMinutes: z.string(),
  intro: z.string(),                    // informant-facing welcome text
  /** Four-step respondent flow labels (handoff 03); optional pre-v1.5 banks. */
  steps: z
    .array(z.object({ step: z.number().int().min(1).max(4), title: z.string() }))
    .optional(),
  /** Version of the grade→band mapping this bank was authored against. */
  gradeBandSetVersion: z.string().optional(),
  modules: z.array(Module).min(1),
  branchRules: z.array(BranchRule),
  /** Optional derived concern-set config (D-028); absent = base question only. */
  concernSet: ConcernSetConfig.optional(),
  followUps: z.array(FollowUp),
  completenessRules: z.array(CompletenessRule),
  summaryConstraints: SummaryConstraints,
});

export type TQuestionBank = z.infer<typeof QuestionBank>;
export type TQuestion = z.infer<typeof Question>;
export type TModule = z.infer<typeof Module>;
