import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { CaseStatus } from "@suite/ui";
import { Shell } from "@/components/shell";
import { CaseTabs } from "@/components/case-tabs";
import { loadWorkspace } from "@/lib/case-workspace";
import { evalTypeLabel, studentDisplayName } from "@/lib/labels";

/**
 * The case workspace frame (§8.2): identity, the five tabs, nothing else.
 * Status, progress, and actions live on the tab surfaces so no screen
 * repeats them. No due-date clock renders until a ratified timeline rule
 * supplies one.
 */
export default async function CaseLayout({
  params,
  children,
}: {
  params: Promise<{ caseId: string }>;
  children: ReactNode;
}) {
  const { caseId } = await params;
  const ws = await loadWorkspace(caseId);
  if (!ws.context) notFound();
  const ctx = ws.context;

  return (
    <Shell activeHref="/cases" displayName={ws.displayName} cases={ws.cases}>
      <div className="case-header">
        <CaseStatus
          name={studentDisplayName(ctx.student)}
          evalTypeLabel={`${evalTypeLabel(ctx.evalType)} · Grade ${ctx.student.grade} · referred ${ctx.referralDate}`}
        />
        <CaseTabs caseId={ctx.caseId} />
      </div>
      {children}
    </Shell>
  );
}
