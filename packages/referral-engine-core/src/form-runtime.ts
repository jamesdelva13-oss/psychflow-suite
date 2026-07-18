/**
 * form-runtime.ts — the deterministic heart of the intake experience.
 *
 * Pure functions only: (bank, responses) in → decisions out. No I/O, no
 * framework. The UI renders what visibleQuestions() returns; the server
 * trusts nothing until validateSubmission() and lockSubmission() pass.
 *
 * Response map contract:
 *   - plain questions:        responses["TCH-RDG-001"]
 *   - repeat-group instances: responses["TCH-BEH-G01::avoidance"]
 * Answer value types by responseType:
 *   - single_select / likert: option value string
 *   - multi_select:           string[] of option values
 *   - open_text:              string
 *   - yes_no:                 "yes" | "no"
 */

import * as crypto from "crypto";
import {
  QuestionBank,
  type TQuestionBank,
  type TQuestion,
} from "../../case-model/src/question-bank.schema";
import { Source, type TSource } from "../../case-model/src/entities";

export type Answer = string | string[];
export type ResponseMap = Record<string, Answer>;

export const instanceKey = (questionId: string, optionValue?: string) =>
  optionValue ? `${questionId}::${optionValue}` : questionId;

/** A concrete, renderable question: a bank question plus repeat context. */
export interface QuestionInstance {
  key: string;                 // response-map key
  question: TQuestion;
  moduleId: string;
  repeatOf?: {                 // present for repeat-group instances
    sourceQuestionId: string;
    optionValue: string;
    optionLabel: string;
    topography?: string;       // inherited tag for downstream Evidence
  };
}

/* ---------------- answers & conditions ---------------- */

const isAnswered = (a: Answer | undefined): boolean =>
  Array.isArray(a) ? a.length > 0 : typeof a === "string" && a.trim().length > 0;

interface Cond {
  questionId: string;
  operator: string;
  value?: string;
  values?: string[];
}

/**
 * Evaluate one condition. For conditions referencing a repeat-group question,
 * semantics are: answered = every active instance answered; not_answered = at
 * least one active instance missing. `instanceKeys` maps a repeat question id
 * to its currently active instance keys (empty array if group inactive).
 */
export function evaluateCondition(
  c: Cond,
  responses: ResponseMap,
  instanceKeys: Map<string, string[]>
): boolean {
  const keys = instanceKeys.get(c.questionId) ?? [c.questionId];
  if (keys.length === 0) {
    // group inactive: nothing is missing, nothing is answered
    return c.operator === "not_answered" ? false : false;
  }
  const answers = keys.map((k) => responses[k]);

  switch (c.operator) {
    case "answered":
      return answers.every(isAnswered);
    case "not_answered":
      return answers.some((a) => !isAnswered(a));
    case "equals":
      return answers.length === 1 && answers[0] === c.value;
    case "equals_any":
      return answers.length === 1 && !Array.isArray(answers[0]) && (c.values ?? []).includes(answers[0] as string);
    case "includes":
      return answers.length === 1 && Array.isArray(answers[0]) && answers[0].includes(c.value!);
    case "includes_any":
      return (
        answers.length === 1 &&
        Array.isArray(answers[0]) &&
        (c.values ?? []).some((v) => (answers[0] as string[]).includes(v))
      );
    case "excludes":
      // multi_select answer does NOT contain value (an unanswered/absent
      // multi-select excludes everything). Used to suppress a screener once the
      // domain is already flagged on the base concern question.
      return answers.length === 1 && !(Array.isArray(answers[0]) && answers[0].includes(c.value!));
    case "is_yes":
      return answers.length === 1 && answers[0] === "yes";
    case "is_no":
      return answers.length === 1 && answers[0] === "no";
    default:
      return false;
  }
}

const allConditions = (
  conds: Cond[] | undefined,
  responses: ResponseMap,
  ik: Map<string, string[]>
): boolean => !conds || conds.every((c) => evaluateCondition(c, responses, ik));

/* ---------------- derived concern set (D-028) ---------------- */

