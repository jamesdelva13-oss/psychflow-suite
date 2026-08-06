// Entity-layer tests: names, dates, pronouns, instrument mentions, and score
// candidates extract from the IR with correct anchors, and the EntityMap gives
// side inputs (user-confirmed ground truth) precedence over extraction.
//
// Anchor correctness is asserted the strong way throughout: slicing the
// element's actual text at the anchor must reproduce the matched token.

import { test, expect, describe } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parseDocx } from "../src/parsers/docx.js";
import type { IRDocument } from "../src/ir/types.js";
import type { InstrumentLibrary } from "../src/extraction/instruments.js";
import { extractEntities, buildEntityMap } from "../src/extraction/entity-map.js";
import type { Anchor, ExtractedEntities } from "../src/extraction/types.js";

const fixture = (name: string) =>
  readFile(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)));

async function loadLibrary(): Promise<InstrumentLibrary> {
  const raw = await readFile(
    fileURLToPath(new URL("./fixtures/instrument-seed.json", import.meta.url)),
    "utf8",
  );
  return JSON.parse(raw) as InstrumentLibrary;
}

/** Slice the anchored element's text — must reproduce the token exactly. */
function anchoredText(ir: IRDocument, a: Anchor): string {
  const el = ir.elements.find((e) => e.id === a.elementId);
  if (!el) throw new Error(`anchor points at unknown element ${a.elementId}`);
  return el.text.slice(a.start, a.end);
}

async function extractFixture(
  name: string,
): Promise<{ ir: IRDocument; entities: ExtractedEntities }> {
  const ir = await parseDocx(await fixture(name));
  const entities = extractEntities(ir, await loadLibrary());
  return { ir, entities };
}

describe("name extraction", () => {
  test("labeled student name extracts with anchors that slice back to the name", async () => {
    const { ir, entities } = await extractFixture("entity-sample.docx");
    expect(entities.names).toHaveLength(1);
    const name = entities.names[0]!;
    expect(name.text).toBe("Jordan Sample");
    expect(name.fromLabel).toBe(true);
    // Full name once + given name "Jordan" twice in prose.
    expect(name.count).toBe(3);
    for (const a of name.anchors) {
      expect(["Jordan Sample", "Jordan"]).toContain(anchoredText(ir, a));
    }
  });

  test("no labeled name -> no name candidates (never guessed)", async () => {
    const { entities } = await extractFixture("basic-score-table.docx");
    expect(entities.names).toEqual([]);
  });
});

describe("date extraction", () => {
  test("numeric and written dates extract, normalize, and label correctly", async () => {
    const { ir, entities } = await extractFixture("entity-sample.docx");
    const byLabel = (label: string) => entities.dates.filter((d) => d.label === label);

    const dob = byLabel("dob");
    expect(dob).toHaveLength(1);
    expect(dob[0]!.iso).toBe("2015-03-14");
    expect(anchoredText(ir, dob[0]!.anchor)).toBe("03/14/2015");

    const consent = byLabel("consent_date");
    expect(consent).toHaveLength(1);
    expect(consent[0]!.iso).toBe("2025-11-02");

    // Both evaluation dates — written and numeric — share the label from the
    // "Evaluation Dates:" prefix within the same element.
    const evals = byLabel("evaluation_date").map((d) => d.iso).sort();
    expect(evals).toEqual(["2025-12-01", "2025-12-08"]);
    const written = byLabel("evaluation_date").find((d) => d.raw.startsWith("December"))!;
    expect(anchoredText(ir, written.anchor)).toBe("December 1, 2025");

    const report = byLabel("report_date");
    expect(report).toHaveLength(1);
    expect(report[0]!.iso).toBe("2026-01-09");
  });

  test("a document with no dates yields no date candidates", async () => {
    const { entities } = await extractFixture("basic-score-table.docx");
    expect(entities.dates).toEqual([]);
  });
});

