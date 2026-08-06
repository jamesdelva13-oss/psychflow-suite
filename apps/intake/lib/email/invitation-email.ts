// Invitation email content — pure and testable. DESIGN CONSTRAINT: this
// builder's signature accepts NO student or case fields, so student identity
// cannot appear in an email even by mistake. The respondent sees the D-120
// identity (first name + last initial) only after opening the secured form.
// No product name appears (D-127: naming unratified); the email speaks as
// the psychologist.

export type InvitationEmailInput = {
  /** Respondent role, e.g. "teacher" | "parent_guardian". */
  role: string;
  /** The one-time invitation URL (carries the raw token — never log it). */
  url: string;
  /** ISO timestamp the link expires. */
  expiresAt: string;
  /** The sending psychologist's display name. */
  psychologistName: string;
};

export type InvitationEmailContent = {
  subject: string;
  text: string;
  html: string;
};

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const roleNoun = (role: string) =>
  role === "parent_guardian" ? "parent/guardian" : role.replace(/_/g, " ");

export function buildInvitationEmail(
  input: InvitationEmailInput
): InvitationEmailContent {
  const { role, url, expiresAt, psychologistName } = input;
  const expiresDate = new Date(expiresAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const noun = roleNoun(role);

  const subject = `Secure ${noun} input form from ${psychologistName}`;

  const text = [
    `${psychologistName} has asked you to complete a secure ${noun} input form about a student you work with.`,
    ``,
    `Open your secure form:`,
    url,
    ``,
    `This link is unique to you, works once, and expires on ${expiresDate}. Please do not forward it. The student is identified only after you open the form.`,
    ``,
    `If you weren't expecting this, you can ignore this email or reply to reach ${psychologistName} directly.`,
  ].join("\n");

  const name = escapeHtml(psychologistName);
  const html = [
    `<div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b; line-height: 1.5;">`,
    `<p>${name} has asked you to complete a secure ${escapeHtml(noun)} input form about a student you work with.</p>`,
    `<p style="margin: 24px 0;"><a href="${escapeHtml(url)}" style="background: #1d4ed8; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block;">Open your secure form</a></p>`,
    `<p style="font-size: 13px; color: #475569;">This link is unique to you, works once, and expires on ${escapeHtml(expiresDate)}. Please do not forward it. The student is identified only after you open the form.</p>`,
    `<p style="font-size: 13px; color: #475569;">If you weren't expecting this, you can ignore this email or reply to reach ${name} directly.</p>`,
    `</div>`,
  ].join("\n");

  return { subject, text, html };
}

/**
 * Mask a recipient address for on-screen confirmation ("j***@school.org").
 * Display-only — the full address is never persisted or written to audit.
 */
export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "***";
  return `${email[0]}***@${email.slice(at + 1)}`;
}
