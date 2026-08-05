import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { recordAudit } from "@/lib/audit";
import { finalizeCapture, type CaptureSessionRow } from "@/lib/capture-core";

const Body = z.object({
  summaryFinal: z.string().max(20_000).nullable().optional(),
  confirmed: z.boolean(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", issues: parsed.error.flatten() }, { status: 422 });
  }

  const { data: session } = await supabase
    .from("capture_sessions")
    .select(
      "id, case_id, psychologist_id, informant_id, kind, setting, occurred_on, notes, status, summary_proposal, summary_final, source_id"
    )
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const result = await finalizeCapture({
    svc: supabase,
    session: session as CaptureSessionRow,
    body: parsed.data,
  });

  if (result.ok) {
    await recordAudit({
      caseId: session.case_id,
      actor: user.id,
      eventType: "capture_finalized",
      metadata: {
        captureSessionId: sessionId,
        sourceId: result.sourceId,
        hasSummary: Boolean(parsed.data.summaryFinal?.trim()),
      },
    });
  }

  return NextResponse.json(result.body, { status: result.status });
}
