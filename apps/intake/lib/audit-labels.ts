// Human-sentence rendering of audit events (RIE voice: statuses read as
// sentences, never as indicator codes). Every event type recordAudit is
// called with MUST have an entry here — tests enforce the pairing, so adding
// an event without a label is a failing test, not a silent "unknown event".

export const KNOWN_EVENT_TYPES = [
  "case_created",
  "case_deleted",
  "invitation_created",
  "invitation_email_sent",
  "invitation_revoked",
  "response_opened",
  "response_submitted",
  "capture_session_created",
  "capture_summary_proposed",
  "capture_finalized",
] as const;

export type KnownEventType = (typeof KNOWN_EVENT_TYPES)[number];

type Meta = Record<string, unknown>;

const kindPhrase = (m: Meta) =>
  typeof m.kind === "string" ? ` (${m.kind})` : "";

const LABELS: Record<KnownEventType, (m: Meta, self: boolean) => string> = {
  case_created: (_m, self) =>
    self ? "You created this case" : "The case was created",
  case_deleted: () => "The case was permanently deleted",
  invitation_created: (m) =>
    `A secure ${typeof m.role === "string" ? String(m.role).replace(/_/g, " ") : "respondent"} intake was created`,
  invitation_email_sent: (m) =>
    `The secure ${typeof m.role === "string" ? String(m.role).replace(/_/g, " ") : "respondent"} intake was emailed to the respondent`,
  invitation_revoked: () => "An intake invitation was revoked",
  response_opened: () => "The respondent opened their intake form",
  response_submitted: () =>
    "The respondent submitted their intake — locked into the case record",
  capture_session_created: (m, self) =>
    `${self ? "You started" : "Started"} a capture session${kindPhrase(m)}`,
  capture_summary_proposed: (m) =>
    `The model drafted a capture summary — a proposal awaiting review${
      typeof m.model === "string" ? ` (${m.model})` : ""
    }`,
  capture_finalized: (m, self) =>
    `${self ? "You confirmed and finalized" : "Finalized"} a capture session${
      m.hasSummary === false ? " (notes only)" : ""
    } — locked into the case record`,
};

export function describeAuditEvent(
  eventType: string,
  metadata: Meta,
  opts: { self: boolean }
): string {
  const render = LABELS[eventType as KnownEventType];
  if (render) return render(metadata ?? {}, opts.self);
  // Unknown types render honestly rather than breaking the page; the test
  // suite is what keeps this branch from being reachable in practice.
  return eventType.replace(/_/g, " ");
}
