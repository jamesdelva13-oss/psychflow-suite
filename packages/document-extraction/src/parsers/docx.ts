// docx -> IR. The primary ingestion path (Technical Architecture §2): highest
// confidence, because a .docx carries tables as true structure (w:tbl -> rows
// -> cells) rather than reconstructed geometry.
//
// This file owns the docx path only. PDF and pasted-text parsers land later and
// produce the same IR (packages/core/ir/types.ts); no check ever sees a source
// format.
//
// Confidence policy on the docx path (decided for this repo):
//   * Best-effort with per-CELL graded confidence — never blanket-cap a whole
//     table for containing merges.
//   * A full-width horizontal merge (a banner spanning every column) resolves
//     unambiguously -> parsed_ok.
//   * A PARTIAL horizontal merge (spans a proper subset of columns > 1) needs
//     content-to-column inference -> parsed_low_confidence, on exactly those
//     covered coordinates.
//   * A vertical merge (vMerge) resolves the continuation to its origin
//     unambiguously -> parsed_ok.
//   * `failed` is reserved for a cell that cannot be placed in any coherent
//     grid (e.g. a vMerge-continue with no cell above it).
//   * Two source tables split across a page break are rejoined only on strong
//     evidence (matching column count AND a repeated header or a headerless
//     continuation); the join boundary is marked with a low-confidence seam.

import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import {
  type OoxmlNode,
  tagOf,
  childrenOf,
  attrsOf,
  childrenNamed,
  firstChild,
  findDescendant,
  hasDescendant,
  textNodeValue,
} from "./ooxml.js";
import type {
  IRDocument,
  IRElement,
  IRTable,
  ParagraphElement,
  TableCellElement,
  ParserConfidence,
  Section,
  HeadingSignals,
  TableSeam,
} from "../ir/types.js";
import { detectSections } from "./sections.js";

// ---------------------------------------------------------------------------
// Raw (pre-IR) structures captured straight off the XML, before documentOrder
// assignment and before split-table rejoining.
// ---------------------------------------------------------------------------

interface RawCell {
  gridSpan: number;
  vMerge: "restart" | "continue" | null;
  text: string;
}
interface RawRow {
  cells: RawCell[];
}
interface RawTableBlock {
  kind: "table";
  srcIds: string[];
  numColumns: number;
  rows: RawRow[];
  /** Seam row indices (into `rows`) introduced by rejoining, with a reason. */
  seams: { atRow: number; reason: string }[];
}
interface RawParaBlock {
  kind: "para";
  text: string;
  style: string | undefined;
  signals: HeadingSignals;
  pageBreak: boolean;
  /** True when the paragraph has no non-whitespace text. */
  empty: boolean;
}
type RawBlock = RawTableBlock | RawParaBlock;

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/** Parse a .docx (as bytes) into the IR. */
export async function parseDocx(
  data: Uint8Array | ArrayBuffer,
): Promise<IRDocument> {
  const zip = await JSZip.loadAsync(data);
  const documentXml = zip.file("word/document.xml");
  if (!documentXml) {
    throw new Error("not a Word document: word/document.xml is missing");
  }
  const xml = await documentXml.async("string");
  return irFromDocumentXml(xml);
}

/** Parse an already-extracted word/document.xml string into the IR. */
export function irFromDocumentXml(xml: string): IRDocument {
  const parser = new XMLParser({
    preserveOrder: true,
    ignoreAttributes: false,
    attributeNamePrefix: "",
    trimValues: false, // offsets are load-bearing — never trim run text
  });
  const tree = parser.parse(xml) as OoxmlNode[];
  const body = findBody(tree);
  const rawBlocks = body ? readBlocks(body) : [];
  const joined = rejoinSplitTables(rawBlocks);
  return assemble(joined);
}

