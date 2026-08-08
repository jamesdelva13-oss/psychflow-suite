import "server-only";
import type { SupabaseLike } from "./case-context";

/** RLS-scoped case list for Home, Cases, and the command palette. */
export interface CaseListRow {
  id: string;
  first_name: string | null;
  last_initial: string | null;
  display_initials: string;
  grade: string;
  eval_type: string;
  status: string;
  referral_date: string;
}

export async function listCases(db: SupabaseLike): Promise<CaseListRow[]> {
  const { data, error } = await db
    .from("cases")
    .select("id, first_name, last_initial, display_initials, grade, eval_type, status, referral_date")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CaseListRow[];
}
