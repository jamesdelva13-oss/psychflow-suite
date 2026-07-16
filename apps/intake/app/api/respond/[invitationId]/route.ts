import { NextResponse } from "next/server";
import { z } from "zod";
import { getRespondentInvitationId } from "@/lib/respondent-session";
import { authorizeRespondent } from "@/lib/respondent-guard";
import {
  loadInvitationById,
  invitationUsable,
  bankForInvitation,
  loadDrafts,
} from "@/lib/respondent-data";
import { buildFormView } from "@/lib/form-view";
import { createServiceClient } from "@/lib/supabase/service";

const Answer = z.union([z.string(), z.array(z.string())]);
const Body = z.object({
  updates: z
    .array(z.object({ key: z.string().min(1), answer: Answer }))
    .min(1)
    .max(500),
});

// Autosave. Cookie-gated to exactly this invitation; upserts drafts, then
// returns the engine-recomputed view so the client's branching stays
// authoritative without ever running the engine in the browser.
export async function PATCH(
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
  const usable = invitationUsable(inv);
  if (!usable.ok) return NextResponse.json({ error: usable.reason }, { status: 409 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 422 });
  }

  const svc = createServiceClient();
  const now = new Date().toISOString();
  const rows = parsed.data.updates.map((u) => ({
    invitation_id: invitationId,
    response_key: u.key,
    answer: u.answer,
    updated_at: now,
  }));
  const { error } = await svc
    .from("draft_responses")
    .upsert(rows, { onConflict: "invitation_id,response_key" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const bank = bankForInvitation(inv);
  const responses = await loadDrafts(invitationId);
  return NextResponse.json({ view: buildFormView(bank, responses) });
}
