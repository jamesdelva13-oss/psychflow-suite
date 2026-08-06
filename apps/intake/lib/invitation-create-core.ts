import "server-only";
import { z } from "zod";
import type { TQuestionBank } from "@suite/case-model";
import { buildInvitationRow } from "./invitation-core";
import { buildInvitationEmail, maskEmail } from "./email/invitation-email";
import type { OutboundEmail, SendEmailResult } from "./email/sender";
import type { SupabaseLike } from "./submit-core";

const Body = z.object({
  role: z.enum(["teacher", "parent_guardian"]),
  expiresInDays: z.number().int().min(1).max(90).optional(),
  // Optional delivery. Used transiently for the send and NEVER persisted:
  // retention semantics are an open JD decision (directive §3.2), so no new
  // stored PII field may presume the answer. Audit stays structural.
  recipientEmail: z.string().trim().email().max(254).optional(),
});

export type EmailDelivery =
  | { attempted: false }
  | { attempted: true; sent: true; maskedRecipient: string }
  | { attempted: true; sent: false; reason: string };

export interface CreateInvitationResult {
  status: number;
  body: Record<string, unknown>;
  ok: boolean;
}

/**
 * The full invitation-creation flow (create → link/QR → optional email
 * delivery), injectable for unit testing. Authorization gates run before any
 * write and before any email leaves: an unauthenticated or non-owner caller
 * must never trigger a send. Email failure never loses the invitation — the
 * link/QR fallback is always returned.
 */
export async function createInvitation(deps: {
  /** RLS-scoped (user) client — ownership checks rely on RLS visibility. */
  db: SupabaseLike;
  userId: string | null;
  caseId: string;
  rawBody: unknown;
  bankForRole: (role: string) => TQuestionBank;
  supportedRoles: string[];
  generateToken: () => string;
  invitationUrl: (base: string, token: string) => string;
  qrDataUrl: (url: string) => Promise<string>;
  sendEmail: (msg: OutboundEmail) => Promise<SendEmailResult>;
  recordAudit: (args: {
    caseId: string | null;
    actor: string;
    eventType: string;
    metadata?: Record<string, unknown>;
  }) => Promise<void>;
  baseUrl: string;
  now?: Date;
}): Promise<CreateInvitationResult> {
  const { db, userId, caseId } = deps;
  const now = deps.now ?? new Date();

  if (!userId) return { status: 401, body: { error: "unauthorized" }, ok: false };

  const parsed = Body.safeParse(deps.rawBody);
  if (!parsed.success) {
    return {
      status: 422,
      body: { error: "invalid", issues: parsed.error.flatten() },
      ok: false,
    };
  }
  const { role, recipientEmail } = parsed.data;
  if (!deps.supportedRoles.includes(role)) {
    return { status: 422, body: { error: "unsupported_role" }, ok: false };
  }

  // Ownership check via RLS: the select only returns the case if it's the
  // caller's. 404 (not 403) so we don't reveal existence of others' cases.
  const { data: theCase } = await db
    .from("cases")
    .select("id")
    .eq("id", caseId)
    .maybeSingle();
  if (!theCase) return { status: 404, body: { error: "not_found" }, ok: false };

  // Pin the exact bank id + version at creation (D-013).
  const bank = deps.bankForRole(role);

  // One informant per invitation so a submission can attach informant_id.
  const { data: informant, error: infErr } = await db
    .from("informants")
    .insert({ case_id: caseId, role })
    .select("id")
    .single();
  if (infErr || !informant) {
    return {
      status: 400,
      body: { error: infErr?.message ?? "informant_failed" },
      ok: false,
    };
  }

  const rawToken = deps.generateToken();
  const days = parsed.data.expiresInDays ?? 14;
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

  const { data: invite, error: invErr } = await db
    .from("invitations")
    .insert(
      buildInvitationRow({
        caseId,
        informantId: informant.id,
        role,
        bank,
        rawToken,
        expiresAt,
      })
    )
    .select("id")
    .single();
  if (invErr || !invite) {
    return {
      status: 400,
      body: { error: invErr?.message ?? "invitation_failed" },
      ok: false,
    };
  }

  const url = deps.invitationUrl(deps.baseUrl, rawToken); // raw token, returned once
  const qr = await deps.qrDataUrl(url);

  await deps.recordAudit({
    caseId,
    actor: userId,
    eventType: "invitation_created",
    metadata: {
      invitationId: invite.id,
      role,
      bankId: bank.bankId,
      bankVersion: bank.version,
    },
  });

  let emailDelivery: EmailDelivery = { attempted: false };
  if (recipientEmail) {
    // The psychologist's own display name/email personalize the message and
    // give the respondent a reply path. Self-row select under RLS.
    const { data: psych } = await db
      .from("psychologists")
      .select("display_name, email")
      .eq("id", userId)
      .maybeSingle();
    const psychologistName =
      (psych as { display_name?: string } | null)?.display_name ?? "Your school psychologist";
    const psychologistEmail = (psych as { email?: string } | null)?.email;

    const content = buildInvitationEmail({
      role,
      url,
      expiresAt,
      psychologistName,
    });
    const sent = await deps.sendEmail({
      to: recipientEmail,
      ...content,
      ...(psychologistEmail ? { replyTo: psychologistEmail } : {}),
    });

    if (sent.ok) {
      // Structural facts only — the recipient address is never written.
      await deps.recordAudit({
        caseId,
        actor: userId,
        eventType: "invitation_email_sent",
        metadata: { invitationId: invite.id, role },
      });
      emailDelivery = {
        attempted: true,
        sent: true,
        maskedRecipient: maskEmail(recipientEmail),
      };
    } else {
      emailDelivery = { attempted: true, sent: false, reason: sent.reason };
    }
  }

  return {
    status: 201,
    body: { url, qrDataUrl: qr, expiresAt, emailDelivery },
    ok: true,
  };
}
