/**
 * assert-dev-instance.mjs — hard environment guard for destructive tooling
 * (D-138).
 *
 * Every script in this repo that DELETES rows — the Avery fixture re-seed
 * teardown, the RLS and VS-1 integration-harness cleanups, and any future
 * destructive tool — must call assertDevInstance() before opening a database
 * client. Fixture-name scoping (student_ref matching, throwaway-account ids)
 * protects the right rows on the right instance; it protects nothing if the
 * script is pointed at the WRONG INSTANCE. This guard closes that hole: the
 * target must be localhost or a committed known-dev project, or the script
 * refuses to run.
 *
 * There is deliberately NO environment-variable override. The only way to
 * authorize a new instance is to add its project ref to the allowlist below
 * in its own reviewed commit, so every authorization is visible in history.
 */

export const KNOWN_DEV_PROJECT_REFS = Object.freeze([
  "eiavypowoxpucchduomh", // the Psych Suite dev instance (as of 2026-08-08)
]);

/**
 * Refuses (exit 3) unless `rawUrl` targets localhost or a known dev project.
 * Returns the verified target label on success so callers can log it.
 */
export function assertDevInstance(rawUrl, scriptName = "this script") {
  const refuse = (why) => {
    console.error(
      [
        `DEV-INSTANCE GUARD: refusing to run ${scriptName}.`,
        `  ${why}`,
        `  Destructive scripts may only target localhost or a known dev`,
        `  instance: [${KNOWN_DEV_PROJECT_REFS.join(", ")}].`,
        `  If this is genuinely a NEW dev instance, add its project ref to`,
        `  KNOWN_DEV_PROJECT_REFS in tools/assert-dev-instance.mjs in its own`,
        `  commit. There is no environment-variable override (D-138).`,
      ].join("\n")
    );
    process.exit(3);
  };

  if (!rawUrl) return refuse("No Supabase URL provided (NEXT_PUBLIC_SUPABASE_URL unset).");
  let host;
  try {
    host = new URL(rawUrl).hostname;
  } catch {
    return refuse(`Supabase URL is not a valid URL: ${rawUrl}`);
  }
  if (host === "localhost" || host === "127.0.0.1") return `${host} (local)`;
  const match = host.match(/^([a-z0-9-]+)\.supabase\.co$/);
  if (match && KNOWN_DEV_PROJECT_REFS.includes(match[1])) return `${match[1]} (dev)`;
  return refuse(`Target host "${host}" is not localhost or a known dev instance.`);
}
