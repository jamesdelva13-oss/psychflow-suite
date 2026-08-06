import "server-only";

/**
 * Outbound email adapter. Vendor-swappable: speaks the Resend-compatible
 * HTTP shape via fetch (no SDK dependency); the provider is deployment
 * configuration, not code. Env:
 *
 *   EMAIL_API_KEY  — provider API key (absent ⇒ delivery reports
 *                    "email_not_configured"; link/QR flow is unaffected)
 *   EMAIL_FROM     — verified From address, e.g. "Intake <intake@domain>"
 *   EMAIL_API_URL  — optional override; defaults to Resend's endpoint
 *
 * LOGGING RULE: nothing in this module may log or return the recipient,
 * subject, body, or URL — the URL carries the raw invitation token, and
 * message content is delivery-only. Failures reduce to status codes.
 */

export type SendEmailResult = { ok: true } | { ok: false; reason: string };

export type OutboundEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

export function emailConfigured(): boolean {
  return Boolean(process.env.EMAIL_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(
  msg: OutboundEmail,
  fetchImpl: typeof fetch = fetch
): Promise<SendEmailResult> {
  const apiKey = process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return { ok: false, reason: "email_not_configured" };

  const endpoint = process.env.EMAIL_API_URL ?? "https://api.resend.com/emails";

  let res: Response;
  try {
    res = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [msg.to],
        subject: msg.subject,
        text: msg.text,
        html: msg.html,
        ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
      }),
    });
  } catch {
    // Deliberately drop the thrown error: its message can echo the request.
    return { ok: false, reason: "provider_unreachable" };
  }

  if (!res.ok) return { ok: false, reason: `provider_rejected_${res.status}` };
  return { ok: true };
}
