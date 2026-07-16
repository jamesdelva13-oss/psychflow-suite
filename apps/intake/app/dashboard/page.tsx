import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensurePsychologist } from "@/lib/psychologist";
import { signOut } from "@/app/login/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await ensurePsychologist(user);

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

      <section className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
        No cases yet. Case creation and invitations arrive in the next step.
      </section>
    </main>
  );
}
