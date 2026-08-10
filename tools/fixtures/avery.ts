/**
 * avery.ts — THE canonical Avery Williams fixture. One definition.
 *
 * PROCESS RULE (JD, 2026-08-09): **eval harnesses read the canonical fixture
 * and never construct their own payloads.**
 *
 * The rule exists because a harness broke it. `full-report.eval.ts` built its
 * own teacher payload with three responses — one of which, `TCH-GEN-001`, is
 * not a question in bank v1.3.0 at all — plus an invented capture summary and
 * no session notes. Every number from that run was therefore measured against
 * a case carrying roughly a fifth of the real material: flag rates, false
 * alarms, retry clearance, and the report thinness the numbers were supposed
 * to characterize. The measurements described a case that does not exist.
 *
 * The structural defence is this file. `tools/seed-avery.ts` writes these
 * objects to the dev instance and every harness imports them, so "what the
 * seed wrote" and "what the harness measured" cannot drift — they are the
 * same object. A harness that hand-rolls a case payload is now visibly doing
 * something this module exists to prevent.
 *
 * `tests/fixture-integrity.test.ts` enforces the part a shared module cannot:
 * that every teacher response id is a real question in the pinned bank. That
 * is the specific check that would have caught `TCH-GEN-001` on the commit
 * that introduced it.
 *
 * Synthetic data throughout. No real student data (directive §6).
 */

export { WIAT4_SCORE_SET } from "./avery-scores";
import { WIAT4_SCORE_SET } from "./avery-scores";

export const FIXTURE_STUDENT_REF = "avery-williams-canonical-fixture";

/** Pinned bank the teacher responses validate against (D-136). */
export const AVERY_BANK = { bankId: "teacher-intake", bankVersion: "1.3.0" } as const;

/** The `cases` row, exactly as tools/seed-avery.ts inserts it. */
export const AVERY_CASE = {
  state: "SC",
  eval_type: "initial",
  referral_date: "2026-04-20",
  status: "data_collection",
  student_ref: FIXTURE_STUDENT_REF,
  first_name: "Avery",
  last_initial: "W",
  display_initials: "A.W.",
  grade: "4",
} as const;

/** The `informants` row for the teacher. */
export const AVERY_INFORMANT = {
  role: "teacher",
  relationship: "Classroom teacher, 4th grade",
  months_known_student: 8,
} as const;

/**
 * Avery's teacher-intake responses — validated against v1.3.0 at lock time.
 * Concern: reading (decoding + fluency, well below peers, Tier 2 phonics with
 * some improvement). Strength: oral vocabulary, science curiosity, peer
 * relationships. Clinically coherent per directive §6.
 *
 * 17 of the bank's 69 questions. The nine unanswered modules
 * (self-regulation, behavior, writing, math, social/communication, cognitive,
 * emotional, adaptive, cog-adaptive screen) are a deliberate reading-only
 * design — adequate for gate testing, and NOT adequate for report-structure
 * work. See governance/canonical-fixture-requirements.md.
 */
export const TEACHER_RESPONSES: Record<string, string | string[]> = {
  "TCH-CORE-001": "gen_ed",
  "TCH-CORE-002": "4th grade, all subjects",
  "TCH-CORE-003": "6to12m",
  "TCH-CORE-005": "Core ELA block plus a Tier 2 phonics small group three times weekly",
  "TCH-CORE-006": "no",
  "TCH-CORE-007": "Strong oral vocabulary; curious about science; helpful and well-liked by peers",
  "TCH-CORE-008": ["reading"],
  "TCH-CORE-010": "prior_year",
  "TCH-CORE-011": "no",
  "TCH-CORE-012": "no",
  "TCH-RDG-001": ["decoding", "fluency"],
  "TCH-RDG-005": ["independent", "content_area"],
  "TCH-RDG-006": "well_below",
  "TCH-INT-001": "Tier 2 phonics small group since October of grade 3; classroom partner reading supports",
  "TCH-INT-004": "some_improve",
  "TCH-IMP-001":
    "Avoids independent reading; needs adult support to access grade-level text in science and social studies",
  "TCH-IMP-002":
    "Below expectations in ELA; work completion drops sharply on independent reading tasks",
};

export const CAPTURE_NOTES = [
  "Teacher interview — Ms. Rivera, 4th grade, Union Elementary (synthetic fixture).",
  "Reading: decoding breaks down on multisyllabic words; oral reading is slow and effortful.",
  "Comprehension improves markedly when text is read aloud to Avery.",
  "Strengths: strong oral vocabulary; leads small-group science discussions; peers seek Avery out.",
  "Tier 2 phonics group since Oct (gr 3); teacher reports slow but real gains on taught patterns.",
  "No attendance, vision, or hearing concerns reported.",
].join("\n");

