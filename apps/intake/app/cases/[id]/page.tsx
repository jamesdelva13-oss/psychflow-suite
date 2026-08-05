import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import {
  InvitationsPanel,
  type InvitationSummary,
} from "@/components/invitations-panel";
import { DeleteCase } from "@/components/delete-case";
import { createServiceClient } from "@/lib/supabase/service";
import { describeAuditEvent } from "@/lib/audit-labels";

// Case overview: everything about one referral in one place — invitations
// (respondent intake) and capture sessions (the psychologist's own notes).

type CaptureRow = {
  id: string;
  kind: string;
  setting: string | null;
  occurred_on: string;
  status: string;
};

export default async function CasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: caseId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("psychologists")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const name = me?.display_name ?? user.email?.split("@")[0] ?? "there";

  const { data: theCase } = await supabase
    .from("cases")
    .select(
      "id, display_initials, grade, state, eval_type, status, priority_flag, referral_date"
    )
    .eq("id", caseId)
    .maybeSingle();
  if (!theCase) notFound();

  const { data: invRows } = await supabase
    .from("invitations")
    .select("id, respondent_role, status, expires_at, uses, max_uses")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  const { data: capRows } = await supabase
    .from("capture_sessions")
    .select("id, kind, setting, occurred_on, status")
    .eq("case_id", caseId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(3);
  const captures = (capRows ?? []) as CaptureRow[];

  // Activity: audit_events has no authenticated-role read policy (writes go
  // through the service role), so read it server-side with the service client
  // — safe here because RLS already proved this case belongs to the caller.
  const svc = createServiceClient();
  const { data: auditRows } = await svc
    .from("audit_events")
    .select("id, actor, event_type, metadata, created_at")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false })
    .limit(20);
  const activity = (auditRows ?? []) as {
    id: string;
    actor: string;
    event_type: string;
    metadata: Record<string, unknown>;
    created_at: string;
  }[];

  return (
    <AppShell active="cases" userName={name}>
      <a href="/dashboard" className="text-sm text-slate-500 hover:underline">
        ← Cases
      </a>
      <header className="mt-3 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-base font-bold text-brand">
            {theCase.display_initials.replace(/\./g, "")}
          </span>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-ink">
              {theCase.display_initials}
            </h1>
            <p className="text-sm text-slate-500">
              Grade {theCase.grade} · {theCase.state} · {theCase.eval_type} ·
              referred {theCase.referral_date}
            </p>
          </div>
        </div>
        {theCase.priority_flag && (
          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
            Priority review
          </span>
        )}
      </header>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Respondent intake
        </h2>
        <InvitationsPanel
          caseId={caseId}
          invitations={(invRows ?? []) as InvitationSummary[]}
        />
      </section>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Capture
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your own notes from interviews, observations, and calls.
            </p>
          </div>
          <a
            href={`/cases/${caseId}/capture`}
            className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Open Capture →
          </a>
        </div>
        {captures.length > 0 && (
          <ul className="mt-4 divide-y divide-slate-100">
            {captures.map((s) => (
              <li key={s.id}>
                <a
                  href={`/cases/${caseId}/capture/${s.id}`}
                  className="flex items-center justify-between py-2.5 text-sm hover:bg-slate-50"
                >
                  <span className="capitalize text-ink">
                    {s.kind}
                    {s.setting ? (
                      <span className="text-slate-400"> · {s.setting}</span>
                    ) : null}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-slate-400">{s.occurred_on}</span>
                    <span
                      className={
                        s.status === "finalized"
                          ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700"
                          : "rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                      }
                    >
                      {s.status === "finalized"
                        ? "Finalized"
                        : s.status === "proposal_ready"
                          ? "Needs review"
                          : "In progress"}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Activity
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          The case's audit trail — what happened and when. Content never
          appears here, only the record of actions.
        </p>
        {activity.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No activity yet.</p>
        ) : (
          <ol className="mt-4 space-y-0">
            {activity.map((e) => (
              <li
                key={e.id}
                className="flex items-baseline justify-between gap-4 border-t border-slate-100 py-2.5 first:border-t-0"
              >
                <span className="text-sm text-ink">
                  {describeAuditEvent(e.event_type, e.metadata, {
                    self: e.actor === user.id,
                  })}
                </span>
                <time className="shrink-0 text-xs tabular-nums text-slate-400">
                  {new Date(e.created_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </time>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-8">
        <DeleteCase caseId={caseId} displayInitials={theCase.display_initials} />
      </section>
    </AppShell>
  );
}
