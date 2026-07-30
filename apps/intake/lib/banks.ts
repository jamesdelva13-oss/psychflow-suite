import "server-only";
import { QuestionBank, type TQuestionBank } from "@suite/case-model";
import teacherForm from "@suite/content/banks/teacher-form.v1.3.0.json";
import teacherFormPreview from "@suite/content/banks/teacher-form.v1.5.0.json";
import parentForm from "@suite/content/banks/parent-form.v1.json";

/**
 * Question banks are authored content owned by @suite/content and validated by
 * the case-model schema. The app holds ZERO question text (D-020) — it only
 * maps a respondent role to the authored bank and hands it to the engine.
 *
 * v1.5.0 is an UNRATIFIED DRAFT: it loads only behind INTAKE_BANK_PREVIEW so
 * the four-step UI can be developed against it. The default stays pinned to
 * the ratified v1.3.0; flip the pin (and drop the flag) at ratification.
 */
const teacherRaw =
  process.env.INTAKE_BANK_PREVIEW === "1.5.0" ? teacherFormPreview : teacherForm;

const RAW_BY_ROLE: Record<string, unknown> = {
  teacher: teacherRaw,
  parent_guardian: parentForm,
};

export function bankForRole(role: string): TQuestionBank {
  const raw = RAW_BY_ROLE[role];
  if (!raw) throw new Error(`No question bank for respondent role: ${role}`);
  return QuestionBank.parse(raw);
}

export const SUPPORTED_ROLES = Object.keys(RAW_BY_ROLE);
