import test from "node:test";
import assert from "node:assert/strict";
import { buildCaseContext, type CaseRow, type SourceRow } from "../lib/case-context";
import { buildGenerationInputs } from "../lib/source-policy";
import { planFor, eligibleSources } from "../lib/report-plan";
import { generateSection, correctionTurn, clinicianGateNotice } from "../lib/generate";
import { resolveGateMode, configuredGateMode, DEFAULT_GATE_MODE, type GateMode } from "../lib/gate-mode";
import { systemPrompt, draftingPromptVersion, DRAFTING_PROMPT_VERSION } from "../lib/prompts";
import {
  validateAdjudication,
  type Adjudicate,
  type Adjudication,
  type AdjudicationProvenance,
  type AdjudicatorInput,
} from "../lib/adjudicator";
import {
  sessionEvidenceFor,
  renderSessionEvidence,
  SESSION_NARRATIVE_KINDS,
} from "../lib/session-evidence";
import type { ScoreSetPayload, ScoreVerification } from "../lib/scores";

/**
 * Deterministic orchestration tests for the session-fidelity gate (D-140,
 * governance/session-fidelity-adjudicator-v1.md §8.1). Runs every commit.
 *
 * The adjudicator is MOCKED throughout. These tests assert nothing about the
 * judge's accuracy — that is the live evaluation's job (tests-eval/). What
 * they assert is the property the judge cannot provide on its own: that a
 * failing verdict actually rejects output, that exactly one retry is
 * permitted, that the retry faces the identical gate, that a second failure
 * surfaces instead of looping, and that a broken adjudicator fails closed.
 */

/* ------------------------------------------------------------------ *
 * Fixtures — the Avery shape: teacher intake, capture, WIAT-4 score set.
 * ------------------------------------------------------------------ */

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

const baseRow: SourceRow = {
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
  ...baseRow,
  id: "33333333-3333-4333-8333-333333333333",
  kind: "score_set",
  instrument: "WIAT-4",
  bank_id: null,
  bank_version: null,
  collected_on: "2026-05-19",
  payload: SCORES,
};

const observationRow: SourceRow = {
  ...baseRow,
  id: "44444444-4444-4444-8444-444444444444",
  kind: "observation",
  instrument: null,
  bank_id: null,
  bank_version: null,
  collected_on: "2026-05-19",
  payload: {
    setting: "Testing session, Union Elementary",
    occurredOn: "2026-05-19",
    notes: "Avery asked once for a direction to be repeated. Rapport was established easily.",
  },
};

const inputsFrom = (rows: SourceRow[], v: ScoreVerification[] = []) =>
  buildGenerationInputs(buildCaseContext(caseRow, rows), v);

const PLAN = planFor("assessment-results")!;

/* ------------------------------------------------------------------ *
 * A scripted drafting client. Returns queued drafts in order, and counts
 * calls so "exactly one retry" is observable rather than inferred.
 * ------------------------------------------------------------------ */

interface Recorder {
  drafts: number;
  /** The `messages` array each drafting call received. */
  turns: unknown[][];
}

function draftingClient(texts: string[], rec: Recorder) {
  let i = 0;
  return {
    beta: {
      messages: {
        stream(body: { messages: unknown[] }) {
          const text = texts[Math.min(i, texts.length - 1)];
          i += 1;
          rec.drafts += 1;
          rec.turns.push(body.messages);
          return {
            finalMessage: async () => ({
              model: "claude-opus-5-20260101",
              stop_reason: "end_turn",
              content: [{ type: "text", text }],
              usage: { input_tokens: 100, outputTokens: 0, output_tokens: 50 },
            }),
          };
        },
      },
    },
  } as never;
}

const PROV: AdjudicationProvenance = {
  requestedModel: "claude-opus-5",
  servingModel: "claude-opus-5-20260101",
  promptVersion: "test",
  specVersion: "test",
  effort: "medium",
  inputTokens: 10,
  outputTokens: 5,
  at: "2026-08-09T00:00:00.000Z",
};

const passed = (): Adjudication => ({
  verdict: "passed",
  pass: true,
  unsupportedStatements: [],
  reason: "No undocumented session event asserted.",
  provenance: PROV,
});

