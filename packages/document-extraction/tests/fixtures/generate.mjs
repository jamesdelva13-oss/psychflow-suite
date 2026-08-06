// Generator for the two synthetic docx test fixtures.
//
// These are SYNTHETIC — no real student data ever enters this repo (CLAUDE.md).
// A .docx is a ZIP of XML, so we author word/document.xml directly (via JSZip)
// with known content and structure, which lets the parser tests assert exact
// cell addressing and character offsets. Run with: npm run fixtures
//
//   basic-score-table.docx   a clean 5-column score table
//                             (Scale | Score | 95% CI | %ile | Classification)
//   awkward-structure.docx    a full-width banner + a vMerge + a partial
//                             (ambiguous) horizontal merge, plus a table split
//                             across a page break with a repeated header.

import JSZip from "jszip";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXED_DATE = new Date("2026-01-01T00:00:00Z"); // deterministic zip bytes

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// --- OOXML building blocks -------------------------------------------------

function para(text, { style, bold } = {}) {
  const pPr = style ? `<w:pPr><w:pStyle w:val="${esc(style)}"/></w:pPr>` : "";
  const rPr = bold ? "<w:rPr><w:b/></w:rPr>" : "";
  const run = text
    ? `<w:r>${rPr}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`
    : "";
  return `<w:p>${pPr}${run}</w:p>`;
}

