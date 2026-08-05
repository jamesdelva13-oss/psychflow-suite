"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Capture editor (D-125). Layout keeps the model's draft summary BESIDE the
// raw notes (D-081 verification pattern): the clinician always confirms the
// summary against the notes before it can enter the case record.

interface Proposal {
  text: string;
  generation: { servedModel: string; promptVersion: string; createdAt: string };
}

export interface CaptureEditorProps {
  sessionId: string;
  caseId: string;
  kind: string;
  setting: string | null;
  occurredOn: string;
  initialNotes: string;
  initialStatus: string;
  initialProposal: Proposal | null;
  initialSummaryFinal: string | null;
}

export function CaptureEditor(props: CaptureEditorProps) {
  const router = useRouter();
  const finalized = props.initialStatus === "finalized";

  const [notes, setNotes] = useState(props.initialNotes);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "dirty" | "error">("saved");
  const [proposal, setProposal] = useState<Proposal | null>(props.initialProposal);
  const [summaryFinal, setSummaryFinal] = useState(props.initialSummaryFinal ?? "");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState<"summarize" | "finalize" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    async (value: string) => {
      setSaveState("saving");
      const res = await fetch(`/api/capture/${props.sessionId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ notes: value }),
      });
      setSaveState(res.ok ? "saved" : "error");
    },
    [props.sessionId]
  );

  // Debounced autosave, 800ms after the last keystroke.
  useEffect(() => {
    if (finalized || notes === props.initialNotes) return;
    setSaveState("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(notes), 800);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [notes, finalized, props.initialNotes, save]);

  async function summarize() {
    setBusy("summarize");
    setError(null);
    if (saveState !== "saved") await save(notes);
    const res = await fetch(`/api/capture/${props.sessionId}/summarize`, { method: "POST" });
    setBusy(null);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "Summarization failed. Your notes are unchanged.");
      return;
    }
    const body = await res.json();
    setProposal(body.proposal);
    setConfirmed(false);
  }

  async function finalize() {
    setBusy("finalize");
    setError(null);
    if (saveState !== "saved") await save(notes);
    const res = await fetch(`/api/capture/${props.sessionId}/finalize`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        summaryFinal: summaryFinal.trim() || null,
        confirmed,
      }),
    });
    setBusy(null);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(
        body?.error === "confirmation_required"
          ? "Check the confirmation box before finalizing."
          : "Could not finalize. Try again."
      );
      return;
    }
    router.refresh();
  }

  if (finalized) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          This session is finalized and locked into the case record. Notes and
          summary can no longer be edited here.
        </div>
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-600">Notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{props.initialNotes}</p>
        </section>
        {props.initialSummaryFinal && (
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-600">Confirmed summary</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink">
              {props.initialSummaryFinal}
            </p>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-600">Your notes</h2>
            <span className="text-xs text-slate-400">
              {saveState === "saved" && "Saved"}
              {saveState === "saving" && "Saving…"}
              {saveState === "dirty" && "Unsaved changes"}
              {saveState === "error" && <span className="text-red-500">Save failed</span>}
            </span>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={16}
            placeholder="Type quick notes as you go…"
            className="mt-2 w-full rounded-md border border-slate-300 p-3 text-sm leading-relaxed"
          />
          <button
            onClick={summarize}
            disabled={busy !== null || !notes.trim()}
            className="mt-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {busy === "summarize" ? "Drafting…" : proposal ? "Redraft summary" : "Draft summary"}
          </button>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-600">Summary</h2>
          {proposal ? (
            <>
              <p className="mt-1 text-xs text-slate-400">
                Draft prepared from your notes — a proposal, not part of the
                record until you confirm it below.
              </p>
              <div className="mt-2 rounded-md border border-indigo-100 bg-indigo-50/50 p-3 text-sm text-ink">
                <p className="whitespace-pre-wrap">{proposal.text}</p>
              </div>
              <button
                onClick={() => setSummaryFinal(proposal.text)}
                className="mt-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Use this draft
              </button>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-400">
              No draft yet. You can draft one from your notes, or write your own
              below. A summary is optional — notes-only sessions can be
              finalized too.
            </p>
          )}
          <label className="mt-3 block text-sm">
            <span className="text-slate-600">Final summary (yours to edit)</span>
            <textarea
              value={summaryFinal}
              onChange={(e) => setSummaryFinal(e.target.value)}
              rows={8}
              className="mt-1 w-full rounded-md border border-slate-300 p-3 text-sm leading-relaxed"
            />
          </label>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            I reviewed these notes{summaryFinal.trim() ? " and this summary against them" : ""},
            and they are accurate. Finalizing locks this session into the case
            record.
          </span>
        </label>
        <button
          onClick={finalize}
          disabled={busy !== null || !confirmed}
          className="mt-3 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {busy === "finalize" ? "Finalizing…" : "Finalize session"}
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </section>
    </div>
  );
}
