import { NextResponse } from "next/server";
import { z } from "zod";
import {
  generateToken,
  hashToken,
  invitationUrl,
  qrDataUrl,
} from "@/lib/engine";
import { createClient } from "@/lib/supabase/server";
import { bankForRole, SUPPORTED_ROLES } from "@/lib/banks";
import { recordAudit } from "@/lib/audit";

const Body = z.object({
  role: z.enum(["teacher", "parent_guardian"]),
  expiresInDays: z.number().int().min(1).max(90).optional(),
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
  const { role } = parsed.data;
  if (!SUPPORTED_ROLES.includes(role)) {
    return NextResponse.json({ error: "unsupported_role" }, { status: 422 });
  }

  // Ownership check via RLS: the select only returns the case if it's the
  // caller's. 404 (not 403) so we don't reveal existence of others' cases.
  const { data: theCase } = await supabase
    .from("cases")
    .select("id")
    .eq("id", caseId)
    .maybeSingle();
  if (!theCase) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Pin the exact bank id + version at creation (D-013).
  const bank = bankForRole(role);

  // One informant per invitation so a submission can attach informant_id.
  const { data: informant, error: infErr } = await supabase
    .from("informants")
    .insert({ case_id: caseId, role })
    .select("id")
    .single();
  if (infErr || !informant) {
    return NextResponse.json({ error: infErr?.message ?? "informant_failed" }, { status: 400 });
  }

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const days = parsed.data.expiresInDays ?? 14;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  const { data: invite, error: invErr } = await supabase
    .from("invitations")
    .insert({
      case_id: caseId,
      informant_id: informant.id,
      respondent_role: role,
      bank_id: bank.bankId,
      bank_version: bank.version,
      token_hash: tokenHash, // only the hash is stored; raw token never persisted
      expires_at: expiresAt,
    })
    .select("id")
    .single();
  if (invErr || !invite) {
    return NextResponse.json({ error: invErr?.message ?? "invitation_failed" }, { status: 400 });
  }

  const base = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const url = invitationUrl(base, rawToken); // raw token in the URL, returned once
  const qr = await qrDataUrl(url);

  await recordAudit({
    caseId,
    actor: user.id,
    eventType: "invitation_created",
    metadata: { invitationId: invite.id, role, bankId: bank.bankId, bankVersion: bank.version },
  });

  return NextResponse.json({ url, qrDataUrl: qr, expiresAt }, { status: 201 });
}
