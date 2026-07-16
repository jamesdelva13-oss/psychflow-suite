"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client — used ONLY for auth (sign-in/out) with the anon
 * key. No data-table access happens from the browser; all case, invitation,
 * draft, and submission I/O goes through server routes. The service_role key
 * is never available here.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
