import { notFound } from "next/navigation";
import { Drawer, Eyebrow, IconDocument, IconInterview, SourceCard } from "@suite/ui";
import { loadWorkspace } from "@/lib/case-workspace";
import { inspectDetail, materialCard } from "@/lib/materials";

/**
 * Case Materials (§8.4 / Stage C): the finalized Teacher Intake and RIE
 * Capture Sources are already here — everything organized in one place,
 * plain-language labels, provenance one click away (the Details drawer),
 * never a forensic evidence system. Evaluation-specific ingestion (and its
 * "Add materials" action) arrives with VS-3; until then the section states
 * what will appear rather than faking a control.
 */
export default async function MaterialsPage({
  params,
  searchParams,
}: {
  params: Promise<{ caseId: string }>;
  searchParams: Promise<{ inspect?: string }>;
}) {
  const { caseId } = await params;
  const { inspect } = await searchParams;
  const ws = await loadWorkspace(caseId);
  if (!ws.context) notFound();
  const ctx = ws.context;

  const referralSources = ctx.sources.filter(
    (s) => s.source.kind === "referral_form" || s.source.kind === "interview"
  );
  const inspected = inspect ? ctx.sources.find((s) => s.source.sourceId === inspect) : undefined;
  const baseHref = `/cases/${caseId}/materials`;

  return (
    <div className="stack-lg">
      <section>
        <header className="page-header">
          <h2 className="panel__title">Everything organized in one place</h2>
          <p className="page-sub">
            Teacher input and your finalized interview notes are already available for this
            evaluation.
          </p>
        </header>
        <div className="stack">
          {referralSources.map((cs) => {
            const card = materialCard(cs);
            return (
              <SourceCard
                key={card.sourceId}
                state={card.state}
                icon={card.kind === "interview" ? <IconInterview /> : <IconDocument />}
                title={card.title}
                meta={card.meta}
                summary={card.summary}
                note={card.note}
                inspectHref={`${baseHref}?inspect=${card.sourceId}`}
              />
            );
          })}
        </div>
      </section>

      <section>
        <Eyebrow>Evaluation materials</Eyebrow>
        <p className="page-sub">
          Assessment results and other evaluation-specific materials you add will appear here
          alongside the referral record.
        </p>
      </section>

      {inspected ? <SourceInspection detail={inspectDetail(inspected)} closeHref={baseHref} /> : null}
    </div>
  );
}

function SourceInspection({
  detail,
  closeHref,
}: {
  detail: ReturnType<typeof inspectDetail>;
  closeHref: string;
}) {
  return (
    <Drawer title={detail.title} closeHref={closeHref}>
      <div className="stack">
        <dl>
          {detail.provenance.map(([label, value]) => (
            <FragmentRow key={label} label={label} value={value} />
          ))}
        </dl>
        {/* inspection surface: provenance is action-relevant here (§2) */}
        <div className="spine spine--source stack">
          {detail.content.map((block) => (
            <div key={block.label}>
              <Eyebrow>{block.label}</Eyebrow>
              <p className="inspect-text">{block.text}</p>
            </div>
          ))}
        </div>
      </div>
    </Drawer>
  );
}

function FragmentRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd className={label === "Integrity checksum" ? "mono" : undefined}>{value}</dd>
    </>
  );
}
