/**
 * dev-login.mjs — mint a one-time magic-link URL for the DEV instance so an
 * authenticated PsychReport session can be opened without typing a password
 * (Gate C screenshot runs against the Avery fixture).
 *
 *   node --env-file=apps/psychreport/.env.local tools/dev-login.mjs [email]
 *
 * Prints a http://localhost:3001/auth/confirm?... URL. Opening it sets the
 * session cookie and lands on Home. Non-destructive, but the instance guard
 * still applies: minting sessions is a dev-only capability (D-138 posture).
 */
import { createClient } from "@supabase/supabase-js";
import { assertDevInstance } from "./assert-dev-instance.mjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing Supabase env — run with --env-file=apps/psychreport/.env.local");
  process.exit(2);
}
assertDevInstance(url, "dev-login.mjs (mints a session link)");

const email = process.argv[2] ?? process.env.SEED_OWNER_EMAIL ?? "jamesdelva13@gmail.com";
const base = process.env.APP_BASE_URL ?? "http://localhost:3001";

const svc = createClient(url, serviceKey, { auth: { persistSession: false } });
const { data, error } = await svc.auth.admin.generateLink({ type: "magiclink", email });
if (error) {
  console.error("generateLink failed:", error.message);
  process.exit(1);
}
const tokenHash = data.properties?.hashed_token;
if (!tokenHash) {
  console.error("No hashed_token in response.");
  process.exit(1);
}
console.log(`${base}/auth/confirm?token_hash=${tokenHash}&type=magiclink&next=/`);
