import test from "node:test";
import assert from "node:assert/strict";
import {
  proseOnly,
  replaceProse,
  sectionProse,
  type SectionBlock,
} from "../lib/report-sections";

/**
 * The block representation (migration 0009). A section is an ordered array of
 * blocks, not a string.
 *
 * These test the TypeScript half of two invariants the database also enforces.
 * Both halves exist on purpose: the schema is the safeguard, and these catch
 * the disagreement early, in the place where the mistake actually gets made.
 * `tools/verify-migration-0009.mjs` proves the SQL side against real Postgres.
 */

const TABLE: SectionBlock = {
  kind: "table",
  table: "score_summary",
  columns: ["Subtest", "SS", "95% CI", "%ile"],
  rows: [{ cells: ["Word Reading", "71", "66–76", "3"], scoreKey: "word-reading" }],
  sourceId: "src-1",
};

test("sectionProse joins prose blocks in order, the way the SQL function does", () => {
  assert.equal(sectionProse([{ kind: "prose", text: "One." }]), "One.");
  assert.equal(
    sectionProse([
      { kind: "prose", text: "One." },
      { kind: "prose", text: "Two." },
    ]),
    "One.\n\nTwo."
  );
});

test("sectionProse ignores rendered blocks entirely", () => {
  assert.equal(sectionProse([TABLE, { kind: "prose", text: "Prose." }]), "Prose.");
  assert.equal(sectionProse([TABLE]), "", "a table-only section has no prose");
});

test("a generation becomes exactly one prose block", () => {
  const blocks = proseOnly("Word reading was an area of difficulty.");
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].kind, "prose");
  // The schema CHECK requires exactly one prose block on a generated section;
  // producing two here would be refused at insert.
  assert.equal(blocks.filter((b) => b.kind === "prose").length, 1);
});

test("the prose of a persisted generation round-trips to the adjudicated text", () => {
  // This is the invariant the report_sections_generated_text_matches trigger
  // enforces: section prose must equal the generation content character for
  // character, or the insert is refused.
  const adjudicated = "First paragraph.\n\nSecond paragraph.";
  assert.equal(sectionProse(proseOnly(adjudicated)), adjudicated);
});

test("a clinician edit replaces the prose and KEEPS the rendered table", () => {
  const before: SectionBlock[] = [TABLE, { kind: "prose", text: "Original." }];
  const after = replaceProse(before, "Edited by the clinician.");

  assert.equal(after.length, 2);
  assert.deepEqual(after[0], TABLE, "the table survived the edit");
  assert.equal(sectionProse(after), "Edited by the clinician.");
});

test("…whatever order the blocks were in", () => {
  const proseFirst: SectionBlock[] = [{ kind: "prose", text: "Original." }, TABLE];
  const after = replaceProse(proseFirst, "Edited.");
  assert.equal(after[0].kind, "prose", "prose stays where it was");
  assert.deepEqual(after[1], TABLE);
  assert.equal(sectionProse(after), "Edited.");
});

test("editing a section with several prose blocks collapses them to one", () => {
  // A human section may carry several prose blocks; the edit surface is one
  // textarea, so saving is one block. The table still survives.
  const before: SectionBlock[] = [
    { kind: "prose", text: "One." },
    TABLE,
    { kind: "prose", text: "Two." },
  ];
  const after = replaceProse(before, "Merged.");
  assert.equal(after.filter((b) => b.kind === "prose").length, 1);
  assert.equal(after.filter((b) => b.kind === "table").length, 1);
  assert.equal(sectionProse(after), "Merged.");
});

test("editing a table-only section adds prose without dropping the table", () => {
  const after = replaceProse([TABLE], "The clinician wrote this.");
  assert.equal(after.length, 2);
  assert.ok(after.some((b) => b.kind === "table"));
  assert.equal(sectionProse(after), "The clinician wrote this.");
});
