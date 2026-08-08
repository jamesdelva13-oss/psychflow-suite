import type { ReactNode } from "react";

/**
 * NeedsReview / VerificationFlag (DESIGN-SYSTEM.md §5.5) — the suite's
 * exception queue. Amber spine, one specific actionable line, evidence on
 * both sides, resolve action.
 *
 * States: open · resolved (collapses to a single-line ledger entry with who
 * and when) · dismissed-with-reason. Flags are specific and actionable —
 * never "check this section".
 */

export function NeedsReview({
  issue,
  detail,
  action,
}: {
  /** One line, specific: "WISC-V VCI transcribed as 112; protocol shows 121". */
  issue: string;
  /** Evidence for both sides — where it was read, what it says. */
  detail?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="needs-review spine spine--review">
      <p className="needs-review__issue">{issue}</p>
      {detail ? <div className="needs-review__detail">{detail}</div> : null}
      {action ? <div className="needs-review__actions">{action}</div> : null}
    </div>
  );
}

/** The resolved form: a quiet ledger line, attributed and timestamped. */
export function NeedsReviewResolved({
  issue,
  who,
  at,
}: {
  issue: string;
  who: string;
  at: string;
}) {
  return (
    <p className="needs-review__resolved">
      <span className="needs-review__resolved-mark" aria-hidden="true">
        ✓
      </span>{" "}
      {issue} · confirmed by {who}{" "}
      <time dateTime={at} title={at}>
        {at.slice(0, 10)}
      </time>
    </p>
  );
}
