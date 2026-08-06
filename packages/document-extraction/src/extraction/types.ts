// Entity-layer types (Technical Architecture §3).
//
// Two distinct things live here and must not blur:
//   * ExtractedEntities — what dictionary matching + regex found in the IR,
//     every item anchored to an element location. These are CANDIDATES.
//   * SideInputs — user-confirmed ground truth from the entity-confirmation
//     screen. When a side input and an extraction conflict, the side input
//     wins, always.
// buildEntityMap() merges the two into the EntityMap that checks consume, with
// per-field provenance so a check (and the UI) can see which values were
// user-confirmed and which are merely extracted.

import type { ParserConfidence } from "@suite/reasoning-contracts";

/** A local text anchor: offsets index into the element's own text. */
export interface Anchor {
  elementId: string;
  start: number;
  end: number;
}

export type PronounSet = "he_him" | "she_her" | "they_them";

export type KeyDateKind =
  | "dob"
  | "consent_date"
  | "referral_date"
  | "evaluation_date"
  | "report_date";

/** Score types a candidate can carry. `unknown` = no explicit evidence —
 *  a guess is never baked into the tag (docs/decisions.md 2026-07-12). */
export type ScoreType =
  | "standard_score"
  | "scaled_score"
  | "t_score"
  | "percentile"
  | "confidence_interval"
  | "raw_score"
  | "unknown";

// ---------------------------------------------------------------------------
// Extraction candidates
// ---------------------------------------------------------------------------

export interface NameCandidate {
  /** Full matched name, e.g. "Jordan Sample". */
  text: string;
  /** Found after an explicit label ("Student:", "Name:"). */
  fromLabel: boolean;
  /** Total occurrences of the full name or its given name across the doc. */
  count: number;
  /** One anchor per occurrence, in document order. */
  anchors: Anchor[];
}

export interface DateCandidate {
  /** The text as it appears in the document. */
  raw: string;
  /** ISO 8601 (YYYY-MM-DD), or null when the match couldn't be normalized. */
  iso: string | null;
  /** Nearest label keyword found before the date in the same element. */
  label: KeyDateKind | "unlabeled";
  anchor: Anchor;
  sourceConfidence: ParserConfidence;
}

export interface PronounObservation {
  set: PronounSet;
  token: string;
  anchor: Anchor;
}

export interface InstrumentMention {
  instrumentId: string;
  matchedText: string;
  anchor: Anchor;
}

export interface ScoreCandidate {
  instrumentId: string;
  /** Canonical scale name from the instrument library (not the alias hit). */
  scale: string;
  scoreType: ScoreType;
  value: number;
  /** Anchor of the numeric token itself. */
  anchor: Anchor;
  /** Anchor of the scale-name match that made this number a candidate. */
  scaleAnchor: Anchor;
  /**
   * How the adjacency was established. This is an evidence-strength signal,
   * not just provenance: `table_row` (structured grid association) is stronger
   * evidence than `prose_window` (proximity in running text), and checks may
   * weight the two differently.
   */
  evidence: "table_row" | "prose_window";
  /** Grid address of the number's cell, when evidence is table_row. */
  table?: { tableId: string; row: number; column: number };
  /** Parser confidence of the element the number came from. */
  sourceConfidence: ParserConfidence;
}

export interface ExtractedEntities {
  names: NameCandidate[];
  dates: DateCandidate[];
  pronouns: PronounObservation[];
  instruments: InstrumentMention[];
  scores: ScoreCandidate[];
}

// ---------------------------------------------------------------------------
// Side inputs and the merged EntityMap
// ---------------------------------------------------------------------------

/** User-confirmed ground truth from the entity-confirmation screen. */
export interface SideInputs {
  studentName?: string;
  pronouns?: PronounSet;
  /** ISO 8601. */
  dob?: string;
  keyDates?: Partial<Record<Exclude<KeyDateKind, "dob">, string>>;
  reportType?: string;
  category?: string;
  /** Two-letter state code, e.g. "SC". */
  state?: string;
}

export type Provenance = "user_confirmed" | "extracted";

/** A resolved field with provenance. Anchors are empty for user_confirmed. */
export interface Resolved<T> {
  value: T;
  source: Provenance;
  anchors: Anchor[];
}

export interface EntityMap {
  studentName: Resolved<string> | null;
  pronouns: Resolved<PronounSet> | null;
  /** Raw tallies behind the pronoun resolution, for the confirmation screen. */
  pronounTallies: Record<PronounSet, number>;
  dob: Resolved<string> | null;
  keyDates: Partial<Record<Exclude<KeyDateKind, "dob">, Resolved<string>>>;
  /** Side-input-only at this stage — extraction does not guess these. */
  reportType: Resolved<string> | null;
  category: Resolved<string> | null;
  state: Resolved<string> | null;
  instrumentsDetected: InstrumentMention[];
  /** The full extraction result, kept for the confirmation screen and UI. */
  candidates: ExtractedEntities;
}
