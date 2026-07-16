/**
 * invitations.ts — secure invitation tokens and the validation state machine.
 * The raw token travels in the URL; only its SHA-256 hash is ever stored
 * (password-reset pattern). Pure logic: storage is the caller's problem.
 */
import * as crypto from "crypto";

export function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export interface InvitationRecord {
  invitationId: string;
  caseId: string;
  respondentRole: string;
  tokenHash: string;
  expiresAt: string;            // ISO datetime
  status: "pending" | "opened" | "completed" | "revoked";
  maxUses: number;              // uses = distinct completed submissions (1 for MVP)
  uses: number;
  deletedAt?: string | null;
}

export type InvitationCheck =
  | { ok: true; invitation: InvitationRecord }
  | { ok: false; reason: "not_found" | "expired" | "revoked" | "already_completed" | "deleted" };

/**
 * Validate a presented raw token against a candidate record (the caller looks
 * the record up by hashToken(rawToken); passing null means no row matched).
 * Constant-time hash comparison guards against timing attacks.
 */
export function checkInvitation(
  record: InvitationRecord | null,
  rawToken: string,
  now: Date = new Date()
): InvitationCheck {
  if (!record) return { ok: false, reason: "not_found" };
  const presented = Buffer.from(hashToken(rawToken), "hex");
  const stored = Buffer.from(record.tokenHash, "hex");
  if (presented.length !== stored.length || !crypto.timingSafeEqual(presented, stored))
    return { ok: false, reason: "not_found" };
  if (record.deletedAt) return { ok: false, reason: "deleted" };
  if (record.status === "revoked") return { ok: false, reason: "revoked" };
  if (record.status === "completed" || record.uses >= record.maxUses)
    return { ok: false, reason: "already_completed" };
  if (new Date(record.expiresAt).getTime() <= now.getTime())
    return { ok: false, reason: "expired" };
  return { ok: true, invitation: record };
}

export function invitationUrl(baseUrl: string, rawToken: string): string {
  return `${baseUrl.replace(/\/$/, "")}/r/${rawToken}`;
}
