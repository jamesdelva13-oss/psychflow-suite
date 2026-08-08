/**
 * Timeline mapping (directive §8.7): audit_events → professional workflow
 * milestones. The Timeline is a workflow view, not a raw audit viewer —
 * only milestone-grade events render; everything else is deliberately
 * dropped here (the underlying audit trail remains in the database).
 *
 * Pure and unit-tested. Actor display rules:
 *   - the owning psychologist's auth id → their display name;
 *   - "respondent:<invitationId>" → "Teacher" (respondents are anonymous
 *     informants reached by invitation link);
 *   - "profile:<profileId>" (attributed contributors, D-131) and unknown
 *     event types are excluded from the milestone view for this slice —
 *     the standalone Psychology case renders no multidisciplinary surface.
 */

export interface AuditRow {
  actor: string;
  event_type: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export interface TimelineEntry {
  at: string;
  actor: string;
  verb: string;
}

const MILESTONES: Record<string, string> = {
  case_created: "opened the case",
  invitation_created: "requested teacher input",
  response_submitted: "submitted the intake form",
  capture_finalized: "finalized the interview summary",
  score_set_added: "added assessment results",
  score_verified: "verified a score against the protocol",
};

export function buildTimeline(
  rows: AuditRow[],
  opts: { ownerId: string; ownerName: string }
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  for (const row of rows) {
    const verb = MILESTONES[row.event_type];
    if (!verb) continue;

    let actor: string;
    if (row.actor === opts.ownerId) actor = opts.ownerName;
    else if (row.actor.startsWith("respondent:")) actor = "Teacher";
    else continue; // attributed contributors: no multidisciplinary UI in this slice

    entries.push({ at: row.created_at, actor, verb });
  }
  return entries.sort((a, b) => a.at.localeCompare(b.at));
}
