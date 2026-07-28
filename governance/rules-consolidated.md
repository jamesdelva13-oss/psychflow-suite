# PsychReport — Consolidated Governing Rule Set

**Purpose.** A single reference assembling the complete current PsychReport
generation rule set, organized by *what each rule governs* rather than by source,
so it can be examined for contradictions and over-rigidity. **This is an
extraction, not a revision.** No rule was changed, resolved, or rewritten. Where
two sources say different things, the difference is flagged as a finding (see
§11), not reconciled.

**Assembled:** 2026-07-26 · read-only.

## Sources

| Tag | Source | Location | Access |
|---|---|---|---|
| **[LOG]** | Decision log (trunk) | `~/Documents/PsychReport QA Engine (repo)/suite/decisions.md` (D-001→D-109) | full |
| **[RC]** | `@suite/reasoning-contracts` | same repo, `suite/packages/reasoning-contracts/src/index.ts` (per D-046 the shared layer currently lives in the Sped-QA-Engine repo, not psychflow-suite) | full |
| **[PB]** | PsychReport parameter block | same repo, `suite/docs/psychreport-parameter-block.md` (§1–§12) | full |
| **[APP]** | Live app prompt module `PRPrompts` | `~/Documents/psychreport/index.html` (lines ~482–920) | full |

**Source-access note.** The task asked for "the FIDELITY block" from
reasoning-contracts. **There is no FIDELITY block in [RC].** FIDELITY is authored
prose and lives only in **[APP]** (`index.html`, `const FIDELITY`, lines 565–585);
its clinical content is mirrored in **[PB] §5 (Fidelity)**. This is recorded here
and again in §11 so the examination does not go looking for it in the wrong file.

**How to read an entry.** Each rule carries: a plain-language statement, the
verbatim source text (indented/quoted), its origin (source tag + decision/file +
line), and cross-references. **Co-governance clusters** — the same concern
governed in more than one place — are boxed together under a ▣ heading; those are
where contradictions are most likely to hide.

---

## 1. Generation constraints — what the model may / may not write

### 1.1 Invent nothing; use only supplied data
**Plain language.** The model may use only the data supplied and may not invent
history, observations, scores, interventions, diagnoses, or quotations. If the
data do not support a statement, omit it; do not soften an unsupported claim into
a hedged one.

> **[APP]** `index.html` L565–577 (`const FIDELITY`):
> "Use only the data supplied. Invent nothing — no history, observations, scores,
> interventions, diagnoses, or quotations. … If the data do not support a
> statement, omit it. Do not soften an unsupported claim into a hedged one."

**Origin:** [APP] index.html L565–577. **Cross-ref:** §5.1 (Fidelity, co-governed);
D-007 [LOG] (unsupported claims deleted/marked/moved, never silently appear);
D-094 (the FIDELITY/exposition contradiction) §8.3.

### 1.2 The output-type refusals
**Plain language.** Decline (and say why in one sentence) when asked to produce
adverse-impact or SDI language; state or presuppose an eligibility verdict;
interpret a source above its ceiling or outside its scope; assert a finding no
supplied evidence supports; or reconcile discrepant informants without evidence —
then produce whatever adjacent content is legitimate and name the evidence that
would be needed.

> **[PB] §12 Refusals** (L279–283):
> "Decline, and say why in one sentence, when asked to: produce adverse-impact or
> SDI language; state or presuppose an eligibility verdict; interpret a source
> above its ceiling or outside its scope; assert a finding no supplied evidence
> supports; or reconcile discrepant informants without evidence. Then produce
> whatever adjacent content you legitimately can, and name the specific evidence
> that would be needed."

**Origin:** [PB] §12, L279–283. **Cross-ref:** §7 (eligibility boundary) for the
first two clauses; §2.4 / §2.5 for ceiling/scope; §5 for fidelity; §3 (validity)
for scope/ceiling refusals.

### 1.3 The report does not narrate itself
**Plain language.** The writer never appears as narrator; the report does not
comment on itself; the reader is not told how to feel.

> **[PB] §8 Style** (L238): "The writer does not appear as narrator. The report
> does not comment on itself. The reader is not told how to feel."

**Origin:** [PB] §8, L238. **Cross-ref:** §9.1 (gap-surfacing — a limitation about
the *tool* must not enter report voice; D-105).

### 1.4 Unit of analysis is the domain, not the instrument
**Plain language.** Section generation operates at the domain level, integrating
multiple instruments within a domain while preserving each source's attribution
and validity — not instrument-by-instrument.

> **[LOG] D-100** (L1272–1278): "A domain may draw on **multiple instruments**;
> section generation must operate **at the domain level**, integrating multiple
> instruments within a domain while **preserving each source's attribution and
> validity.**"

**Origin:** [LOG] D-100. **Status:** Accepted. **Cross-ref:** §6 (proportionality
scales with findings not instruments); D-089 (RIE domain-addressed); §8 library
slot model.

---

## 2. Mode contracts — per-section permissions

▣ **CO-GOVERNANCE CLUSTER A — the five section modes.** The mode system is
governed in **five places at once**: the machine contract **[RC] §1
`MODE_CONTRACTS`**, the authoring prose **[PB] §3**, the live exemplar prompts
**[APP] `MODE_PROMPTS`**, the founding decision **[LOG] D-032**, and two later
amendments to a specific mode's rule (**D-092**, **D-098**). All five must agree;
they do not fully agree (see §11-F1 for the DESCRIPTIVE_RESULTS discrepancy).

### 2.0 Five modes, subtractive modifiers, block-scoped
**Plain language.** There are exactly five base modes; modifiers may only
*subtract* permissions, never add; mode attaches to a content block, never a
heading; there are no blended modes.

> **[RC] §1** (L138–161): `SectionMode = "SOURCE_FAITHFUL" | "DIRECT_OBSERVATION"
> | "DESCRIPTIVE_RESULTS" | "INTEGRATED_INTERPRETATION" | "RECOMMENDATION"`;
> modifiers `MULTISOURCE_FACTUAL`, `PROCEDURAL_ONLY`, `NO_NEW_INFERENCE`,
> `TEAM_RESERVED`. "Kept at five because the QA Engine must INFER mode from
> arbitrary district prose; classification accuracy degrades with class count."
>
> **[LOG] D-032** (L386–397): "Modifiers … may only *subtract* permissions from
> the base mode, never expand them. … No blended modes — mode attaches to a
> content block, never a heading."
>
> **[PB] §3** (L58): "Mode is supplied per **content block**, never per heading.
> … There is no blended mode; if a block needs both description and synthesis, it
> is two blocks." Modifiers (L68): "Modifiers subtract permissions from a base
> mode."

