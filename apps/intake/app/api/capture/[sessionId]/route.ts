import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Autosave: notes and context edits while the session is not finalized.
// A finalized session is immutable (its content lives in the locked Source).

const Body = z.object({
  notes: z.string().max(200_000).optional(),
  setting: z.string().max(200).nullable().optional(),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function PATCH(
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
  const b = parsed.data;

  const { data: session } = await supabase
    .from("capture_sessions")
    .select("id, status")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (session.status === "finalized") {
    return NextResponse.json({ error: "already_finalized" }, { status: 409 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (b.notes !== undefined) update.notes = b.notes;
  if (b.setting !== undefined) update.setting = b.setting;
  if (b.occurredOn !== undefined) update.occurred_on = b.occurredOn;

  const { error } = await supabase
    .from("capture_sessions")
    .update(update)
    .eq("id", sessionId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
