import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Supabase client for server components and route handlers, bound to the
 * request's auth cookie. Uses the ANON key + the signed-in user's JWT, so
 * every query runs under that user's RLS context. Identical posture to
 * apps/intake (CF-8: same project, same auth/RLS posture).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components can't set cookies; middleware refreshes the
            // session, so this is safe to ignore.
          }
        },
      },
    }
  );
}
