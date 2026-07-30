"use client";

import { useMemo, useRef, useState } from "react";
import type {
  FormView,
  FormResponseMap,
  FormAnswer,
  FormField,
  FormGroup,
} from "@/lib/form-types";

export function FormRunner({
  invitationId,
  title,
  intro,
  estimatedMinutes,
  studentLabel,
  initialView,
  initialAnswers,
}: {
  invitationId: string;
  title: string;
  intro: string;
  estimatedMinutes: string;
  studentLabel?: string;
  initialView: FormView;
  initialAnswers: FormResponseMap;
}) {
  const [answers, setAnswers] = useState<FormResponseMap>(initialAnswers);
  const [view, setView] = useState<FormView>(initialView);
  const [stepIdx, setStepIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);

  const dirty = useRef<Record<string, FormAnswer>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stepped = !!view.steps?.length;
  const steps = view.steps ?? [];
  const lastStep = stepIdx >= steps.length - 1;

  // key -> step index, for jumping to the step holding a missing required item
  const stepOfKey = useMemo(() => {
    const m = new Map<string, number>();
    steps.forEach((s, i) =>
      s.groups.forEach((g) => g.fields.forEach((f) => m.set(f.key, i)))
    );
    return m;
  }, [steps]);

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

  /** Domain-level "not observed": mark every unanswered escape-bearing field. */
  function markGroupNotObserved(group: FormGroup) {
    const targets = group.fields.filter(
      (f) => f.observationEscapeValue && !isAnswered(answers[f.key])
    );
    if (targets.length === 0) return;
    const ok = window.confirm(
      "Mark the remaining unanswered ratings in this section as “Not enough opportunity to observe”? Answers you already gave are kept."
    );
    if (!ok) return;
    for (const f of targets) onAnswer(f.key, f.observationEscapeValue!);
  }

  function scrollToField(key: string) {
    document
      .getElementById(`f-${key}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
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
        const miss = j.missingRequired ?? [];
        setMissing(miss);
        const first = miss[0];
        if (first) {
          const target = stepOfKey.get(first);
          if (stepped && target !== undefined && target !== stepIdx) {
            setStepIdx(target);
            setTimeout(() => scrollToField(first), 60);
          } else {
            scrollToField(first);
          }
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

  const currentGroups: FormGroup[] = stepped ? steps[stepIdx].groups : view.groups;
  const showFollowUpsHere = !stepped || steps[stepIdx].step >= 3;

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <header className="rounded-xl bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-accent">
          Referral Intelligence Engine
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-brand">{title}</h1>
        <p className="mt-1 text-xs text-slate-500">
          {studentLabel && <>About <strong>{studentLabel}</strong> · </>}
          about {estimatedMinutes} minutes · saved automatically as you go
        </p>
        {(!stepped || stepIdx === 0) && (
          <p className="mt-3 text-sm text-slate-600">{intro}</p>
        )}
        {stepped && (
          <nav aria-label="Form steps" className="mt-4">
            <ol className="flex flex-wrap items-center gap-2">
              {steps.map((s, i) => (
                <li key={s.step} className="flex items-center gap-2">
                  <span
                    aria-current={i === stepIdx ? "step" : undefined}
                    className={
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold " +
                      (i === stepIdx
                        ? "bg-brand text-white"
                        : i < stepIdx
                          ? "bg-brand-accent/20 text-brand"
                          : "bg-slate-200 text-slate-500")
                    }
                  >
                    {s.step}
                  </span>
                  <span
                    className={
                      "text-xs " +
                      (i === stepIdx ? "font-semibold text-brand" : "text-slate-500")
                    }
                  >
                    {s.title}
                  </span>
                  {i < steps.length - 1 && (
                    <span aria-hidden className="text-slate-300">
                      ·
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
      </header>

      <div className="mt-4 space-y-4">
        {currentGroups.length === 0 && showFollowUpsHere && view.pendingFollowUps.length === 0 && (
          <section className="rounded-xl bg-white p-6 text-sm text-slate-600 shadow-sm">
            Nothing needed here based on your earlier answers — continue to the
            next step.
          </section>
        )}
        {currentGroups.map((g) => (
          <section key={g.moduleId} className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-brand">{g.displayLabel}</h2>
                {g.intro && <p className="mt-1 text-sm text-slate-500">{g.intro}</p>}
              </div>
              {g.fields.some((f) => f.observationEscapeValue) && (
                <button
                  type="button"
                  onClick={() => markGroupNotObserved(g)}
                  className="shrink-0 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                >
                  I haven’t been able to observe this area
                </button>
              )}
            </div>
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

      {showFollowUpsHere && view.pendingFollowUps.length > 0 && (
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
          {stepped && stepIdx > 0 && (
            <button
              type="button"
              onClick={() => {
                setStepIdx((i) => Math.max(0, i - 1));
                window.scrollTo({ top: 0 });
              }}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
            >
              Back
            </button>
          )}
          {stepped && !lastStep ? (
            <button
              type="button"
              onClick={async () => {
                await flush();
                setStepIdx((i) => Math.min(steps.length - 1, i + 1));
                window.scrollTo({ top: 0 });
              }}
              className="rounded-md bg-brand px-5 py-2 font-medium text-white hover:opacity-90"
            >
              Next
            </button>
          ) : (
            <button
              onClick={onSubmit}
              disabled={submitting}
              className="rounded-md bg-brand px-5 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function isAnswered(a: FormAnswer | undefined): boolean {
  return Array.isArray(a) ? a.length > 0 : typeof a === "string" && a.trim().length > 0;
}

const RADIO_TYPES = new Set([
  "single_select",
  "likert",
  "comparison_scale",
  "frequency_scale",
  "support_scale",
]);

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
  const escVal = field.observationEscapeValue;

  // The observation escape renders last, set apart — always visible (never in
  // help text), styled as a distinct state rather than another scale point.
  const mainOptions = field.options?.filter((o) => o.value !== escVal) ?? [];
  const escOption = field.options?.find((o) => o.value === escVal);

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

        {RADIO_TYPES.has(field.responseType) && (
          <>
            {mainOptions.map((o) => (
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
            {escOption && (
              <label className="mt-1 flex items-start gap-2 border-t border-dashed border-slate-200 py-1.5 text-sm text-slate-600">
                <input
                  type="radio"
                  name={field.key}
                  checked={str === escOption.value}
                  onChange={() => onChange(escOption.value)}
                  className="mt-1"
                />
                <span>
                  {escOption.label}
                  <span className="block text-xs text-slate-400">
                    Choosing this is useful information — it is never read as
                    “no concern.”
                  </span>
                </span>
              </label>
            )}
          </>
        )}

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
