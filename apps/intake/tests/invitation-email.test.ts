// Invitation email delivery (directive §3.2 deployable-RIE gate).
// Covers: content builder privacy invariants, the sender adapter's
// no-leak failure modes, and — most importantly — authorization: an
// unauthenticated or non-owner caller must never cause an email send,
// and the recipient address must never be persisted or audited.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildInvitationEmail,
  maskEmail,
} from "../lib/email/invitation-email";
import { sendEmail, type OutboundEmail } from "../lib/email/sender";
import { createInvitation } from "../lib/invitation-create-core";
import { assertStructuralMetadata } from "../lib/audit";
import { bankForRole, SUPPORTED_ROLES } from "../lib/banks";

// ---------------------------------------------------------------------------
// Content builder
// ---------------------------------------------------------------------------

const RAW_TOKEN = "raw-token-secret-abc123";
const URL = `https://intake.example.org/r/${RAW_TOKEN}`;
const EXPIRES = new Date("2026-08-20T12:00:00Z").toISOString();

test("email content carries the link, expiry, and psychologist name — nothing else identifying", () => {
  const c = buildInvitationEmail({
    role: "teacher",
    url: URL,
    expiresAt: EXPIRES,
    psychologistName: "Dr. Rivera",
  });
  assert.match(c.subject, /teacher input form from Dr\. Rivera/);
  assert.ok(c.text.includes(URL));
  assert.ok(c.html.includes(URL));
  assert.match(c.text, /August 20, 2026/);
  // The privacy line is part of the contract: identity only after opening.
  assert.match(c.text, /identified only after you open the form/);
  // The builder's input type has no student/case fields at all; the only
  // dynamic strings are the four inputs above.
});

test("psychologist name is HTML-escaped in the html body", () => {
  const c = buildInvitationEmail({
    role: "teacher",
    url: URL,
    expiresAt: EXPIRES,
    psychologistName: `<img src=x onerror=alert(1)>`,
  });
  assert.ok(!c.html.includes("<img"));
  assert.ok(c.html.includes("&lt;img"));
});

test("parent_guardian role renders as a human phrase", () => {
  const c = buildInvitationEmail({
    role: "parent_guardian",
    url: URL,
    expiresAt: EXPIRES,
    psychologistName: "Dr. Rivera",
  });
  assert.match(c.subject, /parent\/guardian input form/);
});

test("maskEmail shows first character + domain only", () => {
  assert.equal(maskEmail("jane.doe@school.org"), "j***@school.org");
  assert.equal(maskEmail("a@b.co"), "a***@b.co");
  assert.equal(maskEmail("not-an-email"), "***");
});

// ---------------------------------------------------------------------------
// Sender adapter — failure modes must not leak recipient, token, or body
// ---------------------------------------------------------------------------

const MSG: OutboundEmail = {
  to: "teacher@school.org",
  subject: "s",
  text: `t ${URL}`,
  html: `<p>${URL}</p>`,
};

function withEnv(env: Record<string, string | undefined>, fn: () => Promise<void>) {
  const prev: Record<string, string | undefined> = {};
  for (const k of Object.keys(env)) {
    prev[k] = process.env[k];
    if (env[k] === undefined) delete process.env[k];
    else process.env[k] = env[k];
  }
  return fn().finally(() => {
    for (const k of Object.keys(env)) {
      if (prev[k] === undefined) delete process.env[k];
      else process.env[k] = prev[k];
    }
  });
}

test("unconfigured sender reports email_not_configured and never calls the network", () =>
  withEnv({ EMAIL_API_KEY: undefined, EMAIL_FROM: undefined }, async () => {
    let fetched = false;
    const r = await sendEmail(MSG, (async () => {
      fetched = true;
      throw new Error("must not be called");
    }) as unknown as typeof fetch);
    assert.deepEqual(r, { ok: false, reason: "email_not_configured" });
    assert.equal(fetched, false);
  }));

