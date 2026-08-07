import { createBrowserClient } from "@supabase/ssr";

/** Browser Supabase client — anon key + the signed-in user's session, so all
 *  queries run under that user's RLS context. Identical posture to intake. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
