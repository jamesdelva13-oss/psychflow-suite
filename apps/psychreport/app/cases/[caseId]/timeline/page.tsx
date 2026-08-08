import { notFound } from "next/navigation";
import { CaseActivity, EmptyState, IconDocument, Panel } from "@suite/ui";
import { requireUser } from "@/lib/auth";
import { loadWorkspace } from "@/lib/case-workspace";
import { buildTimeline, type AuditRow } from "@/lib/timeline";

/**
 * Timeline (§8.7): meaningful case milestones drawn from the audit trail —
 * a professional workflow view, not a raw audit viewer. The mapping (and
 * what it deliberately drops) lives in lib/timeline.ts.
 */
export default async function TimelinePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const ws = await loadWorkspace(caseId);
  if (!ws.context) notFound();

  const { supabase } = await requireUser();
  const { data: rows, error } = await supabase
    .from("audit_events")
    .select("actor, event_type, created_at, metadata")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const entries = buildTimeline((rows ?? []) as AuditRow[], {
    ownerId: ws.ownerId,
    ownerName: ws.displayName,
  });

  return (
    <Panel title="Case milestones">
      {entries.length === 0 ? (
        <EmptyState
          icon={<IconDocument size={28} />}
          sentence="Milestones appear here as the case moves — intake received, summaries finalized, sections reviewed, report exported."
        />
      ) : (
        <CaseActivity
          entries={entries.map((e) => ({ at: e.at, actor: e.actor, verb: e.verb }))}
        />
      )}
    </Panel>
  );
}
