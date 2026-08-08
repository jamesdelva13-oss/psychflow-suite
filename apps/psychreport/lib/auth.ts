import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Session gate for every PsychReport screen (same posture as intake: pages
 * gate themselves; middleware only refreshes the session cookie). Returns
 * the RLS-scoped client plus the signed-in practitioner's identity.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: psychologist } = await supabase
    .from("psychologists")
    .select("id, display_name, email")
    .eq("id", user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    displayName:
      (psychologist?.display_name as string | undefined) ??
      user.email?.split("@")[0] ??
      "Practitioner",
    email: user.email ?? "",
  };
}
