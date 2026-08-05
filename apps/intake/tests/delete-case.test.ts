import { test } from "node:test";
import assert from "node:assert/strict";
import { deleteCase, DELETION_ORDER } from "../lib/delete-core";

// Mock svc that records every operation in arrival order.
function fakeSvc(opts: { invitationIds?: string[]; failOn?: string } = {}) {
  const ops: { table: string; op: string; args?: unknown }[] = [];
  const invIds = opts.invitationIds ?? [];
  function from(table: string) {
    let op = "";
    const api: any = {
      select() {
        op = "select";
        return api;
      },
      delete() {
        op = "delete";
        return api;
      },
      update(row: unknown) {
        op = "update";
        api._row = row;
        return api;
      },
      insert(row: unknown) {
        ops.push({ table, op: "insert", args: row });
        if (opts.failOn === `${table}:insert`)
          return Promise.resolve({ error: { message: "boom" } });
        return Promise.resolve({ error: null });
      },
      in(_col: string, ids: unknown) {
        ops.push({ table, op, args: ids });
        return Promise.resolve({ error: null });
      },
      eq(_col: string, _v: unknown) {
        ops.push({ table, op, args: api._row });
        if (opts.failOn === `${table}:${op}`)
          return Promise.resolve({ data: null, error: { message: "boom" } });
        if (op === "select" && table === "invitations")
          return Promise.resolve({ data: invIds.map((id) => ({ id })), error: null });
        return Promise.resolve({ data: null, error: null });
      },
    };
    return api;
  }
  return { svc: { from }, ops };
}

test("deletes every case-scoped table in FK-safe order, then audit, then the case", async () => {
  const { svc, ops } = fakeSvc({ invitationIds: ["i1", "i2"] });
  const r = await deleteCase({ svc, caseId: "c1", actorId: "p1" });
  assert.ok(r.ok);

  const deletes = ops.filter((o) => o.op === "delete").map((o) => o.table);
  // draft_responses first (via invitation ids), then the case-scoped tables,
  // finally the case row itself.
  assert.equal(deletes[0], "draft_responses");
  for (const t of DELETION_ORDER.filter((t) => t !== "draft_responses")) {
    assert.ok(deletes.includes(t), `missing delete on ${t}`);
  }
  assert.equal(deletes[deletes.length - 1], "cases");
  // cases deleted only after every child table.
  assert.equal(
    deletes.indexOf("cases"),
    deletes.length - 1
  );

  // audit rows unlinked before the case delete, and a case_deleted event written.
  const auditUpdate = ops.findIndex((o) => o.table === "audit_events" && o.op === "update");
  const caseDelete = ops.findIndex((o) => o.table === "cases" && o.op === "delete");
  assert.ok(auditUpdate !== -1 && auditUpdate < caseDelete);
  const auditInsert = ops.find((o) => o.table === "audit_events" && o.op === "insert");
  assert.ok(auditInsert);
  const meta = (auditInsert!.args as any).metadata;
  assert.equal((auditInsert!.args as any).event_type, "case_deleted");
  assert.equal(meta.deletedCaseId, "c1");
  assert.equal(meta.invitations, 2);
});

test("skips draft_responses delete when the case has no invitations", async () => {
  const { svc, ops } = fakeSvc({ invitationIds: [] });
  const r = await deleteCase({ svc, caseId: "c1", actorId: "p1" });
  assert.ok(r.ok);
  assert.ok(!ops.some((o) => o.table === "draft_responses"));
});

test("a mid-sequence failure surfaces as 500 and stops before deleting the case", async () => {
  const { svc, ops } = fakeSvc({ invitationIds: [], failOn: "sources:delete" });
  const r = await deleteCase({ svc, caseId: "c1", actorId: "p1" });
  assert.equal(r.status, 500);
  assert.ok(!ops.some((o) => o.table === "cases" && o.op === "delete"));
});