const failed = (statements: string[]): Adjudication => ({
  verdict: "failed",
  pass: false,
  unsupportedStatements: statements,
  reason: "Asserts administration mechanics the supplied evidence does not document.",
  provenance: PROV,
});

const unusable = (reason: string): Adjudication => ({
  verdict: "unusable",
  pass: false,
  unsupportedStatements: [],
  reason,
  provenance: PROV,
});

/** Queue of verdicts; records what it was asked to judge. */
function scriptedAdjudicator(verdicts: Adjudication[]) {
  const seen: AdjudicatorInput[] = [];
  let i = 0;
  const fn: Adjudicate = async (input) => {
    seen.push(input);
    const v = verdicts[Math.min(i, verdicts.length - 1)];
    i += 1;
    return v;
  };
  return { fn, seen, get calls() { return i; } };
}

const BAD = "Across both tasks, Avery read a limited number of items correctly before reaching the discontinue criterion.";
const GOOD = "Word reading was a consistent area of difficulty, with unfamiliar words proving harder than familiar ones.";

const run = (
  texts: string[],
  verdicts: Adjudication[],
  rows: SourceRow[] = [scoreRow],
  gateMode: GateMode = "enforce"
) => {
  const rec: Recorder = { drafts: 0, turns: [] };
  const adj = scriptedAdjudicator(verdicts);
  const promise = generateSection({
    inputs: inputsFrom(rows),
    plan: PLAN,
    verifications: [],
    anthropic: draftingClient(texts, rec),
    adjudicate: adj.fn,
    gateMode,
  });
  return { promise, rec, adj };
};

/* ------------------------------------------------------------------ *
 * 1. A failed section is rejected, not returned
 * ------------------------------------------------------------------ */

test("a failing verdict rejects the draft — the prose is not returned as ok", async () => {
  const { promise } = run([BAD, BAD], [failed([BAD]), failed([BAD])]);
  const result = await promise;
  assert.notEqual(result.status, "ok");
  assert.equal(result.status, "needs_review");
});

test("a passing verdict returns the section unchanged and un-retried", async () => {
  const { promise, rec, adj } = run([GOOD], [passed()]);
  const result = await promise;
  assert.equal(result.status, "ok");
  assert.equal(rec.drafts, 1, "no regeneration on a passing section");
  assert.equal(adj.calls, 1);
  if (result.status !== "ok") return;
  assert.equal(result.section.content, GOOD);
  assert.equal(result.section.fidelity.outcome, "passed");
  assert.equal(result.section.fidelity.attempts.length, 1);
});

/* ------------------------------------------------------------------ *
 * 2. Exactly one retry
 * ------------------------------------------------------------------ */

test("exactly one regeneration is permitted, and it is instructed with the named statement", async () => {
  const { promise, rec } = run([BAD, GOOD], [failed([BAD]), passed()]);
  const result = await promise;

  assert.equal(rec.drafts, 2, "one retry, not two");
  assert.equal(result.status, "ok");
  if (result.status !== "ok") return;
  assert.equal(result.section.content, GOOD);
  assert.equal(result.section.fidelity.outcome, "passed_after_retry");

  // The retry turn carries the rejected draft and a correction naming it.
  const retryTurns = rec.turns[1] as { role: string; content: string }[];
  assert.equal(retryTurns.length, 3);
  assert.equal(retryTurns[1].role, "assistant");
  assert.equal(retryTurns[1].content, BAD);
  assert.equal(retryTurns[2].role, "user");
  assert.match(retryTurns[2].content, /discontinue criterion/);
  assert.match(retryTurns[2].content, /Do not hedge it instead/);
});

test("the rejected draft is preserved on the record, not deleted", async () => {
  const { promise } = run([BAD, GOOD], [failed([BAD]), passed()]);
  const result = await promise;
  assert.equal(result.status, "ok");
  if (result.status !== "ok") return;
  const { attempts } = result.section.fidelity;
  assert.equal(attempts.length, 2);
  assert.equal(attempts[0].attempt, 1);
  assert.equal(attempts[0].content, BAD, "the rejected prose is kept verbatim");
  assert.equal(attempts[0].adjudication.verdict, "failed");
  assert.equal(attempts[1].adjudication.verdict, "passed");
});

