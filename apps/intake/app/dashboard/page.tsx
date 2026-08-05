import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensurePsychologist } from "@/lib/psychologist";
import { AppShell } from "@/components/app-shell";

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

const STATUS_LABEL: Record<string, string> = {
  referral: "Referral received",
  data_collection: "Collecting information",
  assessment: "Assessment underway",
  report: "Report in progress",
  qa: "In review",
  meeting: "Meeting scheduled",
  complete: "Complete",
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await ensurePsychologist(user);

  const { data: me } = await supabase
    .from("psychologists")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const name = me?.display_name ?? user.email?.split("@")[0] ?? "there";
  const firstName = name.split(/\s+/)[0];

  const { data: cases } = await supabase
    .from("cases")
    .select(
      "id, display_initials, grade, state, eval_type, status, priority_flag, referral_date, created_at"
    )
    .order("created_at", { ascending: false });
  const rows = (cases ?? []) as CaseRow[];

  return (
    <AppShell active="cases" userName={name}>
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-accent">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">
            {greeting()}, {firstName}.
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Collect what matters. Review what comes back.
          </p>
        </div>
        <a
          href="/intake/new"
          className="shrink-0 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          ＋ New intake
        </a>
      </header>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Active cases
        </h2>
        {rows.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No cases yet. Start with a new intake.
          </div>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {rows.map((c) => (
              <a
                key={c.id}
                href={`/cases/${c.id}`}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-accent/40 hover:shadow"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                    {c.display_initials.replace(/\./g, "")}
                  </span>
                  {c.priority_flag && (
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                      Priority review
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-ink">
                  {c.display_initials}
                </h3>
                <p className="text-sm text-slate-500">
                  Grade {c.grade} · {c.state} · {c.eval_type}
                </p>
                <hr className="my-3 border-slate-100" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    {STATUS_LABEL[c.status] ?? c.status}
                  </span>
                  <span className="font-medium text-brand-accent group-hover:underline">
                    Open case →
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
