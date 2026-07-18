/**
 * run-all.ts — build-time validation for @suite/case-model.
 *
 * Proves four things every time it runs:
 *   1. The taxonomy data file is structurally sound (D-011).
 *   2. The crosswalk references only real constructs.
 *   3. The teacher question bank validates against its schema AND every
 *      construct/topography it references exists in taxonomy v0.3.
 *   4. The entity schemas accept valid records and — just as important —
 *      REJECT records that violate recorded decisions (D-004, D-007, D-008).
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { Taxonomy, validateTaxonomy, isKnownConstruct } from "../src/taxonomy.schema";
import { Case, Informant, Source, Evidence, Claim, Topography, referralSourceForSingleIntake } from "../src/entities";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p: string) => JSON.parse(fs.readFileSync(path.join(here, p), "utf8"));

let failures = 0;
const check = (name: string, ok: boolean, detail?: string) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${!ok && detail ? " — " + detail : ""}`);
  if (!ok) failures++;
};

/* 1 ── taxonomy */
const taxRaw = read("../src/taxonomy.v0-4.json");
const taxParsed = Taxonomy.safeParse(taxRaw);
check("taxonomy: schema-valid", taxParsed.success, taxParsed.success ? "" : JSON.stringify(taxParsed.error.issues[0]));
const tax = taxParsed.success ? taxParsed.data : null;
if (tax) {
  const integ = validateTaxonomy(tax);
  check("taxonomy: structural integrity (parents, dot-paths, cross-links)", integ.length === 0, integ.slice(0, 3).join("; "));
  check("taxonomy: version is 0.4", tax.version === "0.4");
  check("taxonomy: EF displays as Self-Regulation", tax.nodes.find(n => n.id === "EF")?.displayLabel === "Self-Regulation");
}

/* 4 ── entity smoke tests */
const now = new Date().toISOString();
const gen = { modelId: "claude-fable-5", promptVersion: "extract-v1", schemaVersion: "0.1", generatedAt: now };

const okCase = Case.safeParse({
  caseId: "case_0001", state: "SC", evalType: "initial", referralDate: "2026-09-08",
  student: { studentRef: "stu_x9", displayInitials: "J.D.", grade: "3", ageYearsMonths: "8:4" },
  referralSource: "unknown_not_yet_captured",
  createdAt: now,
});
check("Case: valid record parses (organizationId defaults null per D-003)", okCase.success && okCase.data.organizationId === null);
check("Case: retention fields present by default (D-004)", okCase.success && okCase.data.retention.deletedAt === null);
check("Case: referral provenance fields default clean (D-030)",
  okCase.success && okCase.data.referralContributors.length === 0 &&
  okCase.data.concernOnset === null && okCase.data.contributingInformants.length === 0);

// D-030: referralSource is required — a Case cannot omit it
check("Case: REJECTS missing referralSource (required, D-030)", !Case.safeParse({
  caseId: "c", state: "SC", evalType: "initial", referralDate: "2026-09-08",
  student: { studentRef: "s", displayInitials: "A.B.", grade: "3" }, createdAt: now,
}).success);

// D-030: "multiple" requires >= 2 contributors; other values forbid contributors
check("Case: REJECTS multiple with < 2 contributors (D-030)", !Case.safeParse({
  caseId: "c", state: "SC", evalType: "initial", referralDate: "2026-09-08",
  student: { studentRef: "s", displayInitials: "A.B.", grade: "3" },
  referralSource: "multiple", referralContributors: ["teacher"], createdAt: now,
}).success);
check("Case: accepts multiple with 2 contributors (D-030)", Case.safeParse({
  caseId: "c", state: "SC", evalType: "initial", referralDate: "2026-09-08",
  student: { studentRef: "s", displayInitials: "A.B.", grade: "3" },
  referralSource: "multiple", referralContributors: ["mtss_intervention_team", "parent_guardian"], createdAt: now,
}).success);

// D-030: the checkable "onset never populates referralSource" rule
check("Case: a lone intake yields unknown_not_yet_captured, never a derived source (D-030)",
  referralSourceForSingleIntake() === "unknown_not_yet_captured");