/* ------------------------------------------------------------------ *
 * 3. The retry passes through the SAME gate
 * ------------------------------------------------------------------ */

test("the retry is judged by the same adjudicator against the same evidence", async () => {
  const { promise, adj } = run([BAD, GOOD], [failed([BAD]), passed()]);
  await promise;

  assert.equal(adj.calls, 2, "the regenerated section is adjudicated too");
  assert.deepEqual(
    adj.seen[0].evidence,
    adj.seen[1].evidence,
    "the retry faces the identical evidence set — the gate is not relaxed for it"
  );
  assert.equal(adj.seen[0].sectionKey, adj.seen[1].sectionKey);
  assert.equal(adj.seen[1].content, GOOD, "the gate judges the NEW text, not the old one");
});

test("a retry that fails the same way is not accepted because it was the retry", async () => {
  const { promise, rec } = run([BAD, BAD], [failed([BAD]), failed([BAD])]);
  const result = await promise;
  assert.equal(rec.drafts, 2);
  assert.equal(result.status, "needs_review");
});

/* ------------------------------------------------------------------ *
 * 4. Second failure surfaces; never loops; never deletes
 * ------------------------------------------------------------------ */

test("a second failure surfaces to the clinician rather than looping", async () => {
  const { promise, rec, adj } = run([BAD, BAD], [failed([BAD]), failed([BAD])]);
  const result = await promise;

  assert.equal(rec.drafts, 2, "generation stops at two attempts");
  assert.equal(adj.calls, 2);
  assert.equal(result.status, "needs_review");
  if (result.status !== "needs_review") return;

  // The language is surfaced, not silently removed.
  assert.equal(result.section.content, BAD);
  assert.deepEqual(result.unsupportedStatements, [BAD]);
  assert.match(result.reason, /does not document/);
  assert.equal(result.section.fidelity.outcome, "needs_review");
  assert.equal(result.section.fidelity.attempts.length, 2);
});

test("many consecutive failures still produce exactly two attempts", async () => {
  const verdicts = Array.from({ length: 10 }, () => failed([BAD]));
  const { promise, rec } = run([BAD, BAD, BAD, BAD], verdicts);
  const result = await promise;
  assert.equal(rec.drafts, 2);
  assert.equal(result.status, "needs_review");
});

/* ------------------------------------------------------------------ *
 * 5. Fail closed
 * ------------------------------------------------------------------ */

test("an adjudicator error fails closed — the section does not pass", async () => {
  const { promise, rec } = run(
    [GOOD, GOOD],
    [unusable("The session-fidelity check could not be completed (network).")]
  );
  const result = await promise;

  assert.equal(result.status, "needs_review", "an unevaluated section never passes");
  assert.equal(rec.drafts, 1, "a broken gate does not burn a regeneration");
  if (result.status !== "needs_review") return;
  assert.equal(result.section.content, GOOD, "the prose is still surfaced");
  assert.deepEqual(result.unsupportedStatements, [], "nothing can be named");
  assert.match(result.reason, /could not be completed/);
});

test("an adjudicator that throws fails closed rather than propagating", async () => {
  const rec: Recorder = { drafts: 0, turns: [] };
  const result = await generateSection({
    inputs: inputsFrom([scoreRow]),
    plan: PLAN,
    verifications: [],
    anthropic: draftingClient([GOOD], rec),
    adjudicate: async () => {
      throw new Error("boom");
    },
  });
  assert.equal(result.status, "needs_review");
  if (result.status !== "needs_review") return;
  assert.match(result.reason, /failed to run \(boom\)/);
  assert.equal(rec.drafts, 1);
});

test("unparseable adjudicator output fails closed", () => {
  const a = validateAdjudication({ verdict: "fine" }, GOOD, PROV);
  assert.equal(a.verdict, "unusable");
  assert.equal(a.pass, false);
  assert.match(a.reason, /did not match its contract/);
});

test("a contradictory verdict fails closed in both directions", () => {
  const passWithFindings = validateAdjudication(
    { pass: true, unsupportedStatements: [BAD], reason: "ok" },
    BAD,
    PROV
  );
  assert.equal(passWithFindings.verdict, "unusable");
  assert.match(passWithFindings.reason, /contradictory/);

  const failWithNothing = validateAdjudication(
    { pass: false, unsupportedStatements: [], reason: "bad" },
    BAD,
    PROV
  );
  assert.equal(failWithNothing.verdict, "unusable");
  assert.match(failWithNothing.reason, /without naming any statement/);
});

