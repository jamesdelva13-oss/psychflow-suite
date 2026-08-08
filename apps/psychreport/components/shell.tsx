import type { ReactNode } from "react";
import {
  AppFrame,
  CommandPalette,
  IconCases,
  IconHome,
  IconLibrary,
  IconTemplate,
  type NavItem,
  type PaletteItem,
} from "@suite/ui";
import { signOut } from "@/app/login/actions";
import { studentDisplayName } from "@/lib/labels";
import type { CaseListRow } from "@/lib/cases";

/**
 * The PsychReport shell (directive §8.1): Home · Cases · Assessment Library ·
 * Templates on the navy rail; the account (and future settings) lives in the
 * rail's user slot. No District/Speech/OT/IEP/MDR/Eligibility entries — not
 * even as disabled items. Every screen registers in the ⌘K palette.
 */

const NAV: NavItem[] = [
  { label: "Home", href: "/", icon: <IconHome /> },
  { label: "Cases", href: "/cases", icon: <IconCases /> },
  { label: "Assessment Library", href: "/library", icon: <IconLibrary /> },
  { label: "Templates", href: "/templates", icon: <IconTemplate /> },
];

export function Shell({
  activeHref,
  displayName,
  cases,
  children,
}: {
  activeHref: string;
  displayName: string;
  cases: CaseListRow[];
  children: ReactNode;
}) {
  const palette: PaletteItem[] = [
    { group: "Go to", label: "Home", href: "/" },
    { group: "Go to", label: "Cases", href: "/cases" },
    { group: "Go to", label: "Assessment Library", href: "/library" },
    { group: "Go to", label: "Templates", href: "/templates" },
    ...cases.flatMap((c): PaletteItem[] => {
      const name = studentDisplayName({
        firstName: c.first_name,
        lastInitial: c.last_initial,
        displayInitials: c.display_initials,
      });
      return [
        { group: "Cases", label: `${name} — overview`, href: `/cases/${c.id}/overview`, keywords: "case student" },
        { group: "Cases", label: `${name} — case materials`, href: `/cases/${c.id}/materials`, keywords: "sources documents" },
        { group: "Cases", label: `${name} — evaluations`, href: `/cases/${c.id}/evaluations` },
        { group: "Cases", label: `${name} — documentation support`, href: `/cases/${c.id}/support`, keywords: "meeting brief" },
        { group: "Cases", label: `${name} — timeline`, href: `/cases/${c.id}/timeline`, keywords: "activity history" },
      ];
    }),
  ];

  return (
    <AppFrame
      brand="PsychReport"
      items={NAV}
      activeHref={activeHref}
      user={
        <form action={signOut}>
          <div className="nav-rail__item nav-rail__item--static">
            <span className="nav-rail__label">{displayName}</span>
          </div>
          <button type="submit" className="nav-rail__item nav-rail__signout">
            Sign out
          </button>
        </form>
      }
    >
      <CommandPalette items={palette} />
      {children}
    </AppFrame>
  );
}