test("configured sender posts the message and succeeds on 2xx", () =>
  withEnv(
    { EMAIL_API_KEY: "k", EMAIL_FROM: "Intake <intake@example.org>" },
    async () => {
      let posted: any = null;
      const r = await sendEmail(MSG, (async (_url: any, init: any) => {
        posted = JSON.parse(init.body);
        return { ok: true, status: 200 } as Response;
      }) as unknown as typeof fetch);
      assert.deepEqual(r, { ok: true });
      assert.deepEqual(posted.to, ["teacher@school.org"]);
      assert.equal(posted.from, "Intake <intake@example.org>");
    }
  ));

test("provider rejection reduces to a status code — no recipient, token, or body in the reason", () =>
  withEnv(
    { EMAIL_API_KEY: "k", EMAIL_FROM: "intake@example.org" },
    async () => {
      const r = await sendEmail(MSG, (async () => {
        return { ok: false, status: 422 } as Response;
      }) as unknown as typeof fetch);
      assert.equal(r.ok, false);
      const reason = (r as { ok: false; reason: string }).reason;
      assert.equal(reason, "provider_rejected_422");
      assert.ok(!reason.includes("teacher@school.org"));
      assert.ok(!reason.includes(RAW_TOKEN));
    }
  ));

test("network failure reduces to provider_unreachable — thrown error is dropped", () =>
  withEnv(
    { EMAIL_API_KEY: "k", EMAIL_FROM: "intake@example.org" },
    async () => {
      const r = await sendEmail(MSG, (async () => {
        throw new Error(`connect failed sending to teacher@school.org ${URL}`);
      }) as unknown as typeof fetch);
      assert.deepEqual(r, { ok: false, reason: "provider_unreachable" });
    }
  ));

// ---------------------------------------------------------------------------
// Creation core — authorization gates run before any write or send
// ---------------------------------------------------------------------------