**Origin:** [RC] §1 L138–161; [LOG] D-032 L386–397; [PB] §3 L56–68.
**Cross-ref:** §7 (TEAM_RESERVED / eligibility).

### 2.1 SOURCE_FAITHFUL
> **[RC] §1** (L187–200): synthesis `WITHIN_SOURCE`, inference `NONE`; permitted
> `ATTRIBUTE, ORGANIZE, CONDENSE, PRESERVE_CONTRADICTION`; prohibited
> "psychological inference", "causal explanation", "cross-informant synthesis",
> "reconciling contradictions", "escalating certainty, frequency, or severity",
> "treating an omission as a negative finding".
>
> **[PB] §3** (L70): "organize and condense one informant's account; group by
> domain; preserve contradictions. Do not infer motive, cause, diagnosis, or
> unreported severity. … An unanswered item is missing, not negative."
>
> **[APP] `MODE_PROMPTS.SOURCE_FAITHFUL`** (L612–637): "You may not interpret,
> explain cause, escalate severity, reference another informant or any test
> result, or resolve a contradiction."

**Cross-ref:** §5 (fidelity — "omission is missing, not negative" restated in
FIDELITY).

### 2.2 DIRECT_OBSERVATION
> **[RC] §1** (L202–219): synthesis `WITHIN_OBSERVATION`, inference `BOUNDED`;
> permitted `DESCRIBE_OBSERVED, ORGANIZE, CONDENSE, COMPARE_WITHIN_SOURCE`;
> prohibited "generalizing beyond the observed conditions", "cross-setting
> claims", "attribution of motive", "diagnosis", "unmarked inference
> (characterization must read as characterization)".
>
> **[PB] §3** (L72–76): "Bounded characterization across the observation session
> is permitted and must read as characterization." (with observation vs.
> permitted-characterization vs. exceeds-the-mode exemplars).
>
> **[APP]** (L641–668): parallel exemplars; "Motive, diagnosis, trait
> attribution, other settings, and connections to scores or informant reports are
> not."

### 2.3 DESCRIPTIVE_RESULTS  ⚠ see §11-F1
> **[RC] §1** (L221–238): synthesis `WITHIN_MEASURE`, inference `NONE`; permitted
> `REPORT_SCORE, CLASSIFY, DESCRIBE_OBSERVED, COMPARE_WITHIN_SOURCE`; prohibited
> "any extrapolation beyond the measure", "causal claims", "functional or
> classroom translation", "cross-source synthesis", "diagnosis". Plus (L274–278):
> "DESCRIPTIVE_RESULTS inference is binary … within-measure pattern description is
> permitted; all extrapolation beyond the measure is prohibited."
>
> **[PB] §3** (L78): "scores, classifications, validity status, task performance,
> within-measure comparison. Inference is binary here."
>
> **[APP] `MODE_PROMPTS.DESCRIPTIVE_RESULTS`** (L672–691): "**Write one level
> coarser than the table.** If the table lists subtests, write about composites;
> if it lists scales, write about the domain."
>
> **[LOG] D-092** (L1185–1194) — **amends the "coarser" rule**: "Replace 'write
> one level coarser than the table / do not restate the numbers' with **'one
> level more meaningful than the table.'** … in suppressing score-transcription it
> also suppressed **required construct exposition**." **Status:** Accepted
> 2026-07-25 · *Build item.*

**Discrepancy:** the live [APP] prompt and [PB] §6 P2 still say "one level
**coarser**"; D-092 replaces that with "one level **more meaningful**." → §11-F1.
**Cross-ref:** §8 (construct exposition D-093/D-107), §6 P2 (granularity table),
D-098 (exemplar de-hazarding, below).

### 2.3a Exemplar de-hazarding (amends the DESCRIPTIVE_RESULTS / VOICE exemplars)
> **[LOG] D-098** (L1255–1262): "The reading exemplar in `VOICE` and
> `DESCRIPTIVE_RESULTS` depicts the **clinically-typical pattern** … when a real
> case is the **reverse**, a primed model may **reproduce the typical pattern
> against the actual scores.** Fix: **neutral exemplars, or case-matched exemplar
> selection**." **Status:** Accepted · *Build item.*

**Note:** live [APP] exemplars (L676–679) still depict the typical
decoding-harder-than-familiar pattern → D-098 is a not-yet-built correction.

### 2.4 INTEGRATED_INTERPRETATION
> **[RC] §1** (L240–258): synthesis `CROSS_SOURCE`, inference `CALIBRATED`;
> permitted `SYNTHESIZE_CROSS_SOURCE, ANALYZE_DISCREPANCY, FORM_HYPOTHESIS,
> STATE_FUNCTIONAL_MEANING, ATTRIBUTE`; prohibited "claims exceeding a source's
> effective ceiling", "claims outside a source's scope", "invented reconciliation
> of discrepant sources", "team-reserved conclusions", "eligibility verdicts".
>
> **[PB] §3** (L80): "this is where the psychologist's work happens. Synthesize
> relevant sources, address meaningful convergence and discrepancy, state
> functional meaning, form calibrated hypotheses. Do not exceed source scope or
> ceiling. Do not invent an explanation for a discrepancy."

**Cross-ref:** §3 (ceiling/scope), §4 (confidence), §7 (team-reserved /
eligibility verdicts prohibited).

### 2.5 RECOMMENDATION
> **[RC] §1** (L260–271): synthesis `CROSS_SOURCE`, inference `NONE`; permitted
> `PRESCRIBE_ACTION, STATE_FUNCTIONAL_MEANING`; prohibited "new findings", "new
> needs asserted to justify a recommendation", "new diagnoses", "guaranteed
> outcomes".
>
> **[PB] §3** (L82): "translate documented needs into actions. Never infer a need
> in order to justify a recommendation." **[PB] §9** (L244) adds the trace chain:
> "need → target skill → mechanism → implementation context → fading condition →
> progress indicator."

**Cross-ref:** §9 (recommendations exemplar).

---

## 3. Validity & data model

▣ **CO-GOVERNANCE CLUSTER B — ceiling/scope resolution (`effectiveCeiling`).**
Governed in **[RC] §0** (the canonical resolver), **[APP]** (a second, divergent
copy of the same function), **[PB] §4** (the authoring rule), **[LOG] D-033**
(orthogonality + the two fail-safe guards), and **[LOG] D-097** (a decision that
the [APP] copy is *wrong* and must be fixed). **The two implementations do not
match — see §11-F2.**

