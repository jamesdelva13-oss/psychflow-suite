import "server-only";
import {
  resolveGradeBand,
  GRADE_BAND_SET_VERSION,
  type TQuestionBank,
} from "@suite/case-model";
import type { RenderContext } from "@/lib/engine";

/**
 * The session's grade-band routing context, resolved server-side from the
 * case's stored grade — the same context is used for rendering, validation,
 * and locking, so what the respondent saw and what the Source records can
 * never disagree. Pre-band banks (no gradeBandSetVersion) get no context:
 * routing stays disabled for them.
 */
export function bandContextFor(
  bank: TQuestionBank,
  grade: string | null | undefined
): { ctx?: RenderContext; sessionContext?: { gradeBand: string; gradeBandSetVersion: string } } {
  if (!bank.gradeBandSetVersion || !grade) return {};
  const band = resolveGradeBand(grade);
  if (!band) return {}; // ungraded: band must be assigned on the case (not yet wired)
  return {
    ctx: { gradeBand: band },
    sessionContext: { gradeBand: band, gradeBandSetVersion: GRADE_BAND_SET_VERSION },
  };
}
