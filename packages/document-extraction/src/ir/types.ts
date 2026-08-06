// The intermediate representation (IR).
//
// Every input format (docx first; pdf and pasted text later) normalizes to this
// one internal model — sections, paragraphs with character offsets, tables as
// typed grids (Technical Architecture §2). All checks operate on the IR, never
// on source formats; adding an input type touches parsers only.
//
// Anchoring model (decided for this repo, beyond what §2 fixes):
//   * Text anchors are PER-ELEMENT and LOCAL: (elementId, startOffset,
//     endOffset), where offsets index into that element's own `text`.
//   * Elements are paragraphs and table cells. Every element carries a
//     `documentOrder` index that is independent of section grouping.
//   * Table cells are additionally addressed by (tableId, row, column) in the
//     resolved logical grid.
//   * No global document offsets are stored. A global text stream + a position
//     map back to (elementId, localOffset) is DERIVED on demand from the
//     element list (see ir/text-stream.ts) so it can never diverge from the
//     canonical anchors.

import type { ParserConfidence } from "@suite/reasoning-contracts";

export type { ParserConfidence };

/** Discriminant for the two kinds of text-bearing element. */
export type ElementKind = "paragraph" | "tableCell";

/** Fields shared by every text-bearing element. */
interface ElementBase {
  /** Stable within one parsed document, e.g. "p3", "t1:r2:c0". */
  id: string;
  kind: ElementKind;
  /**
   * Monotonic index in document reading order across paragraphs AND table
   * cells. Independent of `sections` — sections are an overlay, not a reorder.
   */
  documentOrder: number;
  /** The element's own text. Local offsets index into this string. */
  text: string;
  /** Per-element parser confidence — load-bearing, not decorative (§2). */
  confidence: ParserConfidence;
}

export interface ParagraphElement extends ElementBase {
  kind: "paragraph";
  /** OOXML paragraph style id/name (e.g. "Heading1", "Title") when present. */
  style?: string;
  /** Heading signals gathered during parsing, consumed by section detection. */
  heading?: HeadingSignals;
  /** True when this paragraph carries an explicit page break (w:br page). */
  pageBreakAfter?: boolean;
}

export interface TableCellElement extends ElementBase {
  kind: "tableCell";
  tableId: string;
  /** Logical grid coordinates of this cell's top-left corner. */
  row: number;
  column: number;
  /** Column span in the resolved logical grid (1 = no horizontal merge). */
  colSpan: number;
  /** Row span in the resolved logical grid (1 = no vertical merge). */
  rowSpan: number;
}

export type IRElement = ParagraphElement | TableCellElement;

/** Raw signals a paragraph exhibits that may mark it as a section heading. */
export interface HeadingSignals {
  /** Style name matched a heading/title style. */
  styledHeading: boolean;
  /** Whole paragraph is bold. */
  allBold: boolean;
  /** Text is entirely upper-case (letters present, none lower-case). */
  allCaps: boolean;
  /** Short, single-line, standalone paragraph (few words, no terminal period). */
  shortStandalone: boolean;
}

/**
 * A resolved table. The `grid` is row-major; a merged cell's element sits at its
 * top-left coordinate, and every covered coordinate points at that same element
 * (so grid[r][c] is never a hole inside a merge). `cells` lists each element
 * once, at its origin.
 */
export interface IRTable {
  id: string;
  documentOrder: number;
  numRows: number;
  numColumns: number;
  /** grid[row][column] -> element id covering that coordinate (or null). */
  grid: (string | null)[][];
  /** Each distinct cell element, once, keyed for grid lookups. */
  cells: TableCellElement[];
  /** Table-level confidence (worst case is surfaced here for convenience). */
  confidence: ParserConfidence;
  /** Source w:tbl ids this table was assembled from (>1 means rejoined). */
  joinedFrom: string[];
  /**
   * Seams where two source tables were rejoined across a page break. The row
   * index is where the second source table's body begins in the logical grid.
   */
  seams: TableSeam[];
}

export interface TableSeam {
  atRow: number;
  confidence: ParserConfidence;
  reason: string;
}

/**
 * A semantic report section, detected from heading signals. When no reliable
 * headings are found the parser emits a single implicit section spanning the
 * whole document rather than guessing boundaries.
 */
export interface Section {
  id: string;
  /** Heading text, or null for the implicit whole-document fallback. */
  title: string | null;
  /** Paragraph element id that opened this section, or null when implicit. */
  headingElementId: string | null;
  /** Confidence in this section boundary's detection. */
  confidence: ParserConfidence;
  /** True for the whole-document fallback emitted when no headings are found. */
  implicit: boolean;
  /** Member element ids (paragraphs and cells) in document order. */
  elementIds: string[];
}

export interface IRDocument {
  /** All text-bearing elements in document order (paragraphs + table cells). */
  elements: IRElement[];
  /** Structural table overlay providing grid addressing over cell elements. */
  tables: IRTable[];
  /** Semantic section overlay. Always at least one section. */
  sections: Section[];
}

/** Type guards. */
export function isParagraph(el: IRElement): el is ParagraphElement {
  return el.kind === "paragraph";
}
export function isTableCell(el: IRElement): el is TableCellElement {
  return el.kind === "tableCell";
}
