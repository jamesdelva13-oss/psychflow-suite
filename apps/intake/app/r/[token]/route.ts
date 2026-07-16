import { NextResponse } from "next/server";
import { hashToken, checkInvitation, type InvitationRecord } from "@/lib/engine";
import { loadInvitationByTokenHash, type InvitationRow } from "@/lib/respondent-data";
import { createServiceClient } from "@/lib/supabase/service";
import { setRespondentCookie } from "@/lib/respondent-session";
import { recordAudit } from "@/lib/audit";

// Implemented as a route handler (not a plain server component) because it
// must SET the respondent session cookie, which RSCs can't do. It validates
// the token with the engine, marks the invitation opened, then redirects to
// the cookie-authorized /respond form.
function toRecord(inv: InvitationRow): InvitationRecord {
  return {
    invitationId: inv.id,
    caseId: inv.case_id,
    respondentRole: inv.respondent_role,
    tokenHash: inv.token_hash,
    expiresAt: inv.expires_at,
    status: inv.status,
    maxUses: inv.max_uses,
    uses: inv.uses,
    deletedAt: inv.deleted_at,
  };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const origin = new URL(req.url).origin;

  const inv = await loadInvitationByTokenHash(hashToken(token));
  const check = checkInvitation(inv ? toRecord(inv) : null, token);
  if (!check.ok) {
    return NextResponse.redirect(
      new URL(`/respond/unavailable?reason=${check.reason}`, origin)
    );
  }

  if (inv!.status === "pending") {
    const svc = createServiceClient();
    await svc
      .from("invitations")
      .update({ status: "opened" })
      .eq("id", inv!.id)
      .eq("status", "pending");
    await recordAudit({
      caseId: inv!.case_id,
      actor: `respondent:${inv!.id}`,
      eventType: "response_opened",
      metadata: { invitationId: inv!.id, role: inv!.respondent_role },
    });
  }

  const res = NextResponse.redirect(new URL("/respond", origin));
  setRespondentCookie(res, inv!.id);
  return res;
}
