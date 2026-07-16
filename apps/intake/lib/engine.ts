import "server-only";

/**
 * Single server-only entry point to the referral engine. `import "server-only"`
 * makes the build fail loudly if the engine — which uses node:crypto — is ever
 * pulled into a client bundle. All engine use stays in server components /
 * route handlers (JD hard constraint). The engine now declares `main`
 * (D-023), so it imports cleanly by bare package name.
 */
export * from "@suite/referral-engine-core";
