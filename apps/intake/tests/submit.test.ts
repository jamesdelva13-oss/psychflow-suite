import { test } from "node:test";
import assert from "node:assert/strict";
import teacher from "@suite/content/banks/teacher-form.v1.3.0.json";
import { QuestionBank } from "@suite/case-model";
import { visibleQuestions, validateSubmission, type ResponseMap } from "../lib/engine";
import { submitResponse } from "../lib/submit-core";
import type { InvitationRow } from "../lib/respondent-data";

const bank = QuestionBank.parse(teacher);

function inv(over: Partial<InvitationRow> = {}): InvitationRow {
  return {
    id: "A", case_id: "c1", informant_id: "i1", respondent_role: "teacher",
    bank_id: "teacher-intake", bank_version: "1.3.0", token_hash: "h",
    expires_at: new Date(Date.now() + 864e5).toISOString(),
    status: "opened", max_uses: 1, uses: 0, completed_at: null, deleted_at: null,
    ...over,
  };
}

type Draft = { response_key: string; answer: string | string[] };

function fakeSvc(draftRows: Draft[]) {
  const calls = {
    sources: [] as any[],
    caseUpdates: [] as any[],
    invitationUpdates: [] as any[],
    audits: [] as any[],
  };
  function from(table: string) {
    let op: string | null = null;
    let payload: any = null;
    const api: any = {
      select() { op = "select"; return api; },
      insert(row: any) {
        op = "insert";
        if (table === "sources") calls.sources.push(row);
        else if (table === "audit_events") calls.audits.push(row);
        return Promise.resolve({ data: { id: row?.id ?? "x" }, error: null });
      },
      update(row: any) { op = "update"; payload = row; return api; },
      eq() {
        if (op === "update") {
          if (table === "cases") calls.caseUpdates.push(payload);
          else if (table === "invitations") calls.invitationUpdates.push(payload);
          return Promise.resolve({ error: null });
        }
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

/** Fill a seed into a complete, valid teacher submission (the seed always wins). */
function fillSubmission(seed: ResponseMap): Draft[] {
  const r: ResponseMap = { ...seed };
  for (let i = 0; i < 40; i++) {
    const v = validateSubmission(bank, r);
    if (v.ok) break;
    const vis = visibleQuestions(bank, r);
    for (const key of v.missingRequired) {
      const q = vis.find((x) => x.key === key)?.question;
      if (!q) continue;
      if (q.responseType === "single_select" || q.responseType === "likert") r[key] = q.options![0].value;
      else if (q.responseType === "multi_select") r[key] = [q.options![0].value];
      else if (q.responseType === "yes_no") r[key] = "no";
      else r[key] = "Test response.";
    }
  }
  Object.assign(r, seed); // the intentional gate answer must never be overwritten
  return Object.entries(r).map(([response_key, answer]) => ({ response_key, answer }));
}

const behaviorSubmission = (gate: "yes" | "no") =>
  fillSubmission({ "TCH-CORE-008": ["behavior"], "TCH-BEH-002": gate });
const emotionalSubmission = (gate: "yes" | "no") =>
  fillSubmission({ "TCH-CORE-008": ["emotional"], "TCH-EMO-004": gate });

test("a cookie for another invitation cannot submit (401)", async () => {
  const { svc } = fakeSvc([]);
  const r = await submitResponse({ svc, sessionInvitationId: "B", inv: inv({ id: "A" }), bank });
  assert.equal(r.status, 401);
});

test("submitting a completed invitation is rejected (409)", async () => {
  const { svc } = fakeSvc(behaviorSubmission("no"));
  const r = await submitResponse({ svc, sessionInvitationId: "A", inv: inv({ status: "completed", uses: 1 }), bank });
  assert.equal(r.status, 409);
});

test("incomplete submit → 422 with the exact instance keys", async () => {
  const { svc } = fakeSvc([
    { response_key: "TCH-CORE-008", answer: ["behavior"] },
    { response_key: "TCH-BEH-001", answer: ["aggression"] },
  ]);
  const r = await submitResponse({ svc, sessionInvitationId: "A", inv: inv(), bank });
  assert.equal(r.status, 422);
  const missing = r.body.missingRequired as string[];
  assert.ok(missing.includes("TCH-BEH-G01::aggression")); // repeat-group instance key
  assert.ok(missing.some((k) => !k.includes("::"))); // plain keys present too
});

test("complete submit with safety gate = yes → 200, priority flag + locked source", async () => {
  const { svc, calls } = fakeSvc(behaviorSubmission("yes"));
  const r = await submitResponse({ svc, sessionInvitationId: "A", inv: inv(), bank });
  assert.equal(r.status, 200);
  assert.equal(r.body.priorityFlagged, true);
  assert.equal(calls.caseUpdates.length, 1);
  assert.equal(calls.caseUpdates[0].priority_flag, true);
  assert.equal(calls.sources.length, 1);
  assert.equal(calls.sources[0].locked, true);
  assert.match(calls.sources[0].checksum, /^[0-9a-f]{64}$/);
  assert.equal(calls.invitationUpdates[0].status, "completed");
});

test("complete submit with safety gate = no → no priority flag", async () => {
  const { svc, calls } = fakeSvc(behaviorSubmission("no"));
  const r = await submitResponse({ svc, sessionInvitationId: "A", inv: inv(), bank });
  assert.equal(r.status, 200);
  assert.equal(r.body.priorityFlagged, false);
  assert.equal(calls.caseUpdates.length, 0);
});

// HARD GATE: the internalizing safety item (TCH-EMO-004) must close the gap —
// it sets priority_flag on its own, with no behavior concern present.
test("SAFETY: TCH-EMO-004=yes with NO behavior concern → priority_flag set", async () => {
  const drafts = emotionalSubmission("yes");
  // guard the test itself: this submission carries the emotional gate and no behavior gate
  assert.ok(drafts.some((d) => d.response_key === "TCH-EMO-004" && d.answer === "yes"));
  assert.ok(!drafts.some((d) => d.response_key === "TCH-BEH-002"));
  const { svc, calls } = fakeSvc(drafts);
  const r = await submitResponse({ svc, sessionInvitationId: "A", inv: inv(), bank });
  assert.equal(r.status, 200);
  assert.equal(r.body.priorityFlagged, true);
  assert.equal(calls.caseUpdates.length, 1);
  assert.equal(calls.caseUpdates[0].priority_flag, true);
});

test("SAFETY: TCH-EMO-004=no emotional submission → priority_flag NOT set", async () => {
  const { svc, calls } = fakeSvc(emotionalSubmission("no"));
  const r = await submitResponse({ svc, sessionInvitationId: "A", inv: inv(), bank });
  assert.equal(r.status, 200);
  assert.equal(r.body.priorityFlagged, false);
  assert.equal(calls.caseUpdates.length, 0);
});
