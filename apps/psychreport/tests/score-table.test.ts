import test from "node:test";
import assert from "node:assert/strict";
import { ScoreTableConvention } from "@suite/case-model";
import {
  DEFAULT_SCORE_TABLE,
  buildScoreTableBlock,
  tablesForSection,
} from "../lib/score-table";
import { WIAT4_SCORE_SET } from "../../../tools/fixtures/avery";
import type { ScoreSetPayload, ScoreVerification } from "../lib/scores";
import { planFor } from "../lib/report-plan";

/**
 * The table layer (report-architecture proposal §2). Pure — no model, no I/O.
 *
 * Two properties matter most and are tested hardest: an unconfirmed score
 * APPEARS (marked), because the withholding is from the drafting model and
 * never from the clinician; and the column schema comes from a house
 * convention, because parameter block §11 puts it at layer 7 and hardcoding
 * it would violate a ratified layer boundary.
 */

const SOURCE_ID = "33333333-3333-4333-8333-333333333333";
const payload = WIAT4_SCORE_SET as unknown as ScoreSetPayload;

const build = (verifications: ScoreVerification[] = []) =>
  buildScoreTableBlock({ payload, sourceId: SOURCE_ID, verifications });

test("the default convention is authored content, validated against the contract", () => {
  // If the JSON drifts from the schema this throws at module load, not at use.
  assert.doesNotThrow(() => ScoreTableConvention.parse(DEFAULT_SCORE_TABLE));
  assert.equal(DEFAULT_SCORE_TABLE.id, "score-table.default");
  assert.ok(DEFAULT_SCORE_TABLE.columns.length > 0);
});

test("every extracted score appears — including the one awaiting confirmation", () => {
  const block = build();
  assert.equal(block.rows.length, 3, "all three WIAT-4 rows, none withheld");
  const subtests = block.rows.map((r) => r.cells[0]);
  assert.deepEqual(subtests, ["Word Reading", "Pseudoword Decoding", "Reading Comprehension"]);
});

test("…and the unconfirmed one is MARKED rather than hidden", () => {
  const block = build();
  const flagged = block.rows.filter((r) => r.flag === "unverified");
  assert.equal(flagged.length, 1);
  assert.equal(flagged[0].cells[0], "Reading Comprehension");
  assert.equal(flagged[0].scoreKey, "reading-comprehension");
  // The marker text is the convention's, not this module's.
  assert.ok(flagged[0].cells.includes(DEFAULT_SCORE_TABLE.unverifiedMarker));
});

test("the table shows a value the drafting model was denied", () => {
  // The contrast this whole design turns on: renderCaseData withholds Reading
  // Comprehension from the prompt, and the table shows it to the clinician,
  // because only one of them is being asked to confirm it against a protocol.
  const block = build();
  const rc = block.rows.find((r) => r.cells[0] === "Reading Comprehension")!;
  assert.ok(rc.cells.includes("76"), "the clinician sees the extracted value");
});

test("confirming the score clears the mark", () => {
  const v: ScoreVerification[] = [
    { sourceId: SOURCE_ID, scoreKey: "reading-comprehension", actor: "owner", at: "2026-05-20T10:00:00Z" },
  ];
  const block = build(v);
  assert.equal(block.rows.filter((r) => r.flag === "unverified").length, 0);
  assert.equal(block.rows.length, 3, "still every score");
});

test("a verification for a different Source does not clear it (negative)", () => {
  const v: ScoreVerification[] = [
    { sourceId: "some-other-source", scoreKey: "reading-comprehension", actor: "o", at: "x" },
  ];
  assert.equal(build(v).rows.filter((r) => r.flag === "unverified").length, 1);
});

/* ---- house conventions: the schema is not ours to fix ---- */

test("a district convention changes the table with no code change", () => {
  const district = ScoreTableConvention.parse({
    id: "district.union",
    version: "1.0.0",
    label: "Union SD",
    columns: [
      { key: "subtest", header: "Measure" },
      { key: "percentile", header: "PR" },
      { key: "standardScore", header: "SS" },
    ],
    order: "subtest_alpha",
    confidenceIntervalSeparator: " to ",
    unverifiedMarker: "UNCONFIRMED",
  });
  const block = buildScoreTableBlock({
    payload,
    sourceId: SOURCE_ID,
    verifications: [],
    convention: district,
  });

  assert.deepEqual(block.columns, ["Measure", "PR", "SS"], "columns and order are the district's");
  assert.equal(block.rows[0].cells[0], "Pseudoword Decoding", "subtest_alpha reordered them");
  assert.equal(block.convention.id, "district.union", "the record says which convention rendered it");
  // No CI column requested, so no CI anywhere in the table.
  assert.ok(!block.rows.some((r) => r.cells.some((c) => c.includes(" to "))));
});

test("confidence intervals render through the convention's separator", () => {
  const block = build();
  const ciCol = DEFAULT_SCORE_TABLE.columns.findIndex((c) => c.key === "confidenceInterval");
  assert.equal(block.rows[0].cells[ciCol], `66${DEFAULT_SCORE_TABLE.confidenceIntervalSeparator}76`);
});

test("classification renders only when a convention supplies bands", () => {
  const base = {
    id: "c", version: "1.0.0", label: "c",
    columns: [{ key: "subtest", header: "Subtest" }, { key: "classification", header: "Range" }],
    unverifiedMarker: "pending",
  };
  const withoutBands = ScoreTableConvention.parse(base);
  const blank = buildScoreTableBlock({ payload, sourceId: SOURCE_ID, verifications: [], convention: withoutBands });
  assert.deepEqual(
    blank.rows.map((r) => r.cells[1]),
    ["", "", ""],
    "no bands authored → no classification claimed"
  );

  const withBands = ScoreTableConvention.parse({
    ...base,
    bands: [
      { label: "Low", min: 0, max: 80 },
      { label: "Below average", min: 80, max: 90 },
    ],
  });
  const banded = buildScoreTableBlock({ payload, sourceId: SOURCE_ID, verifications: [], convention: withBands });
  assert.deepEqual(banded.rows.map((r) => r.cells[1]), ["Low", "Low", "Low"]);
});

/* ---- placement is the report plan's ---- */

test("only Assessment results carries the score table", () => {
  const sources = [{ source: { kind: "score_set", sourceId: SOURCE_ID }, payload }];
  const assessment = tablesForSection({
    tables: planFor("assessment-results")!.tables,
    sources,
    verifications: [],
  });
  assert.equal(assessment.length, 1);

  for (const key of ["reason-for-referral", "background", "interpretation", "recommendations"]) {
    const blocks = tablesForSection({
      tables: planFor(key)!.tables,
      sources,
      verifications: [],
    });
    assert.equal(blocks.length, 0, `${key} must not repeat the table`);
  }
});

test("a section with no score set gets no table", () => {
  const blocks = tablesForSection({
    tables: planFor("assessment-results")!.tables,
    sources: [{ source: { kind: "referral_form", sourceId: "t" }, payload: {} }],
    verifications: [],
  });
  assert.deepEqual(blocks, []);
});

test("the block carries what it was rendered from, so a stored table stays interpretable", () => {
  const block = build();
  assert.equal(block.sourceId, SOURCE_ID);
  assert.equal(block.convention.id, DEFAULT_SCORE_TABLE.id);
  assert.equal(block.convention.version, DEFAULT_SCORE_TABLE.version);
  assert.match(block.caption ?? "", /WIAT-4/);
});
