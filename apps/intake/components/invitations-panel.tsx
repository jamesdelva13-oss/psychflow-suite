"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type InvitationSummary = {
  id: string;
  respondent_role: string;
  status: "pending" | "opened" | "completed" | "revoked";
  expires_at: string;
  uses: number;
  max_uses: number;
};

type EmailDelivery =
  | { attempted: false }
  | { attempted: true; sent: true; maskedRecipient: string }
  | { attempted: true; sent: false; reason: string };

type NewLink = {
  url: string;
  qrDataUrl: string;
  expiresAt: string;
  emailDelivery?: EmailDelivery;
};

const DELIVERY_FAILURE_HINT: Record<string, string> = {
  email_not_configured:
    "Email sending isn't set up on this deployment yet — share the link below instead.",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-slate-100 text-slate-600",
  opened: "bg-sky-100 text-sky-700",
  completed: "bg-emerald-100 text-emerald-700",
  revoked: "bg-amber-100 text-amber-700",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Not started",
  opened: "Opened",
  completed: "Completed",
  revoked: "Revoked",
};

export function InvitationsPanel({
  caseId,
  invitations,
}: {
  caseId: string;
  invitations: InvitationSummary[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fresh, setFresh] = useState<NewLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");

  async function generate() {
    setBusy(true);
    setError(null);
    const email = recipientEmail.trim();
    const res = await fetch(`/api/cases/${caseId}/invitations`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        role: "teacher",
        ...(email ? { recipientEmail: email } : {}),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({})))?.error ?? "Could not generate");
      return;
    }
    setFresh(await res.json());
    setRecipientEmail(""); // used once for delivery; never kept around
    setShowQr(false);
    setCopied(false);
    router.refresh();
  }

  async function revoke(id: string) {
    setBusy(true);
    await fetch(`/api/invitations/${id}/revoke`, { method: "POST" });
    setBusy(false);
    router.refresh();
  }

  async function copy() {
    if (!fresh) return;
    await navigator.clipboard.writeText(fresh.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      {invitations.length > 0 && (
        <ul className="mb-3 space-y-1.5">
          {invitations.map((inv) => (
            <li
              key={inv.id}
              className="flex items-center justify-between text-sm"
            >
              <span className="flex items-center gap-2">
                <span className="capitalize text-slate-600">
                  {inv.respondent_role.replace("_", " ")}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[inv.status]}`}
                >
                  {STATUS_LABEL[inv.status]}
                </span>
                <span className="text-xs text-slate-400">
                  expires {new Date(inv.expires_at).toLocaleDateString()}
                </span>
              </span>
              {(inv.status === "pending" || inv.status === "opened") && (
                <button
                  onClick={() => revoke(inv.id)}
                  disabled={busy}
                  className="text-xs text-amber-700 hover:underline disabled:opacity-50"
                >
                  Revoke
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`invite-email-${caseId}`} className="sr-only">
          Teacher email for delivery (optional)
        </label>
        <input
          id={`invite-email-${caseId}`}
          type="email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          placeholder="Teacher's email (optional)"
          autoComplete="off"
          className="w-56 rounded-md border border-slate-300 px-3 py-1.5 text-sm placeholder:text-slate-400"
        />
        <button
          onClick={generate}
          disabled={busy}
          className="rounded-md bg-brand-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {busy
            ? "Working…"
            : recipientEmail.trim()
              ? "Send email invitation"
              : invitations.some((i) => i.status !== "revoked")
                ? "Regenerate teacher link"
                : "Generate teacher invitation"}
        </button>
        {fresh && (
          <>
            <button
              onClick={copy}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              {copied ? "Copied ✓" : "Copy link"}
            </button>
            <button
              onClick={() => setShowQr((v) => !v)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              {showQr ? "Hide QR" : "Show QR"}
            </button>
          </>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

      {fresh && (
        <div className="mt-3 space-y-2">
          {fresh.emailDelivery?.attempted && fresh.emailDelivery.sent && (
            <p
              role="status"
              className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
            >
              Invitation emailed to {fresh.emailDelivery.maskedRecipient}. The
              link below is the same one — keep it as a backup if needed.
            </p>
          )}
          {fresh.emailDelivery?.attempted && !fresh.emailDelivery.sent && (
            <p
              role="status"
              className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800"
            >
              The invitation was created, but the email could not be sent.{" "}
              {DELIVERY_FAILURE_HINT[fresh.emailDelivery.reason] ??
                "Copy the link below and share it directly."}
            </p>
          )}
          <code className="block break-all rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-700">
            {fresh.url}
          </code>
          <p className="text-xs text-slate-500">
            Shown once — the raw token is never stored. Expires{" "}
            {new Date(fresh.expiresAt).toLocaleString()}.
          </p>
          {showQr && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={fresh.qrDataUrl}
              alt="Invitation QR code"
              className="h-48 w-48 rounded-md border border-slate-200"
            />
          )}
        </div>
      )}
    </div>
  );
}
