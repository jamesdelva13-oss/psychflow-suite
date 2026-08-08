import test from "node:test";
import assert from "node:assert/strict";
import { buildTimeline, type AuditRow } from "../lib/timeline";

const OWNER = "owner-auth-id";
const OPTS = { ownerId: OWNER, ownerName: "James Delva" };

const row = (over: Partial<AuditRow>): AuditRow => ({
  actor: OWNER,
  event_type: "case_created",
  created_at: "2026-04-20T12:00:00Z",
  metadata: null,
  ...over,
});

test("milestone events map to attributed workflow entries, sorted by time", () => {
  const entries = buildTimeline(
    [
      row({ event_type: "capture_finalized", created_at: "2026-05-05T19:00:00Z" }),
      row({ event_type: "case_created", created_at: "2026-04-20T12:00:00Z" }),
      row({
        event_type: "response_submitted",
        actor: "respondent:inv-1",
        created_at: "2026-04-28T14:30:00Z",
      }),
    ],
    OPTS
  );
  assert.deepEqual(
    entries.map((e) => [e.actor, e.verb]),
    [
      ["James Delva", "opened the case"],
      ["Teacher", "submitted the intake form"],
      ["James Delva", "finalized the interview summary"],
    ]
  );
});

test("non-milestone events are dropped — the Timeline is not a raw audit viewer", () => {
  const entries = buildTimeline(
    [
      row({ event_type: "capture_session_created" }),
      row({ event_type: "invitation_revoked" }),
      row({ event_type: "some_future_event" }),
    ],
    OPTS
  );
  assert.deepEqual(entries, []);
});

test("attributed contributor activity stays out of the milestone view (no multidisciplinary UI in the slice)", () => {
  const entries = buildTimeline(
    [row({ event_type: "response_submitted", actor: "profile:slp-profile-id" })],
    OPTS
  );
  assert.deepEqual(entries, []);
});

test("a clean case with no events yields an empty timeline (negative)", () => {
  assert.deepEqual(buildTimeline([], OPTS), []);
});