function findBody(tree: OoxmlNode[]): OoxmlNode | undefined {
  for (const node of tree) {
    const hit = findDescendant(node, "w:body");
    if (hit) return hit;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// XML -> raw blocks
// ---------------------------------------------------------------------------

function readBlocks(body: OoxmlNode): RawBlock[] {
  const blocks: RawBlock[] = [];
  let tableSeq = 0;
  for (const child of childrenOf(body)) {
    const tag = tagOf(child);
    if (tag === "w:p") {
      blocks.push(readParagraph(child));
    } else if (tag === "w:tbl") {
      blocks.push(readTable(child, tableSeq++));
    }
    // w:sectPr and everything else is intentionally ignored (§ sections are
    // semantic/heading-based; OOXML sectPr layout boundaries are not used).
  }
  return blocks;
}

function readParagraph(p: OoxmlNode): RawParaBlock {
  const { text, pageBreak } = collectParagraphText(p);
  const style = paragraphStyle(p);
  const signals = headingSignals(p, text, style);
  return {
    kind: "para",
    text,
    style,
    signals,
    pageBreak,
    empty: text.trim().length === 0,
  };
}

/** Concatenate a paragraph's run text; note any explicit page break. */
function collectParagraphText(p: OoxmlNode): { text: string; pageBreak: boolean } {
  let text = "";
  let pageBreak = false;
  const walk = (node: OoxmlNode) => {
    const tag = tagOf(node);
    if (tag === "w:t") {
      for (const c of childrenOf(node)) text += textNodeValue(c);
      return;
    }
    if (tag === "w:tab") {
      text += "\t";
      return;
    }
    if (tag === "w:br" || tag === "w:cr") {
      if (attrsOf(node)["w:type"] === "page") pageBreak = true;
      else text += "\n";
      return;
    }
    if (tag === "w:lastRenderedPageBreak") {
      pageBreak = true;
      return;
    }
    for (const c of childrenOf(node)) walk(c);
  };
  for (const c of childrenOf(p)) walk(c);
  return { text, pageBreak };
}

function paragraphStyle(p: OoxmlNode): string | undefined {
  const pPr = firstChild(p, "w:pPr");
  if (!pPr) return undefined;
  const pStyle = firstChild(pPr, "w:pStyle");
  return pStyle ? attrsOf(pStyle)["w:val"] : undefined;
}

const HEADING_STYLE = /^(heading\d*|title|subtitle)$/i;

function headingSignals(
  p: OoxmlNode,
  text: string,
  style: string | undefined,
): HeadingSignals {
  const trimmed = text.trim();
  const styledHeading = style !== undefined && HEADING_STYLE.test(style);
  const allBold = paragraphIsBold(p);
  const letters = trimmed.replace(/[^A-Za-z]/g, "");
  const allCaps = letters.length > 0 && letters === letters.toUpperCase();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const shortStandalone =
    trimmed.length > 0 &&
    words.length > 0 &&
    words.length <= 6 &&
    !/[.:;]$/.test(trimmed);
  return { styledHeading, allBold, allCaps, shortStandalone };
}

/** A paragraph is "bold" if it has text and every text-bearing run is bold. */
function paragraphIsBold(p: OoxmlNode): boolean {
  const runs = collectRuns(p);
  const textRuns = runs.filter((r) => runText(r).length > 0);
  if (textRuns.length === 0) return false;
  const paraBold = boldFromRPr(firstChild(firstChild(p, "w:pPr") ?? emptyNode(), "w:rPr"));
  return textRuns.every((r) => paraBold || boldFromRPr(firstChild(r, "w:rPr")));
}

function collectRuns(p: OoxmlNode): OoxmlNode[] {
  const runs: OoxmlNode[] = [];
  const walk = (node: OoxmlNode) => {
    if (tagOf(node) === "w:r") runs.push(node);
    else for (const c of childrenOf(node)) walk(c);
  };
  for (const c of childrenOf(p)) walk(c);
  return runs;
}

function runText(r: OoxmlNode): string {
  const t = findDescendant(r, "w:t");
  if (!t) return "";
  return childrenOf(t).map(textNodeValue).join("");
}

function boldFromRPr(rPr: OoxmlNode | undefined): boolean {
  if (!rPr) return false;
  const b = firstChild(rPr, "w:b");
  if (!b) return false;
  const val = attrsOf(b)["w:val"];
  return val !== "false" && val !== "0";
}

function emptyNode(): OoxmlNode {
  return { "#empty": [] };
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

function readTable(tbl: OoxmlNode, seq: number): RawTableBlock {
  const grid = firstChild(tbl, "w:tblGrid");
  const declaredCols = grid ? childrenNamed(grid, "w:gridCol").length : 0;

  const rows: RawRow[] = [];
  for (const tr of childrenNamed(tbl, "w:tr")) {
    const cells: RawCell[] = [];
    for (const tc of childrenNamed(tr, "w:tc")) {
      cells.push(readCell(tc));
    }
    rows.push({ cells });
  }

  // Column count: prefer the declared grid; otherwise the widest row span sum.
  const widestRow = rows.reduce((max, r) => {
    const span = r.cells.reduce((s, c) => s + c.gridSpan, 0);
    return Math.max(max, span);
  }, 0);
  const numColumns = declaredCols > 0 ? declaredCols : widestRow;

  return {
    kind: "table",
    srcIds: [`t${seq}`],
    numColumns,
    rows,
    seams: [],
  };
}

function readCell(tc: OoxmlNode): RawCell {
  const tcPr = firstChild(tc, "w:tcPr");
  const gridSpanNode = tcPr ? firstChild(tcPr, "w:gridSpan") : undefined;
  const gridSpan = gridSpanNode
    ? Math.max(1, parseInt(attrsOf(gridSpanNode)["w:val"] ?? "1", 10) || 1)
    : 1;

  let vMerge: RawCell["vMerge"] = null;
  const vMergeNode = tcPr ? firstChild(tcPr, "w:vMerge") : undefined;
  if (vMergeNode) {
    const val = attrsOf(vMergeNode)["w:val"];
    vMerge = val === "restart" ? "restart" : "continue";
  }

  // Cell text = its paragraphs' text, joined by newline.
  const paras = childrenNamed(tc, "w:p").map((p) => collectParagraphText(p).text);
  return { gridSpan, vMerge, text: paras.join("\n") };
}

// ---------------------------------------------------------------------------
// Split-table rejoin. Only rejoin across a page break with STRONG evidence.
// ---------------------------------------------------------------------------

function rejoinSplitTables(blocks: RawBlock[]): RawBlock[] {
  const out: RawBlock[] = [];
  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i]!;
    if (block.kind !== "table") {
      out.push(block);
      i++;
      continue;
    }
    // Look ahead past separator paragraphs for another table to merge into.
    let current = block;
    let j = i + 1;
    for (;;) {
      const sep = collectSeparators(blocks, j);
      const next = blocks[sep.next];
      if (!next || next.kind !== "table") break;
      if (!strongJoinEvidence(current, next, sep.pageBreak)) break;
      current = mergeTables(current, next, sep.pageBreak);
      j = sep.next + 1;
    }
    out.push(current);
    i = j;
  }
  return out;
}

/** Advance over empty/page-break-only separator paragraphs. */
function collectSeparators(
  blocks: RawBlock[],
  from: number,
): { next: number; pageBreak: boolean } {
  let k = from;
  let pageBreak = false;
  while (k < blocks.length) {
    const b = blocks[k]!;
    if (b.kind === "para" && b.empty) {
      if (b.pageBreak) pageBreak = true;
      k++;
      continue;
    }
    break;
  }
  return { next: k, pageBreak };
}

function strongJoinEvidence(
  a: RawTableBlock,
  b: RawTableBlock,
  pageBreakBetween: boolean,
): boolean {
  if (a.numColumns !== b.numColumns) return false;
  if (a.rows.length === 0 || b.rows.length === 0) return false;
  const repeatedHeader = rowsEqual(a.rows[0]!, b.rows[0]!);
  // Headerless continuation: a real page break, A opened with a header-ish row,
  // and B dives straight into data (no duplicated header to key on).
  const headerlessContinuation =
    pageBreakBetween &&
    !repeatedHeader &&
    looksLikeHeader(a.rows[0]!) &&
    !looksLikeHeader(b.rows[0]!);
  return repeatedHeader || headerlessContinuation;
}

function rowsEqual(a: RawRow, b: RawRow): boolean {
  if (a.cells.length !== b.cells.length) return false;
  return a.cells.every(
    (c, idx) => c.text.trim() === b.cells[idx]!.text.trim() && c.gridSpan === b.cells[idx]!.gridSpan,
  );
}

/** Header-ish = every cell has text and none is purely numeric. */
function looksLikeHeader(row: RawRow): boolean {
  const nonEmpty = row.cells.filter((c) => c.text.trim().length > 0);
  if (nonEmpty.length === 0) return false;
  return nonEmpty.every((c) => !/^[\d.,%\s–-]+$/.test(c.text.trim()));
}

function mergeTables(
  a: RawTableBlock,
  b: RawTableBlock,
  pageBreakBetween: boolean,
): RawTableBlock {
  const repeatedHeader = rowsEqual(a.rows[0]!, b.rows[0]!);
  const bBody = repeatedHeader ? b.rows.slice(1) : b.rows;
  const seamRow = a.rows.length; // where B's body begins in the combined grid
  return {
    kind: "table",
    srcIds: [...a.srcIds, ...b.srcIds],
    numColumns: a.numColumns,
    rows: [...a.rows, ...bBody],
    seams: [
      ...a.seams,
      {
        atRow: seamRow,
        reason: repeatedHeader
          ? "rejoined across page break: matching column count and repeated header"
          : "rejoined across page break: matching column count, headerless continuation",
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Raw blocks -> IR (assign documentOrder, resolve grids, detect sections)
// ---------------------------------------------------------------------------

function assemble(blocks: RawBlock[]): IRDocument {
  const elements: IRElement[] = [];
  const tables: IRTable[] = [];
  let order = 0;
  let paraSeq = 0;

  for (const block of blocks) {
    if (block.kind === "para") {
      const el: ParagraphElement = {
        id: `p${paraSeq++}`,
        kind: "paragraph",
        documentOrder: order++,
        text: block.text,
        confidence: "parsed_ok",
        ...(block.style !== undefined ? { style: block.style } : {}),
        heading: block.signals,
        ...(block.pageBreak ? { pageBreakAfter: true } : {}),
      };
      elements.push(el);
    } else {
      const resolved = resolveTable(block, () => order++);
      tables.push(resolved.table);
      elements.push(...resolved.cells);
    }
  }

  const sections = detectSections(elements);
  return { elements, tables, sections };
}

interface ResolvedTable {
  table: IRTable;
  cells: TableCellElement[];
}

/**
 * Resolve a raw table into the logical grid, placing merged cells at their
 * top-left and grading per-cell confidence. `nextOrder` is called once per
 * distinct cell to interleave cell documentOrder with the surrounding elements.
 */
function resolveTable(raw: RawTableBlock, nextOrder: () => number): ResolvedTable {
  const tableId = raw.srcIds.join("+");
  const numColumns = raw.numColumns;
  const numRows = raw.rows.length;
  const grid: (string | null)[][] = Array.from({ length: numRows }, () =>
    Array.from({ length: numColumns }, () => null as string | null),
  );
  const byId = new Map<string, TableCellElement>();

  for (let r = 0; r < numRows; r++) {
    const row = raw.rows[r]!;
    let col = 0;
    for (const rc of row.cells) {
      // Skip past columns already occupied (defensive; well-formed rows are
      // contiguous, but a prior vMerge could have widened things).
      while (col < numColumns && grid[r]![col] !== null) col++;
      const startCol = col;
      const span = Math.min(rc.gridSpan, Math.max(1, numColumns - startCol));

      if (rc.vMerge === "continue") {
        // Resolve to the origin cell directly above; extend its rowSpan.
        const originId = r > 0 ? grid[r - 1]![startCol] : null;
        if (originId && byId.has(originId)) {
          const origin = byId.get(originId)!;
          origin.rowSpan += 1;
          for (let c = startCol; c < startCol + span; c++) grid[r]![c] = originId;
        } else {
          // vMerge-continue with no origin above -> no coherent grid for it.
          const cell = makeCell(tableId, r, startCol, span, 1, rc.text, "failed", nextOrder());
          place(grid, byId, cell);
        }
        col = startCol + span;
        continue;
      }

      const confidence = cellConfidence(span, numColumns);
      const cell = makeCell(tableId, r, startCol, span, 1, rc.text, confidence, nextOrder());
      place(grid, byId, cell);
      col = startCol + span;
    }
  }

  const cells = [...byId.values()].sort((a, b) => a.documentOrder - b.documentOrder);
  const seams: TableSeam[] = raw.seams.map((s) => ({
    atRow: s.atRow,
    confidence: "parsed_low_confidence",
    reason: s.reason,
  }));
  const confidence = worstConfidence([
    ...cells.map((c) => c.confidence),
    ...seams.map((s) => s.confidence),
  ]);

  const table: IRTable = {
    id: tableId,
    documentOrder: cells.length > 0 ? cells[0]!.documentOrder : nextOrder(),
    numRows,
    numColumns,
    grid,
    cells,
    confidence,
    joinedFrom: raw.srcIds,
    seams,
  };
  return { table, cells };
}

/**
 * Per-cell confidence: a full-width banner is unambiguous (parsed_ok); a
 * partial horizontal merge needs content-to-column inference
 * (parsed_low_confidence); a plain cell is parsed_ok.
 */
function cellConfidence(colSpan: number, numColumns: number): ParserConfidence {
  if (colSpan <= 1) return "parsed_ok";
  if (colSpan >= numColumns) return "parsed_ok"; // full-width banner
  return "parsed_low_confidence"; // partial merge -> ambiguous column mapping
}

function makeCell(
  tableId: string,
  row: number,
  column: number,
  colSpan: number,
  rowSpan: number,
  text: string,
  confidence: ParserConfidence,
  documentOrder: number,
): TableCellElement {
  return {
    id: `${tableId}:r${row}:c${column}`,
    kind: "tableCell",
    documentOrder,
    text,
    confidence,
    tableId,
    row,
    column,
    colSpan,
    rowSpan,
  };
}

function place(
  grid: (string | null)[][],
  byId: Map<string, TableCellElement>,
  cell: TableCellElement,
): void {
  byId.set(cell.id, cell);
  for (let c = cell.column; c < cell.column + cell.colSpan; c++) {
    if (c < grid[cell.row]!.length) grid[cell.row]![c] = cell.id;
  }
}

const SEVERITY: Record<ParserConfidence, number> = {
  parsed_ok: 0,
  parsed_low_confidence: 1,
  failed: 2,
};

function worstConfidence(list: ParserConfidence[]): ParserConfidence {
  return list.reduce<ParserConfidence>(
    (worst, c) => (SEVERITY[c] > SEVERITY[worst] ? c : worst),
    "parsed_ok",
  );
}
