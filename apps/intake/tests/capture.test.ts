import { test } from "node:test";
import assert from "node:assert/strict";
import {
  pseudonymizeNotes,
  canonicalStringify,
  checksumOf,
  sourceKindFor,
  finalizeCapture,
  type CaptureSessionRow,
  type SummaryProposal,
} from "../lib/capture-core";

// ---------------------------------------------------------------------------
// Pseudonymization (data-posture §7: D-120 fields → placeholder before any
// model call)
// ---------------------------------------------------------------------------

const identity = { firstName: "Avery", lastInitial: "W" };

test("pseudonymize replaces name+initial pairs and bare first names, case-insensitively", () => {
  const { text, replacements } = pseudonymizeNotes(
    "Avery W. was quiet. avery raised her hand. Teacher praised AVERY W today.",
    identity
  );
  assert.equal(
    text,
    "the student was quiet. the student raised her hand. Teacher praised the student today."
  );
  assert.equal(replacements, 3);
});

test("pseudonymize handles possessives and leaves other words alone", () => {
  const { text } = pseudonymizeNotes("Avery's desk is near Ms. Waverly.", identity);
  assert.equal(text, "the student's desk is near Ms. Waverly.");
});

test("pseudonymize does not touch substrings of longer words", () => {
  const { text, replacements } = pseudonymizeNotes("Averys? No — Waverly Avenue.", identity);
  // "Averys" has no word boundary after "Avery"... but \b matches between y|s? No:
  // \bAvery\b requires a non-word char after "y"; "Averys" keeps going, so no match.
  assert.equal(replacements, 0);
  assert.equal(text, "Averys? No — Waverly Avenue.");
});

test("pseudonymize is a no-op when no identity fields exist", () => {
  const { text, replacements } = pseudonymizeNotes("Avery read aloud.", {
    firstName: null,
    lastInitial: null,
  });
  assert.equal(text, "Avery read aloud.");
  assert.equal(replacements, 0);
});

// ---------------------------------------------------------------------------
// Canonical payload + checksum
// ---------------------------------------------------------------------------

test("checksum is independent of key insertion order", () => {
  const a = { b: 1, a: { d: [1, 2], c: "x" } };
  const b = { a: { c: "x", d: [1, 2] }, b: 1 };
  assert.equal(canonicalStringify(a), canonicalStringify(b));
  assert.equal(checksumOf(a), checksumOf(b));
});

test("checksum changes when content changes", () => {
  assert.notEqual(checksumOf({ notes: "a" }), checksumOf({ notes: "b" }));
});

test("capture kinds map onto the sources.kind constraint", () => {
  assert.equal(sourceKindFor("interview"), "interview");
  assert.equal(sourceKindFor("call"), "interview");
  assert.equal(sourceKindFor("observation"), "observation");
  assert.equal(sourceKindFor("other"), "other");
});

// ---------------------------------------------------------------------------
// Finalize gate (D-125 / D-081)
// ---------------------------------------------------------------------------

const generation: SummaryProposal["generation"] = {
  requestedModel: "claude-opus-5",
  servedModel: "claude-opus-5",
  promptVersion: "capture-summary-v1",
  schemaVersion: "capture-summary-schema-v1",
  pseudonymized: true,
  createdAt: "2026-08-04T12:00:00.000Z",
};

function session(over: Partial<CaptureSessionRow> = {}): CaptureSessionRow {
  return {
    id: "cs1",
    case_id: "c1",
    psychologist_id: "p1",
    informant_id: null,
    kind: "interview",
    setting: "phone call with parent",
    occurred_on: "2026-08-04",
    notes: "Parent reported reading frustration at home.",
    status: "open",
    summary_proposal: null,
    summary_final: null,
    source_id: null,
    ...over,
  };
}

function fakeSvc() {
  const calls = { sources: [] as any[], sessionUpdates: [] as any[] };
  function from(table: string) {
    let op: string | null = null;
    let payload: any = null;
    const api: any = {
      insert(row: any) {
        op = "insert";
        if (table === "sources") calls.sources.push(row);
        return api;
      },
      select() {
        return api;
      },
      single() {
        return Promise.resolve({ data: { id: "src1" }, error: null });
      },
      update(row: any) {
        op = "update";
        payload = row;
        return api;
      },
      eq() {
        if (op === "update" && table === "capture_sessions") {
          calls.sessionUpdates.push(payload);
        }
        return Promise.resolve({ error: null });
      },
    };
    return api;
  }
  return { svc: { from }, calls };
}

