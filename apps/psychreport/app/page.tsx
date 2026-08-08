import { EmptyState, IconCases, LinkButton, Panel, StatusPill } from "@suite/ui";
import { Shell } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { listCases } from "@/lib/cases";
import { statusLabel, studentDisplayName, evalTypeLabel } from "@/lib/labels";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** Home (§8.1): one calm screen — your cases and one next action. */
export default async function HomePage() {
  const { supabase, displayName } = await requireUser();
  const cases = await listCases(supabase);
  const mostRecent = cases[0];

  return (
    <Shell activeHref="/" displayName={displayName} cases={cases}>
      <header className="page-header">
        <h1 className="page-title">
          {greeting()}, {displayName.split(" ")[0]}
        </h1>
        <p className="page-sub">
          {cases.length === 0
            ? "No open cases yet."
            : cases.length === 1
              ? "One case is in progress."
              : `${cases.length} cases are in progress.`}
        </p>
      </header>

      {cases.length === 0 ? (
        <Panel>
          <EmptyState
            icon={<IconCases size={28} />}
            sentence="Cases you open in Referral Intake appear here automatically — nothing to import."
            action={<LinkButton href="/cases">View cases</LinkButton>}
          />
        </Panel>
      ) : (
        <div className="stack">
          {cases.map((c) => {
            const name = studentDisplayName({
              firstName: c.first_name,
              lastInitial: c.last_initial,
              displayInitials: c.display_initials,
            });
            return (
              <Panel key={c.id}>
                <div className="home-case">
                  <div>
                    <h2 className="panel__title">{name}</h2>
                    <p className="page-sub">
                      Grade {c.grade} · {evalTypeLabel(c.eval_type)} · referred {c.referral_date}
                    </p>
                  </div>
                  <div className="home-case__side">
                    <StatusPill tone="neutral">{statusLabel(c.status)}</StatusPill>
                    {c.id === mostRecent.id ? (
                      <LinkButton variant="primary" href={`/cases/${c.id}/overview`}>
                        Open case
                      </LinkButton>
                    ) : (
                      <LinkButton href={`/cases/${c.id}/overview`}>Open case</LinkButton>
                    )}
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
