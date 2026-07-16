import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses RLS — use ONLY in server code, and
 * only for operations that legitimately cross the RLS boundary:
 *   - provisioning the psychologist row at first login (id = auth.uid())
 *   - respondent flows (invitation lookup, draft autosave, submission locking),
 *     where the caller has no Supabase identity and reaches the DB solely
 *     through our server routes.
 *
 * `import "server-only"` makes the build fail if this module is ever pulled
 * into a client bundle. The key is read from a non-public env var.
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set (server-only).");

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