### 3.1 Ceiling and scope are orthogonal
**Plain language.** Interpretive *ceiling* governs how far a source may be pushed;
*scope* governs where/when/about-what it speaks. A valid teacher form supports
school claims and says nothing about home — a scope limit, not a ceiling limit.

> **[LOG] D-033** (L400–410): "Ceiling governs *how far* a source may be pushed;
> scope governs *where, when, and about what* it speaks. … Two fail-safe guards:
> `NOT_ESTABLISHED` never resolves to `FULL_INTERPRETATION`; an absent or empty
> scope means UNKNOWN, never UNRESTRICTED … Never read `interpretiveCeiling`
> directly — call `effectiveCeiling()`."
>
> **[PB] §4** (L92–99): "Two orthogonal limits: **Interpretive ceiling** … and
> **Source scope** … Use `effectiveCeiling()` rather than reading the field
> directly. `INVALID` yields `DO_NOT_INTERPRET`; `NOT_ESTABLISHED` yields
> `DESCRIBE_ONLY` and never full interpretation."

**Origin:** [LOG] D-033; [PB] §4. **Cross-ref:** §3.2/§3.3 (the two resolvers).

### 3.2 The canonical resolver (fails safe)
> **[RC] §0** (L98–116):
> ```ts
> export function effectiveCeiling(v: SourceInterpretationPolicy): InterpretiveCeiling {
>   if (v.validityStatus === "INVALID") return "DO_NOT_INTERPRET";
>   if (v.validityStatus === "NOT_ESTABLISHED") return "DESCRIBE_ONLY";
>   if (isScopeUnestablished(v.scope)) return "DESCRIBE_ONLY";
>   return v.interpretiveCeiling;
> }
> export function isScopeUnestablished(scope?: SourceScope): boolean {
>   if (!scope) return true;
>   return scope.settings.length === 0 || scope.constructs.length === 0;
> }
> ```
> GUARD 1 (L94–96): "NOT_ESTABLISHED must never resolve to FULL_INTERPRETATION."
> GUARD 2 (L107–112): "an absent or empty scope is UNKNOWN, never UNRESTRICTED."

**Behavior:** returns the *declared* `interpretiveCeiling` when validity/scope are
established; has **no bare `FULL_INTERPRETATION` fall-through**; **no `modified`
check.** Fails safe. **Origin:** [RC] §0 L98–116.

### 3.3 The app resolver (has the fall-through D-097 targets) ⚠ §11-F2
> **[APP]** `index.html` L839–851:
> ```js
> function effectiveCeiling(source) {
>   if (source.validityStatus === "INVALID") return "DO_NOT_INTERPRET";
>   if (source.validityStatus === "NOT_ESTABLISHED") return "DESCRIBE_ONLY";
>   if (source.modified) return "DESCRIBE_ONLY";
>   const scope = SCOPE_DEFAULTS[source.name];
>   if (!scope || !scope.settings || scope.settings.length === 0) {
>     return "DESCRIBE_ONLY";
>   }
>   if (source.validityStatus === "ACCEPTABLE_WITH_LIMITATIONS") {
>     return "INTEGRATE_WITH_QUALIFICATION";
>   }
>   return "FULL_INTERPRETATION";
> }
> ```
> `CEILING_TEXT` (L853–867) defines `COMPARE_WITHIN_SOURCE` but the resolver above
> never returns it.

**Behavior:** ends in a bare `return "FULL_INTERPRETATION"` and never returns
`COMPARE_WITHIN_SOURCE`. Adds a `modified → DESCRIBE_ONLY` check the canonical
resolver lacks (this matches [PB] §4 L101 "administration modifications").

> **[LOG] D-097** (L1246–1253) — the correction decision: "(1) **Unknown/absent
> validity must fail safe to the conservative ceiling (describe-only)** … the
> current fall-through to `FULL_INTERPRETATION` is **backwards.** (2)
> `COMPARE_WITHIN_SOURCE` is **defined but never returned** by the resolver —
> **restore its return path.**" **Status:** Accepted · *Build item.* "**Flag:
> `reasoning-contracts` (shared) — D-046 interaction.**"

**Discrepancy → §11-F2.** **Cross-ref:** D-099 (payload not wired, §3.6), D-046.

### 3.4 The source policy object (scope + validity + ceiling)
> **[RC] §0** (L43–89): `InterpretiveCeiling` = `DO_NOT_INTERPRET | DESCRIBE_ONLY
> | COMPARE_WITHIN_SOURCE | INTEGRATE_WITH_QUALIFICATION | FULL_INTERPRETATION`;
> `ValidityStatus` = `ACCEPTABLE | ACCEPTABLE_WITH_LIMITATIONS | INVALID |
> NOT_ESTABLISHED`; `SourceScope { informant?, settings[], timeframe?,
> constructs[], observationContext? }`; `SourceInterpretationPolicy { sourceId,
> validityStatus, interpretiveCeiling, scope, establishedBy, professionalReviewRequired, … }`.
> "(Formerly `SourceValidity`. That alias is deprecated … the name misdescribed
> the object, which carries scope as well as validity.)" ([PB] §4 L90; [RC] L91–92.)

**Cross-ref:** §3.5 (instrument scope defaults live in the app, not [RC]).

### 3.5 Instrument scope defaults
> **[APP] `SCOPE_DEFAULTS`** (L804–831): per-instrument informant + settings, e.g.
> `"WISC-V": { informant: "EXAMINER", settings: ["TESTING"] }`, `"Conners-4
> Parent": { informant: "PARENT", settings: ["HOME"] }`, `"Conners-4 Teacher":
> { informant: "TEACHER", settings: ["SCHOOL"] }`. `sourcePolicyBlock` (L869–884)
> renders "SOURCE LIMITS — do not exceed these" with an unestablished scope printed
> as "UNESTABLISHED — unknown, not unrestricted."

**Note:** these defaults are app-side only; [RC] carries the *types*, not the
per-instrument table.

### 3.6 Component-level validity (data-model requirement, not yet built)
> **[LOG] D-096** (L1236–1244): "Validity must be representable at the
> **component (subtest) level, not only the source level** … A component's
> invalidity **must be able to flag or qualify any composite it feeds.**"
> **Status:** Accepted · *Build item.* "**Flag: likely touches `reasoning-contracts`
> (shared) — D-046 interaction.**"

**Note:** the current `SourceInterpretationPolicy` [RC] §0 is **source-level
only** — component-level validity is specified by D-096 but not present in [RC].
**Cross-ref:** §9.2 (compromised-composite caveat D-108), §8 composite entries.

