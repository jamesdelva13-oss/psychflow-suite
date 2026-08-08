import { Panel, StatusPill } from "@suite/ui";
import { Shell } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { listCases } from "@/lib/cases";

/**
 * Assessment Library (§8.1). Deliberately narrow for the slice (§5.2 rules
 * out library breadth): it lists the repository's actual instrument-library
 * state. The one existing entry (WISC-V) is drafted but not practitioner-
 * verified, and verification status is shown honestly — unverified
 * descriptions never reach a report (the D-109 rule).
 */
export default async function LibraryPage() {
  const { supabase, displayName } = await requireUser();
  const cases = await listCases(supabase);

  return (
    <Shell activeHref="/library" displayName={displayName} cases={cases}>
      <header className="page-header">
        <h1 className="page-title">Assessment Library</h1>
        <p className="page-sub">
          Instrument descriptions become available to the report writer once they are verified
          against the publisher's manual.
        </p>
      </header>

      <Panel>
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Instrument</th>
                <th>Full name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>WISC-V</td>
                <td>Wechsler Intelligence Scale for Children, Fifth Edition</td>
                <td>
                  <StatusPill tone="warn">Draft — pending practitioner verification</StatusPill>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>
    </Shell>
  );
}
