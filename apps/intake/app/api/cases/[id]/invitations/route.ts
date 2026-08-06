import { NextResponse } from "next/server";
import { generateToken, invitationUrl, qrDataUrl } from "@/lib/engine";
import { createInvitation } from "@/lib/invitation-create-core";
import { createClient } from "@/lib/supabase/server";
import { bankForRole, SUPPORTED_ROLES } from "@/lib/banks";
import { sendEmail } from "@/lib/email/sender";
import { recordAudit } from "@/lib/audit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: caseId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await createInvitation({
    db: supabase,
    userId: user?.id ?? null,
    caseId,
    rawBody: await req.json().catch(() => null),
    bankForRole,
    supportedRoles: SUPPORTED_ROLES,
    generateToken,
    invitationUrl,
    qrDataUrl,
    sendEmail,
    recordAudit,
    baseUrl: process.env.APP_BASE_URL ?? "http://localhost:3000",
  });

  return NextResponse.json(result.body, { status: result.status });
}