### 3.7 The validity architecture is switched off in production
> **[LOG] D-099** (L1264–1270): "The live `callMode` invocation passes **only
> `{data}`**, bypassing the sources/validity/scope/ceiling blocks `buildPrompt` is
> built to apply — **the validity architecture exists and is switched off in
> production.** … prerequisite for D-096/D-097 to have any effect." **Status:**
> Accepted · *Build item.* Confirmed at [APP] L1854 `TODO(stage2)` and L1925
> `callMode("DESCRIPTIVE_RESULTS", …)` passing only data.

**Cross-ref:** D-101 (Stage-1 quarantined, §10.4).

### 3.8 Evidence-tier ladder (domain coverage)
**Plain language.** How strongly a single *domain* is evidenced by what the
instrument captured — T0 (not asked) / T1 (asked, no concern = evidence of
absence) / T1-obs (asked, insufficient opportunity = absence of evidence) / T2
(affirmatively rated) / T3 (T2 + detail). Tiers never upgrade by inference; a
"domain addressed" check is satisfied by T1 but **not** by T1-obs.

> **[RC] §7** (L554–602): `Tier = "T0" | "T1" | "T1-obs" | "T2" | "T3"`;
> `satisfiesDomainAddressed(t)` returns true for T1/T2/T3, false for T1-obs/T0
> ("T1-obs is absence of evidence, not evidence of absence: it must raise a
> collect-elsewhere flag, never count the domain as covered"); `tierAssignmentLegal`
> — "tiers never upgrade by inference … reachable ONLY when the instrument
> supplied affirmative data."
>
> **[LOG] D-048** (L696–712): migrates the ladder + no-inference-upgrade + the
> domain-addressed guard to `@suite/reasoning-contracts`; "P29's *render forms* …
> stay in RIE." **Status:** Accepted.

**Cross-ref:** D-049 (RIE origin), D-091 (SpedQA cross-doc check), D-100
(domain unit). **Location caveat:** [RC] §7 L548–551 notes this lives in the
Sped-QA-Engine repo per D-046 and "relocates wholesale when the shared layer is
consolidated."

### 3.9 Evidence-status vocabulary (distinct axis from tiers)
> **[RC] §0** (L33–41): `EvidenceStatus = DIRECT_FACT | ATTRIBUTED_REPORT |
> DIRECT_OBSERVATION | DERIVED_CALCULATION | SUPPORTED_SYNTHESIS |
> QUALIFIED_SYNTHESIS | HYPOTHESIS | UNSUPPORTED` — the last "must not appear in
> output."

**Cross-ref:** §4 (confidence policy maps conditions → evidenceStatus); D-007
(claim-type labels).

---

## 4. Confidence & hedging

▣ **CO-GOVERNANCE CLUSTER C — confidence stems.** Governed by **[RC] §2
`CONFIDENCE_POLICY`** (the rank table), **[PB] §5 (Confidence language)** (the
same six stems as authoring prose), **[APP] `CONFIDENCE_BLOCK`** (the same six as
a live prompt), and **[LOG] D-026** (declares the stems non-normative). These are
consistent; the shared caveat (stems are anchors, not required vocabulary) is
what keeps them from becoming boilerplate.

### 4.1 The rank table (normative) with non-normative stems
> **[RC] §2** (L331–368): six entries, rank 5→0:
> `CONVERGENT_INDEPENDENT` → "The findings indicate" (SUPPORTED_SYNTHESIS, 5);
> `SUPPORTED_WITH_LIMITATION` → "The available information supports"
> (QUALIFIED_SYNTHESIS, 4); `SINGLE_SOURCE_OR_PARTIAL` → "The findings suggest"
> (QUALIFIED_SYNTHESIS, 3); `PLAUSIBLE_UNCONFIRMED` → "One possibility is"
> (HYPOTHESIS, 2); `MATERIALLY_CONFLICTING` → "The available information does not
> establish" (QUALIFIED_SYNTHESIS, 1); `MISSING_NECESSARY_EVIDENCE` →
> "Insufficient information was available to determine" (UNSUPPORTED, 0).
>
> **[PB] §5** (L131–140) — same six as a table, plus: "Use the strongest language
> the evidence warrants. Do not hedge merely because certainty is impossible."
>
> **[APP] `CONFIDENCE_BLOCK`** (L592–602) — same six, appended only for inference
> modes (`INFERENCE_MODES = ["INTEGRATED_INTERPRETATION", "RECOMMENDATION"]`,
> L892, L897–899).

### 4.2 Stems are non-normative anchors
> **[LOG] D-026** (L273–284): "the normative content is the `rank` ordering and
> its mapping to `condition` and `evidenceStatus`. The `stem` strings are
> calibration examples … not a closed vocabulary … QA must not implement any check
> as string-matching against a stem: detection targets rank overreach, never
> vocabulary divergence."
>
> **[RC] §2** header (L286–307) restates this verbatim in code comments; **[PB]
> §5** (L142): "These stems are anchors, not a required vocabulary. … House
> conventions may substitute their own stems at layer 7."

**Cross-ref:** §11 house conventions ([PB] §11); §6 (repeating stems manufactures
the boilerplate §5/§8 exist to prevent).

### 4.3 Qualification budget (one per paragraph)
> **[PB] §5 Qualification budget** (L160–167): "One material qualification per
> interpretive paragraph, by default. … Do not stack *suggests*, *may*, *might*,
> *possibly*, *appears* in one claim."
>
> **[APP] FIDELITY** (L579–581): "At most one qualification per paragraph. Never
> stack suggests / may / might / possibly / appears in a single claim."

**Co-governed** across [PB] §5 and [APP] FIDELITY — consistent.
**Cross-ref:** §5 (fidelity).

### 4.4 Actionable hypotheses
> **[PB] §5 Actionable hypotheses** (L144–150): "state it at the correct
> confidence level, name the observable that would support or weaken it, and route
> it to monitoring **only if** it is educationally consequential and reasonably
> measurable. Do not convert every uncertainty into a recommendation."

**Cross-ref:** §2.5 (RECOMMENDATION — no inferred need), §9.

---

## 5. Fidelity & sourcing

▣ **CO-GOVERNANCE CLUSTER D — fidelity / prohibited transformations.** Governed
by **[PB] §5 (Fidelity)** and **[APP] `FIDELITY`** — *not* by [RC] (there is no
FIDELITY object in reasoning-contracts). The two texts overlap but are not
identical (see §11-F3).

### 5.1 Preserve intensity/frequency/certainty; attribute; distinguish
> **[PB] §5 Fidelity** (L109): "Preserve the source's intensity, frequency, and
> certainty. Attribute reported information to its source. Distinguish observed
> behavior from respondent opinion, score description from interpretation, and
> hypothesis from supported conclusion."
>
> **[APP] FIDELITY** (L570–574): "Preserve each source's intensity, frequency, and
> certainty exactly. 'Sometimes' does not become 'frequently.' 'Elevated' does not
> become 'clinically significant.' 'The teacher reported' does not become 'the
> student is.' An unanswered item is missing information, not a negative finding."

### 5.2 Prohibited transformations (the list)
> **[PB] §5** (L111–122): "Do not turn: *sometimes* into *frequently*; *elevated*
> into *clinically significant*; *teacher reported* into *the student is*; a low
> score into a diagnosed impairment; cross-informant disagreement into situational
> causation; a relative weakness into a normative deficit; test behavior into a
> generalized trait without corroboration; absence of evidence into evidence of
> absence; a recommendation into a demonstrated need."

**Note:** [APP] FIDELITY carries a shorter subset (three transformations) than
[PB] §5's nine. → §11-F3. **Cross-ref:** §1.1 (invent nothing), §3.8 (T1-obs =
absence of evidence, the machine form of "absence ≠ evidence of absence").

