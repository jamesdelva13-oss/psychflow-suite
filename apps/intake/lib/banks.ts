import "server-only";
import { QuestionBank, type TQuestionBank } from "@suite/case-model";
import teacherForm from "@suite/content/banks/teacher-form.v1.3.0.json";
import parentForm from "@suite/content/banks/parent-form.v1.json";

/**
 * Question banks are authored content owned by @suite/content and validated by
 * the case-model schema. The app holds ZERO question text (D-020) — it only
 * maps a respondent role to the authored bank and hands it to the engine.
 */
const RAW_BY_ROLE: Record<string, unknown> = {
  teacher: teacherForm,
  parent_guardian: parentForm,
};

export function bankForRole(role: string): TQuestionBank {
  const raw = RAW_BY_ROLE[role];
  if (!raw) throw new Error(`No question bank for respondent role: ${role}`);
  return QuestionBank.parse(raw);
}

export const SUPPORTED_ROLES = Object.keys(RAW_BY_ROLE);
