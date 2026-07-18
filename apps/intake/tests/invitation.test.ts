import { test } from "node:test";
import assert from "node:assert/strict";
import teacher from "@suite/content/banks/teacher-form.v1.3.0.json";
import { QuestionBank } from "@suite/case-model";
import { buildInvitationRow } from "../lib/invitation-core";
import { hashToken } from "../lib/engine";
import { invitationUsable, type InvitationRow } from "../lib/respondent-data";

const bank = QuestionBank.parse(teacher);

test("invitation row stores only the token HASH, never the raw token", () => {
  const rawToken = "raw-secret-token-value-do-not-store-me";
  const row = buildInvitationRow({
    caseId: "c1", informantId: "i1", role: "teacher", bank, rawToken,
    expiresAt: new Date().toISOString(),
  });
  assert.equal(row.token_hash, hashToken(rawToken));
  assert.match(row.token_hash, /^[0-9a-f]{64}$/);
  assert.notEqual(row.token_hash, rawToken);
  // the raw token must appear nowhere in the persisted row
  assert.ok(!JSON.stringify(row).includes(rawToken));
});

test("invitation row pins bank id + version (D-013)", () => {
  const row = buildInvitationRow({
    caseId: "c1", informantId: "i1", role: "teacher", bank, rawToken: "t",
    expiresAt: new Date().toISOString(),
  });
  assert.equal(row.bank_id, "teacher-intake");
  assert.equal(row.bank_version, "1.3.0");
});

function inv(over: Partial<InvitationRow> = {}): InvitationRow {
  return {
    id: "A", case_id: "c1", informant_id: "i1", respondent_role: "teacher",
    bank_id: "teacher-intake", bank_version: "1.3.0", token_hash: "h",
    expires_at: new Date(Date.now() + 864e5).toISOString(),
    status: "opened", max_uses: 1, uses: 0, completed_at: null, deleted_at: null,
    ...over,
  };
}

test("completed invitation is rejected (already_completed)", () => {
  const r = invitationUsable(inv({ status: "completed", uses: 1 }));
  assert.equal(r.ok, false);
  assert.equal((r as { ok: false; reason: string }).reason, "already_completed");
});

test("used-up invitation (uses >= max) rejected", () => {
  assert.equal(invitationUsable(inv({ uses: 1, max_uses: 1 })).ok, false);
});

test("expired / revoked / deleted invitations rejected", () => {
  assert.equal(invitationUsable(inv({ expires_at: new Date(Date.now() - 1000).toISOString() })).ok, false);
  assert.equal(invitationUsable(inv({ status: "revoked" })).ok, false);
  assert.equal(invitationUsable(inv({ deleted_at: new Date().toISOString() })).ok, false);
});

test("a fresh, opened invitation is usable", () => {
  assert.equal(invitationUsable(inv()).ok, true);
});
