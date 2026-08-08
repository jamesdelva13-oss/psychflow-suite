import { Eyebrow, Panel, StatusPill } from "@suite/ui";
import { Shell } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { listCases } from "@/lib/cases";
import { TEMPLATES } from "@/lib/templates";

/**
 * Templates (§8.1). The slice carries exactly one synthetic district-style
 * template — the VS-7 export target. The outline is shown so the mapping
 * destination is inspectable; export itself requires an approved report.
 */
export default async function TemplatesPage() {
  const { supabase, displayName } = await requireUser();
  const cases = await listCases(supabase);

  return (
    <Shell activeHref="/templates" displayName={displayName} cases={cases}>
      <header className="page-header">
        <h1 className="page-title">Templates</h1>
        <p className="page-sub">
          The approved report maps onto a template at export. Export becomes available once a
          report is approved.
        </p>
      </header>

      <div className="stack">
        {TEMPLATES.map((t) => (
          <Panel key={t.id} title={t.name}>
            <p className="page-sub">{t.origin}</p>
            <div className="template-outline">
              <Eyebrow>Sections</Eyebrow>
              <ol className="template-outline__list">
                {t.sections.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              <StatusPill tone="neutral">Export target for psychological evaluations</StatusPill>
            </div>
          </Panel>
        ))}
      </div>
    </Shell>
  );
}
