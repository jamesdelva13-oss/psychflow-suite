"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireUser } from "@/lib/auth";
import { assertStructuralMetadata } from "@/lib/attribution";
import { resolveCaseContext } from "@/lib/case-context";
import { SCORE_VERIFIED } from "@/lib/verifications";

/**
 * Confirm one extracted score against the protocol (directive §5.1 item 11).
 *
 * The clinician confirms that the software READ the document correctly. They
 * are not endorsing an interpretation — that is a separate act, and the two
 * are deliberately not conflated. Confirming the last open score raises the
 * score set from NOT_ESTABLISHED to ACCEPTABLE, which is what lifts the
 * canonical interpretive ceiling off DESCRIBE_ONLY.
 *
 * Authorization: the case must be visible through the caller's own RLS
 * context, and the Source must belong to that case, before the service-role
 * write. RLS answers "is this yours" at the database; this action never
 * takes the caller's word for either id.
 */
export async function verifyScore(formData: FormData): Promise<void> {
  const caseId = String(formData.get("caseId") ?? "");
  const sourceId = String(formData.get("sourceId") ?? "");
  const scoreKey = String(formData.get("scoreKey") ?? "");
  if (!caseId || !sourceId || !scoreKey) throw new Error("verifyScore: missing field");

  const { user } = await requireUser();
  const rls = await createClient();

  // Visible to this caller? An invisible case resolves to null, exactly as
  // a cross-account probe would — the action learns nothing either way.
  const ctx = await resolveCaseContext(rls, caseId);
  if (!ctx) throw new Error("verifyScore: case not available");

  // The Source must belong to this case and be a score set on it.
  const target = ctx.currentSources.find(
    (s) => s.source.sourceId === sourceId && s.source.kind === "score_set"
  );
  if (!target) throw new Error("verifyScore: score set not on this case");

  const metadata = { sourceId, scoreKey };
  assertStructuralMetadata(metadata);

  const svc = createServiceClient();
  const { error } = await svc.from("audit_events").insert({
    case_id: caseId,
    actor: user.id,
    event_type: SCORE_VERIFIED,
    metadata,
  });
  if (error) throw error;

  revalidatePath(`/cases/${caseId}`, "layout");
}
