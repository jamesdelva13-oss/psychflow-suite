import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildCaseContext,
  sourceFromRow,
  resolveCaseContext,
  type CaseRow,
  type SourceRow,
} from "../lib/case-context";
import { makeMockDb } from "./helpers/mock-db";

const caseRow: CaseRow = {
  id: "case-1",
  psychologist_id: "psych-1",
  state: "SC",
  eval_type: "initial",
  referral_date: "2026-08-01",
  status: "data_collection",
  first_name: "Avery",
  last_initial: "W",
  display_initials: "A.W.",
  grade: "4",
  student_ref: "fixture-ref",
  priority_flag: false,
  created_at: "2026-08-01 09:00:00+00",
  deleted_at: null,
};

const baseSource = (over: Partial<SourceRow>): SourceRow => ({
  id: "src-1",
  case_id: "case-1",
  informant_id: "inf-1",
  kind: "referral_form",
  collected_on: "2026-08-02",
  instrument: null,
  bank_id: "teacher-intake",
  bank_version: "1.3.0",
  payload: { responses: { "TCH-CORE-001": "gen_ed" } },
  locked: true,
  checksum: "abc123",
  version: 1,
  supersedes_source_id: null,
  created_at: "2026-08-02 10:00:00+00",
  deleted_at: null,
  ...over,
});

test("sourceFromRow maps a DB row onto the canonical Source contract", () => {
  const s = sourceFromRow(baseSource({}));
  assert.equal(s.sourceId, "src-1");
  assert.equal(s.caseId, "case-1");
  assert.deepEqual(s.bank, { bankId: "teacher-intake", bankVersion: "1.3.0" });
  assert.equal(s.checksum, "abc123");
  assert.equal(s.locked, true);
  assert.equal(s.version, 1);
  // Postgres offset timestamps are Z-normalized to satisfy the contract.
  assert.match(s.createdAt, /Z$/);
});

test("sourceFromRow throws on a row that violates the contract", () => {
  assert.throws(() => sourceFromRow(baseSource({ kind: "not_a_kind" })));
});

test("unlocked and deleted source rows are structurally excluded", () => {
  const ctx = buildCaseContext(caseRow, [
    baseSource({}),
    baseSource({ id: "src-unlocked", locked: false }),
    baseSource({ id: "src-deleted", deleted_at: "2026-08-03 00:00:00+00" }),
  ]);
  assert.equal(ctx.sources.length, 1);
  assert.equal(ctx.sources[0].source.sourceId, "src-1");
});

test("supersession resolves to the current Source with superseded derived", () => {
  const ctx = buildCaseContext(caseRow, [
    baseSource({}),
    baseSource({
      id: "src-2",
      version: 2,
      supersedes_source_id: "src-1",
      checksum: "def456",
      created_at: "2026-08-04 10:00:00+00",
    }),
  ]);
  assert.equal(ctx.sources.length, 2);
  const v1 = ctx.sources.find((s) => s.source.sourceId === "src-1")!;
  const v2 = ctx.sources.find((s) => s.source.sourceId === "src-2")!;
  assert.equal(v1.superseded, true);
  assert.equal(v2.superseded, false);
  assert.deepEqual(
    ctx.currentSources.map((s) => s.source.sourceId),
    ["src-2"]
  );
});

test("payload content travels with each context source", () => {
  const ctx = buildCaseContext(caseRow, [baseSource({})]);
  assert.deepEqual(ctx.sources[0].payload, {
    responses: { "TCH-CORE-001": "gen_ed" },
  });
});

test("resolveCaseContext returns null for an invisible or absent case", async () => {
  const db = makeMockDb({ cases: { maybeSingleRow: null } });
  assert.equal(await resolveCaseContext(db, "nope"), null);
});

test("resolveCaseContext assembles the context from live rows", async () => {
  const db = makeMockDb({
    cases: { maybeSingleRow: caseRow },
    sources: { rows: [baseSource({})] },
  });
  const ctx = await resolveCaseContext(db, "case-1");
  assert.ok(ctx);
  assert.equal(ctx!.caseId, "case-1");
  assert.equal(ctx!.student.firstName, "Avery");
  assert.equal(ctx!.currentSources.length, 1);
});
