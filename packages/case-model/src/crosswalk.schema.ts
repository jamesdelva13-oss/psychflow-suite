/**
 * crosswalk.schema.ts — instrument -> construct mappings (D-011).
 * The crosswalk absorbs each instrument's packaging; the taxonomy never does.
 * One subtest may map to multiple constructs (Evidence carries a tag list).
 */
import { z } from "zod";
import { ConstructId } from "./taxonomy.schema";

export const CrosswalkEntry = z.object({
  instrument: z.string(),            // "WIAT-4", "BASC-3 TRS", "Vineland-3"
  scale: z.string(),                 // subtest / scale / composite name
  kind: z.enum(["subtest", "scale", "composite", "index"]),
  constructIds: z.array(ConstructId).min(1),
  notes: z.string().optional(),
});

export const Crosswalk = z.object({
  version: z.string(),
  taxonomyVersion: z.string(),
  entries: z.array(CrosswalkEntry),
});
export type TCrosswalk = z.infer<typeof Crosswalk>;
