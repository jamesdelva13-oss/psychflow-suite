// Score-candidate extraction (Technical Architecture §3): every number
// adjacent to a recognized scale name becomes a candidate tagged
// {instrument, scale, score_type, value, location}.
//
// Adjacency (docs/decisions.md 2026-07-12):
//   * Table path — numbers in the same logical-grid row as a cell matching a
//     scale name. score_type comes from the nearest header cell ABOVE the
//     number's column that matches the header lexicon.
//   * Prose path — numbers within a bounded window (~80 chars) after a scale
//     name in the same paragraph. score_type comes from an inline marker
//     between the scale name and the number, if any.
// Either way: no explicit evidence -> score_type "unknown". Never guessed.
//
// Extraction is deliberately liberal — candidates get filtered downstream; the
// per-element sourceConfidence rides along so any finding built on a shaky
// parse is capped by the Finding constructor, not here.

import type { IRDocument, IRTable, TableCellElement } from "../ir/types.js";
import { isParagraph } from "../ir/types.js";
import type { ScoreCandidate, ScoreType } from "./types.js";
import { type CompiledLibrary, findScaleMatches } from "./instruments.js";

/** Prose adjacency window after the end of a scale-name match. */
const PROSE_WINDOW = 80;

const NUMBER_RE = /\d+(?:\.\d+)?/g;

/** Header lexicon: specific patterns first; a bare "Score" is NOT evidence. */
const HEADER_TYPES: { re: RegExp; type: ScoreType }[] = [
  { re: /standard\s+score|\bSS\b/i, type: "standard_score" },
  { re: /scaled\s+score/i, type: "scaled_score" },
  { re: /\bt[\s-]?score\b/i, type: "t_score" },
  { re: /%\s*ile|percentile/i, type: "percentile" },
  { re: /confidence\s+interval|\bCI\b/i, type: "confidence_interval" },
  { re: /raw\s+score/i, type: "raw_score" },
];

/** Inline markers for the prose path, matched between scale name and number. */
const INLINE_TYPES: { re: RegExp; type: ScoreType }[] = [
  { re: /standard\s+score|\bSS\b\s*[=:]?/i, type: "standard_score" },
  { re: /scaled\s+score/i, type: "scaled_score" },
  { re: /\bt[\s-]?score\b|\bT\s*[=:]/i, type: "t_score" },
  { re: /percentile|%\s*ile/i, type: "percentile" },
  { re: /confidence\s+interval|\bCI\b/i, type: "confidence_interval" },
  { re: /raw\s+score/i, type: "raw_score" },
];

function headerType(text: string): ScoreType | null {
  for (const h of HEADER_TYPES) if (h.re.test(text)) return h.type;
  return null;
}

function inlineType(between: string): ScoreType {
  for (const h of INLINE_TYPES) if (h.re.test(between)) return h.type;
  return "unknown";
}

export function extractScoreCandidates(
  ir: IRDocument,
  lib: CompiledLibrary,
): ScoreCandidate[] {
  return [...fromTables(ir, lib), ...fromProse(ir, lib)];
}

// ---------------------------------------------------------------------------
// Table path
// ---------------------------------------------------------------------------

function fromTables(ir: IRDocument, lib: CompiledLibrary): ScoreCandidate[] {
  const out: ScoreCandidate[] = [];
  for (const table of ir.tables) {
    const byId = new Map(table.cells.map((c) => [c.id, c]));
    for (const scaleCell of table.cells) {
      const matches = findScaleMatches(scaleCell.text, lib);
      for (const m of matches) {
        const scaleAnchor = {
          elementId: scaleCell.id,
          start: m.start,
          end: m.end,
        };
        // Numbers come from the other distinct cells in the scale cell's row.
        const rowCells = distinctRowCells(table, scaleCell.row, byId);
        for (const cell of rowCells) {
          if (cell.id === scaleCell.id) continue;
          const colType = columnType(table, cell.column, scaleCell.row, byId);
          for (const num of cell.text.matchAll(NUMBER_RE)) {
            out.push({
              instrumentId: m.instrumentId,
              scale: m.scale!,
              scoreType: colType ?? "unknown",
              value: Number(num[0]),
              anchor: {
                elementId: cell.id,
                start: num.index,
                end: num.index + num[0].length,
              },
              scaleAnchor,
              evidence: "table_row",
              table: { tableId: table.id, row: cell.row, column: cell.column },
              sourceConfidence: cell.confidence,
            });
          }
        }
      }
    }
  }
  return out;
}

function distinctRowCells(
  table: IRTable,
  row: number,
  byId: Map<string, TableCellElement>,
): TableCellElement[] {
  const seen = new Set<string>();
  const cells: TableCellElement[] = [];
  for (const id of table.grid[row] ?? []) {
    if (id && !seen.has(id)) {
      seen.add(id);
      const cell = byId.get(id);
      if (cell) cells.push(cell);
    }
  }
  return cells;
}

/** Nearest header-lexicon match in this column, scanning up from the row. */
function columnType(
  table: IRTable,
  column: number,
  belowRow: number,
  byId: Map<string, TableCellElement>,
): ScoreType | null {
  for (let r = belowRow - 1; r >= 0; r--) {
    const id = table.grid[r]?.[column];
    if (!id) continue;
    const cell = byId.get(id);
    if (!cell) continue;
    const t = headerType(cell.text);
    if (t) return t;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Prose path
// ---------------------------------------------------------------------------

function fromProse(ir: IRDocument, lib: CompiledLibrary): ScoreCandidate[] {
  const out: ScoreCandidate[] = [];
  for (const el of ir.elements) {
    if (!isParagraph(el)) continue; // table cells are handled by the table path
    const matches = findScaleMatches(el.text, lib);
    for (const m of matches) {
      const windowEnd = Math.min(el.text.length, m.end + PROSE_WINDOW);
      const window = el.text.slice(m.end, windowEnd);
      for (const num of window.matchAll(NUMBER_RE)) {
        const numStart = m.end + num.index;
        const between = el.text.slice(m.end, numStart);
        out.push({
          instrumentId: m.instrumentId,
          scale: m.scale!,
          scoreType: inlineType(between),
          value: Number(num[0]),
          anchor: {
            elementId: el.id,
            start: numStart,
            end: numStart + num[0].length,
          },
          scaleAnchor: { elementId: el.id, start: m.start, end: m.end },
          evidence: "prose_window",
          sourceConfidence: el.confidence,
        });
      }
    }
  }
  return out;
}
