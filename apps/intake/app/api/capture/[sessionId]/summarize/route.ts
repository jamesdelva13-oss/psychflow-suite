import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordAudit } from "@/lib/audit";
import { pseudonymizeNotes, type CaptureSessionRow } from "@/lib/capture-core";
import { summarizeCaptureNotes, CaptureSummaryError } from "@/lib/llm/anthropic";

// Draft a summary PROPOSAL from the clinician's notes (D-125). The D-120
// identity fields are replaced with placeholders before the model call
// (data-posture §7); the result is stored as a proposal the clinician must
// review and confirm — it never enters a Source on its own.

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: session } = await supabase
    .from("capture_sessions")
    .select("id, case_id, kind, setting, occurred_on, notes, status")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (session.status === "finalized") {
    return NextResponse.json({ error: "already_finalized" }, { status: 409 });
  }
  if (!session.notes?.trim()) {
    return NextResponse.json({ error: "empty_notes" }, { status: 422 });
  }

  const { data: theCase } = await supabase
    .from("cases")
    .select("first_name, last_initial")
    .eq("id", session.case_id)
    .maybeSingle();

  const { text: pseudonymized } = pseudonymizeNotes(session.notes, {
    firstName: theCase?.first_name ?? null,
    lastInitial: theCase?.last_initial ?? null,
  });

  let proposal;
  try {
    proposal = await summarizeCaptureNotes({
      notes: pseudonymized,
      kind: session.kind as CaptureSessionRow["kind"],
      setting: session.setting,
      occurredOn: session.occurred_on,
    });
  } catch (err) {
    if (err instanceof CaptureSummaryError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 502 });
    }
    return NextResponse.json(
      { error: "provider_error", message: "Summarization failed. Your notes are unchanged — try again or write the summary manually." },
      { status: 502 }
    );
  }

  const { error } = await supabase
    .from("capture_sessions")
    .update({
      summary_proposal: { text: proposal.text, generation: proposal.generation },
      status: "proposal_ready",
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Audit carries structure only, never narrative content (audit.ts rule).
  await recordAudit({
    caseId: session.case_id,
    actor: user.id,
    eventType: "capture_summary_proposed",
    metadata: {
      captureSessionId: sessionId,
      model: proposal.generation.servedModel,
      promptVersion: proposal.generation.promptVersion,
    },
  });

  return NextResponse.json({
    proposal: { text: proposal.text, generation: proposal.generation },
  });
}
