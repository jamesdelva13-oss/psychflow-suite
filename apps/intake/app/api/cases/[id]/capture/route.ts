import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { recordAudit } from "@/lib/audit";

const Body = z.object({
  kind: z.enum(["interview", "observation", "call", "other"]),
  informantId: z.string().uuid().optional(),
  setting: z.string().max(200).optional(),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: caseId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", issues: parsed.error.flatten() }, { status: 422 });
  }
  const b = parsed.data;

  // Ownership via RLS: the select returns the case only if it's the caller's.
  const { data: theCase } = await supabase
    .from("cases")
    .select("id")
    .eq("id", caseId)
    .maybeSingle();
  if (!theCase) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data, error } = await supabase
    .from("capture_sessions")
    .insert({
      case_id: caseId,
      psychologist_id: user.id,
      informant_id: b.informantId ?? null,
      kind: b.kind,
      setting: b.setting ?? null,
      occurred_on: b.occurredOn ?? new Date().toISOString().slice(0, 10),
    })
    .select("id")
    .single();
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "insert_failed" }, { status: 400 });
  }

  await recordAudit({
    caseId,
    actor: user.id,
    eventType: "capture_session_created",
    metadata: { captureSessionId: data.id, kind: b.kind },
  });

  return NextResponse.json({ id: data.id }, { status: 201 });
}
