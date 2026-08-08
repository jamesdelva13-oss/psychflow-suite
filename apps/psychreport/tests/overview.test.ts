import test from "node:test";
import assert from "node:assert/strict";
import { buildCaseContext, type CaseRow, type SourceRow } from "../lib/case-context";
import { buildOverview } from "../lib/overview";

const caseRow: CaseRow = {
  id: "case-1",
  psychologist_id: "owner",
  state: "SC",
  eval_type: "initial",
  referral_date: "2026-04-20",
  status: "data_collection",
  first_name: "Avery",
  last_initial: "W",
  display_initials: "A.W.",
  grade: "4",
  student_ref: "fixture",
  priority_flag: false,
  created_at: "2026-04-20T12:00:00Z",
  deleted_at: null,
};

const sourceRow = (over: Partial<SourceRow>): SourceRow => ({
  id: "11111111-1111-4111-8111-111111111111",
  case_id: "case-1",
  informant_id: null,
  kind: "referral_form",
  collected_on: "2026-04-28",
  instrument: null,
  bank_id: "teacher-intake",
  bank_version: "1.3.0",
  payload: { responses: {} },
  locked: true,
  checksum: "abc",
  version: 1,
  supersedes_source_id: null,
  created_at: "2026-04-28T14:30:00Z",
  deleted_at: null,
  ...over,
});

test("complete referral record: readiness affirms, action goes to materials, reuse message present", () => {
  const ctx = buildCaseContext(caseRow, [
    sourceRow({}),
    sourceRow({
      id: "22222222-2222-4222-8222-222222222222",
      kind: "interview",
      instrument: "capture",
      bank_id: null,
      bank_version: null,
    }),
  ]);
  const o = buildOverview(ctx);
  assert.equal(o.readiness, "The referral record is complete.");
  assert.equal(o.nextAction.href, "/cases/case-1/materials");
  assert.ok(o.reuseMessage && /already available/.test(o.reuseMessage));
});

test("teacher intake only: readiness names the missing interview, no reuse overclaim", () => {
  const ctx = buildCaseContext(caseRow, [sourceRow({})]);
  const o = buildOverview(ctx);
  assert.match(o.readiness, /missing an interview or observation/);
  assert.equal(o.reuseMessage, null);
});

test("no sources: readiness says so plainly (negative — nothing invented)", () => {
  const ctx = buildCaseContext(caseRow, []);
  const o = buildOverview(ctx);
  assert.match(o.readiness, /No finalized referral material/);
  assert.equal(o.reuseMessage, null);
});

test("a superseded interview does not count toward readiness", () => {
  const oldId = "33333333-3333-4333-8333-333333333333";
  const ctx = buildCaseContext(caseRow, [
    sourceRow({}),
    sourceRow({ id: oldId, kind: "interview", instrument: "capture", bank_id: null, bank_version: null }),
    sourceRow({
      id: "44444444-4444-4444-8444-444444444444",
      kind: "interview",
      instrument: "capture",
      bank_id: null,
      bank_version: null,
      version: 2,
      supersedes_source_id: oldId,
    }),
  ]);
  const o = buildOverview(ctx);
  // the superseding interview is current, so the record is still complete
  assert.equal(o.readiness, "The referral record is complete.");
  const current = ctx.currentSources.filter((s) => s.source.kind === "interview");
  assert.equal(current.length, 1);
  assert.equal(current[0].source.version, 2);
});
