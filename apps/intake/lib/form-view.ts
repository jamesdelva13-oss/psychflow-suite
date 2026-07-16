import "server-only";
import type { TQuestionBank } from "@suite/case-model";
import { visibleQuestions, pendingFollowUps, type ResponseMap } from "@/lib/engine";
import type { FormView, FormGroup, FormField } from "./form-types";

/**
 * Turn the engine's decisions into a serializable view for the client. The
 * engine runs here (server); the browser only ever receives this plain data
 * and renders it — it never imports the engine (JD hard constraint).
 */
export function buildFormView(bank: TQuestionBank, responses: ResponseMap): FormView {
  const visible = visibleQuestions(bank, responses);
  const moduleMeta = new Map(bank.modules.map((m) => [m.id, m]));

  const groups: FormGroup[] = [];
  let current: FormGroup | null = null;

  for (const inst of visible) {
    if (!current || current.moduleId !== inst.moduleId) {
      const m = moduleMeta.get(inst.moduleId);
      current = {
        moduleId: inst.moduleId,
        displayLabel: m?.displayLabel ?? inst.moduleId,
        intro: m?.intro,
        fields: [],
      };
      groups.push(current);
    }
    const q = inst.question;
    const field: FormField = {
      key: inst.key,
      prompt: q.prompt,
      helpText: q.helpText,
      responseType: q.responseType,
      options: q.options?.map((o) => ({ value: o.value, label: o.label })),
      required: q.required,
      groupLabel: inst.repeatOf?.optionLabel,
    };
    current.fields.push(field);
  }

  const pending = pendingFollowUps(bank, responses).map((p) => ({
    followUpId: p.followUpId,
    prompt: p.prompt,
    description: p.description,
  }));

  return { groups, pendingFollowUps: pending };
}

/** Keys currently visible — used to prune stale (now-hidden) drafts at submit. */
export function visibleKeys(bank: TQuestionBank, responses: ResponseMap): string[] {
  return visibleQuestions(bank, responses).map((v) => v.key);
}
