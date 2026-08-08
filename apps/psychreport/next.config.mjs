import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Nested-monorepo clone: pin tracing to this repo root (same as intake).
  outputFileTracingRoot: path.resolve(import.meta.dirname, "..", ".."),
  // @suite/* packages ship raw TypeScript (main = src/index.ts).
  // PsychReport's legal import set (VS-0 map §4 item 2 / CF-8): case-model,
  // reasoning-contracts, content — plus @suite/ui, the shared design-system
  // implementation every suite product composes its screens from (VS-2).
  transpilePackages: [
    "@suite/case-model",
    "@suite/content",
    "@suite/reasoning-contracts",
    "@suite/ui",
  ],
};

export default nextConfig;