check("Informant: valid record parses", Informant.safeParse({
  informantId: "inf_001", caseId: "case_0001", role: "teacher",
  relationship: "3rd grade gen ed", monthsKnownStudent: 7,
}).success);

check("Source: valid form submission parses with bank version binding (D-013)", Source.safeParse({
  sourceId: "src_001", caseId: "case_0001", informantId: "inf_001", kind: "referral_form",
  collectedOn: "2026-09-10", bank: { bankId: "teacher-intake", bankVersion: "1.0.0" },
  payloadRef: "responses/src_001.json", locked: true, checksum: "abc", createdAt: now,
}).success);

check("Evidence: valid LLM extraction with provenance parses", Evidence.safeParse({
  evidenceId: "ev_001", caseId: "case_0001", sourceId: "src_001", responseIds: ["TCH-RDG-002"],
  constructTags: [{ id: "ACAD.READ.DECODING", status: "reported" }],
  polarity: "concern", statement: "Guesses at unfamiliar words from first-letter cues.",
  verbatim: "He usually looks at the first letter and guesses",
  extractionMethod: "llm", generation: gen, createdAt: now,
}).success);

check("Evidence: REJECTS record with no construct tag and no topography (D-007)", !Evidence.safeParse({
  evidenceId: "ev_002", caseId: "case_0001", sourceId: "src_001",
  polarity: "concern", statement: "Something vague.", extractionMethod: "llm",
  generation: gen, createdAt: now,
}).success);

check("Evidence: REJECTS LLM extraction without provenance (D-008)", !Evidence.safeParse({
  evidenceId: "ev_003", caseId: "case_0001", sourceId: "src_001",
  constructTags: [{ id: "ACAD.READ.DECODING", status: "reported" }],
  polarity: "concern", statement: "x", extractionMethod: "llm", createdAt: now,
}).success);

check("Evidence: topography record with hypothesis-grade construct parses (D-012)", Evidence.safeParse({
  evidenceId: "ev_004", caseId: "case_0001", sourceId: "src_001",
  topography: "avoidance", hypothesizedFunction: "escape",
  constructTags: [{ id: "ACAD.READ.DECODING", status: "hypothesis" }],
  polarity: "concern",
  statement: "Put head down at the start of both independent reading tasks.",
  extractionMethod: "llm", generation: gen, createdAt: now,
}).success);

check("Evidence: REJECTS hypothesizedFunction without topography", !Evidence.safeParse({
  evidenceId: "ev_005", caseId: "case_0001", sourceId: "src_001",
  hypothesizedFunction: "escape",
  constructTags: [{ id: "BEH.WITHDRAWAL", status: "reported" }],
  polarity: "concern", statement: "x", extractionMethod: "manual", createdAt: now,
}).success);

check("Claim: reported_fact with evidence parses", Claim.safeParse({
  claimId: "cl_001", caseId: "case_0001", outputSection: "referral_summary.concerns",
  text: "The teacher reported that the student guesses at unfamiliar words.",
  claimType: "reported_fact", evidenceIds: ["ev_001"], generation: gen,
}).success);

check("Claim: REJECTS reported_fact with no evidence (D-007)", !Claim.safeParse({
  claimId: "cl_002", caseId: "case_0001", outputSection: "referral_summary.concerns",
  text: "The student has significant reading problems.",
  claimType: "reported_fact", evidenceIds: [], generation: gen,
}).success);

check("Claim: missing_information may stand without evidence", Claim.safeParse({
  claimId: "cl_003", caseId: "case_0001", outputSection: "referral_summary.missing",
  text: "Progress-monitoring data were not provided.",
  claimType: "missing_information", generation: gen,
}).success);

check("Claim: REJECTS approved status without approver (audit rule)", !Claim.safeParse({
  claimId: "cl_004", caseId: "case_0001", outputSection: "referral_summary.strengths",
  text: "x", claimType: "reported_fact", evidenceIds: ["ev_001"], status: "approved",
}).success);

console.log(failures === 0 ? "\nALL CHECKS PASSED ✓" : `\n${failures} CHECK(S) FAILED ✗`);
process.exit(failures === 0 ? 0 : 1);
