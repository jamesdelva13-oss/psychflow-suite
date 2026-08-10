import { z } from "zod";

/**
 * score-table.schema.ts — the shape of a score-table HOUSE CONVENTION.
 *
 * The parameter block §11 puts table column schema and order, decimal and
 * score-display rules, whether confidence intervals appear, whether
 * percentiles appear, classification vocabulary, score ordering, and
 * instrument naming at **layer 7: injected per district or per report, never
 * hardcoded**. A convention may govern *how valid content is expressed*; it
 * can never change *what the evidence supports*.
 *
 * So the table is configuration, and this is its contract. Hardcoding
 * "Subtest / SS / 95% CI / %ile" into a renderer would violate a ratified
 * layer boundary on the day the table shipped.
 *
 * Content depends on contracts, never the reverse (D-018): the schema lives
 * here, the authored conventions live in `@suite/content/conventions`.
 */

/**
 * Columns a convention may include. Deliberately a closed set — a district
 * chooses among the values the data model actually holds, and cannot invent a
 * column with nothing behind it.
 *
 * `classification` renders only when the convention also supplies `bands`.
 * No bands ship by default: classification vocabulary is authored clinical
 * content, and inventing cut points would be exactly the kind of unratified
 * clinical claim the suite refuses to make on a practitioner's behalf.
 */
export const ScoreTableColumnKey = z.enum([
  "subtest",
  "standardScore",
  "confidenceInterval",
  "percentile",
  "classification",
  "verificationStatus",
]);
export type TScoreTableColumnKey = z.infer<typeof ScoreTableColumnKey>;

export const ScoreTableColumn = z.object({
  key: ScoreTableColumnKey,
  /** Column heading as the district words it. */
  header: z.string().min(1),
});

/** One classification band. Half-open on the upper bound: [min, max). */
export const ClassificationBand = z.object({
  label: z.string().min(1),
  min: z.number(),
  max: z.number(),
});

export const ScoreTableConvention = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  label: z.string().min(1),

  /** Ordered. At least one column, or there is no table. */
  columns: z.array(ScoreTableColumn).min(1),

  /**
   * `as_reported` preserves the order the instrument reports its scores in,
   * which is the order the protocol prints and the order a clinician checks
   * against. Anything else is a district preference.
   */
  order: z.enum(["as_reported", "subtest_alpha"]).default("as_reported"),

  /** Confidence-interval rendering, e.g. "66–76". */
  confidenceIntervalSeparator: z.string().default("–"),

  /**
   * How a score awaiting confirmation against the protocol is marked. It is
   * ALWAYS shown — the withholding is from the drafting model, never from the
   * clinician, who must see the extracted value in order to confirm it.
   */
  unverifiedMarker: z.string().min(1),

  /** Optional; classification renders only when supplied. */
  bands: z.array(ClassificationBand).optional(),

  /** Table caption. The instrument name is substituted for {instrument}. */
  caption: z.string().optional(),
});
export type TScoreTableConvention = z.infer<typeof ScoreTableConvention>;