describe("pronoun extraction", () => {
  test("pronoun tokens extract with anchors and tally to the dominant set", async () => {
    const { ir, entities } = await extractFixture("entity-sample.docx");
    expect(entities.pronouns.length).toBeGreaterThanOrEqual(4);
    expect(entities.pronouns.every((o) => o.set === "he_him")).toBe(true);
    for (const o of entities.pronouns) {
      expect(anchoredText(ir, o.anchor)).toBe(o.token);
      expect(["he", "He", "his", "His", "him"]).toContain(o.token);
    }
  });
});

describe("instrument mentions", () => {
  test("full name and acronym both detect as WISC-V with anchors", async () => {
    const { ir, entities } = await extractFixture("entity-sample.docx");
    const wisc = entities.instruments.filter((i) => i.instrumentId === "wisc-v");
    const texts = wisc.map((i) => anchoredText(ir, i.anchor));
    expect(texts).toContain("WISC-V");
    expect(texts).toContain("Wechsler Intelligence Scale for Children, Fifth Edition");
  });
});

describe("score-candidate extraction", () => {
  test("table row: numbers beside a scale name become typed candidates with cell addresses", async () => {
    const { ir, entities } = await extractFixture("entity-sample.docx");
    const wm = entities.scores.filter((s) => s.scale === "Working Memory Index");
    // Same row: 98 (Standard Score), 91+105 (95% CI), 45 (%ile).
    expect(wm.map((s) => [s.value, s.scoreType]).sort((a, b) => (a[0] as number) - (b[0] as number))).toEqual([
      [45, "percentile"],
      [91, "confidence_interval"],
      [98, "standard_score"],
      [105, "confidence_interval"],
    ]);
    const ss = wm.find((s) => s.value === 98)!;
    expect(ss.instrumentId).toBe("wisc-v");
    expect(ss.evidence).toBe("table_row");
    expect(ss.table).toEqual({ tableId: "t0", row: 2, column: 1 });
    expect(anchoredText(ir, ss.anchor)).toBe("98");
    // The scale anchor points at the alias text that triggered the candidate.
    expect(anchoredText(ir, ss.scaleAnchor)).toBe("Working Memory");
    expect(ss.sourceConfidence).toBe("parsed_ok");
  });

  test("prose window: a number after a scale name becomes a candidate carrying prose_window evidence", async () => {
    const { ir, entities } = await extractFixture("entity-sample.docx");
    const prose = entities.scores.filter((s) => s.evidence === "prose_window");
    const psi = prose.find((s) => s.scale === "Processing Speed Index")!;
    expect(psi.value).toBe(88);
    expect(psi.scoreType).toBe("unknown"); // "score of 88" is not explicit evidence
    expect(anchoredText(ir, psi.anchor)).toBe("88");
    expect(anchoredText(ir, psi.scaleAnchor)).toBe("Processing Speed Index");
    // Prose candidates never carry a grid address.
    expect(psi.table).toBeUndefined();
  });

  test("(a) a number outside the prose window near a scale name produces NO candidate", async () => {
    const { entities } = await extractFixture("entity-sample.docx");
    // "Fluid Reasoning ... [>80 digit-free chars] ... as 102."
    expect(entities.scores.some((s) => s.value === 102)).toBe(false);
    expect(entities.scores.some((s) => s.scale === "Fluid Reasoning Index")).toBe(false);
  });

  test("(b) a value plausible as T-score or percentile with no marker stays 'unknown' — never inferred from range", async () => {
    const { entities } = await extractFixture("entity-sample.docx");
    // "the Attention Problems scale was reported at 68" — 68 sits in both the
    // T-score and percentile ranges; without explicit evidence, no guess.
    const hit = entities.scores.find((s) => s.scale === "Attention Problems")!;
    expect(hit.instrumentId).toBe("basc-3");
    expect(hit.value).toBe(68);
    expect(hit.evidence).toBe("prose_window");
    expect(hit.scoreType).toBe("unknown");
  });

  test("(c) a column-header marker resolves the candidate's score type", async () => {
    const { entities } = await extractFixture("entity-sample.docx");
    const fsiq = entities.scores.filter((s) => s.scale === "Full Scale IQ");
    expect(fsiq.find((s) => s.value === 104)!.scoreType).toBe("standard_score"); // "Standard Score"
    expect(fsiq.find((s) => s.value === 61)!.scoreType).toBe("percentile"); // "%ile"
    expect(fsiq.find((s) => s.value === 99)!.scoreType).toBe("confidence_interval"); // "95% CI"
    // All header-typed candidates carry the stronger table_row evidence.
    expect(fsiq.every((s) => s.evidence === "table_row")).toBe(true);
  });

  test("a generic 'Score' header is not evidence — column type stays unknown", async () => {
    const { entities } = await extractFixture("basic-score-table.docx");
    const vc = entities.scores.filter((s) => s.scale === "Verbal Comprehension Index");
    expect(vc.find((s) => s.value === 108)!.scoreType).toBe("unknown");
    expect(vc.find((s) => s.value === 70)!.scoreType).toBe("percentile");
  });

  test("numbers NOT adjacent to a scale name never become candidates", async () => {
    const { ir, entities } = await extractFixture("entity-sample.docx");
    // "Room 214" and "3 sessions" live in scale-free paragraphs.
    const roomEl = ir.elements.find((e) => e.text.includes("Room 214"))!;
    const sessionsEl = ir.elements.find((e) => e.text.includes("3 sessions"))!;
    for (const s of entities.scores) {
      expect(s.anchor.elementId).not.toBe(roomEl.id);
      expect(s.anchor.elementId).not.toBe(sessionsEl.id);
    }
    expect(entities.scores.some((s) => s.value === 214)).toBe(false);
  });
});

