import type { ReactNode } from "react";
import { IconCheck } from "./icons";

/**
 * CaseStatus (§5.1) — the header of every case. States: on-track · due ≤ 7
 * days (amber date) · overdue (red date) · complete (green check, action
 * becomes "View report").
 *
 * Days-remaining is computed here from dueDate, never stored copy. When no
 * ratified timeline rule supplies a due date (no rulepack yet), callers omit
 * dueDate and the clock segment simply doesn't render — the component never
 * invents a deadline.
 */

export function CaseStatus({
  name,
  evalTypeLabel,
  dueDate,
  now,
  complete = false,
  progress,
  statusSentence,
  action,
}: {
  name: string;
  evalTypeLabel: string;
  /** ISO date; omit when no ratified timeline provides one. */
  dueDate?: string;
  /** Injected clock for deterministic rendering/tests; defaults to today. */
  now?: Date;
  complete?: boolean;
  /** 0..1; render only with a statusSentence explaining what's missing. */
  progress?: number;
  /** Omitted on surfaces whose body already communicates status (§8.2 —
   *  never duplicate status on one screen). */
  statusSentence?: string;
  action?: ReactNode;
}) {
  let clock: ReactNode = null;
  if (dueDate) {
    const today = now ?? new Date();
    const days = Math.ceil(
      (new Date(dueDate).getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
    );
    const cls = days < 0 ? "is-overdue" : days <= 7 ? "is-due-soon" : undefined;
    const text =
      days < 0
        ? `Due ${dueDate} · ${Math.abs(days)} days past due`
        : `Due ${dueDate} · ${days} days remaining`;
    clock = <span className={cls ? `eyebrow ${cls}` : "eyebrow"}>{text}</span>;
  }

  return (
    <header>
      <h1 className="case-status__name">
        {name}
        {complete ? (
          <span className="case-status__complete">
            {" "}
            <IconCheck size={22} title="Complete" />
          </span>
        ) : null}
      </h1>
      <div className="case-status__eyebrow">
        <span className="eyebrow">{evalTypeLabel}</span>
        {clock}
      </div>
      {/* §5.1 rule: never a progress meter without the sentence explaining it */}
      {typeof progress === "number" && statusSentence ? (
        <div className="case-status__progress">
          <div
            className="case-status__progress-fill"
            style={{ width: `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%` }}
          />
        </div>
      ) : null}
      {statusSentence ? <p className="case-status__sentence">{statusSentence}</p> : null}
      {action ? <div className="case-status__action">{action}</div> : null}
    </header>
  );
}
