"use client";

import { useRef, useState } from "react";
import type {
  FormView,
  FormResponseMap,
  FormAnswer,
  FormField,
} from "@/lib/form-types";

export function FormRunner({
  invitationId,
  title,
  intro,
  estimatedMinutes,
  initialView,
  initialAnswers,
}: {
  invitationId: string;
  title: string;
  intro: string;
  estimatedMinutes: string;
  initialView: FormView;
  initialAnswers: FormResponseMap;
}) {
  const [answers, setAnswers] = useState<FormResponseMap>(initialAnswers);
  const [view, setView] = useState<FormView>(initialView);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);

  const dirty = useRef<Record<string, FormAnswer>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function flush(): Promise<void> {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const keys = Object.keys(dirty.current);
    if (keys.length === 0) return;
    const updates = keys.map((k) => ({ key: k, answer: dirty.current[k] }));
    dirty.current = {};
    setSaving(true);
    try {
      const res = await fetch(`/api/respond/${invitationId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      if (res.ok) {
        const j = (await res.json()) as { view: FormView };
        setView(j.view); // authoritative branching from the engine (server)
      }
    } finally {
      setSaving(false);
    }
  }

  function onAnswer(key: string, value: FormAnswer) {
    setAnswers((a) => ({ ...a, [key]: value }));
    dirty.current[key] = value;
    if (missing.length) setMissing((m) => m.filter((k) => k !== key));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 800);
  }

  async function onSubmit() {
    setSubmitting(true);
    setMissing([]);
    await flush();
    try {
      const res = await fetch(`/api/respond/${invitationId}/submit`, {
        method: "POST",
      });
      if (res.status === 422) {
        const j = (await res.json()) as { missingRequired?: string[] };
        setMissing(j.missingRequired ?? []);
        // scroll to the first missing field
        const first = (j.missingRequired ?? [])[0];
        if (first) {
          document
            .getElementById(`f-${first}`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }
      if (res.ok) setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-brand">Thank you</h1>
          <p className="mt-3 text-slate-600">
            Your responses have been submitted to the school psychologist. You
            can close this page.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <header className="rounded-xl bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-accent">
          Referral Intelligence Engine
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-brand">{title}</h1>
        <p className="mt-1 text-xs text-slate-500">
          About {estimatedMinutes} · saved automatically as you go
        </p>
        <p className="mt-3 text-sm text-slate-600">{intro}</p>
      </header>

      <div className="mt-4 space-y-4">
        {view.groups.map((g) => (
          <section key={g.moduleId} className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-brand">{g.displayLabel}</h2>
            {g.intro && <p className="mt-1 text-sm text-slate-500">{g.intro}</p>}
            <div className="mt-4 space-y-6">
              {g.fields.map((f) => (
                <Field
                  key={f.key}
                  field={f}
                  value={answers[f.key]}
                  missing={missing.includes(f.key)}
                  onChange={(v) => onAnswer(f.key, v)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {view.pendingFollowUps.length > 0 && (
        <section className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-sm font-semibold text-amber-800">
            A few more details would help
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
            {view.pendingFollowUps.map((p) => (
              <li key={p.followUpId}>{p.prompt}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-700">
            These are optional — you can still submit.
          </p>
        </section>
      )}

      <div className="sticky bottom-0 mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
        <span className="text-xs text-slate-500">
          {saving ? "Saving…" : "All changes saved"}
        </span>
        <div className="flex items-center gap-3">
          {missing.length > 0 && (
            <span className="text-sm text-red-700">
              {missing.length} required item{missing.length > 1 ? "s" : ""} left
            </span>
          )}
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="rounded-md bg-brand px-5 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>
    </main>
  );
}

function Field({
  field,
  value,
  missing,
  onChange,
}: {
  field: FormField;
  value: FormAnswer | undefined;
  missing: boolean;
  onChange: (v: FormAnswer) => void;
}) {
  const arr = Array.isArray(value) ? value : [];
  const str = typeof value === "string" ? value : "";

  return (
    <div
      id={`f-${field.key}`}
      className={missing ? "rounded-lg border border-red-300 bg-red-50 p-3" : ""}
    >
      <div className="flex items-baseline gap-2">
        {field.groupLabel && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {field.groupLabel}
          </span>
        )}
        <label className="font-medium text-ink">
          {field.prompt}
          {field.required && <span className="text-red-600"> *</span>}
        </label>
      </div>
      {field.helpText && (
        <p className="mt-1 text-sm text-slate-500">{field.helpText}</p>
      )}

      <div className="mt-2">
        {field.responseType === "open_text" && (
          <textarea
            value={str}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent"
          />
        )}

        {(field.responseType === "single_select" ||
          field.responseType === "likert") &&
          field.options?.map((o) => (
            <label key={o.value} className="flex items-start gap-2 py-1 text-sm">
              <input
                type="radio"
                name={field.key}
                checked={str === o.value}
                onChange={() => onChange(o.value)}
                className="mt-1"
              />
              <span>{o.label}</span>
            </label>
          ))}

        {field.responseType === "yes_no" &&
          ["yes", "no"].map((v) => (
            <label key={v} className="mr-4 inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={field.key}
                checked={str === v}
                onChange={() => onChange(v)}
              />
              <span className="capitalize">{v}</span>
            </label>
          ))}

        {field.responseType === "multi_select" &&
          field.options?.map((o) => {
            const checked = arr.includes(o.value);
            return (
              <label key={o.value} className="flex items-start gap-2 py-1 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChange(
                      checked
                        ? arr.filter((x) => x !== o.value)
                        : [...arr, o.value]
                    )
                  }
                  className="mt-1"
                />
                <span>{o.label}</span>
              </label>
            );
          })}
      </div>
    </div>
  );
}
