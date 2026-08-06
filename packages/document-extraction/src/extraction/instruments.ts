// Instrument library types + dictionary matcher (Technical Architecture §3).
//
// The library itself is DATA living at /rulepacks/instruments/*.json —
// instruments can be added or corrected without a core code release. The core
// never does I/O: consumers read the JSON and pass the parsed object in.
// Matching is case-insensitive, word-boundary, longest-match-wins dictionary
// lookup over element text.

import type { ScoreType } from "./types.js";

// ---------------------------------------------------------------------------
// Library schema (mirrors rulepacks/instruments/*.json)
// ---------------------------------------------------------------------------

export interface ScaleDef {
  /** Canonical scale name, e.g. "Working Memory Index". */
  name: string;
  aliases?: string[];
  /** The score type this scale is normally reported in. NOTE: this is library
   *  metadata for downstream checks — extraction does NOT use it to tag
   *  candidates (score_type comes only from explicit document evidence). */
  score_type?: ScoreType;
  kind?: "composite" | "subtest" | "scale" | "index";
}

export interface DescriptorRange {
  min?: number;
  max?: number;
  label: string;
}

export interface InstrumentDef {
  id: string;
  name: string;
  aliases?: string[];
  publisher?: string;
  scales: ScaleDef[];
  /** score_type -> ordered ranges, per publisher. */
  descriptor_ranges?: Record<string, DescriptorRange[]>;
}

export interface InstrumentLibrary {
  schema_version: number;
  status?: string;
  instruments: InstrumentDef[];
}

// ---------------------------------------------------------------------------
// Compiled matcher
// ---------------------------------------------------------------------------

interface Term {
  /** The literal term to match (canonical name or alias). */
  term: string;
  instrumentId: string;
  /** Canonical scale name; undefined for instrument-name terms. */
  scale?: string;
}

export interface CompiledLibrary {
  scaleTerms: Term[];
  instrumentTerms: Term[];
}

export interface TextMatch {
  instrumentId: string;
  /** Canonical scale name; undefined when the match is an instrument name. */
  scale?: string;
  start: number;
  end: number;
  matched: string;
}

export function compileLibrary(lib: InstrumentLibrary): CompiledLibrary {
  const scaleTerms: Term[] = [];
  const instrumentTerms: Term[] = [];
  for (const inst of lib.instruments) {
    instrumentTerms.push({ term: inst.name, instrumentId: inst.id });
    for (const alias of inst.aliases ?? []) {
      instrumentTerms.push({ term: alias, instrumentId: inst.id });
    }
    for (const scale of inst.scales) {
      scaleTerms.push({ term: scale.name, instrumentId: inst.id, scale: scale.name });
      for (const alias of scale.aliases ?? []) {
        scaleTerms.push({ term: alias, instrumentId: inst.id, scale: scale.name });
      }
    }
  }
  // Longest first so greedy overlap resolution prefers the most specific term
  // ("Working Memory Index" beats "Working Memory" at the same start).
  scaleTerms.sort((a, b) => b.term.length - a.term.length);
  instrumentTerms.sort((a, b) => b.term.length - a.term.length);
  return { scaleTerms, instrumentTerms };
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Find all term matches in `text`. Overlapping matches are resolved
 * longest-first; a shorter match overlapping an accepted one is dropped unless
 * it covers the identical span (two instruments sharing a term both match).
 */
function findMatches(text: string, terms: Term[]): TextMatch[] {
  const raw: TextMatch[] = [];
  for (const t of terms) {
    const re = new RegExp(`\\b${escapeRe(t.term)}\\b`, "gi");
    for (const m of text.matchAll(re)) {
      raw.push({
        instrumentId: t.instrumentId,
        ...(t.scale !== undefined ? { scale: t.scale } : {}),
        start: m.index,
        end: m.index + m[0].length,
        matched: m[0],
      });
    }
  }
  raw.sort((a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start);
  const accepted: TextMatch[] = [];
  for (const cand of raw) {
    const clash = accepted.find((a) => cand.start < a.end && a.start < cand.end);
    if (!clash || (clash.start === cand.start && clash.end === cand.end)) {
      accepted.push(cand);
    }
  }
  accepted.sort((a, b) => a.start - b.start);
  return accepted;
}

export function findScaleMatches(text: string, lib: CompiledLibrary): TextMatch[] {
  return findMatches(text, lib.scaleTerms);
}

export function findInstrumentMatches(text: string, lib: CompiledLibrary): TextMatch[] {
  return findMatches(text, lib.instrumentTerms);
}
