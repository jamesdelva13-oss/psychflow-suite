import { notFound } from "next/navigation";
import { LinkButton, Panel, StatusPill } from "@suite/ui";
import { loadWorkspace } from "@/lib/case-workspace";
import { statusLabel } from "@/lib/labels";

/**
 * Evaluations (§8.5): only the Psychological Evaluation — no other
 * profession's work appears in the standalone case. The primary action follows
 * the evaluation's real state; the writer itself arrives in VS-3, so while
 * the case is still collecting information the action leads to the
 * materials that drafting will draw on.
 */
export default async function EvaluationsPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const ws = await loadWorkspace(caseId);
  if (!ws.context) notFound();
  const ctx = ws.context;

  return (
    <Panel title="Psychological evaluation">
      <div className="eval-row">
        <StatusPill tone={ctx.status === "complete" ? "ok" : "neutral"}>
          {statusLabel(ctx.status)}
        </StatusPill>
      </div>
      <p className="page-sub">
        Reviewed teacher input, interview material, observations, and scores are available to the
        report writer without re-entering them.
      </p>
      <div className="case-status__action">
        <LinkButton variant="primary" href={`/cases/${caseId}/materials`}>
          Review materials
        </LinkButton>
      </div>
    </Panel>
  );
}
