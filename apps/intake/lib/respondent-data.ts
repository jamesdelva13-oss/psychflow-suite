import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { bankForRole } from "@/lib/banks";
import type { TQuestionBank } from "@suite/case-model";
import type { ResponseMap } from "@/lib/engine";

export type InvitationRow = {
  id: string;
  case_id: string;
  informant_id: string | null;
  respondent_role: string;
  bank_id: string;
  bank_version: string;
  token_hash: string;
  expires_at: string;
  status: "pending" | "opened" | "completed" | "revoked";
  max_uses: number;
  uses: number;
  completed_at: string | null;
  deleted_at: string | null;
};

export async function loadInvitationById(id: string): Promise<InvitationRow | null> {
  const svc = createServiceClient();
  const { data } = await svc.from("invitations").select("*").eq("id", id).maybeSingle();
  return (data as InvitationRow) ?? null;
}

export async function loadInvitationByTokenHash(
  tokenHash: string
): Promise<InvitationRow | null> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("invitations")
    .select("*")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  return (data as InvitationRow) ?? null;
}

/** Cookie-based usability check (no raw token available post-exchange). */
export function invitationUsable(
  inv: InvitationRow,
  now = new Date()
): { ok: true } | { ok: false; reason: string } {
  if (inv.deleted_at) return { ok: false, reason: "deleted" };
  if (inv.status === "revoked") return { ok: false, reason: "revoked" };
  if (inv.status === "completed" || inv.uses >= inv.max_uses)
    return { ok: false, reason: "already_completed" };
  if (new Date(inv.expires_at).getTime() <= now.getTime())
    return { ok: false, reason: "expired" };
  return { ok: true };
}

/** The pinned bank for this invitation (D-013). */
export function bankForInvitation(inv: InvitationRow): TQuestionBank {
  const bank = bankForRole(inv.respondent_role);
  if (bank.version !== inv.bank_version) {
    throw new Error(
      `Bank version drift: invitation pinned ${inv.bank_id}@${inv.bank_version}, content has ${bank.version}`
    );
  }
  return bank;
}

export async function loadDrafts(invitationId: string): Promise<ResponseMap> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("draft_responses")
    .select("response_key, answer")
    .eq("invitation_id", invitationId);
  const map: ResponseMap = {};
  for (const r of data ?? []) map[r.response_key] = r.answer as string | string[];
  return map;
}
