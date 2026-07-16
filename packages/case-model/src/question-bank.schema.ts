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
]);

/** A condition over a previously answered question. */
export const Condition = z
  .object({
    questionId: z.string(),
    operator: z.enum([
      "equals",        // answer === value
      "includes",      // multi_select answer contains value
      "includes_any",  // multi_select answer contains at least one of values
      "answered",      // any non-empty answer exists
      "not_answered",  // no answer / empty
      "is_yes",
      "is_no",
    ]),
    value: z.string().optional(),           // required for equals / includes
    values: z.array(z.string()).optional(), // required for includes_any
  })
  .superRefine((c, ctx) => {
    if ((c.operator === "equals" || c.operator === "includes") && !c.value)
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${c.operator} requires value` });
    if (c.operator === "includes_any" && !c.values?.length)
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "includes_any requires values[]" });
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
  notes: z.string().optional(),         // authoring notes, never displayed
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
  modules: z.array(Module).min(1),
  branchRules: z.array(BranchRule),
  followUps: z.array(FollowUp),
  completenessRules: z.array(CompletenessRule),
  summaryConstraints: SummaryConstraints,
});

export type TQuestionBank = z.infer<typeof QuestionBank>;
export type TQuestion = z.infer<typeof Question>;
export type TModule = z.infer<typeof Module>;
