import "server-only";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import {
  RESPONDENT_COOKIE,
  RESPONDENT_COOKIE_MAX_AGE,
  makeCookieValue,
  parseCookieValue,
} from "./respondent-cookie";

/**
 * Cookie I/O for the respondent session. The signing logic lives in the pure,
 * testable ./respondent-cookie module; this file only touches Next request
 * state (cookies() / NextResponse), which can't run in a unit test.
 */

/** Read + verify the respondent cookie; returns the invitation id or null. */
export async function getRespondentInvitationId(): Promise<string | null> {
  const store = await cookies();
  return parseCookieValue(store.get(RESPONDENT_COOKIE)?.value);
}

/** Set the cookie on a response (used from the /r/[token] route handler). */
export function setRespondentCookie(res: NextResponse, invitationId: string): void {
  res.cookies.set(RESPONDENT_COOKIE, makeCookieValue(invitationId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: RESPONDENT_COOKIE_MAX_AGE,
  });
}

export async function clearRespondentCookie(): Promise<void> {
  const store = await cookies();
  store.delete(RESPONDENT_COOKIE);
}
