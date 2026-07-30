# Contamination audit — `@suite/reasoning-contracts`

**Date:** 2026-07-20, revised 2026-07-21 · **Status:** executed
**Trigger:** Manifest v1.0, "What Claude needs next," item 1.

> **Read this first.** The July 20 pass audited a *reconstruction* of
> `reasoning-contracts.ts`, not the real file — the July 19 original had not
> been recovered yet. The reconstruction was wrong in substance and is now
> archived. The findings below have been re-checked against the real
> v0.1.0-pilot contracts; the section tables were rewritten on July 21.
>
> The reasoning survived the correction. The specifics did not, and anything
> quoting the July 20 version of this file should be re-read.

---

## The test

The shared code book is contaminated whenever it holds a rule that only one
product needs. Contamination is not a style problem — it is a dependency
problem. A craft rule sitting in the shared package silently forces the QA
Engine to import a PsychReport opinion, and the suite's one dependency rule
starts leaking.

The cut is directional:

> If a rule constrains **how a human writes**, it is craft → PsychReport.
> If a rule constrains **what may be claimed, and on what basis**, it is
> epistemics → `reasoning-contracts`.
> If a rule constrains **what an external authority requires**, it is mandate →
> QA Engine rulepacks.

Craft rules are house opinion and may change without anyone's permission.
Epistemic rules are the thing all four products must agree on or they cannot
talk to each other. Mandates belong to somebody else entirely and must cite a
document.

---

## Findings

### Moved out of the shared package → PsychReport parameter block

| Item | Why it left |
|---|---|
Executed 2026-07-21 against the real v0.1.0-pilot contracts. Two items were
found and removed; the other two were never in the shared package to begin
with.

| Item | Status | Why it left |
|---|---|---|
| **`PRECEDENCE`** (was §4) | **Removed** · D-024 | Orders competing *drafting* instructions. It answers "which instruction wins while writing," not "what may be claimed." QA does not draft, so every QA build was importing a PsychReport authoring opinion for nothing. Now sole-sourced in parameter block §1. |
| **`LengthGovernance`, `DEFAULT_LENGTH_GOVERNANCE`** (was §6) | **Removed** · D-025 | A house judgment about report length. In the shared package it would let QA flag another evaluator's report for exceeding *our* preference — the same class of error as enforcing House Conventions on outside documents. Now sole-sourced in parameter block §7. |
| **Qualification budget** | Already clean | Lives only in parameter block §5. Never entered the shared package. |
| **House conventions** | Already clean | Lives only in parameter block §11, and is explicitly injected per district rather than hardcoded. Never entered the shared package. |

### Stayed in the shared package

| Item | Why it stayed |
|---|---|
| **Epistemic types + the two guards** (§0) | `EvidenceStatus`, `InterpretiveCeiling`, `ValidityStatus`, `SourceScope`, `SourceInterpretationPolicy`, `effectiveCeiling()`, `isScopeUnestablished()`. QA assigns `EvidenceStatus` to prose it has no case model for, so these cannot move to `case-model` — which QA may not import. |
| **Section modes + `MODE_CONTRACTS`** (§1) | QA must *infer* mode from arbitrary district prose; both products have to mean the same thing by `INTEGRATED_INTERPRETATION` or findings won't map onto drafts. |
| **Confidence-language policy** (§2) | PsychReport constrains generated wording by it; QA compares observed wording against reconstructed support. One table, two readings. |
| **Cross-source relationship classes** (§3) | A discrepancy must be classified before it is described, by whichever product is looking at it. |
| **Rule provenance** (§4) | `SourceStatus` is what stops a product-generated operationalization being presented as a published principle. |
| **`PILOT_METRICS`** (§5) | Instrumentation, not a length rule — see D-025. Retaining it is what lets future length targets be derived from data rather than asserted as taste. |
| **Artifact boundary** (§6) | Enforced by schema: PsychReport has no section type for adverse-impact or SDI language, so the eligibility firewall is structural rather than prompted. |

### Annotated this pass

**Confidence stems marked non-normative** (D-026). The normative content of
`CONFIDENCE_POLICY` is the `rank` ordering and its mapping to `condition` and
`evidenceStatus`; the `stem` strings are calibration anchors. This was
implicit and load-bearing in both directions — QA implementing a stem check as
string-matching would flag correct prose for word choice, and PsychReport
treating the stems as required phrasing would emit the same six openers across
every report, manufacturing the boilerplate §5 and §8 exist to prevent.

### Withdrawn from the July 20 pass

The July 20 version of this file proposed a **three-tier authority enum**
(`mandated` · `publisher` · `best-practice`) with jurisdiction on a separate
axis, plus `mayPhraseAsRequirement()` and `validateProvenance()`.

**Withdrawn.** It was designed against a reconstructed provenance schema that
does not exist. The real §4 already carries an eight-value `SourceStatus`
covering the same ground with more resolution — `DIRECT_SOURCE_PRINCIPLE` vs
`SOURCE_DERIVED_OPERATIONALIZATION` is a distinction the three-tier proposal
could not express, and it is the distinction that matters most for not
overclaiming.

**This withdrawal over-corrected — see D-028.** The *enum* stays withdrawn:
it was designed against a phantom schema and would have replaced a
higher-resolution one. But the three-value axis it was reaching for is
ratified and load-bearing, and dropping it along with the bad implementation
was a mistake. `SourceStatus` captures provenance and cannot express
compulsion — nothing in the eight values separates "will not survive due
process" from "our house prefers it," which is exactly what QA must show a
district and what bounds the attorney's review scope.

Resolved by adding `authority` (**mandated · defensibility · craft**) as a
*field* on `RuleMetadata` alongside `sourceStatus`, not as a replacement for
it. Both are populated; neither is derived from the other. Guards:
`mayPhraseAsRequirement()`, `inAttorneyReviewScope()`.

Lesson worth keeping: a withdrawal should retract the implementation that was
wrong, not the requirement that motivated it.

### Not yet resolved

- **`@suite/case-model` import direction.** The manifest states case-model
  imports the §0 types *from* reasoning-contracts. That import does not exist
  yet — case-model currently defines its own vocabulary. Wiring it is a
  follow-on commit, and it should be done in that direction only.
- **QA Engine is forbidden from importing `@suite/case-model`.** Currently
  unenforced. Worth an import-boundary lint rule rather than a convention.

---

## Consequential defects found while auditing

Two things surfaced that are not contamination but block work:

1. **`@suite/case-model` has broken imports.** `src/index.ts` exports from
   `./taxonomy.schema` and imports `./taxonomy.v0-3.json`. **Neither file exists
   in the repo.** The package cannot resolve. Since D-011 puts taxonomy
   additions under governance, these were not reconstructed here — they need to
   come from wherever the ratified v0.3 taxonomy actually lives.

2. **The P-rules are absent from this repo.** P29 (render forms), P32
   (disclosure), P33 (render-layer purity) appear in the manifest and in no
   file here. RIE spec v0.6 is not present either. Manifest item 3 cannot be
   verified against anything on this machine.

---

## Recommended next commit

1. Ratify or amend the three-tier authority cut above.
2. Wire `@suite/case-model` §0 imports to `@suite/reasoning-contracts` — one
   direction only.
3. Restore the two missing taxonomy files from the governed source.
4. Add the import-boundary lint: `reasoning-contracts` imports nothing;
   QA Engine never imports `case-model`.
