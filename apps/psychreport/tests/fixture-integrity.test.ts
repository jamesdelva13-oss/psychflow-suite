import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { QuestionBank } from "@suite/case-model";
import bank13raw from "@suite/content/banks/teacher-form.v1.3.0.json" with { type: "json" };
import {
  AVERY_BANK,
  AVERY_CASE,
  CAPTURE_PAYLOAD,
  TEACHER_RESPONSES,
  WIAT4_SCORE_SET,
  averyFixtureRows,
} from "../../../tools/fixtures/avery";

/**
 * Fixture integrity (process rule, JD 2026-08-09).
 *
 * "Eval harnesses read the canonical fixture and never construct their own
 * payloads." A shared module makes that easy; these tests make the two ways
 * it can still go wrong impossible to land silently.
 *
 * The defect this exists to prevent, concretely: `full-report.eval.ts` shipped
 * with a hand-built teacher payload of three responses, one of them
 * `TCH-GEN-001` — an id that is not a question in bank v1.3.0. Nothing
 * rejected it. `bankConstructs` simply skipped the unknown key and
 * `inspectDetail` rendered nothing for it, so the harness produced plausible
 * output while measuring a case with roughly a fifth of the real material.
 * Five reports and three published numbers were wrong before anyone noticed.
 */

const bank = QuestionBank.parse(bank13raw);
const BANK_IDS = new Set(bank.modules.flatMap((m) => m.questions.map((q) => q.id)));

test("every canonical teacher response is a real question in the pinned bank", () => {
  const unknown = Object.keys(TEACHER_RESPONSES).filter((id) => !BANK_IDS.has(id));
  assert.deepEqual(
    unknown,
    [],
    `response ids absent from bank ${AVERY_BANK.bankVersion}: ${unknown.join(", ")}`
  );
});

test("the fixture pins the bank version its responses were validated against", () => {
  assert.equal(AVERY_BANK.bankVersion, bank.version);
  assert.equal(AVERY_BANK.bankId, "teacher-intake");
});

test("the canonical fixture has the material the seed writes, not a subset", () => {
  // A harness that silently thins the fixture is the exact regression here.
  // These are floors, not exact counts — adding material is fine, quietly
  // losing it is not.
  assert.ok(
    Object.keys(TEACHER_RESPONSES).length >= 17,
    `teacher responses dropped to ${Object.keys(TEACHER_RESPONSES).length}`
  );
  assert.ok(CAPTURE_PAYLOAD.notes.length > 200, "capture notes are missing or truncated");
  assert.ok(CAPTURE_PAYLOAD.summaryFinal.length > 200, "capture summary is missing or truncated");
  assert.equal(WIAT4_SCORE_SET.scores.length, 3);
  assert.equal(AVERY_CASE.grade, "4");
});

test("the in-memory rows carry all three Sources, locked and current", () => {
  const { caseRow, sourceRows } = averyFixtureRows();
  assert.equal(sourceRows.length, 3);
  assert.deepEqual(
    sourceRows.map((r) => r.kind).sort(),
    ["interview", "referral_form", "score_set"]
  );
  for (const r of sourceRows) {
    assert.equal(r.locked, true, `${r.kind} must be finalized to reach generation`);
    assert.equal(r.deleted_at, null);
    assert.equal(r.supersedes_source_id, null);
    assert.equal(r.case_id, caseRow.id);
  }
  const teacher = sourceRows.find((r) => r.kind === "referral_form")!;
  assert.equal((teacher.payload as { responses: object }).responses, TEACHER_RESPONSES);
});

/**
 * The structural half of the process rule: no eval harness may define case
 * content of its own. Greps the harness directory for the shapes a hand-built
 * payload takes.
 *
 * Deliberately narrow. It looks for teacher-bank response ids and capture
 * payload keys OUTSIDE the fixture module — not for every literal — because a
 * broad rule would fire on the adjudicator corpus, whose synthetic session
 * evidence is a legitimate TEST VECTOR rather than a claim about Avery's case.
 */
test("no eval harness constructs its own case payload", () => {
  const dir = join(import.meta.dirname, "..", "tests-eval");
  const offenders: string[] = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".ts"))) {
    const src = readFileSync(join(dir, file), "utf8");
    // A bank question id anywhere in a harness means it is authoring intake
    // responses rather than reading them.
    const ids = src.match(/["']TCH-[A-Z]+-\d+["']/g) ?? [];
    if (ids.length) offenders.push(`${file}: hand-built teacher responses ${[...new Set(ids)].join(", ")}`);
    // summaryFinal outside the fixture module means an invented capture record.
    if (/summaryFinal\s*:/.test(src)) offenders.push(`${file}: hand-built capture summary`);
  }
  assert.deepEqual(
    offenders,
    [],
    "eval harnesses must import tools/fixtures/avery.ts:\n  " + offenders.join("\n  ")
  );
});
