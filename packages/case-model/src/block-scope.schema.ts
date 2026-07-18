/**
 * block-scope.schema.ts — the contract for the drafting-layer block registry.
 *
 * "Blocks" are a drafting construct (drafting-spec.md Content domains), NOT one
 * of the five canonical entities (D-006). Their scope is declared here so it is
 * resolvable programmatically — the single-source disclosure rule (drafting-spec
 * P32) and the deferred v0.7 multi-source merge both need scope by lookup, not by
 * reading prose. The registry DATA lives in @suite/content (D-020); this file is
 * only its shape.
 *
 * Scope (drafting-spec P31):
 *   case      — describes the case; may draw on many sources (RfR, existing data,
 *               intervention history). Single-source disclosure applies (P32);
 *               multi-source merge semantics deferred to v0.7.
 *   informant — one informant's account of a domain (all domain blocks, Other Info).
 *   hybrid    — declared for completeness; unused this version.
 */
import { z } from "zod";

export const BlockScope = z.enum(["case", "informant", "hybrid"]);
export type TBlockScope = z.infer<typeof BlockScope>;

export const BlockRegistryEntry = z.object({
  id: z.string(),        // stable snake_case block id, e.g. "reason_for_referral"
  label: z.string(),     // human label, mirrors drafting-spec Content domains
  scope: BlockScope,
});

export const BlockRegistry = z.object({
  version: z.string(),
  blocks: z.array(BlockRegistryEntry).min(1),
});
export type TBlockRegistry = z.infer<typeof BlockRegistry>;
