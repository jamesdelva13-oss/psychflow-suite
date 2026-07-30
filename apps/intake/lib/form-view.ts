import "server-only";
import type { TQuestionBank } from "@suite/case-model";
import {
  visibleQuestions,
  pendingFollowUps,
  type ResponseMap,
  type RenderContext,
  type QuestionInstance,
} from "@/lib/engine";
import type { FormView, FormGroup, FormField, FormStep } from "./form-types";

/**
 * Turn the engine's decisions into a serializable view for the client. The
 * engine runs here (server); the browser only ever receives this plain data
 * and renders it — it never imports the engine (JD hard constraint).
 *
 * `ctx` carries the session's grade band (v1.5.0+): band routing is decided
 * here, server-side, exactly as validation and locking will decide it.
 */
export function buildFormView(
  bank: TQuestionBank,
  responses: ResponseMap,
  ctx?: RenderContext
): FormView {
  const visible = visibleQuestions(bank, responses, ctx);
  const moduleMeta = new Map(bank.modules.map((m) => [m.id, m]));

  const toField = (inst: QuestionInstance): FormField => {
    const q = inst.question;
    return {
      key: inst.key,
      prompt: q.prompt,
      helpText: q.helpText,
      responseType: q.responseType,
      options: q.options?.map((o) => ({ value: o.value, label: o.label })),
      required: q.required,
      groupLabel: inst.repeatOf?.optionLabel,
      ...(q.observationEscape
        ? { observationEscapeValue: q.observationEscapeValue ?? "not_observed" }
        : {}),
    };
  };

  // Flat module-ordered groups (pre-step banks render exactly this).
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
    current.fields.push(toField(inst));
  }

  const pending = pendingFollowUps(bank, responses, ctx).map((p) => ({
    followUpId: p.followUpId,
    prompt: p.prompt,
    description: p.description,
  }));

  // Four-step assembly (banks that declare steps): a visible instance lands in
  // step 3 when it is depth-tier or a repeat-group instance; otherwise in its
  // module's declared step.
  let steps: FormStep[] | undefined;
  if (bank.steps?.length) {
    const stepTitle = new Map(bank.steps.map((s) => [s.step, s.title]));
    const stepGroups = new Map<number, Map<string, FormGroup>>();
    for (const inst of visible) {
      const m = moduleMeta.get(inst.moduleId);
      const isFollowUp = inst.question.tier === "depth" || !!inst.repeatOf;
      const stepN = isFollowUp ? 3 : m?.step ?? 2;
      if (!stepGroups.has(stepN)) stepGroups.set(stepN, new Map());
      const byModule = stepGroups.get(stepN)!;
      if (!byModule.has(inst.moduleId)) {
        byModule.set(inst.moduleId, {
          moduleId: inst.moduleId,
          displayLabel: m?.displayLabel ?? inst.moduleId,
          intro: stepN === 3 ? undefined : m?.intro,
          fields: [],
        });
      }
      byModule.get(inst.moduleId)!.fields.push(toField(inst));
    }
    steps = [...stepTitle.entries()]
      .sort(([a], [b]) => a - b)
      .map(([step, title]) => ({
        step,
        title,
        groups: [...(stepGroups.get(step)?.values() ?? [])],
      }));
  }

  return { groups, ...(steps ? { steps } : {}), pendingFollowUps: pending };
}

/** Keys currently visible — used to prune stale (now-hidden) drafts at submit. */
export function visibleKeys(
  bank: TQuestionBank,
  responses: ResponseMap,
  ctx?: RenderContext
): string[] {
  return visibleQuestions(bank, responses, ctx).map((v) => v.key);
}
