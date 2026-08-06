// Entity extraction driver + EntityMap builder (Technical Architecture §3).
//
// extractEntities() runs all extractors over the IR. buildEntityMap() merges
// the extraction with the user-confirmed side inputs; ON EVERY CONFLICT THE
// SIDE INPUT WINS — user-verified ground truth outranks any extraction guess.
// Provenance is recorded per field so downstream consumers can tell which is
// which.

import type { IRDocument } from "../ir/types.js";
import type {
  EntityMap,
  ExtractedEntities,
  KeyDateKind,
  PronounSet,
  Resolved,
  SideInputs,
} from "./types.js";
import { type InstrumentLibrary, compileLibrary, findInstrumentMatches } from "./instruments.js";
import { extractNames } from "./names.js";
import { extractDates } from "./dates.js";
import { extractPronouns, tallyPronouns } from "./pronouns.js";
import { extractScoreCandidates } from "./scores.js";
import type { InstrumentMention } from "./types.js";

export function extractEntities(
  ir: IRDocument,
  library: InstrumentLibrary,
): ExtractedEntities {
  const compiled = compileLibrary(library);

  const instruments: InstrumentMention[] = [];
  for (const el of ir.elements) {
    for (const m of findInstrumentMatches(el.text, compiled)) {
      instruments.push({
        instrumentId: m.instrumentId,
        matchedText: m.matched,
        anchor: { elementId: el.id, start: m.start, end: m.end },
      });
    }
  }

  return {
    names: extractNames(ir.elements),
    dates: extractDates(ir.elements),
    pronouns: extractPronouns(ir.elements),
    instruments,
    scores: extractScoreCandidates(ir, compiled),
  };
}

const confirmed = <T>(value: T): Resolved<T> => ({
  value,
  source: "user_confirmed",
  anchors: [],
});

export function buildEntityMap(
  extracted: ExtractedEntities,
  sideInputs: SideInputs = {},
): EntityMap {
  const tallies = tallyPronouns(extracted.pronouns);

  // Student name: side input wins; else the strongest labeled candidate.
  let studentName: Resolved<string> | null = null;
  if (sideInputs.studentName !== undefined) {
    studentName = confirmed(sideInputs.studentName);
  } else if (extracted.names.length > 0) {
    const top = extracted.names[0]!;
    studentName = { value: top.text, source: "extracted", anchors: top.anchors };
  }

  // Pronouns: side input wins; else the dominant tally (strictly dominant —
  // a tie is not a resolution, the confirmation screen settles it).
  let pronouns: Resolved<PronounSet> | null = null;
  if (sideInputs.pronouns !== undefined) {
    pronouns = confirmed(sideInputs.pronouns);
  } else {
    const entries = (Object.entries(tallies) as [PronounSet, number][]).sort(
      (a, b) => b[1] - a[1],
    );
    const [first, second] = entries;
    if (first && first[1] > 0 && (!second || first[1] > second[1])) {
      pronouns = {
        value: first[0],
        source: "extracted",
        anchors: extracted.pronouns
          .filter((o) => o.set === first[0])
          .map((o) => o.anchor),
      };
    }
  }

  // DOB: side input wins; else the first dob-labeled date that normalized.
  let dob: Resolved<string> | null = null;
  if (sideInputs.dob !== undefined) {
    dob = confirmed(sideInputs.dob);
  } else {
    const hit = extracted.dates.find((d) => d.label === "dob" && d.iso !== null);
    if (hit) dob = { value: hit.iso!, source: "extracted", anchors: [hit.anchor] };
  }

  // Key dates: per kind, side input wins; else first labeled+normalized hit.
  const keyDates: EntityMap["keyDates"] = {};
  const kinds: Exclude<KeyDateKind, "dob">[] = [
    "consent_date",
    "referral_date",
    "evaluation_date",
    "report_date",
  ];
  for (const kind of kinds) {
    const side = sideInputs.keyDates?.[kind];
    if (side !== undefined) {
      keyDates[kind] = confirmed(side);
      continue;
    }
    const hit = extracted.dates.find((d) => d.label === kind && d.iso !== null);
    if (hit) {
      keyDates[kind] = { value: hit.iso!, source: "extracted", anchors: [hit.anchor] };
    }
  }

  return {
    studentName,
    pronouns,
    pronounTallies: tallies,
    dob,
    keyDates,
    // Side-input-only fields: extraction does not guess these.
    reportType: sideInputs.reportType !== undefined ? confirmed(sideInputs.reportType) : null,
    category: sideInputs.category !== undefined ? confirmed(sideInputs.category) : null,
    state: sideInputs.state !== undefined ? confirmed(sideInputs.state) : null,
    instrumentsDetected: extracted.instruments,
    candidates: extracted,
  };
}
