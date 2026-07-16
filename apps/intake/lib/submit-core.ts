import "server-only";
import { randomUUID } from "node:crypto";
import type { TQuestionBank } from "@suite/case-model";
import { validateSubmission, lockSubmission, type ResponseMap } from "./engine";
import { visibleKeys } from "./form-view";
import { authorizeRespondent } from "./respondent-guard";
import { invitationUsable, type InvitationRow } from "./respondent-data";

// Answering "yes" to either safety-gate question flags the case for expedited
// review — decided here, server-side, never trusted from the client.
export const SAFETY_GATE_KEYS = ["TCH-BEH-002", "PAR-BEH-002"];

export function isSafetyGateTriggered(responses: ResponseMap): boolean {
  return SAFETY_GATE_KEYS.some((k) => responses[k] === "yes");
}

/** Minimal shape of the Supabase client the core needs — real or mocked. */
export interface SupabaseLike {
  from(table: string): any;
}

export interface SubmitResult {
  status: number;
  body: Record<string, unknown>;
  ok: boolean;
}

/**
 * The full submission-locking flow, injectable for unit testing. Cookie-gated
 * to one invitation; validates (422 with instance keys), locks the canonical
 * Source + checksum, flips the safety-gate flag, and completes the invitation.
 */
export async function submitResponse(deps: {
  svc: SupabaseLike;
  sessionInvitationId: string | null;
  inv: InvitationRow;
  bank: TQuestionBank;
  now?: Date;
}): Promise<SubmitResult> {
  const { svc, sessionInvitationId, inv, bank } = deps;
  const now = deps.now ?? new Date();

  if (!authorizeRespondent(sessionInvitationId, inv.id)) {
    return { status: 401, body: { error: "unauthorized" }, ok: false };
  }
  const usable = invitationUsable(inv, now);
  if (!usable.ok) return { status: 409, body: { error: usable.reason }, ok: false };
  if (!inv.informant_id) {
    return { status: 400, body: { error: "no_informant" }, ok: false };
  }

  const { data: draftRows } = await svc
    .from("draft_responses")
    .select("response_key, answer")
    .eq("invitation_id", inv.id);
  const allDrafts: ResponseMap = {};
  for (const r of (draftRows ?? []) as { response_key: string; answer: unknown }[]) {
    allDrafts[r.response_key] = r.answer as string | string[];
  }

  // Only currently-visible answers are part of the submission.
  const allowed = new Set(visibleKeys(bank, allDrafts));
  const responses: ResponseMap = Object.fromEntries(
    Object.entries(allDrafts).filter(([k]) => allowed.has(k))
  );

  const v = validateSubmission(bank, responses);
  if (!v.ok) {
    return {
      status: 422,
      body: { error: "incomplete", missingRequired: v.missingRequired, unknownKeys: v.unknownKeys },
      ok: false,
    };
  }

  const sourceId = randomUUID();
  const collectedOn = now.toISOString().slice(0, 10);
  const locked = lockSubmission({
    bank,
    responses,
    caseId: inv.case_id,
    sourceId,
    informantId: inv.informant_id,
    collectedOn,
    payloadRef: sourceId,
  });
  const checksum = locked.source.checksum ?? "";

  const { error: srcErr } = await svc.from("sources").insert({
    id: sourceId,
    case_id: inv.case_id,
    informant_id: inv.informant_id,
    kind: "referral_form",
    collected_on: collectedOn,
    bank_id: inv.bank_id,
    bank_version: inv.bank_version,
    payload: locked.payload,
    locked: true,
    checksum,
  });
  if (srcErr) return { status: 400, body: { error: srcErr.message }, ok: false };

  const priority = isSafetyGateTriggered(responses);
  if (priority) {
    await svc.from("cases").update({ priority_flag: true }).eq("id", inv.case_id);
  }

  await svc
    .from("invitations")
    .update({ status: "completed", uses: inv.uses + 1, completed_at: now.toISOString() })
    .eq("id", inv.id);

  await svc.from("audit_events").insert({
    case_id: inv.case_id,
    actor: `respondent:${inv.id}`,
    event_type: "response_submitted",
    metadata: { invitationId: inv.id, sourceId, checksumLength: checksum.length, priorityFlagged: priority },
  });

  return { status: 200, body: { ok: true, sourceId, priorityFlagged: priority }, ok: true };
}
