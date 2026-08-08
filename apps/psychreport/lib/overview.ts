import type { CaseContext } from "./case-context";

/**
 * Overview logic (directive §8.3) as a pure function: one readiness
 * sentence, one next best action, the evaluation state, and one quiet reuse
 * message — derived from the resolved case context, never stored copy.
 *
 * Stage D's rule shapes this: surface only ACTION-RELEVANT exceptions.
 * An open score verification is action-relevant (it holds the interpretive
 * ceiling down); a clean parse is not, and never becomes a chore.
 */

export interface OverviewModel {
  readiness: string;
  evaluationState: string;
  nextAction: { label: string; href: string };
  reuseMessage: string | null;
  /** At most one or two professional-judgment items (§8.3). */
  judgmentItems: string[];
}

export interface CaseSignals {
  /** Scores whose extraction the clinician has not yet confirmed. */
  openVerifications: number;
  /** A score set exists on the case at all. */
  hasScores: boolean;
}

export function buildOverview(ctx: CaseContext, signals: CaseSignals): OverviewModel {
  const current = ctx.currentSources;
  const hasTeacher = current.some((s) => s.source.kind === "referral_form");
  const hasInterview = current.some((s) => s.source.kind === "interview");
  const materialsHref = `/cases/${ctx.caseId}/materials`;
  const evaluationsHref = `/cases/${ctx.caseId}/evaluations`;

  const referralComplete = hasTeacher && hasInterview;
  const reuseMessage = referralComplete
    ? "Teacher input and your finalized interview notes are already available — nothing needs re-entering."
    : null;

  if (signals.openVerifications > 0) {
    const n = signals.openVerifications;
    return {
      readiness: "The record is nearly complete.",
      evaluationState:
        "Psychological evaluation — assessment results are in and organized.",
      nextAction: { label: "Review assessment results", href: evaluationsHref },
      reuseMessage,
      judgmentItems: [
        n === 1
          ? "One score needs verification before results can be interpreted."
          : `${n} scores need verification before results can be interpreted.`,
      ],
    };
  }

  if (signals.hasScores && referralComplete) {
    return {
      readiness: "The record is complete.",
      evaluationState:
        "Psychological evaluation — assessment results verified and ready to draft.",
      nextAction: { label: "Continue to the evaluation", href: evaluationsHref },
      reuseMessage,
      judgmentItems: [],
    };
  }

  if (referralComplete) {
    return {
      readiness: "The referral record is complete.",
      evaluationState:
        "Psychological evaluation — collecting information. Assessment results have not been added yet.",
      nextAction: { label: "Review case materials", href: materialsHref },
      reuseMessage,
      judgmentItems: [],
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
      judgmentItems: [],
    };
  }

  return {
    readiness: "No finalized referral material has reached this case yet.",
    evaluationState: "Psychological evaluation — not started.",
    nextAction: { label: "Review case materials", href: materialsHref },
    reuseMessage: null,
    judgmentItems: [],
  };
}
