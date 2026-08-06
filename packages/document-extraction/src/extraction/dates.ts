// Date extraction over the IR.
//
// Recognizes US-style numeric dates (MM/DD/YYYY, MM-DD-YYYY; four-digit years
// only — two-digit years are ambiguous and skipped at this stage) and written
// month dates ("December 1, 2025"). Each hit is normalized to ISO when valid
// and labeled from the nearest keyword appearing BEFORE it in the same element
// (never across elements), within a bounded window.

import type { IRElement } from "../ir/types.js";
import type { DateCandidate, KeyDateKind } from "./types.js";

const NUMERIC_DATE = /\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/g;
const MONTHS =
  "January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec";
const WRITTEN_DATE = new RegExp(
  `\\b(${MONTHS})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b`,
  "gi",
);

const MONTH_INDEX: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

/** How far back (chars) to look for a label keyword in the same element. */
const LABEL_WINDOW = 80;

/** Ordered: more specific keywords first; nearest match to the date wins ties. */
const LABEL_RULES: { re: RegExp; kind: KeyDateKind }[] = [
  { re: /date\s+of\s+birth|\bdob\b|\bbirth\b/i, kind: "dob" },
  { re: /consent/i, kind: "consent_date" },
  { re: /referral|referred/i, kind: "referral_date" },
  { re: /report\s+date|date\s+of\s+report/i, kind: "report_date" },
  { re: /evaluation|assessment|testing/i, kind: "evaluation_date" },
];

function toIso(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day > daysInMonth) return null;
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function labelFor(text: string, dateStart: number): KeyDateKind | "unlabeled" {
  const windowStart = Math.max(0, dateStart - LABEL_WINDOW);
  const before = text.slice(windowStart, dateStart);
  let best: { kind: KeyDateKind; pos: number } | null = null;
  for (const rule of LABEL_RULES) {
    // Last occurrence of this keyword in the window = nearest to the date.
    let pos = -1;
    const re = new RegExp(rule.re.source, rule.re.flags.includes("g") ? rule.re.flags : rule.re.flags + "g");
    for (const m of before.matchAll(re)) pos = m.index;
    if (pos >= 0 && (best === null || pos > best.pos)) {
      best = { kind: rule.kind, pos };
    }
  }
  return best?.kind ?? "unlabeled";
}

export function extractDates(elements: IRElement[]): DateCandidate[] {
  const out: DateCandidate[] = [];
  const ordered = [...elements].sort((a, b) => a.documentOrder - b.documentOrder);
  for (const el of ordered) {
    const found: DateCandidate[] = [];
    for (const m of el.text.matchAll(NUMERIC_DATE)) {
      const [raw, mo, day, year] = m;
      found.push({
        raw,
        iso: toIso(Number(year), Number(mo), Number(day)),
        label: labelFor(el.text, m.index),
        anchor: { elementId: el.id, start: m.index, end: m.index + raw.length },
        sourceConfidence: el.confidence,
      });
    }
    for (const m of el.text.matchAll(WRITTEN_DATE)) {
      const [raw, monthName, day, year] = m;
      const month = MONTH_INDEX[monthName!.toLowerCase().slice(0, 3)];
      found.push({
        raw,
        iso: month ? toIso(Number(year), month, Number(day)) : null,
        label: labelFor(el.text, m.index),
        anchor: { elementId: el.id, start: m.index, end: m.index + raw.length },
        sourceConfidence: el.confidence,
      });
    }
    // Textual order within the element, so "first hit" downstream means first
    // in the document, not first regex pass.
    found.sort((a, b) => a.anchor.start - b.anchor.start);
    out.push(...found);
  }
  return out;
}