export const CAPTURE_SUMMARY = [
  "Teacher interview corroborates the referral concern: word-level reading (decoding of",
  "multisyllabic words, oral reading fluency) well below grade expectations, with",
  "comprehension substantially stronger when text is presented orally. Strengths in oral",
  "vocabulary, science engagement, and peer relationships. Tier 2 phonics intervention in",
  "place since third grade with modest response. No sensory or attendance concerns.",
].join(" ");

/** Capture payload, minus the ids the seed mints at write time. */
export const CAPTURE_PAYLOAD = {
  kind: "interview",
  setting: "Union Elementary — teacher interview",
  occurredOn: "2026-05-05",
  notes: CAPTURE_NOTES,
  summaryFinal: CAPTURE_SUMMARY,
  summaryProvenance: null, // clinician-authored; no model proposal in play
  finalizedAt: "2026-05-05T19:00:00.000Z",
} as const;

export const COLLECTED_ON = {
  teacher: "2026-04-28",
  capture: "2026-05-05",
  scores: WIAT4_SCORE_SET.administeredOn,
} as const;

/* ------------------------------------------------------------------ *
 * In-memory case, for harnesses that run without a database.
 *
 * These are the SAME payload objects the seed writes, assembled into the row
 * shapes `buildCaseContext` accepts. A harness calling this cannot be
 * measuring a different case from the one on the dev instance.
 * ------------------------------------------------------------------ */

/**
 * Row shapes mirror the database schema. They are declared here rather than
 * imported from apps/psychreport so the fixture stays a leaf — a fixture that
 * depends on an app cannot also be shared with the seed, which is a tool.
 */
export interface FixtureCaseRow {
  id: string;
  psychologist_id: string;
  state: string;
  eval_type: string;
  referral_date: string;
  status: string;
  first_name: string | null;
  last_initial: string | null;
  display_initials: string;
  grade: string;
  student_ref: string;
  priority_flag: boolean;
  created_at: string;
  deleted_at: string | null;
}

export interface FixtureSourceRow {
  id: string;
  case_id: string;
  informant_id: string | null;
  kind: string;
  collected_on: string;
  instrument: string | null;
  bank_id: string | null;
  bank_version: string | null;
  payload: unknown;
  locked: boolean;
  checksum: string | null;
  version: number;
  supersedes_source_id: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface FixtureRows {
  caseRow: FixtureCaseRow;
  sourceRows: FixtureSourceRow[];
}

const IDS = {
  case: "aaaaaaaa-0000-4000-8000-000000000001",
  teacher: "aaaaaaaa-0000-4000-8000-000000000002",
  capture: "aaaaaaaa-0000-4000-8000-000000000003",
  scores: "aaaaaaaa-0000-4000-8000-000000000004",
} as const;

export function averyFixtureRows(): FixtureRows {
  return {
    caseRow: {
      id: IDS.case,
      psychologist_id: "aaaaaaaa-0000-4000-8000-0000000000ff",
      ...AVERY_CASE,
      priority_flag: false,
      // The resolver's shape expects a status the writer runs under; the
      // seed's `data_collection` is the pre-assessment state.
      status: "assessment",
      created_at: "2026-04-20T12:00:00Z",
      deleted_at: null,
    },
    sourceRows: [
      {
        id: IDS.teacher,
        case_id: IDS.case,
        informant_id: null,
        kind: "referral_form",
        collected_on: COLLECTED_ON.teacher,
        instrument: null,
        bank_id: AVERY_BANK.bankId,
        bank_version: AVERY_BANK.bankVersion,
        payload: { responses: TEACHER_RESPONSES },
        locked: true,
        checksum: "canonical-fixture",
        version: 1,
        supersedes_source_id: null,
        created_at: "2026-04-28T14:30:00Z",
        deleted_at: null,
      },
      {
        id: IDS.capture,
        case_id: IDS.case,
        informant_id: null,
        kind: "interview",
        collected_on: COLLECTED_ON.capture,
        instrument: "capture",
        bank_id: null,
        bank_version: null,
        payload: CAPTURE_PAYLOAD,
        locked: true,
        checksum: "canonical-fixture",
        version: 1,
        supersedes_source_id: null,
        created_at: "2026-05-05T19:00:00Z",
        deleted_at: null,
      },
      {
        id: IDS.scores,
        case_id: IDS.case,
        informant_id: null,
        kind: "score_set",
        collected_on: COLLECTED_ON.scores,
        instrument: WIAT4_SCORE_SET.instrument,
        bank_id: null,
        bank_version: null,
        payload: WIAT4_SCORE_SET,
        locked: true,
        checksum: "canonical-fixture",
        version: 1,
        supersedes_source_id: null,
        created_at: "2026-05-19T12:00:00Z",
        deleted_at: null,
      },
    ],
  };
}