function fakeDb(opts: { caseVisible: boolean }) {
  const calls = { informants: [] as any[], invitations: [] as any[] };
  function from(table: string) {
    const api: any = {
      select() {
        return api;
      },
      insert(row: any) {
        if (table === "informants") calls.informants.push(row);
        if (table === "invitations") calls.invitations.push(row);
        return api;
      },
      eq() {
        return api;
      },
      maybeSingle() {
        if (table === "cases") {
          return Promise.resolve({
            data: opts.caseVisible ? { id: "case-1" } : null,
            error: null,
          });
        }
        if (table === "psychologists") {
          return Promise.resolve({
            data: { display_name: "Dr. Rivera", email: "rivera@district.org" },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      },
      single() {
        if (table === "informants")
          return Promise.resolve({ data: { id: "inf-1" }, error: null });
        if (table === "invitations")
          return Promise.resolve({ data: { id: "inv-1" }, error: null });
        return Promise.resolve({ data: null, error: null });
      },
    };
    return api;
  }
  return { db: { from }, calls };
}

function makeDeps(over: Partial<Parameters<typeof createInvitation>[0]> = {}) {
  const sends: OutboundEmail[] = [];
  const audits: { eventType: string; metadata?: Record<string, unknown> }[] = [];
  const { db, calls } = fakeDb({ caseVisible: true });
  const deps: Parameters<typeof createInvitation>[0] = {
    db,
    userId: "psych-1",
    caseId: "case-1",
    rawBody: { role: "teacher" },
    bankForRole,
    supportedRoles: SUPPORTED_ROLES,
    generateToken: () => RAW_TOKEN,
    invitationUrl: (base, t) => `${base}/r/${t}`,
    qrDataUrl: async () => "data:image/png;base64,qr",
    sendEmail: async (m) => {
      sends.push(m);
      return { ok: true };
    },
    recordAudit: async (a) => {
      // Enforce the real no-narrative guard on everything the core records.
      assertStructuralMetadata(a.metadata ?? {});
      audits.push({ eventType: a.eventType, metadata: a.metadata });
    },
    baseUrl: "https://intake.example.org",
    ...over,
  };
  return { deps, sends, audits, calls };
}

test("AUTH: unauthenticated caller gets 401 — nothing created, no email sent", async () => {
  const { deps, sends, calls } = makeDeps({
    userId: null,
    rawBody: { role: "teacher", recipientEmail: "teacher@school.org" },
  });
  const r = await createInvitation(deps);
  assert.equal(r.status, 401);
  assert.equal(sends.length, 0);
  assert.equal(calls.informants.length, 0);
  assert.equal(calls.invitations.length, 0);
});

test("AUTH: case not visible under RLS gets 404 — nothing created, no email sent", async () => {
  const { db, calls } = fakeDb({ caseVisible: false });
  const { deps, sends } = makeDeps({
    db,
    rawBody: { role: "teacher", recipientEmail: "teacher@school.org" },
  });
  const r = await createInvitation(deps);
  assert.equal(r.status, 404);
  assert.equal(sends.length, 0);
  assert.equal(calls.informants.length, 0);
  assert.equal(calls.invitations.length, 0);
});

test("invalid recipient email is 422 — nothing created, no email sent", async () => {
  const { deps, sends, calls } = makeDeps({
    rawBody: { role: "teacher", recipientEmail: "not-an-email" },
  });
  const r = await createInvitation(deps);
  assert.equal(r.status, 422);
  assert.equal(sends.length, 0);
  assert.equal(calls.informants.length, 0);
});

test("no recipientEmail → link-only flow unchanged, no send attempted", async () => {
  const { deps, sends, audits } = makeDeps();
  const r = await createInvitation(deps);
  assert.equal(r.status, 201);
  assert.deepEqual(r.body.emailDelivery, { attempted: false });
  assert.equal(sends.length, 0);
  assert.deepEqual(
    audits.map((a) => a.eventType),
    ["invitation_created"]
  );
});

test("email path: sends once to the recipient with the one-time URL, reply-to the psychologist", async () => {
  const { deps, sends, audits } = makeDeps({
    rawBody: { role: "teacher", recipientEmail: "teacher@school.org" },
  });
  const r = await createInvitation(deps);
  assert.equal(r.status, 201);
  assert.equal(sends.length, 1);
  assert.equal(sends[0].to, "teacher@school.org");
  assert.ok(sends[0].text.includes(`https://intake.example.org/r/${RAW_TOKEN}`));
  assert.equal(sends[0].replyTo, "rivera@district.org");
  assert.deepEqual(r.body.emailDelivery, {
    attempted: true,
    sent: true,
    maskedRecipient: "t***@school.org",
  });
  assert.deepEqual(
    audits.map((a) => a.eventType),
    ["invitation_created", "invitation_email_sent"]
  );
});

test("PRIVACY: the recipient address is never persisted, audited, or echoed unmasked", async () => {
  const { deps, sends, audits, calls } = makeDeps({
    rawBody: { role: "teacher", recipientEmail: "teacher@school.org" },
  });
  const r = await createInvitation(deps);
  assert.equal(sends.length, 1);
  // Not in any DB row the core writes:
  const persisted = JSON.stringify([calls.informants, calls.invitations]);
  assert.ok(!persisted.includes("teacher@school.org"));
  // Not in audit metadata:
  assert.ok(!JSON.stringify(audits).includes("teacher@school.org"));
  // Not echoed back unmasked in the response:
  assert.ok(!JSON.stringify(r.body).includes("teacher@school.org"));
});

test("email failure never loses the invitation — 201 with the link and a typed reason", async () => {
  const { deps, sends, audits } = makeDeps({
    rawBody: { role: "teacher", recipientEmail: "teacher@school.org" },
    sendEmail: async () => ({ ok: false, reason: "email_not_configured" }),
  });
  void sends;
  const r = await createInvitation(deps);
  assert.equal(r.status, 201);
  assert.ok(typeof r.body.url === "string" && (r.body.url as string).includes(RAW_TOKEN));
  assert.deepEqual(r.body.emailDelivery, {
    attempted: true,
    sent: false,
    reason: "email_not_configured",
  });
  // No invitation_email_sent audit on failure.
  assert.deepEqual(
    audits.map((a) => a.eventType),
    ["invitation_created"]
  );
});
