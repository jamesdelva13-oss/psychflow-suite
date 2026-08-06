// Name-token extraction over the IR.
//
// Deliberately label-driven: a name candidate is seeded only by an explicit
// label ("Student:", "Name:", "Child:", "RE:") — free guessing at which
// capitalized words are the student is exactly the risk the entity-confirmation
// screen exists to absorb (Technical Architecture §3). Once seeded, every
// occurrence of the full name and its given name is counted and anchored, which
// gives the confirmation screen (and later the de-identification pass) the
// complete occurrence list.

import type { IRElement } from "../ir/types.js";
import type { Anchor, NameCandidate } from "./types.js";

const LABEL_RE = /\b(?:student(?:'s)?(?:\s+name)?|name|child|re)\s*:\s*/gi;
/** A run of 1-4 capitalized tokens (allowing O'Brien, Smith-Jones). */
const NAME_RE = /^([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,3})/;

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function extractNames(elements: IRElement[]): NameCandidate[] {
  const ordered = [...elements].sort((a, b) => a.documentOrder - b.documentOrder);

  // Pass 1: labeled seeds.
  const seeds = new Map<string, Anchor>(); // full name -> first labeled anchor
  for (const el of ordered) {
    LABEL_RE.lastIndex = 0;
    for (const label of el.text.matchAll(LABEL_RE)) {
      const after = el.text.slice(label.index + label[0].length);
      const name = NAME_RE.exec(after);
      if (!name) continue;
      const start = label.index + label[0].length;
      const full = name[1]!;
      if (!seeds.has(full)) {
        seeds.set(full, { elementId: el.id, start, end: start + full.length });
      }
    }
  }

  // Pass 2: count + anchor every occurrence of each seed (full name, or its
  // given name outside a full-name occurrence).
  const candidates: NameCandidate[] = [];
  for (const [full, labeledAnchor] of seeds) {
    const given = full.split(/\s+/)[0]!;
    const anchors: Anchor[] = [];
    for (const el of ordered) {
      const covered: [number, number][] = [];
      for (const m of el.text.matchAll(new RegExp(`\\b${escapeRe(full)}\\b`, "g"))) {
        anchors.push({ elementId: el.id, start: m.index, end: m.index + m[0].length });
        covered.push([m.index, m.index + m[0].length]);
      }
      if (given !== full) {
        for (const m of el.text.matchAll(new RegExp(`\\b${escapeRe(given)}\\b`, "g"))) {
          const insideFull = covered.some(([s, e]) => m.index >= s && m.index < e);
          if (!insideFull) {
            anchors.push({ elementId: el.id, start: m.index, end: m.index + m[0].length });
          }
        }
      }
    }
    anchors.sort((a, b) =>
      a.elementId === b.elementId ? a.start - b.start : 0,
    );
    candidates.push({
      text: full,
      fromLabel: true,
      count: anchors.length,
      anchors: anchors.length > 0 ? anchors : [labeledAnchor],
    });
  }
  candidates.sort((a, b) => b.count - a.count);
  return candidates;
}
