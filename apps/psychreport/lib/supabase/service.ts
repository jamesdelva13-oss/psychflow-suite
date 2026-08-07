import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses RLS — use ONLY in server code, and
 * only AFTER the calling path has verified authorization through the RLS
 * client or the canonical assignment guard (mayActOnCase). Same posture as
 * apps/intake: `import "server-only"` fails the build if this ever reaches a
 * client bundle; the key is a non-public env var.
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set (server-only).");

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
