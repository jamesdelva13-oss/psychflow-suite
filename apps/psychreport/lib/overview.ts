import type { CaseContext } from "./case-context";

/**
 * Overview logic (directive §8.3) as a pure function: one readiness
 * sentence, one next best action, the evaluation state, and one quiet reuse
 * message — derived from the resolved case context, never stored copy.
 *
 * VS-2 truth: the writer does not exist yet (VS-3), so the next best action
 * never promises drafting. When the writer lands, this function gains the
 * "start the report" branch — the screens stay unchanged.
 */

export interface OverviewModel {
  readiness: string;
  evaluationState: string;
  nextAction: { label: string; href: string };
  reuseMessage: string | null;
}

export function buildOverview(ctx: CaseContext): OverviewModel {
  const current = ctx.currentSources;
  const hasTeacher = current.some((s) => s.source.kind === "referral_form");
  const hasInterview = current.some((s) => s.source.kind === "interview");
  const materialsHref = `/cases/${ctx.caseId}/materials`;

  if (hasTeacher && hasInterview) {
    return {
      readiness: "The referral record is complete.",
      evaluationState:
        "Psychological evaluation — collecting information. Assessment results have not been added yet.",
      nextAction: { label: "Review case materials", href: materialsHref },
      reuseMessage:
        "Teacher input and your finalized interview notes are already available — nothing needs re-entering.",
    };
  }

  if (hasTeacher || hasInterview) {
    const present = hasTeacher ? "Teacher input is" : "Your finalized interview notes are";
    const missing = hasTeacher ? "an interview or observation" : "teacher input";
    return {
      readiness: `${present} available; the record is still missing ${missing}.`,
      evaluationState: "Psychological evaluation — collecting information.",
      nextAction: { label: "Review case materials", href: materialsHref },
      reuseMessage: null,
    };
  }

  return {
    readiness: "No finalized referral material has reached this case yet.",
    evaluationState: "Psychological evaluation — not started.",
    nextAction: { label: "Review case materials", href: materialsHref },
    reuseMessage: null,
  };
}