describe("entity map: side inputs outrank extraction", () => {
  test("with no side inputs, extraction fills the map with provenance 'extracted'", async () => {
    const { entities } = await extractFixture("entity-sample.docx");
    const map = buildEntityMap(entities);
    expect(map.studentName).toMatchObject({ value: "Jordan Sample", source: "extracted" });
    expect(map.pronouns).toMatchObject({ value: "he_him", source: "extracted" });
    expect(map.dob).toMatchObject({ value: "2015-03-14", source: "extracted" });
    expect(map.keyDates.consent_date).toMatchObject({ value: "2025-11-02", source: "extracted" });
    expect(map.keyDates.report_date).toMatchObject({ value: "2026-01-09", source: "extracted" });
    // Two evaluation dates exist; the map takes the textually-first one.
    expect(map.keyDates.evaluation_date).toMatchObject({ value: "2025-12-01", source: "extracted" });
    // Side-input-only fields stay null — extraction never guesses them.
    expect(map.reportType).toBeNull();
    expect(map.category).toBeNull();
    expect(map.state).toBeNull();
  });

  test("user-confirmed side inputs win every conflict", async () => {
    const { entities } = await extractFixture("entity-sample.docx");
    const map = buildEntityMap(entities, {
      studentName: "J. S.",
      pronouns: "they_them",
      dob: "2015-03-15",
      keyDates: { consent_date: "2025-11-03" },
      reportType: "psychoeducational",
      category: "OHI",
      state: "SC",
    });
    expect(map.studentName).toEqual({ value: "J. S.", source: "user_confirmed", anchors: [] });
    expect(map.pronouns).toMatchObject({ value: "they_them", source: "user_confirmed" });
    expect(map.dob).toMatchObject({ value: "2015-03-15", source: "user_confirmed" });
    expect(map.keyDates.consent_date).toMatchObject({
      value: "2025-11-03",
      source: "user_confirmed",
    });
    // Unconfirmed key dates still come from extraction.
    expect(map.keyDates.report_date).toMatchObject({ source: "extracted" });
    expect(map.state).toMatchObject({ value: "SC", source: "user_confirmed" });
    // The raw extraction stays available for the confirmation screen.
    expect(map.candidates.names[0]!.text).toBe("Jordan Sample");
  });

  test("clean document with nothing to extract yields an empty map, not guesses", async () => {
    const { entities } = await extractFixture("basic-score-table.docx");
    const map = buildEntityMap(entities);
    expect(map.studentName).toBeNull();
    expect(map.pronouns).toBeNull();
    expect(map.dob).toBeNull();
    expect(map.keyDates).toEqual({});
  });
});
