import { test } from "node:test";
import assert from "node:assert/strict";
import teacher13raw from "@suite/content/banks/teacher-form.v1.3.0.json";
import teacher15raw from "@suite/content/banks/teacher-form.v1.5.0.json";
import { QuestionBank } from "@suite/case-model";
import { buildFormView } from "../lib/form-view";
import { studentDisplay } from "../lib/student-display";
import { submitResponse } from "../lib/submit-core";
import { validateSubmission, visibleQuestions, type ResponseMap } from "../lib/engine";
import type { InvitationRow } from "../lib/respondent-data";

const bank13 = QuestionBank.parse(teacher13raw);
const bank15 = QuestionBank.parse(teacher15raw);

/* ---------- four-step view assembly (v1.5.0) ---------- */

test("v1.5.0 view carries four steps; pre-step banks carry none", () => {
  const v15 = buildFormView(bank15, {});
  assert.equal(v15.steps?.length, 4);
  assert.deepEqual(v15.steps!.map((s) => s.step), [1, 2, 3, 4]);
  const v13 = buildFormView(bank13, { "TCH-CORE-008": ["reading"] });
  assert.equal(v13.steps, undefined); // legacy single-page rendering
});

test("baseline scales render in step 2 with their observation escape threaded", () => {
  const v = buildFormView(bank15, {});
  const step2 = v.steps!.find((s) => s.step === 2)!;
  const reading = step2.groups.find((g) => g.moduleId === "reading")!;
  const scale = reading.fields.find((f) => f.key === "TCH-RDG-006")!;
  assert.equal(scale.responseType, "comparison_scale");
  assert.equal(scale.observationEscapeValue, "not_observed");
  assert.ok(scale.options!.some((o) => o.value === "not_observed"));
});

test("depth questions land in step 3 only once licensed", () => {
  const before = buildFormView(bank15, {});
  const step3Before = before.steps!.find((s) => s.step === 3)!;
  assert.ok(
    !step3Before.groups.some((g) => g.fields.some((f) => f.key === "TCH-RDG-005"))
  );
  const after = buildFormView(bank15, { "TCH-RDG-006": "somewhat_below" });
  const step3After = after.steps!.find((s) => s.step === 3)!;
  assert.ok(
    step3After.groups.some((g) => g.fields.some((f) => f.key === "TCH-RDG-005"))
  );
});

test("repeat-group instances render as step-3 follow-ups", () => {
  const v = buildFormView(bank15, { "TCH-BEH-001": ["aggression"] });
  const step3 = v.steps!.find((s) => s.step === 3)!;
  const keys = step3.groups.flatMap((g) => g.fields.map((f) => f.key));
  assert.ok(keys.includes("TCH-BEH-G01::aggression"));
});

/* ---------- D-120 student display ---------- */

test("studentDisplay prefers first name + last initial, falls back to initials", () => {
  assert.equal(
    studentDisplay({ first_name: "Maya", last_initial: "r", display_initials: "M.R." }),
    "Maya R."
  );
  assert.equal(
    studentDisplay({ first_name: null, last_initial: null, display_initials: "A.B." }),
    "A.B."
  );
});

/* ---------- session context recorded in the locked Source ---------- */

function inv(over: Partial<InvitationRow> = {}): InvitationRow {
  return {
    id: "A", case_id: "c1", informant_id: "i1", respondent_role: "teacher",
    bank_id: "teacher-intake", bank_version: "1.5.0", token_hash: "h",
    expires_at: new Date(Date.now() + 864e5).toISOString(),
    status: "opened", max_uses: 1, uses: 0, completed_at: null, deleted_at: null,
    ...over,
  };
}

type Draft = { response_key: string; answer: string | string[] };

function fakeSvc(draftRows: Draft[]) {
  const calls = { sources: [] as any[] };
  function from(table: string) {
    let op: string | null = null;
    const api: any = {
      select() { op = "select"; return api; },
      insert(row: any) {
        if (table === "sources") calls.sources.push(row);
        return Promise.resolve({ data: { id: row?.id ?? "x" }, error: null });
      },
      update() { op = "update"; return api; },
      eq() {
        if (op === "select" && table === "draft_responses") {
          return Promise.resolve({ data: draftRows, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      },
    };
    return api;
  }
  return { svc: { from }, calls };
}

/** Complete, valid v1.5.0 submission generated against the real bank. */
function completeSubmission(seed: ResponseMap): Draft[] {
  const r: ResponseMap = { ...seed };
  for (let i = 0; i < 40; i++) {
    const v = validateSubmission(bank15, r);
    if (v.ok) break;
    const vis = visibleQuestions(bank15, r);
    for (const key of v.missingRequired) {
      const q = vis.find((x) => x.key === key)?.question;
      if (!q) continue;
      if (q.responseType === "multi_select") r[key] = [q.options![0].value];
      else if (q.responseType === "yes_no") r[key] = "no";
      else if (q.options?.length) r[key] = q.options[0].value;
      else r[key] = "Test response.";
    }
    Object.assign(r, seed);
  }
  return Object.entries(r).map(([response_key, answer]) => ({ response_key, answer }));
}

test("locked payload records gradeBand + mapping version (hidden-item reconstruction)", async () => {
  const drafts = completeSubmission({ "TCH-CORE-008": ["reading"], "TCH-BEH-002": "no", "TCH-EMO-004": "no" });
  const { svc, calls } = fakeSvc(drafts);
  const res = await submitResponse({
    svc,
    sessionInvitationId: "A",
    inv: inv(),
    bank: bank15,
    ctx: { gradeBand: "elementary" },
    sessionContext: { gradeBand: "elementary", gradeBandSetVersion: "0.1-draft" },
  });
  assert.equal(res.status, 200);
  assert.equal(calls.sources.length, 1);
  const payload = calls.sources[0].payload;
  assert.deepEqual(payload.sessionContext, {
    gradeBand: "elementary",
    gradeBandSetVersion: "0.1-draft",
  });
  assert.equal(payload.bankVersion, "1.5.0");
});

test("submission without band context records no sessionContext (pre-band banks)", async () => {
  const drafts = completeSubmission({ "TCH-CORE-008": ["reading"], "TCH-BEH-002": "no", "TCH-EMO-004": "no" });
  const { svc, calls } = fakeSvc(drafts);
  const res = await submitResponse({
    svc, sessionInvitationId: "A", inv: inv(), bank: bank15,
  });
  assert.equal(res.status, 200);
  assert.equal(calls.sources[0].payload.sessionContext, undefined);
});
