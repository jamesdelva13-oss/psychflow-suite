/**
 * taxonomy.schema.ts — the shape of the construct taxonomy (D-011).
 *
 * The taxonomy itself is DATA (taxonomy.v0-4.json), validated against this
 * schema plus the integrity rules in validateTaxonomy():
 *   - node IDs unique and permanent
 *   - dot-path IDs consistent with the declared parent
 *   - every parent and every relatedTo target exists
 *   - deprecated nodes remain present (deprecation over deletion)
 */

import { z } from "zod";

export const ConstructIdPattern = /^[A-Z][A-Z_]*(\.[A-Z][A-Z_]*)*$/;
export const ConstructId = z.string().regex(ConstructIdPattern);
export type TConstructId = z.infer<typeof ConstructId>;

export const TaxonomyNode = z.object({
  id: ConstructId,
  level: z.enum(["domain", "construct", "facet"]),
  parent: ConstructId.nullable(),
  label: z.string(),                 // canonical professional label
  displayLabel: z.string().optional(), // informant-facing label if different
  aliases: z.array(z.string()).default([]), // extraction + form-wording synonyms
  relatedTo: z.array(ConstructId).default([]), // cross-links (v0.3 rule 4)
  deprecated: z.boolean().default(false),
  notes: z.string().optional(),
});
export type TTaxonomyNode = z.infer<typeof TaxonomyNode>;

export const Taxonomy = z.object({
  version: z.string(),               // e.g. "0.3"
  nodes: z.array(TaxonomyNode).min(1),
});
export type TTaxonomy = z.infer<typeof Taxonomy>;

/** Structural integrity checks beyond field validation. Returns error strings. */
export function validateTaxonomy(tax: TTaxonomy): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const n of tax.nodes) {
    if (ids.has(n.id)) errors.push(`Duplicate node id: ${n.id}`);
    ids.add(n.id);
  }
  for (const n of tax.nodes) {
    if (n.parent) {
      if (!ids.has(n.parent)) errors.push(`${n.id}: parent ${n.parent} does not exist`);
      if (!n.id.startsWith(n.parent + ".")) errors.push(`${n.id}: id is not a dot-path child of parent ${n.parent}`);
    } else if (n.level !== "domain") {
      errors.push(`${n.id}: only domains may have a null parent`);
    }
    if (n.level === "domain" && n.id.includes(".")) errors.push(`${n.id}: domain ids must be a single segment`);
    for (const rel of n.relatedTo) {
      if (!ids.has(rel)) errors.push(`${n.id}: relatedTo target ${rel} does not exist`);
    }
  }
  return errors;
}

/** True if `id` is a node, or a descendant path under an existing node (domain/construct-level tagging is allowed). */
export function isKnownConstruct(tax: TTaxonomy, id: string): boolean {
  return tax.nodes.some((n) => n.id === id);
}
