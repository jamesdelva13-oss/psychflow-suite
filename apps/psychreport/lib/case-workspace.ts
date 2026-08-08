import "server-only";
import { cache } from "react";
import { requireUser } from "./auth";
import { listCases, type CaseListRow } from "./cases";
import { resolveCaseContext, type CaseContext } from "./case-context";

/**
 * Per-request workspace load shared by the case layout and every tab page
 * (React cache dedupes, so the case resolves once per request). All reads
 * run on the caller's RLS-scoped client; an invisible case resolves to
 * null exactly as in VS-1.
 */
export interface Workspace {
  displayName: string;
  ownerId: string;
  cases: CaseListRow[];
  context: CaseContext | null;
}

export const loadWorkspace = cache(async (caseId: string): Promise<Workspace> => {
  const { supabase, user, displayName } = await requireUser();
  const [cases, context] = await Promise.all([
    listCases(supabase),
    resolveCaseContext(supabase, caseId),
  ]);
  return { displayName, ownerId: user.id, cases, context };
});
