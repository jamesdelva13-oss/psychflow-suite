import "server-only";
import type { User } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * The psychologist's Supabase auth id IS their psychologists.id (D-003).
 * On first authenticated request we provision that row with the service role
 * (RLS grants the authenticated role only self-select/update, not insert).
 * Idempotent: safe to call on every dashboard load.
 */
export async function ensurePsychologist(user: User): Promise<void> {
  const svc = createServiceClient();
  const { data: existing } = await svc
    .from("psychologists")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return;

  const displayName =
    (user.user_metadata?.display_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Psychologist";

  const { error } = await svc.from("psychologists").insert({
    id: user.id,
    email: user.email,
    display_name: displayName,
  });
  if (error && error.code !== "23505") throw error; // ignore unique-race
}
