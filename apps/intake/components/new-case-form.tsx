"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const today = () => new Date().toISOString().slice(0, 10);

export function NewCaseForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      state: fd.get("state"),
      evalType: fd.get("evalType"),
      referralDate: fd.get("referralDate"),
      displayInitials: fd.get("displayInitials"),
      grade: fd.get("grade"),
      ageYearsMonths: (fd.get("ageYearsMonths") as string) || undefined,
    };
    const res = await fetch("/api/cases", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Could not create case");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        New case
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Select label="State" name="state" options={["SC", "NC"]} />
        <Select label="Eval type" name="evalType" options={["initial", "reevaluation"]} />
        <Input label="Referral date" name="referralDate" type="date" defaultValue={today()} />
        <Input label="Initials" name="displayInitials" maxLength={5} placeholder="A.B." required />
        <Input label="Grade" name="grade" placeholder="3" required />
        <Input label="Age (opt.)" name="ageYearsMonths" placeholder="8-4" />
      </div>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create case"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-ink">{label}</span>
      <input
        {...props}
        className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent"
      />
    </label>
  );
}

function Select({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: string[];
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-ink">{label}</span>
      <select
        name={name}
        className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
