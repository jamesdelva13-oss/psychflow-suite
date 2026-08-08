import { notFound } from "next/navigation";
import { LinkButton, Panel } from "@suite/ui";
import { requireUser } from "@/lib/auth";
import { loadWorkspace } from "@/lib/case-workspace";
import { buildOverview } from "@/lib/overview";
import { statusProgress } from "@/lib/labels";
import { listScoreVerifications } from "@/lib/verifications";
import { buildScoreRows, isScoreSet, openVerifications, type ScoreSetPayload } from "@/lib/scores";

/**
 * Overview (§8.3): one calm screen — a readiness sentence, one next best
 * action, the evaluation state, at most one or two judgment items, and one
 * quiet reuse message. No queue cards, no audit summaries, no repeated
 * badges.
 */
export default async function OverviewPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const ws = await loadWorkspace(caseId);
  if (!ws.context) notFound();
  const ctx = ws.context;

  const { supabase } = await requireUser();
  const verifications = await listScoreVerifications(supabase, caseId);
  const scoreSource = ctx.currentSources.find(isScoreSet);
  const rows = scoreSource
    ? buildScoreRows(scoreSource.payload as ScoreSetPayload, verifications, scoreSource.source.sourceId)
    : [];

  const overview = buildOverview(ctx, {
    openVerifications: openVerifications(rows).length,
    hasScores: Boolean(scoreSource),
  });
  const progress = statusProgress(ctx.status);

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
      {overview.judgmentItems.map((item) => (
        <p key={item} className="case-status__sentence">
          {item}
        </p>
      ))}
      {overview.reuseMessage ? <p className="overview-reuse">{overview.reuseMessage}</p> : null}
      <div className="case-status__action">
        <LinkButton variant="primary" href={overview.nextAction.href}>
          {overview.nextAction.label}
        </LinkButton>
      </div>
    </Panel>
  );
}