### 5.3 Discrepancy: classify before describing
> **[PB] §5 Discrepancy** (L123–127): "Classify before describing: `CONVERGENT`
> · `PARTIALLY_CONVERGENT` · `DIFFERS_IN_SEVERITY` · `DIFFERS_IN_CONSTRUCT` ·
> `SETTING_SPECIFIC` · `CONTRADICTORY` · `NOT_COMPARABLE` ·
> `INSUFFICIENT_FOR_COMPARISON`. … Never average informants to make a discrepancy
> disappear, and never silently adopt the more severe rating."
>
> **[RC] §3** (L370–388): `SourceRelationship` classes (CONVERGENT …
> INSUFFICIENT_FOR_COMPARISON); header: "A discrepancy must be CLASSIFIED before
> it is described. It may be described without explanation; it may not be explained
> without evidence, and it may never be averaged away."

**Co-governed** [PB] §5 + [RC] §3 — consistent (note [PB] uses
`PARTIALLY_CONVERGENT`; [RC] enum wording to confirm at §3, minor label check).
**Cross-ref:** §2.1 (SOURCE_FAITHFUL preserves contradiction), D-078 ledger rule 3.

### 5.4 The four ledger rules
> **[LOG] D-078** (L1056–1059): "(1) no orphan prose; (2) immutable reporter
> attribution; (3) conflicts preserved, not resolved; (4) gap report precedes
> drafting." **Status:** Accepted.

**Cross-ref:** §9.1 (D-105 extends "gap report precedes drafting"); §5.1
(attribution); §5.3 (conflicts preserved).

### 5.5 Provenance / authority of rules themselves
> **[RC] §4** (L405–455): `SourceStatus` (DIRECT_SOURCE_PRINCIPLE …
> PROVISIONAL_RULE) and `RuleAuthority` (`mandated | defensibility | craft`),
> orthogonal; `mayPhraseAsRequirement(r)` returns true only when authority ===
> "mandated". "Only mandated rules may be phrased as obligations in QA output."
>
> **[LOG] D-028** (L296+): "`authority` is a field on RuleMetadata, orthogonal to
> `SourceStatus`." **Status:** Accepted.

**Note:** primarily a QA-output concern; included because it governs how a rule may
be *stated*. **Cross-ref:** §10 (precedence — legal layer).

---

## 6. Length & proportionality

▣ **CO-GOVERNANCE CLUSTER E — length governance sole-sourcing.** Length lives in
**exactly one place by decision**: **[PB] §7**. **[RC]** deliberately *removed* it
(**[LOG] D-025**); `PILOT_METRICS` stays in [RC] as instrumentation only. This
cluster is a case of *intentional* non-duplication — worth noting so a future
reader does not "restore" length to the shared package.

### 6.1 Proportionality first; length is an outcome
> **[PB] §7** (L200–208): "Narrative length within a domain scales with the
> number, complexity, discrepancy, and decision relevance of interpretable
> findings — **not** with the number of instruments administered. … A new
> paragraph must perform new interpretive work. If two paragraphs reach the same
> functional conclusion, combine them."

