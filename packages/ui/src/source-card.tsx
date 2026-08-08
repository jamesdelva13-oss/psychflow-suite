import type { ReactNode } from "react";
import { Skeleton } from "./primitives";

/**
 * SourceCard (§5.2) — one ingested artifact. All five states are
 * implemented: processing · ready · partially readable · unreadable ·
 * superseded. The extraction summary states what was FOUND, never what a
 * model "thinks"; failure notes name the remedy.
 *
 * The card intentionally carries no evidence spine: a Case Materials file
 * merely being Source-backed is not action-relevant provenance (§2). The
 * inspect affordance is a link so source inspection stays URL-driven and
 * server-rendered.
 */

export type SourceCardState = "processing" | "ready" | "partial" | "unreadable" | "superseded";

export function SourceCard({
  state,
  icon,
  title,
  meta,
  summary,
  note,
  inspectHref,
}: {
  state: SourceCardState;
  icon: ReactNode;
  title: string;
  /** Mono metadata line: pages · date · origin. */
  meta: string;
  /** What was found — e.g. "14 scores, 2 raters". */
  summary?: string;
  /** partial: what failed · unreadable: the fix · superseded: what replaced it. */
  note?: string;
  inspectHref?: string;
}) {
  if (state === "processing") {
    return (
      <article className="source-card" aria-busy="true">
        <div className="source-card__icon">{icon}</div>
        <div className="source-card__body">
          <div className="source-card__title">{title}</div>
          <div className="source-card__summary">Reading…</div>
          <Skeleton lines={2} />
        </div>
      </article>
    );
  }

  return (
    <article className={`source-card source-card--${state}`}>
      <div className="source-card__icon">{icon}</div>
      <div className="source-card__body">
        <div className="source-card__title">{title}</div>
        <div className="source-card__meta">{meta}</div>
        {summary ? <p className="source-card__summary">{summary}</p> : null}
        {note ? <p className="source-card__note">{note}</p> : null}
      </div>
      {inspectHref ? (
        <div className="source-card__action">
          <a className="btn btn--ghost btn--sm" href={inspectHref}>
            Details
          </a>
        </div>
      ) : null}
    </article>
  );
}
