import type { ReactNode } from "react";

/**
 * DraftSection (DESIGN-SYSTEM.md §5.6) — one section of the report inside
 * the editor.
 *
 * Anatomy: title row (title · spine-status rollup dot · word count) · serif
 * document body at --editor-col · footer (sources drawn on).
 *
 * THE EDITOR COLUMN CONTAINS ONLY THE DOCUMENT. Chips, notices, and actions
 * live in the frame around it, never inside the prose, so what the clinician
 * reads is what the export carries (§8 item 7).
 */

export type DraftStatus =
  /** No text yet. An empty section is an action, not a void. */
  | "empty"
  | "drafting"
  /** Machine-written, nobody has accepted it. */
  | "unreviewed"
  /** Accepted by the clinician. */
  | "reviewed"
  /** Surfaced with a gate finding outstanding. */
  | "flagged";

const DOT_LABEL: Record<DraftStatus, string> = {
  empty: "Not started",
  drafting: "Drafting",
  unreviewed: "Proposed, not accepted",
  reviewed: "Accepted",
  flagged: "Needs your review",
};

export const wordCount = (text: string): number =>
  text.trim() ? text.trim().split(/\s+/).length : 0;

export function DraftSection({
  title,
  status,
  text,
  children,
  sources,
  emptyAction,
}: {
  title: string;
  status: DraftStatus;
  /** The document text. Rendered as paragraphs; word count derives from it. */
  text?: string;
  /** Frame content — the AIProposal, an empty invitation, a gate notice. */
  children?: ReactNode;
  sources?: ReactNode;
  emptyAction?: ReactNode;
}) {
  const words = text ? wordCount(text) : 0;
  return (
    <section className="draft-section" aria-label={title}>
      <header className="draft-section__head">
        <span
          className={`draft-section__dot draft-section__dot--${status}`}
          title={DOT_LABEL[status]}
          aria-hidden="true"
        />
        <h2 className="draft-section__title">{title}</h2>
        <span className="draft-section__state">{DOT_LABEL[status]}</span>
        {words > 0 ? (
          <span className="draft-section__words">{words} words</span>
        ) : null}
      </header>

      {children}

      {status === "empty" && emptyAction ? (
        <div className="draft-section__empty">{emptyAction}</div>
      ) : null}

      {sources ? <footer className="draft-section__foot">{sources}</footer> : null}
    </section>
  );
}

/** The document column itself — serif, --editor-col, nothing but prose. */
export function DocumentBody({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim());
  return (
    <div className="doc-body">
      {paragraphs.map((p, i) => (
        <p key={i}>{p.trim()}</p>
      ))}
    </div>
  );
}

/**
 * A section is an ordered array of blocks (migration 0009), not a string.
 * `prose` is written; `table` is rendered from verified data.
 *
 * EVERY KIND MUST RENDER. A block kind this component did not handle would be
 * silently dropped from the document — the same silent-discard shape as
 * `docs/defects/unreachable-source-kinds.md`. The default branch is loud on
 * purpose rather than returning null.
 */
export interface DocTableRow {
  cells: string[];
  /**
   * A score awaiting confirmation against the protocol. It is SHOWN, marked —
   * the withholding is from the drafting model, never from the clinician, who
   * has to see the value in order to confirm it.
   */
  flag?: "unverified";
  scoreKey?: string;
}

export type DocBlock =
  | { kind: "prose"; text: string }
  | {
      kind: "table";
      table: string;
      caption?: string;
      columns: string[];
      rows: DocTableRow[];
      sourceId?: string;
      convention?: { id: string; version: string };
    };

export function DocumentBlocks({ blocks }: { blocks: DocBlock[] }) {
  return (
    <div className="doc-blocks">
      {blocks.map((b, i) => {
        if (b.kind === "prose") return <DocumentBody key={i} text={b.text} />;
        if (b.kind === "table") return <ScoreTable key={i} block={b} />;
        return (
          <p key={i} className="doc-blocks__unknown">
            This section contains content this version of the writer cannot display
            (<code>{(b as { kind: string }).kind}</code>). It has not been removed.
          </p>
        );
      })}
    </div>
  );
}

/**
 * A rendered table. Deterministic — no model produced it, so the fidelity
 * gate has nothing to police here. Column schema comes from the block, not
 * from this component: table columns and order are a house convention
 * (parameter block §11, layer 7), injected per district and never hardcoded.
 */
export function ScoreTable({
  block,
}: {
  block: { table: string; caption?: string; columns: string[]; rows: DocTableRow[] };
}) {
  const pending = block.rows.filter((r) => r.flag === "unverified").length;
  return (
    <div className="doc-table-wrap">
      <table className="doc-table">
        {block.caption ? <caption className="doc-table__caption">{block.caption}</caption> : null}
        <thead>
          <tr>
            {block.columns.map((c, i) => (
              <th key={i} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, r) => (
            <tr
              key={r}
              className={row.flag === "unverified" ? "doc-table__row--unverified" : undefined}
            >
              {row.cells.map((cell, c) => (
                <td key={c}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {pending > 0 ? (
        <p className="doc-table__pending">
          {pending === 1 ? "One score is" : `${pending} scores are`} awaiting your
          confirmation against the protocol. Until then{" "}
          {pending === 1 ? "it is" : "they are"} not available to the writer, and these
          results can be described but not combined with other findings.
        </p>
      ) : null}
    </div>
  );
}

/** Compact outline for the left rail (Stage E). */
export function SectionOutline({
  items,
}: {
  items: { key: string; title: string; status: DraftStatus; href: string }[];
}) {
  return (
    <nav className="outline" aria-label="Report sections">
      <ol className="outline__list">
        {items.map((s) => (
          <li key={s.key} className="outline__item">
            <a className="outline__link" href={s.href}>
              <span
                className={`draft-section__dot draft-section__dot--${s.status}`}
                aria-hidden="true"
              />
              <span className="outline__label">{s.title}</span>
            </a>
            <span className="outline__state">{DOT_LABEL[s.status]}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
