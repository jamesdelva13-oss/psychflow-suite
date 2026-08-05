import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Append an audit_events row. metadata must NEVER copy narrative/answer
 * content — only structural facts (ids, counts, event type). Writes go
 * through the service role so both psychologist and respondent flows can
 * record events uniformly.
 */
/**
 * Mechanical enforcement of the no-narrative rule: audit metadata carries
 * structural facts (ids, counts, short enum-ish strings), never content.
 * Any string long enough to smuggle prose is a programming error — throw so
 * the offending call site fails loudly in development and tests.
 */
export function assertStructuralMetadata(
  value: unknown,
  path = "metadata"
): void {
  if (typeof value === "string") {
    if (value.length > 160) {
      throw new Error(
        `audit ${path} looks like narrative content (${value.length} chars); audit metadata must stay structural`
      );
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => assertStructuralMetadata(v, `${path}[${i}]`));
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      assertStructuralMetadata(v, `${path}.${k}`);
    }
  }
}

export async function recordAudit(args: {
  caseId: string | null;
  actor: string; // psychologist id, or `respondent:<invitationId>`
  eventType: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  assertStructuralMetadata(args.metadata ?? {});
  const svc = createServiceClient();
  const { error } = await svc.from("audit_events").insert({
    case_id: args.caseId,
    actor: args.actor,
    event_type: args.eventType,
    metadata: args.metadata ?? {},
  });
  if (error) throw error;
}
