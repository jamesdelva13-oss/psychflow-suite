import { test } from "node:test";
import assert from "node:assert/strict";
import {
  actorForProfile,
  parseActor,
  assertStructuralMetadata,
  recordAttributedActivity,
} from "../lib/attribution";
import { makeMockDb } from "./helpers/mock-db";

const asg = (over: Record<string, unknown> = {}) => ({
  id: "asg-1",
  case_id: "case-1",
  profile_id: "prof-slp",
  role: "contributor",
  started_at: "2026-08-01 09:00:00+00",
  ended_at: null,
  created_at: "2026-08-01 09:00:00+00",
  ...over,
});

test("actor strings: profile form added, legacy forms parse unchanged", () => {
  assert.equal(actorForProfile("prof-1"), "profile:prof-1");
  assert.deepEqual(parseActor("profile:prof-1"), { kind: "profile", profileId: "prof-1" });
  assert.deepEqual(parseActor("respondent:inv-9"), { kind: "respondent", invitationId: "inv-9" });
  assert.deepEqual(parseActor("dbccdc56-cdde-4e03-b38b-434d8a0aae21"), {
    kind: "auth_user",
    authUserId: "dbccdc56-cdde-4e03-b38b-434d8a0aae21",
  });
});

test("structural-metadata guard rejects narrative-length strings", () => {
  assert.doesNotThrow(() => assertStructuralMetadata({ sourceId: "abc", count: 3 }));
  assert.throws(() => assertStructuralMetadata({ note: "x".repeat(200) }));
});

test("attributed write lands with actor profile:<id> under an active assignment", async () => {
  const db = makeMockDb({ case_assignments: { rows: [asg()] } });
  const res = await recordAttributedActivity({
    svc: db,
    caseId: "case-1",
    profileId: "prof-slp",
    eventType: "contributor_note_added",
    metadata: { sourceId: "src-1" },
  });
  assert.equal(res.ok, true);
  assert.equal(db.inserts.length, 1);
  assert.equal(db.inserts[0].table, "audit_events");
  const row = db.inserts[0].values as Record<string, unknown>;
  assert.equal(row.actor, "profile:prof-slp");
  assert.equal(row.case_id, "case-1");
});

test("ended assignment: authorization refused, nothing written", async () => {
  const db = makeMockDb({
    case_assignments: { rows: [asg({ ended_at: "2026-08-02 09:00:00+00" })] },
  });
  const res = await recordAttributedActivity({
    svc: db,
    caseId: "case-1",
    profileId: "prof-slp",
    eventType: "contributor_note_added",
  });
  assert.equal(res.ok, false);
  assert.equal(res.status, 403);
  assert.equal(db.inserts.length, 0);
});

test("no assignment at all: refused", async () => {
  const db = makeMockDb({ case_assignments: { rows: [] } });
  const res = await recordAttributedActivity({
    svc: db,
    caseId: "case-1",
    profileId: "prof-unknown",
    eventType: "contributor_note_added",
  });
  assert.equal(res.ok, false);
  assert.equal(db.inserts.length, 0);
});

test("database-boundary refusal (42501) maps to the same 403, nothing recorded", async () => {
  // Preflight passes (active assignment) but the mutation-boundary trigger
  // refuses — the stale-preflight/TOCTOU shape D-137 exists to close.
  const db = makeMockDb({
    case_assignments: { rows: [asg()] },
    audit_events: {
      insertError: { message: "no_active_assignment", code: "42501" },
    },
  });
  const res = await recordAttributedActivity({
    svc: db,
    caseId: "case-1",
    profileId: "prof-slp",
    eventType: "contributor_note_added",
  });
  assert.equal(res.ok, false);
  assert.equal(res.status, 403);
  assert.equal(res.body.boundary, "database");
  assert.equal(db.inserts.length, 0);
});

test("non-authorization insert errors still throw (not swallowed into 403)", async () => {
  const db = makeMockDb({
    case_assignments: { rows: [asg()] },
    audit_events: { insertError: { message: "connection reset" } },
  });
  await assert.rejects(
    recordAttributedActivity({
      svc: db,
      caseId: "case-1",
      profileId: "prof-slp",
      eventType: "contributor_note_added",
    })
  );
});

test("narrative metadata is refused before any authorization read", async () => {
  const db = makeMockDb({ case_assignments: { rows: [asg()] } });
  await assert.rejects(
    recordAttributedActivity({
      svc: db,
      caseId: "case-1",
      profileId: "prof-slp",
      eventType: "contributor_note_added",
      metadata: { narrative: "Avery struggled today with ".padEnd(300, "x") },
    })
  );
  assert.equal(db.inserts.length, 0);
});
