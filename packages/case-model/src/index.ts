/** @suite/case-model — canonical data model (decisions.md D-006). */
export * from "./taxonomy.schema";
export * from "./entities";
export * from "./crosswalk.schema";
export * from "./question-bank.schema";
export { default as taxonomyV04 } from "./taxonomy.v0-4.json";

// Export hygiene (D-023): ConstructId and Topography are each declared in two
// submodules (question-bank.schema re-declares both identically). Re-export
// each explicitly from its canonical home so the duplicate `export *` bindings
// don't form an ambiguous re-export under a strict typecheck (e.g. Next).
// An explicit named re-export takes precedence over star-exported bindings of
// the same name; values and meaning are unchanged.
export { ConstructId } from "./taxonomy.schema";
export { Topography } from "./entities";
