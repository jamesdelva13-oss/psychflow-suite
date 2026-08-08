import { EmptyState, IconCases, Panel, StatusPill } from "@suite/ui";
import { Shell } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { listCases } from "@/lib/cases";
import { evalTypeLabel, statusLabel, studentDisplayName } from "@/lib/labels";

export default async function CasesPage() {
  const { supabase, displayName } = await requireUser();
  const cases = await listCases(supabase);

  return (
    <Shell activeHref="/cases" displayName={displayName} cases={cases}>
      <header className="page-header">
        <h1 className="page-title">Cases</h1>
        <p className="page-sub">
          Cases are shared with Referral Intake — anything opened there is already here.
        </p>
      </header>

      <Panel>
        {cases.length === 0 ? (
          <EmptyState
            icon={<IconCases size={28} />}
            sentence="No cases yet. Open a referral in Referral Intake and it appears here."
          />
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Grade</th>
                  <th>Evaluation</th>
                  <th>Status</th>
                  <th>Referred</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <a className="table__rowlink" href={`/cases/${c.id}/overview`}>
                        {studentDisplayName({
                          firstName: c.first_name,
                          lastInitial: c.last_initial,
                          displayInitials: c.display_initials,
                        })}
                      </a>
                    </td>
                    <td>{c.grade}</td>
                    <td>{evalTypeLabel(c.eval_type)}</td>
                    <td>
                      <StatusPill tone={c.status === "complete" ? "ok" : "neutral"}>
                        {statusLabel(c.status)}
                      </StatusPill>
                    </td>
                    <td>{c.referral_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </Shell>
  );
}
