import "server-only";

/**
 * Single server-only entry point to the referral engine.
 *
 * Two reasons this indirection exists:
 *  1. `@suite/referral-engine-core` ships raw TS without a "main" field, so it
 *     can't be imported by bare package name — we point at its entry directly.
 *     (Not editing the manifest-locked package.json for an app concern.)
 *  2. `import "server-only"` makes the build fail loudly if the engine — which
 *     uses node:crypto — is ever pulled into a client bundle. All engine use
 *     stays in server components / route handlers (JD hard constraint).
 */
export * from "@suite/referral-engine-core/src/index";