### 6.2 Length governance sole-sourced here; absolute limits inactive for pilot
> **[PB] §7 Length governance** (L210–220): "Sole-sourced here as of 2026-07-21,
> when the `LengthGovernance` type and `DEFAULT_LENGTH_GOVERNANCE` were removed
> from `@suite/reasoning-contracts`. … **Absolute limits: inactive for pilot.** …
> **Pilot measurement: enabled.** Length is measured, not enforced. Do not add a
> word target during pilot."
>
> **[LOG] D-025** (L260–271): "`LengthGovernance` and `DEFAULT_LENGTH_GOVERNANCE`
> are removed from `@suite/reasoning-contracts` and sole-sourced in the parameter
> block (§7). … Absolute limits stay inactive for pilot; introducing one requires
> a superseding decision, not a style edit."
>
> **[RC] §4/§5** (L464–502): the removal is documented in-file ("REMOVED: LENGTH
> GOVERNANCE … Now sole-sourced in the parameter block, §7 Proportionality") and
> `PILOT_METRICS` is "INSTRUMENTATION ONLY; NEVER A QA FINDING."

**Cross-ref:** §10 (precedence layer 5 = proportionality).

### 6.3 Table/prose division (P1–P3) ⚠ P2 relates to §11-F1
> **[PB] §6** (L171–196): **P1** "Tables enumerate; prose interprets." **P2**
> "**Prose runs one level coarser than the table.**" (granularity table L184–192).
> **P3** "The rating-scale narrative unit is the informant's situated account."

**Note:** [PB] §6 P2 "one level **coarser**" pre-dates **D-092**'s "one level
**more meaningful**" for DESCRIPTIVE_RESULTS. D-092 is scoped to the
DESCRIPTIVE_RESULTS *result-description* rule; whether it also revises P2's
interpretive-prose granularity is **unresolved in the sources** → §11-F1.

### 6.4 Paragraph content inventory (proportionality defaults, not counts)
> **[PB] §5** (L152–158): "Primary findings ordinarily draw on 4–5 elements,
> secondary on 2–3, supporting on 1–2. **These are proportionality defaults, not
> completeness requirements** — do not add qualification or functional commentary
> to reach a count."

**Cross-ref:** §4.3 (qualification budget), §6.1.

---

## 7. Eligibility boundary

▣ **CO-GOVERNANCE CLUSTER F — the eligibility/adverse-impact/SDI wall.** Governed
by **[RC] §6** (schema absence), **[PB] §2** + **§12** (artifact boundary +
refusal), **[LOG] D-034** (structural exclusion) and **[LOG] D-005** (MVP scope)
— **both amended 2026-07-23** — plus **D-082** (SDI language) and **D-090**
(planning-coverage clarification). **The amendments soften the wall to a
district-template setting, but [RC] §6 and [PB] §2/§12 still encode the hard wall
→ §11-F4.**

### 7.1 Artifact boundary — no adverse-impact / SDI / eligibility verdict
> **[PB] §2** (L39–52): "You generate psychoeducational evaluation content only.
> You **cannot** produce, and have no destination for: An adverse-impact
> statement; A determination that the student requires specially designed
> instruction; An eligibility verdict, or language presupposing one;
> Category-derived impact language. … You **may** document eligibility-*relevant*
> findings: observable educational functioning, setting and task context … Producing
> it is not the same as reaching the determination."
>
> **[RC] §6** (L505–533): `PsychReportSection` enumerates twelve sections;
> "Deliberately absent: `adverse_impact`, `need_for_specially_designed_instruction`.
> … Enforced by schema, not by prompting." Eligibility modes
> (`ADVERSE_IMPACT_DRAFTING`, `SDI_DRAFTING`, `ELIGIBILITY_ARTIFACT_REVIEW`) are
> "Never registered in PsychReport's section registry."

### 7.2 The founding exclusion decision (amended)
> **[LOG] D-034** (L413–428): "Adverse-impact language in an evaluation report
> constitutes predetermination … PsychReport has no `adverse_impact` and no
> `need_for_sdi` section — not a flag, not a prompt, not an export field. Enforced
> by schema, not prompting."
> **Amendment (2026-07-23, per D-038), L429:** "The adverse-impact/SDI schema
> exclusion is **no longer an absolute structural wall** — it becomes a
> **district-template setting**; criteria-referenced adverse-impact findings
> grounded in evaluation data and framed for the team (`TEAM_RESERVED` +
> `eligibility_relevant_findings`) are permitted where a district template
> requires them. … Original text preserved above."
>
> **[LOG] D-005** amendment (L50): parallel correction — "Adverse-impact language
> in a report **does not itself constitute predetermination** … The **schema
> exclusion becomes a district-template setting**, not a hard structural wall."

### 7.3 SDI-need language — user-initiated, default off
> **[LOG] D-082** (L1080–1085): "SDI-need language is **user-initiated after
> report review, editable, default off; provisional pending counsel**. …
> **predetermination is a process violation** — deciding eligibility/SDI without
> the team or without data — **not a property of words in a report.**"

### 7.4 Planning coverage is not a report concern
> **[LOG] D-090** (L1160–1169): "PsychReport reports **assessments administered**
> … Documentation of which domains were **considered but not evaluated** … is a
> **referral/eligibility-planning artifact** … No 'the team considered [domain]'
> or coverage-attestation prose is added to PsychReport. … only scales with
> provided scores appear; no domain is manufactured to demonstrate consideration."
> **Status:** Accepted 2026-07-25.

**Cross-ref:** §1.2 (refusals), §2.4 (eligibility verdicts prohibited in
INTEGRATED_INTERPRETATION), §3.8/D-091 (SpedQA cross-doc coverage check).

---

## 8. Library / reference (D-092–D-109)

▣ **CO-GOVERNANCE CLUSTER G — the instrument-description library.** The construct
exposition problem is governed by an interlocking decision chain **D-092 → D-093 →
D-094 → D-103 → (amended by) D-107 → D-108 → D-109**, plus the live scaffold file
`~/Documents/psychreport/library/wisc-v.draft.md`. This is the newest and
densest cluster; D-103 is **AMENDED by D-107**.

### 8.1 Construct exposition is app-supplied library content, not model-generated
> **[LOG] D-093** (L1196–1212): "Descriptions of **what an instrument and each
> index/subtest measure** are static per instrument and must come from a
> **versioned, citable instrument-description library, not the model.** … the
> library holds **two keyed levels** — **instrument-level** … and
> **index/subtest-level** … so the app assembles **definition → student-specific
> performance prose → bounded interpretation.** Only the definition is retrieved."
> **Status:** Accepted · *Build item.*

### 8.2 Why: the FIDELITY / exposition contradiction
> **[LOG] D-094** (L1214–1223): "FIDELITY instructs the model to **use only
> supplied case data and invent nothing**; construct descriptions are **not in the
> case data**; so … describing what an index measures is **either a fidelity
> violation or forces the model to improvise clinical content and mislabel it as
> case-derived.** Making construct exposition **app-supplied library content**
> dissolves the contradiction."

**Cross-ref:** §5.1 (FIDELITY), §1.1.

### 8.3 D-092 — "one level more meaningful than the table"
(Full text under §2.3.) The rule that *unblocks* exposition by separating three
content types — construct exposition, result description, interpretation — that
the old "one level coarser" rule conflated. **Cross-ref:** §2.3, §6.3, §11-F1.

### 8.4 Five-slot entry schema (D-103, superseded in detail by D-107)
> **[LOG] D-103** (L1296–1323): five slots — `construct_definition`
> (library-static, cited, always), `generic_task_example` (library-static, cited,
> generic), `student_performance` (model-generated under DESCRIPTIVE_RESULTS —
> "the **only freely generated slot**"), `functional_connection` (model-generated
> under INTEGRATED_INTERPRETATION only, **pointer only** in the instrument
> section), `variability_context`/caveat (library-static, rule-inserted on
> determination). **Status:** Accepted.
> **Amendment note (2026-07-25, per D-038), L1324:** "Refined by **D-107** … Original
> slot model preserved above; D-107 governs implementation."

### 8.5 D-107 — the implementable schema (amends D-103)
> **[LOG] D-107** (L1367–1402): **Index entry** — Slot 1 two-part: `core_definition`
> (stable, manual-sourced, always) + `secondary_descriptor` (optional
> interpretive-adjacent, structured even when empty); Slot 2 `generic_task_example`;
> Slot 3 `student_performance` (DESCRIPTIVE_RESULTS); Slot 4 `functional_connection`
> (INTEGRATED_INTERPRETATION only, rendered in integration, pointer in instrument
> section); Slot 5 `variability_context`/caveat (rule-inserted from D-108 on
> determination, never scatter-triggered D-104, never generated D-106).
> **Composite entry:** slots 1,3,4,5 + `composition` field, **no slot 2**.
> **Per-slot metadata:** provenance tag; source `{instrument, edition, location}`;
> distinct `version` and `edition` stamps. **Status:** Accepted.

**Scaffold state:** `~/Documents/psychreport/library/wisc-v.draft.md` implements
the D-107 schema but is **DRAFT/UNVERIFIED**; content slots are placeholders (per
its own header + D-109).

### 8.6 Conditional content inserts on determination, never on raw thresholds
> **[LOG] D-104** (L1326–1338): "Conditional content (FSIQ variability caveat,
> compromised-composite caveat, any 'interpret with caution' text) is inserted
> **only when an examiner judgment or validated interpretive-logic condition is
> met** — **never automatically from raw score patterns** such as index scatter.
> … large index discrepancies are statistically common and do not by themselves
> make a composite unreliable." **Status:** Accepted.

