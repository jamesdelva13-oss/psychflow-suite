"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewCaptureForm({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"interview" | "observation" | "call" | "other">("interview");
  const [setting, setSetting] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/cases/${caseId}/capture`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, setting: setting.trim() || undefined }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Could not start the session. Try again.");
      return;
    }
    const { id } = await res.json();
    router.push(`/cases/${caseId}/capture/${id}`);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        + New capture session
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="text-slate-600">Type</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
            className="mt-1 block rounded-md border border-slate-300 px-2 py-1.5"
          >
            <option value="interview">Interview</option>
            <option value="observation">Observation</option>
            <option value="call">Call</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="block flex-1 text-sm">
          <span className="text-slate-600">Setting (optional)</span>
          <input
            value={setting}
            onChange={(e) => setSetting(e.target.value)}
            placeholder="e.g. phone call with parent, classroom"
            className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5"
          />
        </label>
        <button
          onClick={create}
          disabled={busy}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Starting…" : "Start"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600"
        >
          Cancel
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
