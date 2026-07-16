import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensurePsychologist } from "@/lib/psychologist";
import { signOut } from "@/app/login/actions";
import { NewCaseForm } from "@/components/new-case-form";
import { InvitePanel } from "@/components/invite-panel";

type CaseRow = {
  id: string;
  display_initials: string;
  grade: string;
  state: string;
  eval_type: string;
  status: string;
  priority_flag: boolean;
  referral_date: string;
  created_at: string;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await ensurePsychologist(user);

  const { data: cases } = await supabase
    .from("cases")
    .select(
      "id, display_initials, grade, state, eval_type, status, priority_flag, referral_date, created_at"
    )
    .order("created_at", { ascending: false });

  const rows = (cases ?? []) as CaseRow[];

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-accent">
            Referral Intelligence Engine
          </p>
          <h1 className="text-2xl font-semibold text-brand">Cases</h1>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span>{user.email}</span>
          <form action={signOut}>
            <button className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="mt-6">
        <NewCaseForm />
      </div>

      <section className="mt-6 space-y-4">
        {rows.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            No cases yet. Create one to generate a teacher invitation.
          </div>
        )}

        {rows.map((c) => (
          <article
            key={c.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-ink">
                  {c.display_initials}{" "}
                  <span className="text-sm font-normal text-slate-500">
                    · grade {c.grade} · {c.state} · {c.eval_type}
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Referred {c.referral_date} · status {c.status}
                </p>
              </div>
              {c.priority_flag && (
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                  Priority review
                </span>
              )}
            </div>
            <InvitePanel caseId={c.id} />
          </article>
        ))}
      </section>
    </main>
  );
}