**Cross-ref:** §9 (caveats), §3.6 (D-096 composite validity).

### 8.7 Caveat sub-library — closed, keyed, authored strings
> **[LOG] D-108** (L1404–1415): "Conditional caveats (slot 5) are drawn from a
> **closed sub-library of authored strings, not composed by the model.** Each entry
> is a **fixed string with variable slots** … **keyed to the determination
> condition** … Initial set: FSIQ/composite variability caveat;
> compromised-composite caveat …; scope/administration caveat. … a **missing-data
> condition routes to a gap flag (D-105)**, never into this sub-library." **Status:**
> Accepted.

### 8.8 Library content is manual-verified, not model-adopted
> **[LOG] D-109** (L1417–1429): "All library content … must be **authored and
> verified by JD against the primary test manual before entry**, regardless of how
> fluent or agreed-upon draft text from any model … appears. **Two models
> converging on a definition certifies the format is stable; it does not certify
> the content**, since both draw on overlapping training data and can be
> **confidently wrong in the same way.** … library entries reach 'content-complete
> with citation placeholders' … but 'verified' only after a manual-open authoring
> pass; the two states are tracked distinctly." **Status:** Accepted.

**Cross-ref:** §1.1 (invent nothing), §8.2 (D-094), D-066 (pin discipline).

### 8.9 Score-in-prose rule
> **[LOG] D-095** (L1225–1234): "A score may be named in narrative **only when the
> number itself is evidence a reader must inspect** (e.g., a material within-domain
> split such as Word Reading 68 vs. Pseudoword Decoding 88, where **the gap is the
> finding**); otherwise **the table carries the number and the prose carries the
> pattern.**" **Status:** Accepted · *Build item.*

> **[PB] §6 P1** (L180) co-governs: "Prose may name a specific result when: no
> table exists; the result explains a discrepancy; it materially affects
> validity; it answers the referral or eligibility question; …" **[APP]
> DESCRIPTIVE_RESULTS** (L691) co-governs: "Name a specific score only when it
> explains a discrepancy, affects [validity]…"

**Co-governed** D-095 + [PB] §6 P1 + [APP] — consistent. **Cross-ref:** §2.3, §6.3.

---

## 9. Caveats & gap-handling

### 9.1 Gaps become user-facing flags, never report-voice prose
> **[LOG] D-105** (L1340–1355): "When the generator lacks information a competent
> evaluator would have … it must **surface the gap to the user out-of-band** … and
> must **NOT narrate the limitation in the report's voice** (e.g., 'formal
> statistical-comparison information was not available'). … such sentences
> **describe the tool's access, not the child** … This is the **mirror of D-094**
> … extends the ledger's existing 'gap report precedes drafting' (D-078)."
> **Status:** Accepted.

