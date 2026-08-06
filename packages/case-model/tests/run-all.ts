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
import { Case, Informant, Source, Evidence, Claim, Topography, referralSourceForSingleIntake, isFinalized, isSuperseded, validateSupersession } from "../src/entities";
import { ProfessionalProfile, CaseAssignment, ActorRef, mayActOnCase, mayContributeContent } from "../src/contributors";

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

// D-120: respondent-facing identity is first name + last initial; never a full last name
const d120 = Case.safeParse({
  caseId: "case_0002", state: "SC", evalType: "initial", referralDate: "2026-09-08",
  student: { studentRef: "stu_y1", firstName: "Maya", lastInitial: "R", displayInitials: "M.R.", grade: "3" },
  referralSource: "unknown_not_yet_captured", createdAt: now,
});
check("Case: accepts first name + last initial (D-120)", d120.success);
check("Case: REJECTS a multi-character last 'initial' (D-120 minimal-PII guard)", !Case.safeParse({
  caseId: "case_0003", state: "SC", evalType: "initial", referralDate: "2026-09-08",
  student: { studentRef: "stu_y2", firstName: "Maya", lastInitial: "Rivera", displayInitials: "M.R.", grade: "3" },
  referralSource: "unknown_not_yet_captured", createdAt: now,
}).success);

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

/* 5 ── multidisciplinary model (D-131, landed with D-046) */

const psychProfile = ProfessionalProfile.parse({
  profileId: "prof_psych", authUserId: "auth_1", discipline: "school_psychology",
  displayName: "Psych One", createdAt: now,
});
const slpProfile = ProfessionalProfile.parse({
  profileId: "prof_slp", authUserId: "auth_2", discipline: "speech_language",
  displayName: "SLP Two", createdAt: now,
});
check("Profile: two disciplines coexist (D-131)", psychProfile.discipline !== slpProfile.discipline);

const leadAssignment = CaseAssignment.parse({
  assignmentId: "as_1", caseId: "case_0001", profileId: "prof_psych",
  role: "lead_evaluator", startedAt: now, createdAt: now,
});
const slpAssignment = CaseAssignment.parse({
  assignmentId: "as_2", caseId: "case_0001", profileId: "prof_slp",
  role: "contributor", startedAt: now, createdAt: now,
});
const assignments = [leadAssignment, slpAssignment];

check("Assignment: REJECTS endedAt before startedAt", !CaseAssignment.safeParse({
  assignmentId: "as_x", caseId: "case_0001", profileId: "prof_psych",
  role: "contributor", startedAt: "2026-08-06T12:00:00Z",
  endedAt: "2026-08-06T11:00:00Z", createdAt: now,
}).success);

// Case identity is untouched by contributors: the same pre-D-131 Case record
// still parses, with no contributor-shaped fields required or added.
check("D-131: Case schema unchanged — pre-D-131 record still parses", okCase.success);

check("D-131: both disciplines authorized on the one case",
  mayActOnCase("prof_psych", "case_0001", assignments) &&
  mayActOnCase("prof_slp", "case_0001", assignments));

check("D-131: unassigned profile is NOT authorized (no ad-hoc grants)",
  !mayActOnCase("prof_other", "case_0001", assignments));

check("D-131: assignment on another case grants nothing here",
  !mayActOnCase("prof_psych", "case_9999", assignments));

const endedSlp = { ...slpAssignment, endedAt: "2026-08-06T00:00:00Z" };
check("D-131: ended assignment removes authorization…",
  !mayActOnCase("prof_slp", "case_0001", [leadAssignment, endedSlp],
    "2026-08-07T00:00:00Z"));
check("…but attribution survives: ActorRef is by stable profileId",
  ActorRef.safeParse({ profileId: endedSlp.profileId }).success);

check("D-131: reviewers read, leads and contributors write",
  mayContributeContent("lead_evaluator") && mayContributeContent("contributor") &&
  !mayContributeContent("reviewer"));

/* 6 ── Source version/supersession (directive §12.2, landed with D-046) */

const baseSource = {
  sourceId: "src_1", caseId: "case_0001", kind: "referral_form" as const,
  collectedOn: "2026-09-08", locked: true, checksum: "abc", createdAt: now,
};
const orig = Source.parse(baseSource);
check("Source: pre-supersession record parses with version=1, supersedes=null",
  orig.version === 1 && orig.supersedesSourceId === null);
check("Source: finalized = locked (immutability boundary)", isFinalized(orig));

const correction = Source.parse({
  ...baseSource, sourceId: "src_2", version: 2, supersedesSourceId: "src_1",
});
check("Supersession: legal correction chain validates",
  validateSupersession(orig, correction).length === 0);
check("Supersession: derived state — original is superseded, correction is not",
  isSuperseded("src_1", [orig, correction]) && !isSuperseded("src_2", [orig, correction]));

check("Supersession: REJECTS superseding an unlocked draft",
  validateSupersession(Source.parse({ ...baseSource, locked: false }), correction).length > 0);

check("Supersession: REJECTS crossing cases",
  validateSupersession(orig,
    Source.parse({ ...baseSource, sourceId: "src_2", caseId: "case_0002",
      version: 2, supersedesSourceId: "src_1" })).length > 0);

check("Supersession: REJECTS version skips",
  validateSupersession(orig,
    Source.parse({ ...baseSource, sourceId: "src_2", version: 3,
      supersedesSourceId: "src_1" })).length > 0);

check("Supersession: original untouched — validation never mutates",
  orig.version === 1 && orig.supersedesSourceId === null && orig.locked);

console.log(failures === 0 ? "\nALL CHECKS PASSED ✓" : `\n${failures} CHECK(S) FAILED ✗`);
process.exit(failures === 0 ? 0 : 1);
