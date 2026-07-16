import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  getRespondentInvitationId,
  clearRespondentCookie,
} from "@/lib/respondent-session";
import {
  loadInvitationById,
  invitationUsable,
  bankForInvitation,
  loadDrafts,
} from "@/lib/respondent-data";
import { visibleKeys } from "@/lib/form-view";
import { validateSubmission, lockSubmission } from "@/lib/engine";
import { createServiceClient } from "@/lib/supabase/service";
import { recordAudit } from "@/lib/audit";

// Answering "yes" to either safety-gate question flags the case for expedited
// review — set server-side, here, at submit time (never trusted from client).
const SAFETY_GATE_KEYS = ["TCH-BEH-002", "PAR-BEH-002"];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  const { invitationId } = await params;
  const sessionId = await getRespondentInvitationId();
  if (!sessionId || sessionId !== invitationId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const inv = await loadInvitationById(invitationId);
  if (!inv) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const usable = invitationUsable(inv);
  if (!usable.ok) return NextResponse.json({ error: usable.reason }, { status: 409 });
  if (!inv.informant_id) {
    return NextResponse.json({ error: "no_informant" }, { status: 400 });
  }

  const bank = bankForInvitation(inv);
  const allDrafts = await loadDrafts(invitationId);
  // Only the currently-visible answers are part of the submission; prune drafts
  // left behind by branches the respondent later closed.
  const allowed = new Set(visibleKeys(bank, allDrafts));
  const responses = Object.fromEntries(
    Object.entries(allDrafts).filter(([k]) => allowed.has(k))
  );

  const v = validateSubmission(bank, responses);
  if (!v.ok) {
    return NextResponse.json(
      { error: "incomplete", missingRequired: v.missingRequired, unknownKeys: v.unknownKeys },
      { status: 422 }
    );
  }

  const svc = createServiceClient();
  const sourceId = randomUUID();
  const collectedOn = new Date().toISOString().slice(0, 10);

  // Engine validates again and freezes the canonical Source + raw payload.
  const locked = lockSubmission({
    bank,
    responses,
    caseId: inv.case_id,
    sourceId,
    informantId: inv.informant_id,
    collectedOn,
    payloadRef: sourceId,
  });

  const checksum = locked.source.checksum ?? ""; // engine always sets this

  const { error: srcErr } = await svc.from("sources").insert({
    id: sourceId,
    case_id: inv.case_id,
    informant_id: inv.informant_id,
    kind: "referral_form",
    collected_on: collectedOn,
    bank_id: inv.bank_id,
    bank_version: inv.bank_version,
    payload: locked.payload, // raw locked submission (D-007 Layer 1)
    locked: true,
    checksum,
  });
  if (srcErr) return NextResponse.json({ error: srcErr.message }, { status: 400 });

  const priority = SAFETY_GATE_KEYS.some((k) => responses[k] === "yes");
  if (priority) {
    await svc.from("cases").update({ priority_flag: true }).eq("id", inv.case_id);
  }

  await svc
    .from("invitations")
    .update({
      status: "completed",
      uses: inv.uses + 1,
      completed_at: new Date().toISOString(),
    })
    .eq("id", invitationId);

  await recordAudit({
    caseId: inv.case_id,
    actor: `respondent:${invitationId}`,
    eventType: "response_submitted",
    metadata: {
      invitationId,
      sourceId,
      checksumLength: checksum.length,
      priorityFlagged: priority,
    },
  });

  await clearRespondentCookie();
  return NextResponse.json({ ok: true, sourceId });
}
