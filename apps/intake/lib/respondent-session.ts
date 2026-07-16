import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

/**
 * Respondents have no Supabase identity. The invitation token (validated once
 * at /r/[token]) is exchanged for a signed, HTTP-only cookie that authorizes
 * the autosave and submit routes for exactly that invitation. The raw token
 * never travels again; the cookie carries only the invitation id + an HMAC.
 */
const COOKIE = "rsx";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days

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

export function parseCookieValue(value: string | undefined): string | null {
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

/** Read + verify the respondent cookie; returns the invitation id or null. */
export async function getRespondentInvitationId(): Promise<string | null> {
  const store = await cookies();
  return parseCookieValue(store.get(COOKIE)?.value);
}

/** Set the cookie on a response (used from the /r/[token] route handler). */
export function setRespondentCookie(res: NextResponse, invitationId: string): void {
  res.cookies.set(COOKIE, makeCookieValue(invitationId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
  });
}

export async function clearRespondentCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
