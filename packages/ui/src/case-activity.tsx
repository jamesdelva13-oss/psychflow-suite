/**
 * CaseActivity (§5.7) — append-only case history. Machine entries carry a
 * small violet tick (the one place --ai-* appears outside an AIProposal,
 * ratified by the component spec). Not a social feed: no avatars, absolute
 * timestamps on hover.
 */

export interface ActivityEntry {
  /** ISO timestamp. */
  at: string;
  /** Display actor: a person's name or "Psych Suite". */
  actor: string;
  machine?: boolean;
  /** Verb phrase, e.g. "finalized the interview summary". */
  verb: string;
  object?: { label: string; href?: string };
}

function shortStamp(iso: string): string {
  const d = new Date(iso);
  const date = d.toISOString().slice(0, 10);
  const time = d.toISOString().slice(11, 16);
  return `${date} ${time}`;
}

export function CaseActivity({ entries }: { entries: ActivityEntry[] }) {
  return (
    <ol className="activity">
      {entries.map((e, i) => (
        <li key={i} className="activity__item">
          <time className="activity__time" dateTime={e.at} title={e.at}>
            {shortStamp(e.at)}
          </time>
          <div>
            <span className="activity__actor">
              {e.actor}
              {e.machine ? (
                <span className="activity__machine-tick" title="System entry">
                  {" "}
                  ✓
                </span>
              ) : null}
            </span>{" "}
            {e.verb}
            {e.object ? (
              <>
                {" "}
                {e.object.href ? (
                  <a href={e.object.href}>{e.object.label}</a>
                ) : (
                  <span className="activity__object">{e.object.label}</span>
                )}
              </>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