export interface ConcernSetEntry {
  domain: string;
  via: "core-008" | "screener";
}

/**
 * The derived concern set: the base concern-screen selection unioned with any
 * screener contributions ("below" affirmative-screener answers), each carrying
 * entry provenance. The base question's stored answer is NEVER mutated (D-028);
 * this is a pure derivation. Absent config → empty (branch rules then reference
 * their base question directly, unchanged).
 */
export function computeConcernSet(bank: TQuestionBank, responses: ResponseMap): ConcernSetEntry[] {
  const cfg = bank.concernSet;
  if (!cfg) return [];
  const out: ConcernSetEntry[] = [];
  const seen = new Set<string>();
  const base = responses[cfg.baseQuestionId];
  if (Array.isArray(base)) {
    for (const d of base) if (!seen.has(d)) { seen.add(d); out.push({ domain: d, via: "core-008" }); }
  }
  for (const s of cfg.screeners) {
    if (responses[s.questionId] === s.whenAnswer && !seen.has(s.addsValue)) {
      seen.add(s.addsValue);
      out.push({ domain: s.addsValue, via: "screener" });
    }
  }
  return out;
}

/** Responses augmented with the synthetic `$concernSet` array for branch eval. */
function withConcernSet(bank: TQuestionBank, responses: ResponseMap): ResponseMap {
  if (!bank.concernSet) return responses;
  return { ...responses, $concernSet: computeConcernSet(bank, responses).map((e) => e.domain) };
}

/* ---------------- visibility ---------------- */

/** Which modules are active given current responses (alwaysShown + branch rules). */
export function activeModules(bank: TQuestionBank, responses: ResponseMap): Set<string> {
  const ik = new Map<string, string[]>(); // branch conditions never target repeat questions
  const branchResponses = withConcernSet(bank, responses);
  const active = new Set<string>();
  for (const m of bank.modules) if (m.alwaysShown) active.add(m.id);
  for (const br of bank.branchRules) {
    if (allConditions(br.when, branchResponses, ik)) active.add(br.target);
  }
  return active;
}

/** Map each repeat-group question id to its active instance keys. */
function repeatInstanceKeys(bank: TQuestionBank, responses: ResponseMap, active: Set<string>) {
  const ik = new Map<string, string[]>();
  for (const m of bank.modules) {
    if (!active.has(m.id)) continue;
    for (const rg of m.repeatGroups ?? []) {
      const sel = responses[rg.sourceQuestionId];
      const selected = Array.isArray(sel) ? sel : [];
      for (const q of rg.questions) {
        ik.set(q.id, selected.map((v) => instanceKey(q.id, v)));
      }
    }
  }
  return ik;
}

/** The ordered, fully expanded list of currently visible question instances. */
export function visibleQuestions(bank: TQuestionBank, responses: ResponseMap): QuestionInstance[] {
  const active = activeModules(bank, responses);
  const ik = repeatInstanceKeys(bank, responses, active);
  const out: QuestionInstance[] = [];

  for (const m of bank.modules) {
    if (!active.has(m.id)) continue;
    for (const q of m.questions) {
      if (allConditions(q.showIf, responses, ik)) {
        out.push({ key: q.id, question: q, moduleId: m.id });
      }
    }
    for (const rg of m.repeatGroups ?? []) {
      const srcQ = m.questions.find((q) => q.id === rg.sourceQuestionId);
      const sel = responses[rg.sourceQuestionId];
      const selected = Array.isArray(sel) ? sel : [];
      for (const optVal of selected) {
        const opt = srcQ?.options?.find((o) => o.value === optVal);
        for (const q of rg.questions) {
          if (!allConditions(q.showIf, responses, ik)) continue;
          out.push({
            key: instanceKey(q.id, optVal),
            question: q,
            moduleId: m.id,
            repeatOf: {
              sourceQuestionId: rg.sourceQuestionId,
              optionValue: optVal,
              optionLabel: opt?.label ?? optVal,
              topography: opt?.topography,
            },
          });
        }
      }
    }
  }
  return out;
}

/* ---------------- validation & completeness ---------------- */

