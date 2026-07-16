import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The clone is a nested monorepo; pin tracing to this repo root so Next
  // doesn't latch onto a stray lockfile in a parent directory.
  outputFileTracingRoot: path.resolve(import.meta.dirname, "..", ".."),
  // The @suite/* packages ship raw TypeScript (main = src/index.ts), so Next
  // must transpile them rather than expecting pre-built JS.
  transpilePackages: [
    "@suite/case-model",
    "@suite/content",
    "@suite/referral-engine-core",
  ],
  // The server-only engine boundary is enforced in code by lib/engine.ts's
  // `import "server-only"` (any client import fails the build), so no webpack
  // alias is needed here.
};

export default nextConfig;
