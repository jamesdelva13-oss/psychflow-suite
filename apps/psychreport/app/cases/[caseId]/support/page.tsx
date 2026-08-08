import { notFound } from "next/navigation";
import { Panel, StatusPill } from "@suite/ui";
import { loadWorkspace } from "@/lib/case-workspace";

/**
 * Documentation Support (§8.6): Meeting Brief is the slice's one tool. Its
 * availability is a real state — it drafts from the approved report, and no
 * report exists yet — so the surface explains the state instead of showing
 * a dead control. No district-specific tools appear here.
 */
export default async function SupportPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const ws = await loadWorkspace(caseId);
  if (!ws.context) notFound();

  return (
    <Panel title="Meeting Brief">
      <div className="eval-row">
        <StatusPill tone="neutral">Available after the report is approved</StatusPill>
      </div>
      <p className="page-sub">
        Meeting Brief prepares your team-meeting summary from the approved evaluation report and
        the case record — nothing is re-entered, and nothing is created beyond what you approved.
      </p>
    </Panel>
  );
}
