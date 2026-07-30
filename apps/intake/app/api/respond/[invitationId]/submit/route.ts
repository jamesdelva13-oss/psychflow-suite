import { NextResponse } from "next/server";
import {
  getRespondentInvitationId,
  clearRespondentCookie,
} from "@/lib/respondent-session";
import { authorizeRespondent } from "@/lib/respondent-guard";
import { loadInvitationById, bankForInvitation, loadCaseContext } from "@/lib/respondent-data";
import { bandContextFor } from "@/lib/band";
import { createServiceClient } from "@/lib/supabase/service";
import { submitResponse } from "@/lib/submit-core";

// Thin wrapper: gather the real session + service client + invitation + bank,
// then delegate to the injectable submitResponse core (unit-tested separately).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  const { invitationId } = await params;
  const sessionId = await getRespondentInvitationId();
  if (!authorizeRespondent(sessionId, invitationId)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const inv = await loadInvitationById(invitationId);
  if (!inv) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const bank = bankForInvitation(inv);
  const caseRow = await loadCaseContext(inv.case_id);
  const { ctx, sessionContext } = bandContextFor(bank, caseRow?.grade);
  const result = await submitResponse({
    svc: createServiceClient(),
    sessionInvitationId: sessionId,
    inv,
    bank,
    ctx,
    sessionContext,
  });

  if (result.ok) await clearRespondentCookie();
  return NextResponse.json(result.body, { status: result.status });
}
