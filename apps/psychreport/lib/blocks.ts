/**
 * blocks.ts — the document-block model (migration 0009).
 *
 * A section is an ordered array of blocks, not a string. Extracted from
 * report-sections.ts so that generation, persistence, and the table layer can
 * all speak about blocks without importing each other — generate.ts computes
 * the rendered blocks that accompany its prose, and it must not have to reach
 * through the persistence layer to do so.
 *
 * Pure. No server-only, no I/O, no dependencies.
 */

/**
 * One block of a section. A section is an ordered array of these, not a
 * string (migration 0009). `prose` is written — by the model or the
 * clinician; `table` is RENDERED — deterministic, no generation, and
 * therefore nothing the fidelity gate has to police.
 */
export type SectionBlock =
  | { kind: "prose"; text: string }
  | {
      kind: "table";
      /** Which table this is, e.g. "score_summary". */
      table: string;
      caption?: string;
      columns: string[];
      /**
       * `flag` travels WITH the row rather than being re-derived at render
       * time, so an export carries the same distinction the screen showed.
       */
      rows: { cells: string[]; flag?: "unverified"; scoreKey?: string }[];
      /** The Source it was rendered from, where there is one. */
      sourceId?: string;
      /** Which house convention rendered it (parameter block §11). */
      convention?: { id: string; version: string };
    };

/** TypeScript twin of the SQL `report_section_prose(blocks)`. */
export const sectionProse = (blocks: SectionBlock[]): string =>
  blocks
    .filter((b): b is Extract<SectionBlock, { kind: "prose" }> => b.kind === "prose")
    .map((b) => b.text)
    .join("\n\n");

/** A section that is one prose block — what every generation produces today. */
export const proseOnly = (text: string): SectionBlock[] => [{ kind: "prose", text }];

/**
 * Replace the prose of a block array while keeping rendered blocks in place.
 * The clinician edits prose; tables are re-rendered, never hand-edited, so an
 * edit must not silently drop one.
 */
export function replaceProse(blocks: SectionBlock[], text: string): SectionBlock[] {
  const firstProse = blocks.findIndex((b) => b.kind === "prose");
  const kept = blocks.filter((b) => b.kind !== "prose");
  if (firstProse === -1) return [...kept, { kind: "prose", text }];
  const before = blocks.slice(0, firstProse).filter((b) => b.kind !== "prose");
  const after = blocks.slice(firstProse + 1).filter((b) => b.kind !== "prose");
  return [...before, { kind: "prose", text }, ...after];
}