test("a quote that is not in the section fails the section rather than the finding", () => {
  const a = validateAdjudication(
    { pass: false, unsupportedStatements: ["Avery refused to continue."], reason: "x" },
    GOOD,
    PROV
  );
  assert.equal(a.verdict, "unusable");
  assert.match(a.reason, /quoted text that does not appear/);
});

test("grounding tolerates whitespace and case, not invention", () => {
  const wrapped = "Across both tasks, Avery read a limited\nnumber of items correctly.";
  const a = validateAdjudication(
    { pass: false, unsupportedStatements: ["Avery read a limited number of items correctly"], reason: "x" },
    wrapped,
    PROV
  );
  assert.equal(a.verdict, "failed", "a line-wrapped quote is still grounded");
});

test("a well-formed failing verdict is a substantive failure, not an unusable one", () => {
  const a = validateAdjudication(
    { pass: false, unsupportedStatements: [BAD], reason: "asserts a discontinue event" },
    BAD,
    PROV
  );
  assert.equal(a.verdict, "failed");
  assert.deepEqual(a.unsupportedStatements, [BAD]);
});

/* ------------------------------------------------------------------ *
 * 6. The gate runs everywhere; no prefilter
 * ------------------------------------------------------------------ */

test("the gate runs on every section, including modes that forbid session content", async () => {
  for (const key of [
    "reason-for-referral",
    "background",
    "assessment-results",
    "interpretation",
    "recommendations",
  ]) {
    const rec: Recorder = { drafts: 0, turns: [] };
    const adj = scriptedAdjudicator([passed()]);
    const result = await generateSection({
      inputs: inputsFrom([baseRow, scoreRow]),
      plan: planFor(key)!,
      verifications: [],
      anthropic: draftingClient([GOOD], rec),
      adjudicate: adj.fn,
    });
    assert.equal(adj.calls, 1, `${key} was not adjudicated`);
    assert.equal(result.status, "ok");
  }
});

test("innocuous prose is adjudicated too — nothing decides whether the gate runs", async () => {
  const { promise, adj } = run(["Word reading was an area of difficulty."], [passed()]);
  await promise;
  assert.equal(adj.calls, 1);
});

/* ------------------------------------------------------------------ *
 * 7. Session evidence
 * ------------------------------------------------------------------ */

test("a case with no session record supplies NO session evidence, stated explicitly", () => {
  const inputs = inputsFrom([baseRow]);
  const items = sessionEvidenceFor(eligibleSources(inputs, planFor("background")!), []);
  assert.equal(items.length, 0);
  const rendered = renderSessionEvidence(items);
  assert.match(rendered, /SESSION EVIDENCE SUPPLIED FOR THIS SECTION: NONE/);
  assert.match(rendered, /any such statement in the section is unsupported/);
});

test("a score set is administration facts only — it cannot license session behavior", () => {
  const inputs = inputsFrom([scoreRow]);
  const items = sessionEvidenceFor(eligibleSources(inputs, PLAN), []);
  assert.equal(items.length, 1);
  assert.equal(items[0].scope, "ADMINISTRATION_FACTS_ONLY");
  assert.match(items[0].text, /WIAT-4, administered 2026-05-19/);
  assert.match(items[0].text, /documents nothing about how the session was conducted/);
  assert.match(items[0].text, /discontinue, basal, or ceiling rule/);
});

test("scores withheld for verification do not leak into the adjudicator's view", () => {
  const inputs = inputsFrom([scoreRow]);
  const items = sessionEvidenceFor(eligibleSources(inputs, PLAN), []);
  assert.match(items[0].text, /Word Reading/);
  assert.doesNotMatch(items[0].text, /Reading Comprehension/);
});

test("a clinician-authored observation is narrative evidence, carried verbatim", () => {
  const inputs = inputsFrom([observationRow]);
  const items = sessionEvidenceFor(eligibleSources(inputs, planFor("observations")!), []);
  assert.equal(items.length, 1);
  assert.equal(items[0].scope, "NARRATIVE");
  assert.match(items[0].text, /asked once for a direction to be repeated/);
  assert.match(items[0].text, /Rapport was established easily/);
});

