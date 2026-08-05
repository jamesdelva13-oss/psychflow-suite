import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { deleteCase } from "@/lib/delete-core";

// DELETE /api/cases/[id] — per-case deletion (D-004). Ownership is verified
// through the RLS client (the select only returns the caller's case); the
// deletion itself runs with the service role because child tables like
// draft_responses have no authenticated-role policies by design.

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: caseId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: theCase } = await supabase
    .from("cases")
    .select("id")
    .eq("id", caseId)
    .maybeSingle();
  if (!theCase) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const result = await deleteCase({
    svc: createServiceClient(),
    caseId,
    actorId: user.id,
  });
  return NextResponse.json(result.body, { status: result.status });
}
