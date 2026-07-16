import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ensurePsychologist } from "@/lib/psychologist";
import { recordAudit } from "@/lib/audit";

const Body = z.object({
  state: z.enum(["SC", "NC"]),
  evalType: z.enum(["initial", "reevaluation"]),
  referralDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  displayInitials: z.string().min(1).max(5),
  grade: z.string().min(1).max(20),
  ageYearsMonths: z.string().max(10).optional(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await ensurePsychologist(user);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }
  const b = parsed.data;

  // Insert under the authenticated (RLS) client — psychologist_id must equal
  // auth.uid() or the policy rejects it. student_ref stays pseudonymous.
  const { data, error } = await supabase
    .from("cases")
    .insert({
      psychologist_id: user.id,
      state: b.state,
      eval_type: b.evalType,
      referral_date: b.referralDate,
      display_initials: b.displayInitials,
      grade: b.grade,
      age_years_months: b.ageYearsMonths ?? null,
      student_ref: randomUUID(),
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "insert_failed" }, { status: 400 });
  }

  await recordAudit({
    caseId: data.id,
    actor: user.id,
    eventType: "case_created",
    metadata: { state: b.state, evalType: b.evalType },
  });

  return NextResponse.json({ id: data.id }, { status: 201 });
}
