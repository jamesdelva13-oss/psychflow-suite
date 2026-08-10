import {
  ScoreTableConvention,
  type TScoreTableConvention,
  type TScoreTableColumnKey,
} from "@suite/case-model";
import defaultConventionRaw from "@suite/content/conventions/score-table.default.v1.json" with { type: "json" };
import { buildScoreRows, type ScoreRow, type ScoreSetPayload, type ScoreVerification } from "./scores";
import type { SectionBlock } from "./report-sections";

/**
 * score-table.ts — the table layer (report-architecture proposal §2).
 *
 * A deterministic projection of `ScoreRow[]` into a document block. Pure: no
 * model, no I/O, no randomness. That is the whole point of it —
 * DESCRIPTIVE_RESULTS has always been told "the table already carries the
 * numbers" (parameter block §6 P1) while no table existed, so verified
 * numeric data was suppressed from prose and then reached nobody. This
 * supplies the missing precondition.
 *
 * WHAT IT BUYS THE FIDELITY GATE. A rendered table has no generation behind
 * it and cannot fabricate — every cell is a projection of a stored score.
 * Moving numbers out of prose therefore SHRINKS the surface the adjudicator
 * has to police (D-140) rather than enlarging it.
 *
 * THE SCHEMA IS NOT OURS TO FIX. Column set and order, confidence-interval
 * rendering, classification vocabulary, and how an unconfirmed score is marked
 * are house conventions — parameter block §11, layer 7, injected per district.
 * This module is the interpreter; `@suite/content/conventions` holds the data.
 * Nothing below hardcodes a column.
 */

/** The fallback convention, validated at module load rather than at use. */
export const DEFAULT_SCORE_TABLE: TScoreTableConvention =
  ScoreTableConvention.parse(defaultConventionRaw);

/**
 * UNVERIFIED SCORES APPEAR, MARKED.
 *
 * The withholding is from the drafting model, never from the clinician: they
 * have to see the extracted value to confirm it against the protocol. A table
 * that hid Reading Comprehension would hide the very thing the verification
 * flow asks them to act on, and would leave the section looking thin for a
 * reason nobody could see.
 */
function classify(score: number, bands: TScoreTableConvention["bands"]): string {
  if (!bands) return "";
  const hit = bands.find((b) => score >= b.min && score < b.max);
  return hit?.label ?? "";
}

function cell(
  key: TScoreTableColumnKey,
  row: ScoreRow,
  convention: TScoreTableConvention
): string {
  switch (key) {
    case "subtest":
      return row.subtest;
    case "standardScore":
      return String(row.standardScore);
    case "confidenceInterval":
      return `${row.ci95[0]}${convention.confidenceIntervalSeparator}${row.ci95[1]}`;
    case "percentile":
      return String(row.percentile);
    case "classification":
      return classify(row.standardScore, convention.bands);
    case "verificationStatus":
      return row.needsVerification ? convention.unverifiedMarker : "";
  }
}

const ordered = (rows: ScoreRow[], convention: TScoreTableConvention): ScoreRow[] =>
  convention.order === "subtest_alpha"
    ? [...rows].sort((a, b) => a.subtest.localeCompare(b.subtest))
    : rows;

export interface ScoreTableBlock {
  kind: "table";
  table: string;
  caption?: string;
  columns: string[];
  rows: { cells: string[]; flag?: "unverified"; scoreKey: string }[];
  sourceId: string;
  /** Which convention rendered this, so a stored table stays interpretable. */
  convention: { id: string; version: string };
}

/**
 * Render one score set as a document block.
 *
 * Every extracted score appears — including any awaiting confirmation, marked
 * per the convention. `flag` travels with the row so the surface can render
 * the state rather than re-deriving it, and so an export carries the same
 * distinction the screen showed.
 */
export function buildScoreTableBlock(args: {
  payload: ScoreSetPayload;
  sourceId: string;
  verifications: ScoreVerification[];
  convention?: TScoreTableConvention;
}): ScoreTableBlock {
  const convention = args.convention ?? DEFAULT_SCORE_TABLE;
  const rows = ordered(
    buildScoreRows(args.payload, args.verifications, args.sourceId),
    convention
  );

  return {
    kind: "table",
    table: "score_summary",
    caption: convention.caption?.replace("{instrument}", args.payload.instrument),
    columns: convention.columns.map((c) => c.header),
    rows: rows.map((r) => ({
      scoreKey: r.key,
      cells: convention.columns.map((c) => cell(c.key, r, convention)),
      ...(r.needsVerification ? { flag: "unverified" as const } : {}),
    })),
    sourceId: args.sourceId,
    convention: { id: convention.id, version: convention.version },
  };
}

/**
 * The tables one section carries, from its plan declaration.
 *
 * Returns [] for every section that declares none — which is all of them but
 * Assessment results. The table enumerates and the prose interprets one level
 * coarser (parameter block §6 P1/P2); repeating the same table under
 * Interpretation would be the striped-screen failure the Design System warns
 * about (§2).
 *
 * Takes the plan's `tables` array rather than the plan itself, so this module
 * stays a leaf and the report plan keeps ownership of placement.
 */
export function tablesForSection(args: {
  tables: string[] | undefined;
  sources: { source: { kind: string; sourceId: string }; payload: unknown }[];
  verifications: ScoreVerification[];
  convention?: TScoreTableConvention;
}): SectionBlock[] {
  if (!args.tables?.includes("score_summary")) return [];
  return args.sources
    .filter((s) => s.source.kind === "score_set")
    .map(
      (s) =>
        buildScoreTableBlock({
          payload: s.payload as ScoreSetPayload,
          sourceId: s.source.sourceId,
          verifications: args.verifications,
          convention: args.convention,
        }) as unknown as SectionBlock
    );
}