export interface ValidationResult {
  ok: boolean;
  missingRequired: string[];   // instance keys of required, visible, unanswered
  unknownKeys: string[];       // response keys that map to nothing visible or known
}

export function validateSubmission(bank: TQuestionBank, responses: ResponseMap): ValidationResult {
  const visible = visibleQuestions(bank, responses);
  const visibleKeys = new Set(visible.map((v) => v.key));
  const allKnownIds = new Set<string>();
  for (const m of bank.modules) {
    for (const q of m.questions) allKnownIds.add(q.id);
    for (const rg of m.repeatGroups ?? []) for (const q of rg.questions) allKnownIds.add(q.id);
  }

  const missingRequired = visible
    .filter((v) => v.question.required && !isAnswered(responses[v.key]))
    .map((v) => v.key);

  const unknownKeys = Object.keys(responses).filter((k) => {
    const base = k.split("::")[0];
    return !allKnownIds.has(base);
  });

  return { ok: missingRequired.length === 0 && unknownKeys.length === 0, missingRequired, unknownKeys };
}

export interface PendingFollowUp {
  ruleId: string;
  followUpId: string;
  prompt: string;
  description: string;
}

/** Layer 2: deterministic completeness rules → queued approved follow-ups. */
export function pendingFollowUps(bank: TQuestionBank, responses: ResponseMap): PendingFollowUp[] {
  const active = activeModules(bank, responses);
  const ik = repeatInstanceKeys(bank, responses, active);
  const fuById = new Map(bank.followUps.map((f) => [f.id, f]));
  const out: PendingFollowUp[] = [];
  for (const cr of bank.completenessRules) {
    if (allConditions(cr.when, responses, ik)) {
      const fu = fuById.get(cr.askFollowUpId);
      if (fu) out.push({ ruleId: cr.id, followUpId: fu.id, prompt: fu.prompt, description: cr.description });
    }
  }
  return out;
}

/* ---------------- submission locking → canonical Source ---------------- */

export const canonicalChecksum = (payload: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(payload, Object.keys(payload as object).sort())).digest("hex");

export interface LockedSubmission {
  source: TSource;
  payload: {
    bankId: string;
    bankVersion: string;
    taxonomyVersion: string;
    responses: ResponseMap;
    followUpResponses?: ResponseMap; // answers to Layer 2/3 follow-ups, keyed by FU id
    submittedAt: string;
  };
}

/**
 * Validate and freeze a completed submission into a canonical Source record
 * plus its raw payload (D-007 Layer 1: raw stored before any AI). Throws on
 * invalid submissions - locking is refused, never fudged.
 */
export function lockSubmission(args: {
  bank: unknown;
  responses: ResponseMap;
  followUpResponses?: ResponseMap;
  caseId: string;
  sourceId: string;
  informantId: string;
  collectedOn: string; // YYYY-MM-DD
  payloadRef: string;
  now?: Date;
}): LockedSubmission {
  const bank = QuestionBank.parse(args.bank);
  const v = validateSubmission(bank, args.responses);
  if (!v.ok) {
    throw new Error(
      `Submission invalid - missingRequired: [${v.missingRequired.join(", ")}] unknownKeys: [${v.unknownKeys.join(", ")}]`
    );
  }
  const submittedAt = (args.now ?? new Date()).toISOString();
  const payload: LockedSubmission["payload"] = {
    bankId: bank.bankId,
    bankVersion: bank.version,
    taxonomyVersion: bank.taxonomyVersion,
    responses: args.responses,
    ...(args.followUpResponses ? { followUpResponses: args.followUpResponses } : {}),
    submittedAt,
  };
  const source = Source.parse({
    sourceId: args.sourceId,
    caseId: args.caseId,
    informantId: args.informantId,
    kind: "referral_form",
    collectedOn: args.collectedOn,
    bank: { bankId: bank.bankId, bankVersion: bank.version },
    payloadRef: args.payloadRef,
    locked: true,
    checksum: canonicalChecksum(payload),
    createdAt: submittedAt,
  });
  return { source, payload };
}
