import { test } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { KNOWN_EVENT_TYPES, describeAuditEvent } from "../lib/audit-labels";
import { assertStructuralMetadata } from "../lib/audit";

// ---------------------------------------------------------------------------
// Label completeness: every event type actually recorded anywhere in the app
// must appear in KNOWN_EVENT_TYPES (and therefore have a human sentence).
// Grep-based so a new recordAudit call site can't dodge the pairing.
// ---------------------------------------------------------------------------

test("every recorded event type has a label entry", () => {
  const appRoot = new URL("..", import.meta.url).pathname;
  const out = execSync(
    `grep -rhoE 'eventType: "[a-z_]+"|event_type: "[a-z_]+"' app lib`,
    { cwd: appRoot, encoding: "utf8" }
  );
  const recorded = new Set(
    [...out.matchAll(/"([a-z_]+)"/g)].map((m) => m[1])
  );
  for (const t of recorded) {
    assert.ok(
      (KNOWN_EVENT_TYPES as readonly string[]).includes(t),
      `event type "${t}" is recorded but has no label in audit-labels.ts`
    );
  }
});

test("labels render as human sentences, self-aware", () => {
  assert.equal(
    describeAuditEvent("case_created", {}, { self: true }),
    "You created this case"
  );
  assert.match(
    describeAuditEvent("capture_session_created", { kind: "call" }, { self: true }),
    /^You started a capture session \(call\)$/
  );
  assert.match(
    describeAuditEvent("capture_summary_proposed", { model: "claude-opus-5" }, { self: true }),
    /drafted a capture summary.*proposal.*claude-opus-5/
  );
  assert.match(
    describeAuditEvent("capture_finalized", { hasSummary: false }, { self: true }),
    /notes only/
  );
  // Unknown types degrade to readable words, never crash the page.
  assert.equal(describeAuditEvent("some_future_event", {}, { self: false }), "some future event");
});

// ---------------------------------------------------------------------------
// No-narrative guard: metadata that could smuggle prose is rejected loudly.
// ---------------------------------------------------------------------------

test("structural metadata passes the guard", () => {
  assertStructuralMetadata({
    captureSessionId: "cs1",
    invitations: 3,
    model: "claude-opus-5",
    nested: { ids: ["a", "b"], ok: true },
  });
});

test("narrative-length strings are rejected, including nested ones", () => {
  const prose = "The teacher reported that the student ".repeat(6);
  assert.throws(() => assertStructuralMetadata({ note: prose }), /narrative/);
  assert.throws(
    () => assertStructuralMetadata({ deep: { list: [prose] } }),
    /narrative/
  );
});
