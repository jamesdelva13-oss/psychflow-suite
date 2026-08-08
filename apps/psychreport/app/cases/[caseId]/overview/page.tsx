import { notFound } from "next/navigation";
import { LinkButton, Panel } from "@suite/ui";
import { loadWorkspace } from "@/lib/case-workspace";
import { buildOverview } from "@/lib/overview";
import { statusProgress } from "@/lib/labels";

/**
 * Overview (§8.3): one calm screen — a readiness sentence, one next best
 * action, the evaluation state, and one quiet reuse message. No queue
 * cards, no audit summaries, no repeated badges.
 */
export default async function OverviewPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const ws = await loadWorkspace(caseId);
  if (!ws.context) notFound();
  const overview = buildOverview(ws.context);
  const progress = statusProgress(ws.context.status);

  return (
    <Panel>
      <h2 className="panel__title">{overview.readiness}</h2>
      <div className="case-status__progress">
        <div
          className="case-status__progress-fill"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
      <p className="case-status__sentence">{overview.evaluationState}</p>
      {overview.reuseMessage ? <p className="overview-reuse">{overview.reuseMessage}</p> : null}
      <div className="case-status__action">
        <LinkButton variant="primary" href={overview.nextAction.href}>
          {overview.nextAction.label}
        </LinkButton>
      </div>
    </Panel>
  );
}
