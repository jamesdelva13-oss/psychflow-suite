import "server-only";

// Per-case deletion (D-004 / data-posture §8): deleting a case removes its
// informants, invitations, draft responses, sources, capture sessions, and
// derived records. Hard deletion, FK-safe order, executed with the service
// role AFTER the route has verified ownership through the RLS client.
//
// Audit continuity: audit_events rows never contain narrative content (ids
// and counts only), so they are retained — the case's events are unlinked
// (case_id → null) to satisfy the FK, and a final `case_deleted` event
// records the deletion itself. The audit trail of WHAT HAPPENED survives;
// the student-adjacent records do not.

export interface SupabaseLike {
  from(table: string): any;
}

export interface DeleteResult {
  status: number;
  body: Record<string, unknown>;
  ok: boolean;
}

/** FK-safe order: leaves first, case last. */
export const DELETION_ORDER = [
  "draft_responses", // via invitation ids
  "claims",
  "evidence",
  "capture_sessions",
  "sources",
  "invitations",
  "informants",
] as const;

export async function deleteCase(deps: {
  svc: SupabaseLike;
  caseId: string;
  /** The authenticated psychologist — ownership MUST already be verified. */
  actorId: string;
  now?: Date;
}): Promise<DeleteResult> {
  const { svc, caseId, actorId } = deps;

  // draft_responses has no case_id — collect this case's invitation ids first.
  const { data: invRows, error: invErr } = await svc
    .from("invitations")
    .select("id")
    .eq("case_id", caseId);
  if (invErr) return { status: 500, body: { error: invErr.message }, ok: false };
  const invitationIds = ((invRows ?? []) as { id: string }[]).map((r) => r.id);

  if (invitationIds.length > 0) {
    const { error } = await svc
      .from("draft_responses")
      .delete()
      .in("invitation_id", invitationIds);
    if (error) return { status: 500, body: { error: error.message }, ok: false };
  }

  for (const table of DELETION_ORDER) {
    if (table === "draft_responses") continue; // handled above
    const { error } = await svc.from(table).delete().eq("case_id", caseId);
    if (error) return { status: 500, body: { error: error.message }, ok: false };
  }

  // Unlink the case's audit rows (FK), then record the deletion itself.
  {
    const { error } = await svc
      .from("audit_events")
      .update({ case_id: null })
      .eq("case_id", caseId);
    if (error) return { status: 500, body: { error: error.message }, ok: false };
  }
  {
    const { error } = await svc.from("audit_events").insert({
      case_id: null,
      actor: actorId,
      event_type: "case_deleted",
      metadata: { deletedCaseId: caseId, invitations: invitationIds.length },
    });
    if (error) return { status: 500, body: { error: error.message }, ok: false };
  }

  {
    const { error } = await svc.from("cases").delete().eq("id", caseId);
    if (error) return { status: 500, body: { error: error.message }, ok: false };
  }

  return { status: 200, body: { deleted: true }, ok: true };
}
