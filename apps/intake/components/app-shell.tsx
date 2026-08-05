import type { ReactNode } from "react";
import { signOut } from "@/app/login/actions";

// Psychologist-surface shell (RIE increment 4). Interaction reference: the
// July-28 RIE prototype, reconciled against the decision log:
//  - Cases + New intake only in the rail. No "Configure domains" top-level
//    entry (D-119: configuration lives with the form / case setup); no
//    "Test selection", upload-extraction, assistant, or adaptive-follow-up
//    surfaces (phased or open questions — no dead nav entries).
//  - Respondent flow (/r, /respond) never uses this shell.

export type ShellNav = "cases" | "new-intake";

export function AppShell({
  active,
  userName,
  children,
}: {
  active: ShellNav;
  userName: string;
  children: ReactNode;
}) {
  const item = (key: ShellNav, href: string, icon: string, label: string) => (
    <a
      href={href}
      aria-current={active === key ? "page" : undefined}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${
        active === key
          ? "bg-white/10 font-semibold text-white"
          : "text-slate-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span aria-hidden className="w-4 text-center">{icon}</span>
      {label}
    </a>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col bg-[#122a33] px-4 py-6">
        <a href="/dashboard" className="flex items-center gap-3 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-accent font-serif text-lg font-bold text-white">
            R
          </span>
          <span>
            <b className="block text-sm font-semibold leading-tight text-white">
              Referral Intake
            </b>
            <small className="text-[11px] text-slate-400">
              Evidence, clearly gathered.
            </small>
          </span>
        </a>
        <nav className="mt-8 space-y-1">
          {item("cases", "/dashboard", "⌂", "Cases")}
          {item("new-intake", "/intake/new", "＋", "New intake")}
        </nav>
        <div className="mt-auto border-t border-white/10 pt-4">
          <div className="flex items-center gap-2.5 px-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
              {userName
                .split(/\s+/)
                .map((p) => p.charAt(0).toUpperCase())
                .slice(0, 2)
                .join("")}
            </span>
            <span className="min-w-0">
              <b className="block truncate text-sm text-white">{userName}</b>
              <small className="text-[11px] text-slate-400">School Psychologist</small>
            </span>
          </div>
          <form action={signOut} className="mt-3 px-2">
            <button className="text-xs text-slate-400 hover:text-white">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 bg-[#f6f5f1]">
        <div className="mx-auto max-w-4xl px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
