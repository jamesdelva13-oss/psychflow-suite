"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireUser } from "@/lib/auth";
import { resolveCaseContext } from "@/lib/case-context";
import { listScoreVerifications } from "@/lib/verifications";
import { buildGenerationInputs } from "@/lib/source-policy";
import { planFor } from "@/lib/report-plan";
import { generateSection } from "@/lib/generate";
import {
  loadReportSections,
  persistGeneration,
  recordReview,
  saveClinicianEdit,
  setSectionStatus,
  type StoredSection,
} from "@/lib/report-sections";

/**
 * Writer actions.
 *
 * Authorization is the same shape the evaluations actions use: the case must
 * resolve through the caller's OWN RLS context before any service-role write.
 * An invisible case resolves to null, indistinguishable from absent, so a
 * cross-account probe learns nothing either way.
 *
 * Every action that changes what the clinician has decided writes a review
 * row. That is the audit trail districts ask about (§5.7), and it is written
 * by the action rather than left to a caller to remember.
 */

async function authorize(caseId: string) {
  const { user, supabase } = await requireUser();
  const rls = await createClient();
  const ctx = await resolveCaseContext(rls, caseId);
  if (!ctx) throw new Error("case not available");
  return { user, supabase, rls, ctx };
}

const latestFor = async (
  rls: Awaited<ReturnType<typeof createClient>>,
  caseId: string,
  sectionKey: string
): Promise<StoredSection | undefined> => {
  const loaded = await loadReportSections(rls, caseId);
  if (!loaded.available) return undefined;
  return loaded.sections.find((s) => s.sectionKey === sectionKey);
};

/**
 * Draft or regenerate one section.
 *
 * Regenerate ALWAYS starts from sources, never from the prior draft (§5.4):
 * this is a fresh `generateSection`, not a revision turn. The prior version
 * is superseded, not overwritten.
 */
export async function draftSection(formData: FormData): Promise<void> {
  const caseId = String(formData.get("caseId") ?? "");
  const sectionKey = String(formData.get("sectionKey") ?? "");
  const plan = planFor(sectionKey);
  if (!caseId || !plan) throw new Error("draftSection: unknown section");

  const { user, rls, ctx } = await authorize(caseId);
  const verifications = await listScoreVerifications(rls, caseId);
  const inputs = buildGenerationInputs(ctx, verifications);

  const result = await generateSection({ inputs, plan, verifications });
  if (result.status === "refused") {
    // A structural refusal is not a failure to record as content. It is
    // surfaced on the page from the plan's own empty reason.
    revalidatePath(`/cases/${caseId}/report`);
    return;
  }

  const prior = await latestFor(rls, caseId, sectionKey);
  const svc = createServiceClient();
  const written = await persistGeneration(svc, {
    caseId,
    section: result.section,
    actor: user.id,
    supersedesSectionId: prior?.id ?? null,
    nextVersion: (prior?.version ?? 0) + 1,
  });

  if (written.ok) {
    if (prior) {
      await recordReview(svc, {
        caseId,
        sectionId: prior.id,
        action: "regeneration_requested",
        actor: user.id,
      });
    }
    if (result.status === "needs_review") {
      await recordReview(svc, {
        caseId,
        sectionId: written.sectionId,
        action: "flagged_needs_review",
        actor: user.id,
        note: result.reason.slice(0, 160),
      });
    }
  }

  revalidatePath(`/cases/${caseId}/report`);
}

/**
 * Accept a proposal.
 *
 * Accepting a section the gate flagged is a DIFFERENT act from accepting a
 * clean one, and it is logged as one. The clinician may well have a session
 * record the case does not; what must never happen is that decision leaving
 * no trace.
 */
export async function acceptSection(formData: FormData): Promise<void> {
  const caseId = String(formData.get("caseId") ?? "");
  const sectionId = String(formData.get("sectionId") ?? "");
  const overGateFinding = String(formData.get("overGateFinding") ?? "") === "1";
  if (!caseId || !sectionId) throw new Error("acceptSection: missing field");

  const { user } = await authorize(caseId);
  const svc = createServiceClient();
  await setSectionStatus(svc, { sectionId, status: "accepted", actor: user.id });
  await recordReview(svc, {
    caseId,
    sectionId,
    action: overGateFinding ? "accepted_over_gate_finding" : "accepted",
    actor: user.id,
  });
  revalidatePath(`/cases/${caseId}/report`);
}

export async function dismissSection(formData: FormData): Promise<void> {
  const caseId = String(formData.get("caseId") ?? "");
  const sectionId = String(formData.get("sectionId") ?? "");
  if (!caseId || !sectionId) throw new Error("dismissSection: missing field");

  const { user } = await authorize(caseId);
  const svc = createServiceClient();
  await setSectionStatus(svc, { sectionId, status: "dismissed", actor: user.id });
  await recordReview(svc, { caseId, sectionId, action: "dismissed", actor: user.id });
  revalidatePath(`/cases/${caseId}/report`);
}

/**
 * Save a clinician edit as a NEW version with no generation link. The prior
 * generated version is frozen by the supersession trigger, so the adjudicated
 * text remains in history, distinct from the current text.
 */
export async function editSection(formData: FormData): Promise<void> {
  const caseId = String(formData.get("caseId") ?? "");
  const sectionKey = String(formData.get("sectionKey") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!caseId || !sectionKey || !content) throw new Error("editSection: missing field");

  const { user, rls } = await authorize(caseId);
  const prior = await latestFor(rls, caseId, sectionKey);
  if (!prior) throw new Error("editSection: nothing to edit");
  // Compare against the PROSE, not the whole composition — a rendered table
  // is not something the clinician just typed.
  if (content === prior.prose) {
    revalidatePath(`/cases/${caseId}/report`);
    return;
  }

  const svc = createServiceClient();
  const written = await saveClinicianEdit(svc, { caseId, prior, content, actor: user.id });
  if (written.ok) {
    await recordReview(svc, {
      caseId,
      sectionId: written.sectionId,
      action: "edited",
      actor: user.id,
    });
  }
  revalidatePath(`/cases/${caseId}/report`);
}
