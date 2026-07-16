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
  // Hard guard against the server-only engine ever leaking into a client
  // bundle: if something imports `@suite/referral-engine-core` (which uses
  // node:crypto) from client code, the build fails loudly instead of shipping
  // a broken bundle. All engine use must be in server components / route
  // handlers. (decisions.md D-021; JD hard constraint.)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        "@suite/referral-engine-core": false,
      };
    }
    return config;
  },
};

export default nextConfig;