test("finalize refuses without the explicit confirmation", async () => {
  const { svc, calls } = fakeSvc();
  const r = await finalizeCapture({ svc, session: session(), body: { confirmed: false } });
  assert.equal(r.status, 422);
  assert.equal(r.body.error, "confirmation_required");
  assert.equal(calls.sources.length, 0);
});

test("finalize refuses when already finalized", async () => {
  const { svc } = fakeSvc();
  const r = await finalizeCapture({
    svc,
    session: session({ status: "finalized", source_id: "src0" }),
    body: { confirmed: true },
  });
  assert.equal(r.status, 409);
});

test("finalize refuses empty notes", async () => {
  const { svc } = fakeSvc();
  const r = await finalizeCapture({
    svc,
    session: session({ notes: "   " }),
    body: { confirmed: true },
  });
  assert.equal(r.status, 422);
  assert.equal(r.body.error, "empty_notes");
});

test("notes-only finalize locks a Source with no summary", async () => {
  const { svc, calls } = fakeSvc();
  const r = await finalizeCapture({ svc, session: session(), body: { confirmed: true } });
  assert.ok(r.ok);
  assert.equal(calls.sources.length, 1);
  const src = calls.sources[0];
  assert.equal(src.locked, true);
  assert.equal(src.kind, "interview");
  assert.equal(src.instrument, "capture");
  assert.equal(src.payload.summaryFinal, null);
  assert.equal(src.payload.summaryProvenance, null);
  assert.equal(src.checksum, checksumOf(src.payload));
  assert.equal(calls.sessionUpdates[0].status, "finalized");
  assert.equal(calls.sessionUpdates[0].source_id, "src1");
});

test("an unconfirmed proposal NEVER travels into the Source", async () => {
  const { svc, calls } = fakeSvc();
  const withProposal = session({
    status: "proposal_ready",
    summary_proposal: { text: "Model draft the clinician never confirmed.", generation },
  });
  // Clinician finalizes notes-only: proposal exists but summaryFinal was not sent.
  const r = await finalizeCapture({ svc, session: withProposal, body: { confirmed: true } });
  assert.ok(r.ok);
  const src = calls.sources[0];
  assert.equal(src.payload.summaryFinal, null);
  assert.equal(src.payload.summaryProvenance, null);
  assert.ok(!JSON.stringify(src.payload).includes("Model draft"));
});

test("a confirmed verbatim proposal carries provenance with acceptedVerbatim=true", async () => {
  const { svc, calls } = fakeSvc();
  const draft = "Parent reported reading frustration at home; the student avoids homework.";
  const r = await finalizeCapture({
    svc,
    session: session({
      status: "proposal_ready",
      summary_proposal: { text: draft, generation },
    }),
    body: { confirmed: true, summaryFinal: draft },
  });
  assert.ok(r.ok);
  const src = calls.sources[0];
  assert.equal(src.payload.summaryFinal, draft);
  assert.equal(src.payload.summaryProvenance.acceptedVerbatim, true);
  assert.equal(src.payload.summaryProvenance.generation.promptVersion, "capture-summary-v1");
});

test("an edited proposal carries provenance with acceptedVerbatim=false", async () => {
  const { svc, calls } = fakeSvc();
  const r = await finalizeCapture({
    svc,
    session: session({
      status: "proposal_ready",
      summary_proposal: { text: "Model draft.", generation },
    }),
    body: { confirmed: true, summaryFinal: "Clinician-corrected summary." },
  });
  assert.ok(r.ok);
  const src = calls.sources[0];
  assert.equal(src.payload.summaryProvenance.acceptedVerbatim, false);
});

test("a clinician-authored summary with no proposal has null provenance", async () => {
  const { svc, calls } = fakeSvc();
  const r = await finalizeCapture({
    svc,
    session: session(),
    body: { confirmed: true, summaryFinal: "Hand-written summary." },
  });
  assert.ok(r.ok);
  const src = calls.sources[0];
  assert.equal(src.payload.summaryFinal, "Hand-written summary.");
  assert.equal(src.payload.summaryProvenance, null);
});
