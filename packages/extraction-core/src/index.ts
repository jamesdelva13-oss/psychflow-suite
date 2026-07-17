/**
 * @suite/extraction-core — Phase 2 Source -> Evidence extraction.
 *
 * Principle (clinical review): extraction is the evidentiary substrate for a
 * psychologist's summary, so it preserves EVERYTHING summary-worthy tagged by
 * polarity (concern / strength / neutral) — not just complaints. The summary
 * layer compresses (esp. aggregable neutrals); extraction never omits and never
 * corrects a response (thin answers are the follow-up layer's job).
 *
 * Deterministic slice (this slice) — rules R1..R5, implemented verbatim as
 * documented, legible functions (see fixtures/*/README.md):
 *   R1  selected concern options            -> concern Evidence
 *   R2  explicit magnitude answers only     -> severity (never from tone)
 *   R3  cleared exclusionary + unselected
 *       concern-screen options              -> neutral Evidence (tagged, aggregable)
 *   R4  intervention answers                -> one CTX.INSTRUCTION_ADEQUACY neutral
 *   R5  structured strength answers         -> strength Evidence
 *   (informant/admin fields + unanswered optionals -> nothing)
 *
 * Open-text narrative — including the open-text STRENGTH answer (e.g.
 * TCH-CORE-007) — is deferred to the LLM slice (injected provider, D-008
 * provenance + verbatim grounding).
 *
 * API to build after fixture #1 is hand-annotated:
 *   extractDeterministic(source, bank, taxonomy) -> Evidence[]
 *   scoreExtraction(produced, golden) -> metrics
 * Nothing is implemented yet — golden set is authored first, blind.
 */
export {};
