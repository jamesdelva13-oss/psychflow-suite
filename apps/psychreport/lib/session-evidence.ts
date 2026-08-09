import type { PolicedSource } from "./source-policy";
import { buildScoreRows, type ScoreSetPayload, type ScoreVerification } from "./scores";

/**
 * session-evidence.ts — what counts as documented testing-session evidence,
 * and what each item is structurally capable of documenting.
 *
 * Governed by D-140 and `governance/session-fidelity-adjudicator-v1.md` §3.
 * Pure: no model, no I/O. The adjudicator receives exactly what this module
 * returns, verbatim.
 *
 * The distinction below is a CODE-LEVEL fact, not a judgment call. A score
 * set physically contains an instrument, a date, a form, and numbers — there
 * is no session narrative in it to read, so it can never license a claim
 * about how the session went. A clinician-authored observation contains
 * whatever the clinician wrote, so its scope is whatever its text says and
 * the adjudicator reads it directly. Classifying WHICH session dimensions a
 * narrative documents is the adjudicator's judgment, deliberately not
 * pre-empted here (D-140: evidence for one dimension does not license
 * assertions about another).
 */

export type SessionEvidenceScope =
  /** Whatever the clinician's text says; the adjudicator reads it verbatim. */
  | "NARRATIVE"
  /** Only that named measures were administered. Nothing about the session. */
  | "ADMINISTRATION_FACTS_ONLY";

export interface SessionEvidenceItem {
  sourceId: string;
  kind: string;
  label: string;
  scope: SessionEvidenceScope;
  /** The exact text handed to the adjudicator. */
  text: string;
}

/**
 * Source kinds carrying clinician-authored or clinician-verified session
 * narrative. "Clinician-verified" is the condition, not manual typing:
 * dictated notes and imported testing notes qualify once the clinician has
 * confirmed them (D-140).
 *
 * `session_notes` / `testing_notes` do not exist in the schema yet; they are
 * listed so that the day a session-notes source lands, it is recognized here
 * rather than falling silently outside the evidence set.
 *
 * `interview` is deliberately ABSENT. RIE Capture records a teacher
 * conversation — `capturePolicy` fixes informant TEACHER, setting SCHOOL — so
 * it documents nothing about the student's evaluation session. When Capture
 * gains a testing-session setting, it enters here and the spec table is
 * amended; until then its absence is the honest answer.
 */
export const SESSION_NARRATIVE_KINDS = ["observation", "session_notes", "testing_notes"];

interface NarrativePayload {
  setting?: string;
  occurredOn?: string;
  notes?: string;
  text?: string;
  summaryFinal?: string | null;
}

function narrativeText(cs: PolicedSource): string {
  const p = (cs.payload ?? {}) as NarrativePayload;
  const head = [
    cs.label,
    p.setting ? `setting: ${p.setting}` : null,
    `recorded ${p.occurredOn ?? cs.source.collectedOn}`,
  ]
    .filter(Boolean)
    .join(" — ");

  const body = [p.summaryFinal, p.notes, p.text].filter(Boolean).join("\n\n");

  // A narrative source with no readable text documents nothing. Say so
  // rather than emitting an empty block the adjudicator might read as
  // permissive.
  return body.trim()
    ? `${head}\n${body.trim()}`
    : `${head}\n(This record contains no session narrative.)`;
}

/**
 * The administration record. Only subtests actually RELEASED to the writer
 * appear: a score withheld pending verification never reached the drafting
 * model (report-plan.ts renderSource), and must not reach the adjudicator
 * either. The wording states the scope limit inside the evidence itself, so
 * the constraint survives independently of the adjudicator's prompt.
 */
function administrationText(cs: PolicedSource, verifications: ScoreVerification[]): string {
  const payload = cs.payload as ScoreSetPayload;
  const rows = buildScoreRows(payload, verifications, cs.source.sourceId);
  const released = rows.filter((r) => !r.needsVerification).map((r) => r.subtest);
  const list = released.length ? released.join("; ") : "(no subtest released to the writer)";
  return (
    `${payload.instrument}, administered ${payload.administeredOn} (${payload.form}).\n` +
    `Subtests administered: ${list}.\n` +
    `This is an administration record only. It documents THAT these measures were ` +
    `administered on this date. It documents nothing about how the session was ` +
    `conducted, what the examiner did, how the student behaved, how many items were ` +
    `attempted or answered, or whether any discontinue, basal, or ceiling rule was reached.`
  );
}

/**
 * The session evidence supplied to one section's generation — built from the
 * sources that section was actually gated to, never from the whole case. A
 * section is judged against what it was given.
 */
export function sessionEvidenceFor(
  sources: PolicedSource[],
  verifications: ScoreVerification[]
): SessionEvidenceItem[] {
  const items: SessionEvidenceItem[] = [];
  for (const cs of sources) {
    const kind = cs.source.kind;
    if (SESSION_NARRATIVE_KINDS.includes(kind)) {
      items.push({
        sourceId: cs.source.sourceId,
        kind,
        label: cs.label,
        scope: "NARRATIVE",
        text: narrativeText(cs),
      });
    } else if (kind === "score_set") {
      items.push({
        sourceId: cs.source.sourceId,
        kind,
        label: cs.label,
        scope: "ADMINISTRATION_FACTS_ONLY",
        text: administrationText(cs, verifications),
      });
    }
  }
  return items;
}

/**
 * Render the evidence set for the adjudicator. An EMPTY set renders as an
 * explicit statement of emptiness, never as an absent block: "no session
 * evidence" must read to the judge as "every session assertion is
 * unsupported," which is exactly the Avery case as it stands today.
 */
export function renderSessionEvidence(items: SessionEvidenceItem[]): string {
  if (items.length === 0) {
    return (
      "SESSION EVIDENCE SUPPLIED FOR THIS SECTION: NONE.\n" +
      "No testing-session or observation record was supplied to the writer for " +
      "this section. Therefore NO statement about an administration event, " +
      "examinee behavior during a session, examiner action, or session condition " +
      "is documented, and any such statement in the section is unsupported."
    );
  }
  const blocks = items.map(
    (i) => `[${i.scope}] ${i.label} (${i.kind})\n${i.text}`
  );
  return "SESSION EVIDENCE SUPPLIED FOR THIS SECTION\n\n" + blocks.join("\n\n");
}
