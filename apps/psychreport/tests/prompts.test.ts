import test from "node:test";
import assert from "node:assert/strict";
import { buildCaseContext, type CaseRow, type SourceRow } from "../lib/case-context";
import { buildGenerationInputs } from "../lib/source-policy";
import { systemPrompt, userPrompt, sourcePolicyBlock } from "../lib/prompts";
import { gateSection, planFor, renderCaseData, eligibleSources } from "../lib/report-plan";
import type { ScoreSetPayload, ScoreVerification } from "../lib/scores";

/**
 * Prompt-assembly guards. The point of these is not that the prose is good
 * — it is that the prompt cannot be assembled without the pieces the
 * operational spec and the ceiling architecture require.
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

const teacherRow: SourceRow = {
  id: "11111111-1111-4111-8111-111111111111",
  case_id: "case-1",
  informant_id: null,
  kind: "referral_form",
  collected_on: "2026-04-28",
  instrument: null,
  bank_id: "teacher-intake",
  bank_version: "1.3.0",
  payload: { responses: { "TCH-RDG-006": "well_below" } },
  locked: true,
  checksum: "abc",
  version: 1,
  supersedes_source_id: null,
  created_at: "2026-04-28T14:30:00Z",
  deleted_at: null,
};

const captureRow: SourceRow = {
  ...teacherRow,
  id: "22222222-2222-4222-8222-222222222222",
  kind: "interview",
  instrument: "capture",
  bank_id: null,
  bank_version: null,
  payload: { setting: "Union Elementary", occurredOn: "2026-05-05", summaryFinal: "Summary." },
};

const SCORES: ScoreSetPayload = {
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
      location: "p. 2",
    },
    {
      key: "reading-comprehension",
      subtest: "Reading Comprehension",
      standardScore: 76,
      ci95: [70, 82],
      percentile: 5,
      extraction: "parsed_low_confidence",
      location: "p. 2",
    },
  ],
};

const scoreRow: SourceRow = {
  ...teacherRow,
  id: "33333333-3333-4333-8333-333333333333",
  kind: "score_set",
  instrument: "WIAT-4",
  bank_id: null,
  bank_version: null,
  collected_on: "2026-05-19",
  payload: SCORES,
};

const inputsFrom = (rows: SourceRow[], v: ScoreVerification[] = []) =>
  buildGenerationInputs(buildCaseContext(caseRow, rows), v);

test("the system prompt carries voice, the mode block, fidelity, and the nine transformations", () => {
  const p = systemPrompt("SOURCE_FAITHFUL");
  assert.match(p, /measured confidence of an experienced psychologist/);
  assert.match(p, /BLOCK: Source-faithful summary/);
  assert.match(p, /FIDELITY/);
  assert.match(p, /PROHIBITED TRANSFORMATIONS/);
  // C4: all nine examples ship until the QA regression suite exists.
  for (const t of [
    /"sometimes" → "frequently"/,
    /"elevated" → "clinically significant"/,
    /"the teacher reported" → "the student is"/,
    /a low score → a diagnosed impairment/,
    /cross-informant disagreement → situational causation/,
    /a relative weakness → a normative deficit/,
    /test-session behavior → a generalized trait/,
    /absence of evidence → evidence of absence/,
    /a recommendation → a demonstrated need/,
  ]) {
    assert.match(p, t);
  }
});

test("operational-spec 4.3 is applied: the deleted qualification cap is absent", () => {
  const p = systemPrompt("INTEGRATED_INTERPRETATION");
  assert.doesNotMatch(p, /At most one qualification per paragraph/);
  assert.match(p, /Qualify each claim only as much as its evidence requires/);
});

test("confidence stems appear only where inference is permitted", () => {
  assert.match(systemPrompt("INTEGRATED_INTERPRETATION"), /Match the stem to the evidence/);
  assert.match(systemPrompt("RECOMMENDATION"), /Match the stem to the evidence/);
  assert.doesNotMatch(systemPrompt("SOURCE_FAITHFUL"), /Match the stem to the evidence/);
  assert.doesNotMatch(systemPrompt("DESCRIPTIVE_RESULTS"), /Match the stem to the evidence/);
});

test("D-099 defect shape at the prompt layer: source limits are always carried", () => {
  const inputs = inputsFrom([teacherRow, captureRow, scoreRow]);
  const prompt = userPrompt(inputs, "CASE DATA HERE");
  assert.match(prompt, /SOURCE LIMITS — do not exceed these/);
  assert.match(prompt, /CASE DATA/);
  // Every source appears with its resolved ceiling text.
  assert.equal((prompt.match(/ceiling:/g) ?? []).length, 3);
});

test("the ceiling stated to the model is the resolved one, not the declared one", () => {
  // The capture source declares INTEGRATE_WITH_QUALIFICATION but resolves to
  // DESCRIBE_ONLY (no construct scope), and the prompt must say so.
  const inputs = inputsFrom([captureRow]);
  const block = sourcePolicyBlock(inputs.sources);
  assert.match(block, /Describe observed performance only/);
  assert.doesNotMatch(block, /May be used in synthesis/);
});

test("a section with no eligible source refuses instead of drafting from adjacent material", () => {
  const inputs = inputsFrom([teacherRow, captureRow]); // no observation
  const gate = gateSection(inputs, planFor("observations")!);
  assert.equal(gate.ok, false);
  assert.match((gate as { reason: string }).reason, /No observation has been added/);
});

test("integrated interpretation refuses when every source is describe-only", () => {
  const inputs = inputsFrom([captureRow, scoreRow]); // capture: no scope; scores: unverified
  const gate = gateSection(inputs, planFor("interpretation")!);
  assert.equal(gate.ok, false);
  assert.match((gate as { reason: string }).reason, /limited to description/);
});

test("…and permits it once one source is integrable", () => {
  const inputs = inputsFrom([teacherRow, captureRow]);
  const gate = gateSection(inputs, planFor("interpretation")!);
  assert.equal(gate.ok, true);
});

test("unverified scores are withheld from the model, and their absence is stated", () => {
  const inputs = inputsFrom([scoreRow]);
  const plan = planFor("assessment-results")!;
  const data = renderCaseData(inputs, eligibleSources(inputs, plan), []);
  assert.match(data, /Word Reading: standard score 71/);
  // The unconfirmed subtest never reaches the model at all — neither its
  // name nor its value. (A bare /76/ would false-match Word Reading's CI.)
  assert.doesNotMatch(data, /Reading Comprehension/);
  assert.doesNotMatch(data, /standard score 76/);
  assert.match(data, /awaiting verification/);
});

test("confirming the score releases it into the case data", () => {
  const v: ScoreVerification[] = [
    {
      sourceId: scoreRow.id,
      scoreKey: "reading-comprehension",
      actor: "owner",
      at: "2026-05-20T10:00:00Z",
    },
  ];
  const inputs = inputsFrom([scoreRow], v);
  const plan = planFor("assessment-results")!;
  const data = renderCaseData(inputs, eligibleSources(inputs, plan), v);
  assert.match(data, /Reading Comprehension: standard score 76/);
  assert.doesNotMatch(data, /awaiting verification/);
});
