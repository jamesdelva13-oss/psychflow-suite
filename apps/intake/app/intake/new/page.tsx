import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensurePsychologist } from "@/lib/psychologist";
import { AppShell } from "@/components/app-shell";
import { NewCaseForm } from "@/components/new-case-form";

export default async function NewIntakePage() {
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

  return (
    <AppShell active="new-intake" userName={name}>
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-accent">
          New intake
        </p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">
          Start a new referral.
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Create the case, then send a secure teacher intake from the case page.
        </p>
      </header>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <NewCaseForm startOpen />
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <span aria-hidden className="text-brand-accent">◇</span>
        <p>
          <b className="text-ink">Built for the referral workflow.</b>{" "}
          Respondents see the student's first name and last initial only.
          Responses autosave, and you review everything that comes back.
        </p>
      </div>
    </AppShell>
  );
}
