import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { NewCaptureForm } from "@/components/new-capture-form";

// Capture (D-125): list of this case's capture sessions + start a new one.
// RLS scopes every query to the signed-in psychologist.

type SessionRow = {
  id: string;
  kind: string;
  setting: string | null;
  occurred_on: string;
  status: string;
  updated_at: string;
};

export default async function CapturePage({
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
  const userName = me?.display_name ?? user.email?.split("@")[0] ?? "there";

  const { data: theCase } = await supabase
    .from("cases")
    .select("id, display_initials, grade, eval_type")
    .eq("id", caseId)
    .maybeSingle();
  if (!theCase) notFound();

  const { data: sessions } = await supabase
    .from("capture_sessions")
    .select("id, kind, setting, occurred_on, status, updated_at")
    .eq("case_id", caseId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const rows = (sessions ?? []) as SessionRow[];

  const statusLabel: Record<string, string> = {
    open: "In progress",
    proposal_ready: "Summary drafted — needs your review",
    finalized: "Finalized",
  };

  return (
    <AppShell active="cases" userName={userName}>
      <a href={`/cases/${caseId}`} className="text-sm text-slate-500 hover:underline">
        ← Case
      </a>
      <header className="mt-2">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-accent">
          Capture
        </p>
        <h1 className="text-2xl font-semibold text-brand">
          {theCase.display_initials}
          <span className="ml-2 text-sm font-normal text-slate-500">
            grade {theCase.grade} · {theCase.eval_type}
          </span>
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Quick notes during interviews, observations, and calls. Finalizing
          locks a session into the case record; summaries are drafts until you
          confirm them.
        </p>
      </header>

      <div className="mt-6">
        <NewCaptureForm caseId={caseId} />
      </div>

      <section className="mt-6 space-y-3">
        {rows.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            No capture sessions yet.
          </div>
        )}
        {rows.map((s) => (
          <a
            key={s.id}
            href={`/cases/${caseId}/capture/${s.id}`}
            className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium capitalize text-ink">{s.kind}</span>
                {s.setting && (
                  <span className="ml-2 text-sm text-slate-500">{s.setting}</span>
                )}
                <p className="text-xs text-slate-500">{s.occurred_on}</p>
              </div>
              <span
                className={
                  s.status === "finalized"
                    ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                    : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                }
              >
                {statusLabel[s.status] ?? s.status}
              </span>
            </div>
          </a>
        ))}
      </section>
    </AppShell>
  );
}
