/**
 * grade-bands.ts — the central grade → developmental-band mapping.
 *
 * D-119 / handoff 04: grade/developmental routing is the preferred mechanism
 * for excluding categorically irrelevant content. This is the ONE mapping —
 * banks pin the version they were authored against (`gradeBandSetVersion`),
 * and every locked submission records the resolved band plus this version so
 * a routed-hidden item is reconstructable (acceptance test 11).
 *
 * DRAFT band set (0.1-draft): the four-band mapping is an open question in
 * the handoff roadmap ("Four-band mapping and developmental override") and is
 * pending JD ratification. Do not treat the band boundaries as settled.
 *
 * Ungraded/developmental placement: callers may assign a band directly
 * (acceptance test 7); `resolveGradeBand` is for the ordinary graded path.
 */
import { z } from "zod";

export const GRADE_BAND_SET_VERSION = "0.1-draft";

export const GradeBandId = z.enum(["early_childhood", "elementary", "middle", "secondary"]);
export type TGradeBandId = z.infer<typeof GradeBandId>;

/** Accepted grade tokens: "PK" | "K" | "1".."12" (string, as stored on Case). */
const GRADE_TO_BAND: Record<string, TGradeBandId> = {
  PK: "early_childhood",
  K: "early_childhood",
  "1": "elementary",
  "2": "elementary",
  "3": "elementary",
  "4": "elementary",
  "5": "elementary",
  "6": "middle",
  "7": "middle",
  "8": "middle",
  "9": "secondary",
  "10": "secondary",
  "11": "secondary",
  "12": "secondary",
};

/**
 * Resolve a stored grade token to its band, or null when the token is not a
 * graded placement (e.g. "ungraded") — in that case the band must be assigned
 * directly by the psychologist, never guessed.
 */
export function resolveGradeBand(grade: string): TGradeBandId | null {
  const norm = grade.trim().toUpperCase().replace(/^0(?=\d)/, "");
  return GRADE_TO_BAND[norm] ?? null;
}
