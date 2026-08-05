import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { CaptureEditor } from "@/components/capture-editor";

export default async function CaptureSessionPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id: caseId, sessionId } = await params;

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

  const { data: session } = await supabase
    .from("capture_sessions")
    .select(
      "id, case_id, kind, setting, occurred_on, notes, status, summary_proposal, summary_final"
    )
    .eq("id", sessionId)
    .eq("case_id", caseId)
    .maybeSingle();
  if (!session) notFound();

  const { data: theCase } = await supabase
    .from("cases")
    .select("display_initials")
    .eq("id", caseId)
    .maybeSingle();

  return (
    <AppShell active="cases" userName={userName}>
      <a
        href={`/cases/${caseId}/capture`}
        className="text-sm text-slate-500 hover:underline"
      >
        ← Capture sessions
      </a>
      <header className="mt-2 mb-6">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-accent">
          Capture · {theCase?.display_initials ?? ""}
        </p>
        <h1 className="text-2xl font-semibold capitalize text-brand">
          {session.kind}
          <span className="ml-2 text-sm font-normal normal-case text-slate-500">
            {session.setting ? `${session.setting} · ` : ""}
            {session.occurred_on}
          </span>
        </h1>
      </header>

      <CaptureEditor
        sessionId={session.id}
        caseId={caseId}
        kind={session.kind}
        setting={session.setting}
        occurredOn={session.occurred_on}
        initialNotes={session.notes}
        initialStatus={session.status}
        initialProposal={session.summary_proposal}
        initialSummaryFinal={session.summary_final}
      />
    </AppShell>
  );
}
