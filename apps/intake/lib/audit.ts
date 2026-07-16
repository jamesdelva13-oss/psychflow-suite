import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Append an audit_events row. metadata must NEVER copy narrative/answer
 * content — only structural facts (ids, counts, event type). Writes go
 * through the service role so both psychologist and respondent flows can
 * record events uniformly.
 */
export async function recordAudit(args: {
  caseId: string | null;
  actor: string; // psychologist id, or `respondent:<invitationId>`
  eventType: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const svc = createServiceClient();
  const { error } = await svc.from("audit_events").insert({
    case_id: args.caseId,
    actor: args.actor,
    event_type: args.eventType,
    metadata: args.metadata ?? {},
  });
  if (error) throw error;
}
