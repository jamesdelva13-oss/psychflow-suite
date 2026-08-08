"use client";

import { usePathname } from "next/navigation";
import { Tabs } from "@suite/ui";

/** The five-tab case shell (§8.2) — active tab derived from the URL. */
export function CaseTabs({ caseId }: { caseId: string }) {
  const pathname = usePathname();
  const base = `/cases/${caseId}`;
  const tabs = [
    { label: "Overview", href: `${base}/overview` },
    { label: "Case Materials", href: `${base}/materials` },
    { label: "Evaluations", href: `${base}/evaluations` },
    { label: "Documentation Support", href: `${base}/support` },
    { label: "Timeline", href: `${base}/timeline` },
  ];
  const active = tabs.find((t) => pathname.startsWith(t.href))?.href ?? tabs[0].href;
  return <Tabs tabs={tabs} activeHref={active} />;
}