test("a teacher interview is not session evidence", () => {
  const captureRow: SourceRow = {
    ...baseRow,
    id: "22222222-2222-4222-8222-222222222222",
    kind: "interview",
    instrument: "capture",
    bank_id: null,
    bank_version: null,
    payload: { setting: "Union Elementary", summaryFinal: "Teacher describes decoding difficulty." },
  };
  const inputs = inputsFrom([captureRow]);
  const items = sessionEvidenceFor(eligibleSources(inputs, planFor("background")!), []);
  assert.equal(items.length, 0);
  assert.equal(SESSION_NARRATIVE_KINDS.includes("interview"), false);
});

test("the evidence set is section-scoped: a section is judged on what it was given", async () => {
  // The observation exists on the case but is not eligible for assessment-results.
  const { promise, adj } = run([GOOD], [passed()], [scoreRow, observationRow]);
  await promise;
  assert.equal(adj.seen[0].evidence.length, 1);
  assert.equal(adj.seen[0].evidence[0].scope, "ADMINISTRATION_FACTS_ONLY");
});

/* ------------------------------------------------------------------ *
 * 8. Provenance and the persisted record
 * ------------------------------------------------------------------ */

test("the section carries everything migration 0009 persists", async () => {
  const { promise } = run([BAD, GOOD], [failed([BAD]), passed()]);
  const result = await promise;
  assert.equal(result.status, "ok");
  if (result.status !== "ok") return;
  const s = result.section;

  assert.ok(s.promptVersion, "generation prompt version");
  assert.ok(s.specVersion, "generation spec version");
  assert.ok(s.generatedBy.servingModel, "the model that actually served the text");
  assert.ok(s.fidelity.gate, "adjudicator spec version");
  assert.ok(s.fidelity.attempts[0].adjudication.provenance.promptVersion);

  // The evidence snapshot holds the blocks as sent, not references to rows.
  const snap = s.evidenceSnapshot;
  assert.equal(snap.sectionKey, "assessment-results");
  assert.equal(snap.mode, "DESCRIPTIVE_RESULTS");
  assert.match(snap.sourceLimits, /SOURCE LIMITS — do not exceed these/);
  assert.match(snap.caseData, /Word Reading: standard score 71/);
  assert.equal(snap.sources[0].sourceId, scoreRow.id);
  assert.equal(snap.sources[0].checksum, "abc");
  assert.equal(snap.sources[0].ceiling, "DESCRIBE_ONLY", "the resolved ceiling, not the declared one");
  assert.equal(snap.sessionEvidence.length, 1);
});

test("the correction turn names the statement and forecloses hedging", () => {
  const text = correctionTurn(failed([BAD]));
  assert.match(text, /Across both tasks/);
  assert.match(text, /Remove each statement listed above/);
  assert.match(text, /do not create an evidentiary basis/);
  assert.match(text, /preserve every statement the supplied evidence does support/);
});

/* ------------------------------------------------------------------ *
 * 9. The structural refusal is unchanged (directive item 5)
 * ------------------------------------------------------------------ */

test("Observations still refuses before generation when no observation exists", async () => {
  const rec: Recorder = { drafts: 0, turns: [] };
  const adj = scriptedAdjudicator([passed()]);
  const result = await generateSection({
    inputs: inputsFrom([baseRow, scoreRow]),
    plan: planFor("observations")!,
    verifications: [],
    anthropic: draftingClient([GOOD], rec),
    adjudicate: adj.fn,
  });
  assert.equal(result.status, "refused");
  assert.equal(rec.drafts, 0, "no model call at all");
  assert.equal(adj.calls, 0, "the pre-generation refusal is not replaced by the gate");
  if (result.status !== "refused") return;
  assert.match(result.reason, /No observation has been added/);
});

/* ------------------------------------------------------------------ *
 * 10. Deployment mode — shadow | enforce (configuration, not a fork)
 * ------------------------------------------------------------------ */

