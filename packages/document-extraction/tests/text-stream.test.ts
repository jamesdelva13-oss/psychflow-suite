// Offset-model tests. The IR stores only per-element LOCAL anchors; the global
// text stream is derived. This proves a span in a non-first paragraph resolves
// to the same text via both the canonical local anchor and the derived global
// map — i.e. the two views cannot disagree.

import { test, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parseDocx } from "../src/parsers/docx.js";
import { isParagraph } from "../src/ir/types.js";
import { buildGlobalTextStream, localToGlobal, globalToLocal } from "../src/ir/text-stream.js";

const loadFixture = (name: string) =>
  readFile(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)));

test("a span in the second body paragraph resolves the same via local anchor and derived global map", async () => {
  const ir = await parseDocx(await loadFixture("basic-score-table.docx"));

  // The second body paragraph, deep enough that its global offset is non-zero.
  const paragraphs = ir.elements.filter(isParagraph);
  const target = paragraphs.find((p) => p.text.includes("confidence intervals"))!;
  expect(target.text).toBe("Scores are reported with 95% confidence intervals.");

  // A local span within that element: the word "confidence".
  const localStart = target.text.indexOf("confidence");
  const localEnd = localStart + "confidence".length;
  const viaLocal = target.text.slice(localStart, localEnd);
  expect(viaLocal).toBe("confidence");

  // Resolve the identical span through the derived global stream.
  const stream = buildGlobalTextStream(ir.elements);
  const globalStart = localToGlobal(stream, target.id, localStart);
  const globalEnd = localToGlobal(stream, target.id, localEnd);
  const viaGlobal = stream.text.slice(globalStart, globalEnd);

  // Same text through both paths — the anchors and the derived map agree.
  expect(viaGlobal).toBe(viaLocal);

  // The element is genuinely mid-document, so the map did real work (not a
  // trivial identity where local == global).
  expect(globalStart).toBeGreaterThan(0);

  // And the reverse mapping round-trips back to the canonical local anchor.
  expect(globalToLocal(stream, globalStart)).toEqual({
    elementId: target.id,
    localOffset: localStart,
  });
});

test("the derived stream contains every element's text at its mapped position", async () => {
  const ir = await parseDocx(await loadFixture("basic-score-table.docx"));
  const stream = buildGlobalTextStream(ir.elements);
  for (const el of ir.elements) {
    const seg = stream.segments.find((s) => s.elementId === el.id)!;
    expect(stream.text.slice(seg.start, seg.start + seg.length)).toBe(el.text);
  }
});