function pageBreakPara() {
  return `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
}

// cell descriptor: { text?, gridSpan?, vMerge?: "restart" | "continue" }
function cell(c) {
  const parts = [];
  if (c.gridSpan && c.gridSpan > 1) parts.push(`<w:gridSpan w:val="${c.gridSpan}"/>`);
  if (c.vMerge) parts.push(`<w:vMerge${c.vMerge === "restart" ? ' w:val="restart"' : ""}/>`);
  const tcPr = parts.length ? `<w:tcPr>${parts.join("")}</w:tcPr>` : "";
  const body = c.text
    ? `<w:p><w:r><w:t xml:space="preserve">${esc(c.text)}</w:t></w:r></w:p>`
    : `<w:p/>`;
  return `<w:tc>${tcPr}${body}</w:tc>`;
}

function table(numColumns, rows) {
  const grid = `<w:tblGrid>${'<w:gridCol w:w="1800"/>'.repeat(numColumns)}</w:tblGrid>`;
  const trs = rows
    .map((r) => `<w:tr>${r.map(cell).join("")}</w:tr>`)
    .join("");
  return `<w:tbl><w:tblPr/>${grid}${trs}</w:tbl>`;
}

function documentXml(bodyInner) {
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
    `<w:body>${bodyInner}<w:sectPr/></w:body></w:document>`
  );
}

const CONTENT_TYPES =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
  `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
  `<Default Extension="xml" ContentType="application/xml"/>` +
  `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
  `</Types>`;

const RELS =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
  `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>` +
  `</Relationships>`;

async function writeDocx(name, bodyInner) {
  const zip = new JSZip();
  // createFolders: false — implicit folder entries get stamped with the
  // CURRENT time (ignoring `date`), which made every regeneration produce
  // different bytes. Zip readers don't need folder entries; without them the
  // output is fully deterministic.
  const opts = { date: FIXED_DATE, createFolders: false };
  zip.file("[Content_Types].xml", CONTENT_TYPES, opts);
  zip.file("_rels/.rels", RELS, opts);
  zip.file("word/document.xml", documentXml(bodyInner), opts);
  const buf = await zip.generateAsync({ type: "nodebuffer", platform: "UNIX" });
  const out = join(HERE, name);
  await writeFile(out, buf);
  console.log(`wrote ${name} (${buf.length} bytes)`);
}

// --- Fixture 1: a clean score table ---------------------------------------

const basic = [
  para("PSYCHOEDUCATIONAL EVALUATION", { style: "Title" }),
  para("Assessment Results", { style: "Heading1" }),
  para("The following table summarizes cognitive composite scores."),
  para("Scores are reported with 95% confidence intervals."),
  table(5, [
    [
      { text: "Scale" },
      { text: "Score" },
      { text: "95% CI" },
      { text: "%ile" },
      { text: "Classification" },
    ],
    [
      { text: "Verbal Comprehension" },
      { text: "108" },
      { text: "101–115" },
      { text: "70" },
      { text: "Average" },
    ],
    [
      { text: "Visual Spatial" },
      { text: "95" },
      { text: "88–102" },
      { text: "37" },
      { text: "Average" },
    ],
    [
      { text: "Working Memory" },
      { text: "112" },
      { text: "104–120" },
      { text: "79" },
      { text: "High Average" },
    ],
  ]),
  para("End of report."),
].join("");

// --- Fixture 2: deliberately awkward structure -----------------------------
// T1 exercises three merge cases in one grid:
//   Row 0  full-width banner (gridSpan=4)        -> parsed_ok
//   Row 2/3 vertical merge in column 0 (vMerge)  -> parsed_ok, resolves to origin
//   Row 4  partial horizontal merge cols 2-3     -> parsed_low_confidence (only there)
const awkwardTable = table(4, [
  [{ text: "Cognitive Profile Composite", gridSpan: 4 }],
  [{ text: "Domain" }, { text: "Subtest" }, { text: "Score" }, { text: "Descriptor" }],
  [
    { text: "Verbal", vMerge: "restart" },
    { text: "Vocabulary" },
    { text: "11" },
    { text: "Average" },
  ],
  [
    { vMerge: "continue" },
    { text: "Similarities" },
    { text: "10" },
    { text: "Average" },
  ],
  [
    { text: "Visual" },
    { text: "Block Design" },
    { text: "9 (Average)", gridSpan: 2 },
  ],
]);

// A single logical table split across a page break, with the header repeated on
// the continuation — the parser should rejoin it and mark the seam.
const splitPartA = table(3, [
  [{ text: "Area" }, { text: "Standard Score" }, { text: "Range" }],
  [{ text: "Reading" }, { text: "105" }, { text: "Average" }],
]);
const splitPartB = table(3, [
  [{ text: "Area" }, { text: "Standard Score" }, { text: "Range" }],
  [{ text: "Mathematics" }, { text: "98" }, { text: "Average" }],
]);

const awkward = [
  para("NEUROPSYCHOLOGICAL SUMMARY", { style: "Title" }),
  para("Cognitive Profile", { style: "Heading1" }),
  awkwardTable,
  para("Achievement", { style: "Heading1" }),
  splitPartA,
  pageBreakPara(),
  splitPartB,
  para("End of report."),
].join("");

// --- Fixture 3: entity extraction sample ------------------------------------
// SYNTHETIC student ("Jordan Sample") for the entity layer: a labeled name,
// labeled dates in both numeric and written form, he/him pronouns, a WISC-V
// mention, a score table with explicit type headers, one prose score with no
// explicit type, and negative controls (numbers not adjacent to scale names).

const entity = [
  para("CONFIDENTIAL PSYCHOEDUCATIONAL EVALUATION", { style: "Title" }),
  para("Student: Jordan Sample"),
  para("Date of Birth: 03/14/2015"),
  para("Consent Received: 11/02/2025"),
  para("Evaluation Dates: December 1, 2025 and 12/08/2025"),
  para("Report Date: 01/09/2026"),
  para("Reason for Referral", { style: "Heading1" }),
  para(
    "Jordan is a ten-year-old student referred by his classroom teacher. " +
      "He has difficulty sustaining attention, and his work completion varies. " +
      "Room 214 serves as his homeroom.",
  ),
  para("Assessment Results", { style: "Heading1" }),
  para(
    "The Wechsler Intelligence Scale for Children, Fifth Edition (WISC-V) was administered.",
  ),
  table(5, [
    [
      { text: "Index" },
      { text: "Standard Score" },
      { text: "95% CI" },
      { text: "%ile" },
      { text: "Descriptor" },
    ],
    [
      { text: "Verbal Comprehension" },
      { text: "112" },
      { text: "104–118" },
      { text: "79" },
      { text: "High Average" },
    ],
    [
      { text: "Working Memory" },
      { text: "98" },
      { text: "91–105" },
      { text: "45" },
      { text: "Average" },
    ],
    [
      { text: "Full Scale IQ" },
      { text: "104" },
      { text: "99–109" },
      { text: "61" },
      { text: "Average" },
    ],
  ]),
  para(
    "Jordan obtained a Processing Speed Index score of 88, in the Low Average range.",
  ),
  // Scale name followed by a number OUTSIDE the prose adjacency window (>80
  // chars of digit-free text between them) — must produce no candidate.
  para(
    "Fluid Reasoning was assessed through nonverbal pattern tasks; performance appeared " +
      "consistent with classroom observation across repeated sessions, and the composite " +
      "value appears in the summary table rather than here as 102.",
  ),
  // A value plausible as either a T-score or a percentile, with no explicit
  // marker — score_type must stay unknown, never inferred from the range.
  para("On the BASC-3, the Attention Problems scale was reported at 68."),
  para("He completed 3 sessions across two mornings."),
].join("");

await writeDocx("basic-score-table.docx", basic);
await writeDocx("awkward-structure.docx", awkward);
await writeDocx("entity-sample.docx", entity);