test("mode resolution fails safe: anything not 'shadow' enforces", () => {
  assert.equal(resolveGateMode("shadow"), "shadow");
  assert.equal(resolveGateMode("SHADOW"), "shadow");
  assert.equal(resolveGateMode("  shadow "), "shadow");
  assert.equal(resolveGateMode("enforce"), "enforce");
  // A typo, an empty string, or an absent variable can only ever be
  // stricter than intended — never quieter.
  for (const raw of ["shadw", "", "  ", "off", "none", "true", null, undefined]) {
    assert.equal(resolveGateMode(raw), "enforce", `resolveGateMode(${JSON.stringify(raw)})`);
  }
  assert.equal(DEFAULT_GATE_MODE, "enforce");
});

test("the configured default is enforce when nothing is set", () => {
  const prior = process.env.PSYCHREPORT_FIDELITY_GATE_MODE;
  delete process.env.PSYCHREPORT_FIDELITY_GATE_MODE;
  try {
    assert.equal(configuredGateMode(), "enforce");
    process.env.PSYCHREPORT_FIDELITY_GATE_MODE = "shadow";
    assert.equal(configuredGateMode(), "shadow");
  } finally {
    if (prior === undefined) delete process.env.PSYCHREPORT_FIDELITY_GATE_MODE;
    else process.env.PSYCHREPORT_FIDELITY_GATE_MODE = prior;
  }
});

test("shadow: a failing verdict is recorded and the section proceeds", async () => {
  const { promise, rec, adj } = run([BAD, GOOD], [failed([BAD]), passed()], [scoreRow], "shadow");
  const result = await promise;

  assert.equal(result.status, "ok", "shadow never blocks");
  assert.equal(rec.drafts, 1, "shadow does not regenerate — regeneration is enforcement");
  assert.equal(adj.calls, 1);
  if (result.status !== "ok") return;

  const f = result.section.fidelity;
  assert.equal(result.section.content, BAD, "the section proceeds with the text it drafted");
  assert.equal(f.mode, "shadow");
  assert.equal(f.outcome, "shadow_would_reject");
  assert.equal(f.wouldEnforce, "needs_review", "the counterfactual is recorded");
  assert.deepEqual(f.unsupportedStatements, [BAD], "the verdict is kept in the record");
  assert.match(f.reason ?? "", /does not document/);
});

test("shadow: an unusable gate is recorded distinctly from a rejection", async () => {
  const { promise, rec } = run([GOOD], [unusable("network")], [scoreRow], "shadow");
  const result = await promise;
  assert.equal(result.status, "ok");
  assert.equal(rec.drafts, 1);
  if (result.status !== "ok") return;
  assert.equal(result.section.fidelity.outcome, "shadow_would_flag");
  assert.notEqual(result.section.fidelity.outcome, "shadow_would_reject");
});

test("shadow: a passing verdict is indistinguishable from enforce", async () => {
  const { promise } = run([GOOD], [passed()], [scoreRow], "shadow");
  const result = await promise;
  assert.equal(result.status, "ok");
  if (result.status !== "ok") return;
  assert.equal(result.section.fidelity.outcome, "passed");
  assert.equal(result.section.fidelity.wouldEnforce, "passed");
  assert.equal(result.section.fidelity.mode, "shadow");
});

test("a shadow rejection and an enforced rejection are never the same record", async () => {
  const s = await run([BAD, BAD], [failed([BAD])], [scoreRow], "shadow").promise;
  const e = await run([BAD, BAD], [failed([BAD]), failed([BAD])], [scoreRow], "enforce").promise;
  assert.equal(s.status, "ok");
  assert.equal(e.status, "needs_review");
  if (s.status !== "ok" || e.status !== "needs_review") return;
  assert.notEqual(s.section.fidelity.outcome, e.section.fidelity.outcome);
  assert.notEqual(s.section.fidelity.mode, e.section.fidelity.mode);
});

test("the adjudicator runs identically in both modes", async () => {
  const shadow = run([BAD], [failed([BAD])], [scoreRow], "shadow");
  await shadow.promise;
  const enforce = run([BAD, BAD], [failed([BAD]), failed([BAD])], [scoreRow], "enforce");
  await enforce.promise;

  // Same question, same evidence, same section — the mode changes what is
  // done with the verdict, never how it is obtained.
  assert.deepEqual(shadow.adj.seen[0].evidence, enforce.adj.seen[0].evidence);
  assert.equal(shadow.adj.seen[0].content, enforce.adj.seen[0].content);
  assert.equal(shadow.adj.seen[0].sectionKey, enforce.adj.seen[0].sectionKey);
});

