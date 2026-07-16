import crypto from "node:crypto";

/**
 * Pure signing/verification for the respondent session cookie. No Next or I/O
 * imports, so it's unit-testable in a plain Node runner. The cookie carries an
 * invitation id plus an HMAC over it; the raw invitation token never reappears.
 */
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days
export const RESPONDENT_COOKIE = "rsx";
export const RESPONDENT_COOKIE_MAX_AGE = MAX_AGE;

function key(): Buffer {
  const s =
    process.env.RESPONDENT_COOKIE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("No secret available for respondent cookie signing.");
  return crypto.createHash("sha256").update("respondent-cookie:" + s).digest();
}

function sign(value: string): string {
  return crypto.createHmac("sha256", key()).update(value).digest("base64url");
}

export function makeCookieValue(invitationId: string): string {
  return `${invitationId}.${sign(invitationId)}`;
}

/** Verify + extract the invitation id, or null if absent/tampered/forged. */
export function parseCookieValue(value: string | undefined | null): string | null {
  if (!value) return null;
  const i = value.lastIndexOf(".");
  if (i < 0) return null;
  const id = value.slice(0, i);
  const sig = value.slice(i + 1);
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(id));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return id;
}
