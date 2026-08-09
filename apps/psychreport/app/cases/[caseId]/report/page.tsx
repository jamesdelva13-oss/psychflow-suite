import { notFound } from "next/navigation";
import {
  AIProposal,
  Button,
  DocumentBody,
  DraftSection,
  Eyebrow,
  LinkButton,
  Panel,
  SectionOutline,
  type GateNotice,
} from "@suite/ui";
import { requireUser } from "@/lib/auth";
import { loadWorkspace } from "@/lib/case-workspace";
import { listScoreVerifications } from "@/lib/verifications";
import { buildGenerationInputs } from "@/lib/source-policy";
import { REPORT_PLAN, gateSection } from "@/lib/report-plan";
import {
  draftStatusOf,
  loadReportSections,
  type StoredSection,
} from "@/lib/report-sections";
import { draftSection, acceptSection, dismissSection } from "./actions";
import { SectionEditor } from "./section-editor";

/**
 * The report writer (directive Stage E).
 *
 * Layout: compact section outline on the left, document canvas in the centre.
 * The contextual assistant rail is VS-4 and is deliberately absent — the
 * report is primary, and the assistant must not become the application.
 *
 * Machine-written content renders ONLY inside AIProposal (UI rule 5). A
 * clinician's own accepted text renders as plain document body, with no
 * frame and no spine: the frames never appear on human-written content.
 */
export default async function ReportPage({
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
  const inputs = buildGenerationInputs(ctx, verifications);
  const loaded = await loadReportSections(supabase, caseId);

  const student = ctx.student.firstName ?? ctx.student.displayInitials;

  if (!loaded.available) {
    return (
      <div className="stack-lg writer__unavailable">
        <Eyebrow>Report</Eyebrow>
        <Panel title="The writer is not available on this instance yet">
          <p className="page-sub">{loaded.reason}</p>
          <p className="page-sub">
            Drafting works, but there is nowhere to store a draft, its
            provenance, or the session-fidelity verdict — so nothing is
            written until the migration runs. Apply
            <code> migrations/0009_report_sections.sql</code>, then reload.
          </p>
        </Panel>
      </div>
    );
  }

  const byKey = new Map(loaded.sections.map((s) => [s.sectionKey, s]));

  return (
    <div className="stack-lg">
      <div>
        <Eyebrow>Report</Eyebrow>
        <p className="page-sub">
          Draft sections from the material already on {student}&rsquo;s case. Nothing
          is added to the report until you accept it.
        </p>
      </div>

      <div className="writer">
        <aside className="writer__outline">
          <SectionOutline
            items={REPORT_PLAN.map((p) => ({
              key: p.key,
              title: p.title,
              status: draftStatusOf(byKey.get(p.key)),
              href: `#${p.key}`,
            }))}
          />
        </aside>

        <div className="writer__canvas">
          {REPORT_PLAN.map((plan) => {
            const stored = byKey.get(plan.key);
            const status = draftStatusOf(stored);
            const structural = gateSection(inputs, plan);

            return (
              <div id={plan.key} key={plan.key}>
                <DraftSection
                  title={plan.title}
                  status={status}
                  text={stored?.content}
                  sources={
                    stored?.generation
                      ? `Drew on ${stored.generation.sourceIds.length} source${
                          stored.generation.sourceIds.length === 1 ? "" : "s"
                        } on this case.`
                      : undefined
                  }
                  emptyAction={
                    structural.ok ? (
                      <form action={draftSection}>
                        <input type="hidden" name="caseId" value={caseId} />
                        <input type="hidden" name="sectionKey" value={plan.key} />
                        <Button type="submit" variant="primary">
                          Draft from {structural.sources.length} source
                          {structural.sources.length === 1 ? "" : "s"}
                        </Button>
                      </form>
                    ) : (
                      // The pre-generation structural refusal, unchanged
                      // (D-140 enforcement point one). An omission is missing
                      // information, never a finding.
                      <p className="page-sub">{structural.reason}</p>
                    )
                  }
                >
                  {stored ? (
                    <SectionBody caseId={caseId} section={stored} />
                  ) : null}
                </DraftSection>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * One stored version. Accepted clinician text is plain document body — no
 * proposal frame, no spine. A proposal awaiting a decision carries the frame,
 * its actions, and at most one gate notice.
 */
function SectionBody({ caseId, section }: { caseId: string; section: StoredSection }) {
  const g = section.generation;

  if (section.status === "accepted") {
    return <DocumentBody text={section.content} />;
  }

  // Shadow-mode verdicts never reach this function: `gateNoticeFor` returns
  // null unless the generation ran under enforce and ended in needs_review.
  const notice = gateNoticeFor(section);

  return (
    <AIProposal
      notice={notice}
      sources={
        g ? (
          <>
            {g.sourceIds.length} source{g.sourceIds.length === 1 ? "" : "s"} ·{" "}
            <span className="mono">{g.promptVersion}</span>
          </>
        ) : null
      }
      actions={
        <>
          <form action={acceptSection}>
            <input type="hidden" name="caseId" value={caseId} />
            <input type="hidden" name="sectionId" value={section.id} />
            <input type="hidden" name="overGateFinding" value={notice ? "1" : "0"} />
            <Button type="submit" variant="primary">
              Accept
            </Button>
          </form>
          <form action={draftSection}>
            <input type="hidden" name="caseId" value={caseId} />
            <input type="hidden" name="sectionKey" value={section.sectionKey} />
            <Button type="submit" variant="ghost">
              Regenerate
            </Button>
          </form>
          <form action={dismissSection}>
            <input type="hidden" name="caseId" value={caseId} />
            <input type="hidden" name="sectionId" value={section.id} />
            <Button type="submit" variant="ghost">
              Dismiss
            </Button>
          </form>
        </>
      }
    >
      <SectionEditor
        caseId={caseId}
        sectionKey={section.sectionKey}
        content={section.content}
      />
    </AIProposal>
  );
}

/**
 * What the clinician may be shown about the gate — the presentation-layer
 * twin of `clinicianGateNotice` in lib/generate.ts, reading the persisted
 * record rather than a live result.
 *
 * Two rules it exists to make structural:
 *   1. SHADOW IS SILENT. A shadow verdict is recorded and never rendered.
 *   2. REJECTED AND UNUSABLE ARE DIFFERENT. One is about the draft and names
 *      a statement; the other is about the check and names no statement. A
 *      sustained adjudicator outage must not read as bad writing.
 */
function gateNoticeFor(section: StoredSection): GateNotice | null {
  const g = section.generation;
  if (!g) return null;
  if (g.gateMode !== "enforce") return null;
  if (g.gateOutcome !== "needs_review") return null;

  if (g.adjudication?.verdict === "unusable") {
    return { kind: "unusable", reason: g.rejectionReason ?? g.adjudication.reason };
  }
  return {
    kind: "rejected",
    statements: g.adjudication?.unsupportedStatements ?? [],
    reason: g.rejectionReason ?? g.adjudication?.reason ?? "",
  };
}