/* ------------------------------------------------------------------ *
 * 11. What the clinician may be shown
 * ------------------------------------------------------------------ */

test("shadow shows the clinician nothing from the gate", async () => {
  for (const verdicts of [[failed([BAD])], [unusable("down")], [passed()]]) {
    const { promise } = run([BAD], verdicts, [scoreRow], "shadow");
    const result = await promise;
    assert.equal(result.status, "ok");
    if (result.status !== "ok") continue;
    assert.equal(clinicianGateNotice(result.section), null);
  }
});

test("enforce distinguishes a rejected draft from an unusable check", async () => {
  const rejected = await run([BAD, BAD], [failed([BAD]), failed([BAD])]).promise;
  assert.equal(rejected.status, "needs_review");
  if (rejected.status !== "needs_review") return;
  const n1 = clinicianGateNotice(rejected.section);
  assert.equal(n1?.kind, "rejected");
  assert.deepEqual(n1?.kind === "rejected" ? n1.statements : null, [BAD]);

  const broken = await run([GOOD], [unusable("The session-fidelity check could not be completed (503).")]).promise;
  assert.equal(broken.status, "needs_review");
  if (broken.status !== "needs_review") return;
  const n2 = clinicianGateNotice(broken.section);
  assert.equal(n2?.kind, "unusable", "an outage is about the check, not the draft");
  assert.equal(n2?.kind === "unusable" ? n2.reason.includes("503") : false, true);
});

test("a passing section carries no notice in either mode", async () => {
  for (const mode of ["shadow", "enforce"] as const) {
    const { promise } = run([GOOD], [passed()], [scoreRow], mode);
    const r = await promise;
    assert.equal(r.status, "ok");
    if (r.status !== "ok") continue;
    assert.equal(clinicianGateNotice(r.section), null);
  }
});

/* ------------------------------------------------------------------ *
 * 12. The drafting-prompt block and its measurement baseline
 * ------------------------------------------------------------------ */

test("the D-140 block ships in the drafting prompt by default", () => {
  const p = systemPrompt("DESCRIPTIVE_RESULTS");
  assert.match(p, /TESTING-SESSION EVENTS/);
  assert.match(p, /discontinue, basal, or ceiling rule/);
  assert.match(p, /Hedging is not a substitute/);
  // D-111: the escape hatch travels with the rule.
  assert.match(p, /That is a complete answer, not an omission/);
});

test("the baseline arm omits ONLY the targeted block", () => {
  const base = systemPrompt("DESCRIPTIVE_RESULTS", { sessionEvidenceRule: false });
  assert.doesNotMatch(base, /TESTING-SESSION EVENTS/);
  // The comparison must isolate the targeted block, not "fidelity vs none".
  assert.match(base, /FIDELITY/);
  assert.match(base, /Use only the data supplied/);
  assert.match(base, /PROHIBITED TRANSFORMATIONS/);
  assert.match(base, /test-session behavior → a generalized trait/);
});

test("the baseline records its own prompt version so it can never pass as normal", () => {
  assert.equal(draftingPromptVersion(), DRAFTING_PROMPT_VERSION);
  assert.equal(draftingPromptVersion({ sessionEvidenceRule: true }), DRAFTING_PROMPT_VERSION);
  const baseline = draftingPromptVersion({ sessionEvidenceRule: false });
  assert.notEqual(baseline, DRAFTING_PROMPT_VERSION);
  assert.match(baseline, /baseline/);
});

test("the prompt version on the record follows the prompt that actually ran", async () => {
  const rec: Recorder = { drafts: 0, turns: [] };
  const adj = scriptedAdjudicator([passed()]);
  const r = await generateSection({
    inputs: inputsFrom([scoreRow]),
    plan: PLAN,
    verifications: [],
    anthropic: draftingClient([GOOD], rec),
    adjudicate: adj.fn,
    promptOptions: { sessionEvidenceRule: false },
  });
  assert.equal(r.status, "ok");
  if (r.status !== "ok") return;
  assert.match(r.section.promptVersion, /baseline/);
});
