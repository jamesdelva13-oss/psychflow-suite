"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Danger zone: per-case deletion (D-004). Deliberately friction-heavy —
// the clinician must type the student's display initials to arm the button.
// Deletion is immediate and irreversible (only the content-free audit trail
// survives), so the UI says exactly that.

export function DeleteCase({
  caseId,
  displayInitials,
}: {
  caseId: string;
  displayInitials: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const armed = typed.trim().toUpperCase() === displayInitials.toUpperCase();

  async function doDelete() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/cases/${caseId}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      setError("Deletion failed. Nothing was removed — try again.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-red-700 hover:underline"
      >
        Delete this case…
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
      <p className="text-sm text-red-900">
        This permanently removes the case and every record inside it —
        responses, sources, capture sessions, and invitations. It cannot be
        undone. Only the content-free audit trail is retained.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={`Type ${displayInitials} to confirm`}
          className="rounded-md border border-red-300 px-3 py-1.5 text-sm"
        />
        <button
          onClick={doDelete}
          disabled={!armed || busy}
          className="rounded-md bg-red-700 px-3.5 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          {busy ? "Deleting…" : "Delete permanently"}
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setTyped("");
          }}
          className="text-sm text-slate-600 hover:underline"
        >
          Cancel
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
