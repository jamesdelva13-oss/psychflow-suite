// Pronoun-token extraction over the IR.
//
// Every third-person pronoun token is anchored and tallied by set. Extraction
// does NOT decide the student's pronouns — a report mentions parents, teachers,
// and siblings too. The tallies + anchors feed the entity-confirmation screen,
// where the user confirms the actual set (which then outranks these counts).

import type { IRElement } from "../ir/types.js";
import type { PronounObservation, PronounSet } from "./types.js";

const PRONOUN_SETS: Record<string, PronounSet> = {
  he: "he_him", him: "he_him", his: "he_him", himself: "he_him",
  she: "she_her", her: "she_her", hers: "she_her", herself: "she_her",
  they: "they_them", them: "they_them", their: "they_them",
  theirs: "they_them", themselves: "they_them", themself: "they_them",
};

const PRONOUN_RE = new RegExp(
  `\\b(${Object.keys(PRONOUN_SETS).join("|")})\\b`,
  "gi",
);

export function extractPronouns(elements: IRElement[]): PronounObservation[] {
  const out: PronounObservation[] = [];
  const ordered = [...elements].sort((a, b) => a.documentOrder - b.documentOrder);
  for (const el of ordered) {
    for (const m of el.text.matchAll(PRONOUN_RE)) {
      const token = m[0];
      out.push({
        set: PRONOUN_SETS[token.toLowerCase()]!,
        token,
        anchor: { elementId: el.id, start: m.index, end: m.index + token.length },
      });
    }
  }
  return out;
}

export function tallyPronouns(
  observations: PronounObservation[],
): Record<PronounSet, number> {
  const tallies: Record<PronounSet, number> = { he_him: 0, she_her: 0, they_them: 0 };
  for (const o of observations) tallies[o.set] += 1;
  return tallies;
}