**Cross-ref:** §1.3 (report doesn't narrate itself), §5.4 (D-078), §8.2 (D-094).

### 9.2 Slot-5 caveats are clinical judgments, not system limitations
> **[LOG] D-106** (L1357–1365): "The conditional-caveat slot may **only ever
> produce a caveat the evaluator clinically endorses** … It must **never produce a
> caveat that is actually a system limitation in disguise** (e.g., 'comparison data
> was not available') — that case is a **gap flag per D-105, not a caveat.**"
> **Status:** Accepted.

**Cross-ref:** §8.6 (D-104), §8.7 (D-108), §9.1 (D-105).

### 9.3 Limitations under a DESCRIBE_ONLY ceiling
> **[PB] §4** (L101): "Where a ceiling is `DESCRIBE_ONLY` because of administration
> modifications, describe observed task performance without treating obtained
> scores as normative estimates." **[APP] CEILING_TEXT.DESCRIBE_ONLY** (L856–859)
> co-governs the same rule as an injected prompt string.

**Cross-ref:** §3.2/§3.3 (resolvers), §5 (limitations stated once, [PB] §5 L162).

---

## 10. Precedence & conflict resolution

### 10.1 The precedence stack
> **[PB] §1** (L18–27):
> ```
> 1. Legal / authorization / artifact boundary
> 2. Section mode
> 3. Source scope and interpretive ceiling
> 4. Evidence and clinical reasoning
> 5. Proportionality
> 6. General style
> 7. House conventions
> 8. Target template
> ```
> "**Specialization rule.** A lower layer may specialize a higher layer. It may
> not weaken, contradict, or authorize anything a higher layer prohibits." (L29).
> Examples L33–35: a template may rename a heading but not add an excluded section;
> a house convention may request classifications in prose but not authorize
> interpretation beyond ceiling; a style rule may favor direct language but not
> remove a necessary qualification.

### 10.2 Precedence is sole-sourced in the parameter block
> **[PB] §1** (L31): "*This stack is sole-sourced here.* It was previously also
> exported from `@suite/reasoning-contracts` as `PRECEDENCE`; that export was
> removed on 2026-07-21 because it orders drafting instructions, and QA does not
> draft."
>
> **[LOG] D-024** (L251–258): "The precedence stack is exported only from the
> PsychReport parameter block (§1), not from `@suite/reasoning-contracts`. … The
> stack itself is unchanged — this is a relocation, not a revision." **Status:**
> Accepted.

### 10.3 House conventions govern expression, not evidence
> **[PB] §11** (L269–275): "A house convention may govern **how valid content is
> expressed**. It cannot change **what the evidence supports**. If district phrasing
> is legally mandated, it belongs at layer 1 instead. Governs: table column schema
> … classification vocabulary … district-required phrasing … Does **not** govern:
> WIAT-4 domain-level prose or informant-centered rating narratives — those derive
> from P1–P3."
>
> **[APP] buildPrompt** (L904–910) co-governs: injects house conventions with
> "formatting only. These govern how valid content is expressed. They cannot
> authorize a claim the evidence or the source limits do not support."

**Co-governed** [PB] §11 + [APP] — consistent. **Cross-ref:** §4.2 (house may
substitute stems), §6.3 (P1–P3 live in principles layer).

### 10.4 The amendment discipline (how conflicts between decisions resolve)
> **[LOG] D-038** (L495+): `@suite/reasoning-contracts` is Layer 0; the later
> decision governs, the earlier keeps a dated amendment note, ratified text is
> never silently rewritten. (Applied visibly at D-001, D-003, D-005, D-034, D-103.)
>
> Merge discipline: **D-058** (L852) "A decision logged in a product repo must be
> merged to the trunk before session end"; **D-064** (L938) extends this to chats;
> **D-029** (L316) repo canonicity / Project Context copies are snapshots.

### 10.5 Stage-1 is quarantined pending the D-092–D-100 corrections
> **[LOG] D-101** (L1280–1286): "The mode-scoped wiring is **confirmed sound** …
> but the **content architecture beneath it is incomplete** in the ways D-092–D-100
> specify. The **`stage1-mode-prompts` branch stays quarantined**; **`main` remains
> the known-good July 2 baseline** until these resolve." **Status:** Accepted.
>
> **[LOG] D-102** (L1288–1294): meta-note — D-092–D-100 "were surfaced by a
> **single Stage-1 pilot plus one independent cross-check — none were visible on
> paper.**"

**Cross-ref:** §3.7 (D-099 payload not wired), §3.3 (D-097), §3.6 (D-096).

### 10.6 Shared-layer location is unresolved (D-046)
> **[LOG] D-046** (L651–673, **OPEN**): `@suite/*` is split across two repos;
> `reasoning-contracts` currently lives in the QA-Engine repo, `case-model` in
> `psychflow-suite`. "neither can build the whole `@suite` graph on its own."
> Leading option: consolidate into `psychflow-suite`. **Status:** OPEN.

**Why it matters here:** D-096 and D-097 are flagged as `reasoning-contracts`
(shared) changes with a "D-046 interaction" — the two divergent `effectiveCeiling`
copies (§3.2/§3.3) sit on either side of this unresolved split.

---

## 11. Findings — text discrepancies between sources (flagged, not resolved)

**F1 — DESCRIPTIVE_RESULTS granularity: "coarser" vs. "more meaningful."**
[APP] `MODE_PROMPTS.DESCRIPTIVE_RESULTS` (L689) and [PB] §6 P2 (L182) both say
"one level **coarser** than the table." [LOG] **D-092** (Accepted 2026-07-25)
replaces "write one level coarser" with "one level **more meaningful** than the
table," because the coarser rule suppressed required construct exposition. **The
live prompt and [PB] §6 P2 still carry the superseded wording.** Whether D-092
revises only the DESCRIPTIVE_RESULTS result-description rule or also [PB] §6 P2's
interpretive-prose granularity table is not stated in the sources. → §2.3, §6.3.

**F2 — Two `effectiveCeiling` implementations diverge.** The canonical [RC] §0
resolver (L98–105) returns the declared `interpretiveCeiling` and **fails safe**
(no `FULL_INTERPRETATION` fall-through; can return `COMPARE_WITHIN_SOURCE` via the
declared field). The [APP] copy (L839–851) ends in a bare `return
"FULL_INTERPRETATION"` and **never returns `COMPARE_WITHIN_SOURCE`** though
`CEILING_TEXT` defines it. [LOG] **D-097** (Accepted) declares the [APP]
fall-through "backwards" and orders both fixes — **not yet applied.** Secondary
divergence: [APP] has a `source.modified → DESCRIBE_ONLY` check the canonical
resolver lacks (the canonical one matches [PB] §4's modification rule only via the
declared ceiling). → §3.2, §3.3.

**F3 — FIDELITY prohibited-transformation list differs by length.** [PB] §5
lists **nine** prohibited transformations (L111–122); [APP] `FIDELITY` (L570–574)
carries a **three-item** subset. Same direction, different coverage — the app
prompt is a compression of the parameter-block rule, not a copy. → §5.1, §5.2.

**F4 — The eligibility wall: amended in decisions, still hard-coded in
contracts/param-block.** [LOG] D-034 and D-005 were **amended 2026-07-23** to make
the adverse-impact/SDI exclusion "a **district-template setting**, not a hard
structural wall" (permitting `TEAM_RESERVED` + `eligibility_relevant_findings`
where a template requires). But [RC] §6 still lists `adverse_impact` /
`need_for_specially_designed_instruction` as "Deliberately absent … Enforced by
schema," and [PB] §2/§12 still state the model "**cannot** produce" adverse-impact
or SDI language and must **refuse**. The schema/param-block have not been updated
to the amended (softened) decision. → §7.

**F5 — FIDELITY is absent from reasoning-contracts (source-access finding).** The
task requested "the FIDELITY block" from [RC]; it does not exist there. FIDELITY
lives only in [APP] (L565–585); its content is mirrored in [PB] §5. Recorded so
the absence is not mistaken for an extraction gap. → §5, "Source-access note."

**No other source was inaccessible.** All four sources were read in full at the
locations listed in the header.

---

## Appendix — rule count per grouping

| # | Grouping | Rule entries | Primary sources |
|---|---|---|---|
| 1 | Generation constraints | 4 | [APP], [PB]§12/§8, D-007, D-100 |
| 2 | Mode contracts | 7 (5 modes + modifier rule + de-hazarding) | [RC]§1, [PB]§3, [APP], D-032, D-092, D-098 |
| 3 | Validity & data model | 9 | [RC]§0/§7, [APP], [PB]§4, D-033, D-096, D-097, D-099, D-048 |
| 4 | Confidence & hedging | 4 | [RC]§2, [PB]§5, [APP], D-026 |
| 5 | Fidelity & sourcing | 5 | [PB]§5, [APP], [RC]§3/§4, D-078, D-028 |
| 6 | Length & proportionality | 4 | [PB]§6/§7, [RC]§4/§5, D-025 |
| 7 | Eligibility boundary | 4 | [RC]§6, [PB]§2/§12, D-034, D-005, D-082, D-090 |
| 8 | Library / reference (D-092–D-109) | 9 | D-092/093/094/095/103/104/107/108/109, scaffold file |
| 9 | Caveats & gap-handling | 3 | D-105, D-106, [PB]§4, [APP] |
| 10 | Precedence & conflict resolution | 6 | [PB]§1/§11, [APP], D-024, D-038, D-101/102, D-046 |
| — | **Findings (discrepancies)** | **5** (F1–F5) | cross-source |

**Total rule entries:** 55, plus 5 discrepancy findings.
**Co-governance clusters flagged:** 7 (A–G).
**Sources not fully accessible:** none.
