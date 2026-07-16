"use client";

import { useState } from "react";

type Result = { url: string; qrDataUrl: string; expiresAt: string };

export function InvitePanel({ caseId }: { caseId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  async function generate(role: "teacher" | "parent_guardian") {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/cases/${caseId}/invitations`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Could not generate invitation");
      return;
    }
    setResult(await res.json());
    setShowQr(false);
    setCopied(false);
  }

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => generate("teacher")}
          disabled={busy}
          className="rounded-md bg-brand-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Generating…" : "Generate teacher invitation"}
        </button>
        {result && (
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

      {result && (
        <div className="mt-3 space-y-2">
          <code className="block break-all rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-700">
            {result.url}
          </code>
          <p className="text-xs text-slate-500">
            Expires {new Date(result.expiresAt).toLocaleString()}. The link is
            shown once — the raw token is never stored.
          </p>
          {showQr && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={result.qrDataUrl}
              alt="Invitation QR code"
              className="h-48 w-48 rounded-md border border-slate-200"
            />
          )}
        </div>
      )}
    </div>
  );
}
