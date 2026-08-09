import { notFound } from "next/navigation";
import {
  Button,
  Eyebrow,
  LinkButton,
  NeedsReview,
  NeedsReviewResolved,
  Panel,
  StatusPill,
} from "@suite/ui";
import { requireUser } from "@/lib/auth";
import { loadWorkspace } from "@/lib/case-workspace";
import { listScoreVerifications } from "@/lib/verifications";
import { buildScoreRows, isScoreSet, openVerifications, type ScoreSetPayload } from "@/lib/scores";
import { buildOverview } from "@/lib/overview";
import { policeSource } from "@/lib/source-policy";
import { verifyScore } from "./actions";

/**
 * Evaluations (§8.5) + the Stage D pre-generation moment: only the
 * Psychological Evaluation, a concise readiness statement, and the
 * action-relevant exceptions — never a mandatory data-cleaning dashboard.
 * Scores are rendered deterministically (§9.4); no model touches them.
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

  const { supabase } = await requireUser();
  const verifications = await listScoreVerifications(supabase, caseId);

  const scoreSource = ctx.currentSources.find(isScoreSet);
  const payload = scoreSource ? (scoreSource.payload as ScoreSetPayload) : null;
  const rows = scoreSource && payload
    ? buildScoreRows(payload, verifications, scoreSource.source.sourceId)
    : [];
  const open = openVerifications(rows);

  const overview = buildOverview(ctx, {
    openVerifications: open.length,
    hasScores: Boolean(scoreSource),
  });

  // The resolved ceiling this case's results currently sit at — the reason
  // verification matters, stated in plain language rather than as an enum.
  const policed = scoreSource ? policeSource(scoreSource, verifications) : null;
  const interpretable = policed ? policed.ceiling !== "DESCRIBE_ONLY" : false;

  return (
    <div className="stack-lg">
      <Panel title="Psychological evaluation">
        <div className="eval-row">
          <StatusPill tone={open.length > 0 ? "warn" : "neutral"}>
            {open.length > 0 ? "One item needs your judgment" : "Ready to draft"}
          </StatusPill>
        </div>
        <p className="page-sub">{overview.evaluationState}</p>
        <p className="page-sub">
          Reviewed teacher input, interview material, and scores are available to the report
          writer without re-entering them.
        </p>
        <div className="case-status__action">
          {/* Stage D's primary action. The writer is a sub-route of the case
              rather than a sixth tab — the five-tab shell is fixed (D-123). */}
          <LinkButton variant="primary" href={`/cases/${caseId}/report`}>
            Start the report
          </LinkButton>
          <LinkButton variant="ghost" href={`/cases/${caseId}/materials`}>
            Review materials
          </LinkButton>
        </div>
      </Panel>

      {scoreSource && payload ? (
        <Panel title="Assessment results">
          <p className="page-sub">
            {payload.instrument} · administered {payload.administeredOn} · {payload.form}
          </p>

          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Subtest</th>
                  <th>Standard score</th>
                  <th>95% CI</th>
                  <th>Percentile</th>
                  <th>Read from</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key}>
                    <td>{r.subtest}</td>
                    <td>{r.standardScore}</td>
                    <td>
                      95% CI {r.ci95[0]}–{r.ci95[1]}
                    </td>
                    <td>{r.percentile}</td>
                    <td className={r.needsVerification ? "score-flag" : "score-ok"}>
                      {r.needsVerification ? `${r.location} · needs verification` : r.location}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="stack eval-exceptions">
            {open.map((r) => (
              <NeedsReview
                key={r.key}
                issue={`${r.subtest} was read as ${r.standardScore} with low confidence. Confirm it against the protocol.`}
                detail={
                  <>
                    Read from {r.location} of the {payload.instrument} score report. Until this is
                    confirmed, results can be described in the report but not interpreted.
                  </>
                }
                action={
                  <form action={verifyScore}>
                    <input type="hidden" name="caseId" value={caseId} />
                    <input type="hidden" name="sourceId" value={scoreSource.source.sourceId} />
                    <input type="hidden" name="scoreKey" value={r.key} />
                    <Button type="submit" variant="primary" small>
                      Confirm {r.standardScore} is correct
                    </Button>
                  </form>
                }
              />
            ))}

            {rows
              .filter((r) => r.verified)
              .map((r) => (
                <NeedsReviewResolved
                  key={r.key}
                  issue={`${r.subtest} confirmed as ${r.standardScore}`}
                  who={ws.displayName}
                  at={r.verifiedAt ?? ""}
                />
              ))}
          </div>

          {interpretable ? (
            <p className="overview-reuse">
              Scores are confirmed. Results may be interpreted in the report, with the standard
              testing-session limitation stated.
            </p>
          ) : null}
        </Panel>
      ) : (
        <Panel title="Assessment results">
          <Eyebrow>Not yet added</Eyebrow>
          <p className="page-sub">
            Assessment results added to this case appear here with the scores that were identified.
          </p>
        </Panel>
      )}
    </div>
  );
}
