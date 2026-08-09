import type { ReactNode } from "react";

/**
 * AIProposal (DESIGN-SYSTEM.md §5.4, A-6) — Proposal variant.
 *
 * Every piece of machine-proposed content awaiting a human decision renders
 * inside this frame, and nothing human-written ever does. Dashed violet
 * spine · content · footer with the sources drawn on and the four actions:
 * Accept · Edit · Regenerate · Dismiss.
 *
 * The Revision variant (a previewed diff against already-approved text) is
 * VS-4 and is deliberately absent here — a component whose states cannot yet
 * be real does not ship.
 *
 * GATE NOTICES. A proposal can carry one notice from the session-fidelity
 * gate (D-140), and the two kinds are visually and verbally distinct because
 * they ask different things of the reader:
 *
 *   rejected  The draft asserts something the case does not document. The
 *             statement is named. This is about the text.
 *   unusable  The check could not run. The draft may be perfectly good and
 *             nobody has looked at it. This is about the check.
 *
 * A sustained adjudicator outage must never read to a clinician as the model
 * suddenly writing badly, which is why "unusable" says who failed.
 */

export type GateNotice =
  | { kind: "rejected"; statements: string[]; reason: string }
  | { kind: "unusable"; reason: string };

export function AIProposal({
  title,
  children,
  sources,
  notice,
  actions,
  state = "proposed",
}: {
  title?: string;
  /** The proposed prose. Document typography; nothing else in the column. */
  children: ReactNode;
  /** Footer: what this drew on (§5.6 "sources drawn on"). */
  sources?: ReactNode;
  /** At most one gate notice. Null in shadow mode — the gate is silent then. */
  notice?: GateNotice | null;
  actions?: ReactNode;
  state?: "generating" | "proposed";
}) {
  return (
    <article
      className={`ai-proposal spine spine--ai${notice ? " ai-proposal--noticed" : ""}`}
      aria-busy={state === "generating"}
    >
      <header className="ai-proposal__head">
        <span className="ai-proposal__mark">Proposed · not yet accepted</span>
        {title ? <h3 className="ai-proposal__title">{title}</h3> : null}
      </header>

      <div className="ai-proposal__body">{children}</div>

      {notice ? <GateNoticeBlock notice={notice} /> : null}

      {sources || actions ? (
        <footer className="ai-proposal__foot">
          {sources ? <div className="ai-proposal__sources">{sources}</div> : null}
          {actions ? <div className="ai-proposal__actions">{actions}</div> : null}
        </footer>
      ) : null}
    </article>
  );
}

/**
 * The two notices. Both are specific and actionable (§5.5 rules); neither
 * ever says "check this section."
 */
export function GateNoticeBlock({ notice }: { notice: GateNotice }) {
  if (notice.kind === "unusable") {
    return (
      <div className="gate-notice gate-notice--unusable" role="status">
        <p className="gate-notice__lead">
          The testing-session check could not run on this draft.
        </p>
        <p className="gate-notice__detail">{notice.reason}</p>
        <p className="gate-notice__detail">
          This is not a finding about the writing. Nothing has been checked, so
          read the section yourself before accepting it — or try again.
        </p>
      </div>
    );
  }

  const many = notice.statements.length > 1;
  return (
    <div className="gate-notice gate-notice--rejected" role="status">
      <p className="gate-notice__lead">
        {many
          ? "These statements describe the testing session, and the case does not document them:"
          : "This statement describes the testing session, and the case does not document it:"}
      </p>
      <ul className="gate-notice__statements">
        {notice.statements.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
      <p className="gate-notice__detail">{notice.reason}</p>
      <p className="gate-notice__detail">
        The draft was rewritten once and the {many ? "statements" : "statement"}{" "}
        remained. Edit or remove {many ? "them" : "it"} before accepting, or
        accept the section as it stands if you have a session record the case
        does not.
      </p>
    </div>
  );
}
