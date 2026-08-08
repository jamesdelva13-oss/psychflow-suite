import test from "node:test";
import assert from "node:assert/strict";
import { effectiveCeiling } from "@suite/reasoning-contracts";
import { buildCaseContext, type CaseRow, type SourceRow } from "../lib/case-context";
import {
  allDescribeOnly,
  buildGenerationInputs,
  policeSource,
} from "../lib/source-policy";
import type { ScoreSetPayload, ScoreVerification } from "../lib/scores";

/**
 * The D-099 / D-118 defect-shape regressions plus the score-verification →
 * ceiling linkage. These run without a database or a model.
 */

const caseRow: CaseRow = {
  id: "case-1",
  psychologist_id: "owner",
  state: "SC",
  eval_type: "initial",
  referral_date: "2026-04-20",
  status: "assessment",
  first_name: "Avery",
  last_initial: "W",
  display_initials: "A.W.",
  grade: "4",
  student_ref: "fixture",
  priority_flag: false,
  created_at: "2026-04-20T12:00:00Z",
  deleted_at: null,
};

const row = (over: Partial<SourceRow>): SourceRow => ({
  id: "11111111-1111-4111-8111-111111111111",
  case_id: "case-1",
  informant_id: null,
  kind: "referral_form",
  collected_on: "2026-04-28",
  instrument: null,
  bank_id: "teacher-intake",
  bank_version: "1.3.0",
  payload: { responses: { "TCH-RDG-006": "well_below", "TCH-CORE-008": ["reading"] } },
  locked: true,
  checksum: "abc",
  version: 1,
  supersedes_source_id: null,
  created_at: "2026-04-28T14:30:00Z",
  deleted_at: null,
  ...over,
});

const SCORE_PAYLOAD: ScoreSetPayload = {
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
      key: "reading-comprehension",
      subtest: "Reading Comprehension",
      standardScore: 76,
      ci95: [70, 82],
      percentile: 5,
      extraction: "parsed_low_confidence",
      location: "p. 2, Score Summary",
    },
  ],
};

const scoreRow = (over: Partial<SourceRow> = {}): SourceRow =>
  row({
    id: "22222222-2222-4222-8222-222222222222",
    kind: "score_set",
    instrument: "WIAT-4",
    bank_id: null,
    bank_version: null,
    collected_on: "2026-05-19",
    payload: SCORE_PAYLOAD,
    ...over,
  });

const captureRow = (): SourceRow =>
  row({
    id: "33333333-3333-4333-8333-333333333333",
    kind: "interview",
    instrument: "capture",
    bank_id: null,
    bank_version: null,
    collected_on: "2026-05-05",
    payload: { setting: "Union Elementary — teacher interview", occurredOn: "2026-05-05" },
  });

const ctxOf = (rows: SourceRow[]) => buildCaseContext(caseRow, rows);
const first = (rows: SourceRow[], verifications: ScoreVerification[] = []) =>
  policeSource(ctxOf(rows).currentSources[0], verifications);

test("teacher intake: scope established from the pinned bank, integrable with qualification", () => {
  const p = first([row({})]);
  assert.equal(p.policy.scope.informant, "TEACHER");
  assert.deepEqual(p.policy.scope.settings, ["SCHOOL"]);
  assert.ok(p.policy.scope.constructs.length > 0, "constructIds should resolve from the bank");
  assert.equal(p.ceiling, "INTEGRATE_WITH_QUALIFICATION");
});

test("RIE Capture records no construct tags, so GUARD 2 caps the interview at DESCRIBE_ONLY", () => {
  const p = first([captureRow()]);
  assert.deepEqual(p.policy.scope.constructs, []);
  // The policy's declared ceiling is higher; the canonical guard overrides it.
  assert.equal(p.policy.interpretiveCeiling, "INTEGRATE_WITH_QUALIFICATION");
  assert.equal(p.ceiling, "DESCRIBE_ONLY");
});

test("unverified low-confidence score holds the set at NOT_ESTABLISHED → DESCRIBE_ONLY", () => {
  const p = first([scoreRow()]);
  assert.equal(p.policy.validityStatus, "NOT_ESTABLISHED");
  assert.equal(p.ceiling, "DESCRIBE_ONLY");
  assert.equal(p.reviewBeforeIntegration, true);
});

test("confirming the score raises the same set to an integrable source", () => {
  const verifications: ScoreVerification[] = [
    {
      sourceId: "22222222-2222-4222-8222-222222222222",
      scoreKey: "reading-comprehension",
      actor: "owner",
      at: "2026-05-20T10:00:00Z",
    },
  ];
  const p = first([scoreRow()], verifications);
  assert.equal(p.policy.validityStatus, "ACCEPTABLE");
  assert.equal(p.ceiling, "INTEGRATE_WITH_QUALIFICATION");
  assert.equal(p.reviewBeforeIntegration, false);
});

test("verifying an unrelated score does not raise the set (negative)", () => {
  const verifications: ScoreVerification[] = [
    {
      sourceId: "22222222-2222-4222-8222-222222222222",
      scoreKey: "word-reading", // already parsed_ok; not the open item
      actor: "owner",
      at: "2026-05-20T10:00:00Z",
    },
  ];
  const p = first([scoreRow()], verifications);
  assert.equal(p.ceiling, "DESCRIBE_ONLY");
});

test("a verification for a different Source never satisfies this one (negative)", () => {
  const verifications: ScoreVerification[] = [
    {
      sourceId: "99999999-9999-4999-8999-999999999999",
      scoreKey: "reading-comprehension",
      actor: "owner",
      at: "2026-05-20T10:00:00Z",
    },
  ];
  assert.equal(first([scoreRow()], verifications).ceiling, "DESCRIBE_ONLY");
});

test("an unmodelled source kind fails safe to DESCRIBE_ONLY", () => {
  const p = first([row({ kind: "work_sample", bank_id: null, bank_version: null, payload: {} })]);
  assert.equal(p.ceiling, "DESCRIBE_ONLY");
  assert.equal(p.reviewBeforeIntegration, true);
});

test("D-099 defect shape: no source can reach generation without a policy", () => {
  const inputs = buildGenerationInputs(ctxOf([row({}), captureRow(), scoreRow()]), []);
  assert.equal(inputs.sources.length, 3);
  for (const s of inputs.sources) {
    assert.ok(s.policy, `${s.source.kind} arrived without a policy`);
    assert.equal(s.policy.sourceId, s.source.sourceId);
    // The resolved ceiling is the canonical guard's answer, not the raw field.
    assert.equal(s.ceiling, effectiveCeiling(s.policy));
  }
});

test("superseded sources never reach generation", () => {
  const oldId = "44444444-4444-4444-8444-444444444444";
  const inputs = buildGenerationInputs(
    ctxOf([
      scoreRow({ id: oldId }),
      scoreRow({ id: "55555555-5555-4555-8555-555555555555", version: 2, supersedes_source_id: oldId }),
    ]),
    []
  );
  assert.equal(inputs.sources.length, 1);
  assert.equal(inputs.sources[0].source.version, 2);
});

test("allDescribeOnly is false once any source is integrable", () => {
  assert.equal(allDescribeOnly(buildGenerationInputs(ctxOf([captureRow()]), [])), true);
  assert.equal(allDescribeOnly(buildGenerationInputs(ctxOf([row({}), captureRow()]), [])), false);
});
