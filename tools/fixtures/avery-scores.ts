/**
 * avery-scores.ts — the canonical Avery Williams WIAT-4 score set.
 *
 * Extracted from tools/seed-avery.ts so the seed and the session-fidelity
 * live evaluation consume the SAME object rather than two copies that can
 * drift. The evaluation's first case replays the exact sentence the first
 * live generation produced against the exact score set it was produced from;
 * that only means anything if "the exact score set" is literal.
 *
 * WIAT-4 reading scores the directive authorizes, modelled as an EXTRACTION
 * result rather than hand-entered data: each row carries the confidence the
 * extractor reported and the page it was read from. Reading Comprehension is
 * seeded `parsed_low_confidence` on purpose — it is the legitimate,
 * clinically meaningful exception Stage D calls for ("One score needs
 * verification"), and until it is confirmed the whole set stays
 * NOT_ESTABLISHED and may only be described, never interpreted
 * (apps/psychreport/lib/source-policy.ts).
 *
 * Synthetic data. No real student data (directive §6).
 */

export const WIAT4_SCORE_SET = {
  instrument: "WIAT-4",
  administeredOn: "2026-05-19",
  form: "Age-based",
  scores: [
    {
      key: "word-reading",
      subtest: "Word Reading",
      standardScore: 71,
      ci95: [66, 76],
      percentile: 3,
      extraction: "parsed_ok",
      location: "p. 2, Score Summary",
    },
    {
      key: "pseudoword-decoding",
      subtest: "Pseudoword Decoding",
      standardScore: 69,
      ci95: [64, 74],
      percentile: 2,
      extraction: "parsed_ok",
      location: "p. 2, Score Summary",
    },
    {
      key: "reading-comprehension",
      subtest: "Reading Comprehension",
      standardScore: 76,
      ci95: [70, 82],
      percentile: 5,
      extraction: "parsed_low_confidence",
      location: "p. 2, Score Summary",
    },
  ],
} as const;
