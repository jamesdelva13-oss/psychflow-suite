/**
 * @suite/document-extraction — the shared parser / IR / entity-extraction
 * stack (D-046 consolidation; relocated from the Sped QA Engine repo).
 *
 * Pipeline: source document (docx) -> IR -> extracted entities -> EntityMap.
 *
 * Consumers: the Sped QA Engine (report review) and PsychReport
 * (source-document ingestion, D-077). Neither product may reimplement this
 * stack; per the D-046 amendment, shared extraction SUPPORTS QA's checks but
 * never replaces reading the actual source sentence.
 *
 * Dependency direction: this package depends only on
 * @suite/reasoning-contracts (for ParserConfidence). It reads no rulepacks
 * and performs no I/O beyond the buffers handed to it — instrument libraries
 * are injected by the consumer.
 */

export * from "./ir/types.js";
export * from "./ir/text-stream.js";
export { parseDocx } from "./parsers/docx.js";
export { detectSections } from "./parsers/sections.js";
export * from "./extraction/types.js";
export {
  type InstrumentLibrary,
  type CompiledLibrary,
  compileLibrary,
  findInstrumentMatches,
  findScaleMatches,
} from "./extraction/instruments.js";
export { extractEntities, buildEntityMap } from "./extraction/entity-map.js";
export { extractNames } from "./extraction/names.js";
export { extractDates } from "./extraction/dates.js";
export { extractPronouns, tallyPronouns } from "./extraction/pronouns.js";
export { extractScoreCandidates } from "./extraction/scores.js";
