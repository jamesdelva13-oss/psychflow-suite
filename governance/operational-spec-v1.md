# PsychReport — Operational Specification v1

**Current-effective-rules document.** This specification states the rules that
currently govern PsychReport generation. Per **P-05 (D-114)** it is **derived
from and cross-referenced to the decision log — it does not replace it.** The
decision log (`suite/decisions.md`, canonical) remains the provenance record:
original decisions, amendments, and supersession history live there. Every rule
below links back to its governing decision(s).

- **Version:** v1 · **Adopted:** 2026-07-27 (Session A reconciliation, JD-ratified)
- **Source proposal:** `PsychReport_Reconciled_Governing_Rules.docx`, with the four
  consensus corrections C1–C4 applied.
- **Governing process rules:** P-01–P-07, logged as **D-110–D-116**.
- **Amendment set applied to the log:** D-005/D-034, D-092, D-093/D-094, D-095,
  D-097 (OPEN GATE), D-098, D-100, D-101/D-102, D-103/D-107, D-109; corrections
  C2→D-032, C3→D-048.
- **Session B amendment log (2026-07-27):** D-097 **retired** (both claims refuted
  against canonical code); Rule 3.3 **verified** — a divergent duplicate resolver
  exists in the app but is dormant (→ **D-118**), so "retire the duplicate" is not
  void but deferred; D-099 payload framing **confirmed**; logged **D-117**
  (scope-symmetry clause) and **D-118** (running app enforces no interpretive
  ceiling); C2 (Gate 4) and D-046 (Gate 5) confirmed. Cross-references to the
  decision history retained throughout.

> ### Session B (2026-07-27) — engineering-verification results
> The dispositions below were logged OPEN pending Session B (P-03 / C1). Session B
> verified Gates 1–5 against canonical code; results:
>
> - **D-097 (effectiveCeiling) → RETIRED.** Both claims refuted — the canonical
>   resolver already fails safe and can return `COMPARE_WITHIN_SOURCE`. (Gate 1/2.)
> - **Rule 3.3 — app resolver → VERIFIED.** A divergent duplicate resolver *does*
>   exist in the app (`index.html:839`) but is **dormant** (never invoked; payload
>   unwired). "Retire the duplicate" is **not moot** — remove it, call canonical,
>   and wire the payload during integration. Logged as **D-118**. (Gate 3.)
> - **Rule 3.7 — validity architecture off in production (D-099) → CONFIRMED, still
>   OPEN.** The payload is unwired; this is the immediate cause the resolver never
>   runs. Build item (gate G4).
>
> Net: the running app enforces **no** interpretive ceiling (D-118); resolver
> integration (wire payload + replace the duplicate with canonical) is foundational.
> Remaining OPEN build gates: **G3, G4, G6, G7, G8**. See the closed gate list in
> the decision log (after D-118).
>
> **Superseded in part (2026-08-09, VS-3).** The Session B findings above are
> preserved as the record of what was true in July 2026. Rule 3.7 / D-099 and
> gate **G4 are now closed** — the VS-3 rebuild wires the payload and invokes
> the canonical resolver (§3.7 below carries the retirement note). The rule is
> generalized by **D-141** into §8 rule 5.7. Remaining OPEN gates: **G3, G6,
> G7, G8**.

---

## 1. Executive summary

PsychReport should **not** convert the 55 consolidated rule entries into a single
master prompt. The reconciled system preserves the hard safeguards while
separating five implementation layers: runtime generation, deterministic policy,
optional reference, QA/benchmarking, and governance/engineering. Some source
rules are intrinsically rigid; other otherwise-flexible rules became rigid when
prompt distillation removed their qualifications and escape clauses.
Reconciliation therefore (a) amends rules, (b) fixes the prompt-distillation
pipeline, and (c) synchronizes the operational files with the decision log.

**Authority and document relationship.** The decision log is the historical
provenance record; amendments are appended, history is not erased (D-038). This
specification states the current effective rule and cross-references the decision
history (P-05). The runtime prompt is a task-specific subset of this
specification, not a copy of it (P-01). Code-adjacent claims must be verified
against the canonical implementation and tests before ratification (P-03).

## 2. Implementation layers

- **Runtime prompt** — role/register, case-fidelity rule, active-task permissions,
  resolved source limits, confidence instruction when relevant, and output format.
- **Deterministic policy engine** — score facts, source scope, validity ceilings,
  artifact authorization, missing-input detection, caveat triggers, routing.
- **Optional reference registry** — instrument identity, edition, composition,
  concise construct anchors, generic task context, organization-approved language,
  automatic caveat identifiers.
- **QA and benchmark suite** — detailed prohibited transformations, unsupported
  inferences, discrepancy flattening, boilerplate detection, prompt-regression
  cases, output scoring.
- **Governance and engineering** — decision history, precedence, authority
  metadata, repository location, implementation status, test evidence, quarantine.

## 3. Cross-cutting process rules (P-01 – P-07 = D-110 – D-116)

- **P-01 · Minimum-necessary prompt** *(D-110, [suite])* — "A runtime instruction
  remains only when it protects a legitimate product, evidentiary, validity, or
  artifact boundary and its benefit exceeds its cost to natural writing."
- **P-02 · Preserve permissions during distillation** *(D-111, [suite])* — "When a
  source rule contains a permission, default, qualification, or escape clause that
  materially prevents over-constraint, the distilled prompt must carry it in the
  same instruction or reference the complete resolved rule."
- **P-03 · Verify code claims** *(D-112, [suite])* — "No decision about resolver
  behavior, data representation, or application fall-through is ratified from a
  secondary summary alone. Verify the canonical file and execute representative
  tests."
- **P-04 · Claims versus scaffolding** *(D-113, [suite])* — "Student-specific
  factual and inferential claims require case support. Generic construct
  exposition, connective prose, and professional recommendation knowledge may be
  used when authorized, but may not smuggle unsupported claims."
- **P-05 · Current spec versus history** *(D-114, [suite])* — "The operational
  specification contains only current effective rules. The decision log preserves
  original decisions, amendments, and supersession history."
- **P-06 · Artifact profiles** *(D-115, [PsychReport])* — "Product boundaries are
  resolved by artifact profile. School psychoeducational, private psychological,
  and future specialty profiles may authorize different conclusions while sharing
  fidelity and validity safeguards."
- **P-07 · No universal curation tiers** *(D-116, [PsychReport])* — "Do not
  classify instruments as globally high-volume or low-volume. Curated reference
  content is optional and may grow from use, customer demand, corrections, or
  organization preference."

## 4. Generation constraints

**1.1 · Invent nothing; use only supplied data.** Every student-specific factual
claim must be supported by supplied case data. Do not invent or alter history,
observations, scores, interventions, diagnoses, quotations, intensity, frequency,
certainty, or attribution. Standard generic instrument exposition and
professional recommendation knowledge may be used when authorized by the active
task, but must not be presented as facts about the student. If case evidence does
not support a claim, omit it or surface a user-facing gap; do not create the claim
by hedging. *(Resolves the FIDELITY/exposition contradiction without weakening
case fidelity; detailed transformation examples live in QA under Rule 5.2.)*
— *Governs:* APP FIDELITY; PB §5; **D-007**; **D-094**; **P-04 (D-113)**.

**1.2 · Output-type refusals.** Route requested content according to the active
artifact profile, user authorization, source scope, and validity. When a
requested claim is unsupported or unauthorized, block only the affected claim,
produce any adjacent supported content, and surface the reason and needed evidence
outside report prose. In the school profile, eligibility verdicts remain
team-reserved; adverse-impact and SDI language are available only through
configured workflows. *(Do not make the drafting model write assistant-style
refusals inside a report section.)* — *Governs:* PB §12; **D-005/D-034
amendments**; SDI ruling (**D-082**).

**1.3 · The report does not narrate itself.** Do not mention the generator,
prompt, missing application fields, or drafting process in report voice.
Evaluation methods, modified administration, and evaluator-endorsed limitations
may be described when clinically relevant. Do not instruct the reader how to feel
or advocate for a conclusion through rhetorical pressure. — *Governs:* PB §8;
**D-105**.

**1.4 · Unit of analysis is the domain, not the instrument.** Organize the report
around clinically meaningful findings rather than mechanically following the
assessment list. **Domain-level integration is preferred when it improves
understanding. Measure-specific narration is appropriate when needed** to explain
validity, a meaningful within-measure pattern, the referral question, the selected
template, or practice convention. *(Not a universal architecture across school and
private/community reports.)* — *Governs:* **D-100** (softened to finding-centered
default); proportionality rules.

## 5. Mode contracts

**2.0 · Five modes, subtractive modifiers, block-scoped.** PsychReport uses five
base permission profiles: SOURCE_FAITHFUL, DIRECT_OBSERVATION, DESCRIPTIVE_RESULTS,
INTEGRATED_INTERPRETATION, RECOMMENDATION. Modifiers may narrow permissions but may
not expand them. A mode identifies the dominant rhetorical task and claim ceiling;
it does **not** require a separate visible paragraph or block for every claim type.
A paragraph may combine authorized descriptive and interpretive claims when each
claim is supported. SOURCE_FAITHFUL content may not be silently promoted into
interpretation. *(Retires the universal "no blended modes; use two blocks"
rendering rule.)*

> **Correction C2 (suite-level taxonomy).** The QA-classifier accuracy rationale is
> **removed** as the justification for PsychReport's five-mode cap; PsychReport
> evaluates the five-mode taxonomy on its own drafting needs. **However, the mode
> vocabulary in `reasoning-contracts` is shared with QA, so any change to the mode
> taxonomy itself remains a `[suite]`-level ruling** and may not be made
> product-locally.

— *Governs:* RC MODE_CONTRACTS; PB §3; **D-032** (amended, C2).

**2.1 · SOURCE_FAITHFUL.** Recount and organize what this source reported.
Preserve the source's meaning, intensity, uncertainty, attribution, and internal
contradictions. Do not add explanation, causal interpretation, diagnosis, or
evidence from another source. *(An unanswered item is missing information, not a
negative finding. Professional paraphrase is permitted so long as meaning is not
escalated.)* — *Governs:* RC/PB/APP SOURCE_FAITHFUL.

**2.2 · DIRECT_OBSERVATION.** Describe observable behavior and the conditions under
which it occurred, including setting, task demand, structure, and response to
support. Bounded characterization across the observation is permitted when it
remains tied to observed conditions. Do not infer motive, diagnosis, generalized
trait, or functioning in unobserved settings. *(Retain the positive exemplar trio:
direct observation, permitted characterization, exceeds-the-observation.)* —
*Governs:* RC/PB/APP DIRECT_OBSERVATION.

**2.3 · DESCRIPTIVE_RESULTS.** Explain the named instrument or construct when
useful; report verified performance; and describe meaningful patterns,
discrepancies, task behavior, and validity within the reported results. Do not
diagnose, claim causation, or infer broad functioning from the measure alone.
Broader cross-source conclusions belong primarily in integrated interpretation,
but concise construct-level meaning may be braided with results when supported.
*(Removes "inference is binary/none" and the rigid no-functional-translation
formulation; replaced by bounded within-results interpretation.)* — *Governs:*
RC/PB/APP DESCRIPTIVE_RESULTS; **D-092**, **D-093**, **D-094**.

**2.3a · Exemplar de-hazarding.** Use neutral, structurally focused, or
deliberately varied exemplars that teach the permitted operation rather than a
common clinical pattern. Exemplar content must never override case data. Test
prompts with reversed and atypical patterns before release. *(Prefer neutralization
over adding competing clinical exemplars.)* — *Governs:* **D-098** (relocated to
prompt-authoring standard + regression test G7); active VOICE/DESCRIPTIVE_RESULTS
exemplars.

**2.4 · INTEGRATED_INTERPRETATION.** Synthesize relevant evidence across sources,
address meaningful convergence and discrepancy, and explain functional meaning at
the strongest confidence the evidence supports. Include enough descriptive
anchoring for the paragraph to stand alone. Explain or reconcile a discrepancy only
when the evidence supports the explanation; otherwise preserve it as unresolved.
Clearly distinguish established findings, qualified conclusions, and hypotheses.
*(A proposed observable test does not make an otherwise ungrounded explanation
acceptable.)* — *Governs:* RC/PB/APP INTEGRATED_INTERPRETATION.

**2.5 · RECOMMENDATION.** Recommendations must respond to an established need and
introduce no new finding. Make each recommendation specific enough to implement,
communicate, monitor, or act upon. Include mechanism, context, fading, and progress
indicators when they materially improve the recommendation; do not force those
components onto referral, consultation, communication, or monitoring
recommendations that do not require them. *("Inference none" → "no new findings.")*
— *Governs:* RC/PB/APP RECOMMENDATION; recommendation trace chain.

## 6. Validity and data model

**3.1 · Ceiling and scope are orthogonal.** Interpretive ceiling governs how far a
source may be interpreted; source scope governs the settings, informants, time
periods, and constructs to which it speaks. A claim must satisfy both. — *Governs:*
**D-033**; PB §4.

**3.2 · Canonical resolver.** Use one canonical resolver for effective validity and
interpretive ceiling. Fail safe when relevant metadata are genuinely unknown,
invalid, or unestablished. Do not treat a missing application field as a confirmed
low ceiling. Inject only the resolver's final human-readable limit into the
drafting prompt. *(Before finalizing D-097, test concrete missing, unknown,
invalid, modified, and restricted inputs against the canonical resolver and
document every return path.)* — *Governs:* RC effectiveCeiling; **D-033**; **D-097
(pending verification, OPEN)**.

**3.3 · App resolver.** ✅ **VERIFIED — Session B (Gate 3), 2026-07-27.** The
application must call or import the canonical resolver and must not maintain an
independent implementation. **Session B verified that the app *does* maintain a
divergent duplicate `effectiveCeiling` (`index.html:839`)** — it manufactures
`FULL_INTERPRETATION` as a fall-through and never returns `COMPARE_WITHIN_SOURCE` —
but the duplicate is **dormant**: it is never invoked, because `callMode` passes no
sources (payload unwired, D-099), so `sourcePolicyBlock` returns `""` and the
resolver is never reached. The disposition therefore **stands and is not moot**:
during resolver integration, **remove the dormant divergent duplicate, call the
canonical resolver, and wire the payload**. Modification effects and examiner
determinations must live in the source policy, not app-only branches. — *Governs:*
APP resolver; RC resolver; consolidation F2; **D-118** (running app enforces no
ceiling); **D-097 RETIRED** (canonical already correct); **D-099** (payload wiring,
confirmed); gates **G1/G2**.

**3.4 · Source policy object.** Maintain a structured source policy containing
resolved validity, scope, interpretive ceiling, and any examiner-confirmed
limitation or rationale. Pass the drafting model only the resolved restrictions
relevant to the current task. Remove fields that are not operationally used. —
*Governs:* RC SourceInterpretationPolicy; PB §4.

**3.5 · Instrument scope defaults.** Resolve scope in this order: actual informant
and administration context; user or organization override; instrument-form
metadata; conservative fallback when still unknown. Instrument name alone must not
override known case context. Support aliases and editions; avoid brittle
name-string matching. — *Governs:* PB/RC scope defaults.

**3.6 · Component-level validity.** Represent validity and modification at
component and composite levels. A questionable or invalid component must surface
the affected composite for examiner review. Do not automatically invalidate,
suppress, or qualify the composite without an examiner-confirmed determination. —
*Governs:* **D-096**; **D-104**. *(Build item — gate G3.)*

**3.7 · Validity architecture switched off in production.** ✅ **RETIRED AS
FULFILLED — 2026-08-09, per D-141.** Gate G4 is closed.

> **Historical rule text, preserved (D-038: amend, never rewrite).** "⚠ OPEN —
> implementation condition, not a permanent rule. Do not represent the validity
> resolver as an active safeguard until its payload, invocation, and tests are
> wired in production. During quarantine, disclose the implementation gap
> internally and prevent dependent features from claiming protection they do not
> yet have. *(Remove from the operational rule set when corrected.)*" —
> *Governed:* **D-099**; APP TODO; gate **G4**.
>
> **Rationale, preserved.** D-099 found that the live `callMode` invocation
> passed only `{data}`, bypassing the sources/validity/scope/ceiling blocks
> `buildPrompt` was built to apply. The entire ceiling architecture was
> specified and switched off; dependent features were describing a protection
> that was not running.

**Condition met.** The payload is wired — `GenerationInputs`
(`apps/psychreport/lib/source-policy.ts`) cannot be constructed without every
source's interpretation policy, and `userPrompt` always emits the SOURCE LIMITS
block when sources exist. The canonical resolver is invoked: `effectiveCeiling`
from `@suite/reasoning-contracts`, with no resolver defined in the app (D-118's
divergent duplicate lived in the legacy vanilla-JS app that VS-3 replaced). The
tests exist: `apps/psychreport/tests/prompts.test.ts` and
`tests/source-policy.test.ts`, including the D-099 defect shape directly ("no
source can reach generation without a policy").

**Generalized, not merely closed.** The principle this rule instantiated is now
a standing suite rule — **D-141: a safeguard is code that can reject output; no
prompt-level instruction may be represented as one.** See §8 rule 5.7. —
*Governs:* **D-099** (fulfilled); **D-141** (generalization).

**3.8 · Evidence-tier ladder.** Use evidence tiers **only for intake, coverage, and
collection logic.** A direct "no concern" response means that this source did not
report concern in the screened area; it is not broad evidence that the underlying
condition is absent. An unanswered item or insufficient opportunity remains missing
information and may trigger collection elsewhere. Tiers never upgrade by inference.
Do not inject the tier ladder into PsychReport drafting unless a specific output
operation requires it.

> **Correction C3 (location is a separate ruling).** This clarifies **usage**, not
> location. The tier vocabulary's shared-package home is unchanged by this
> specification — it remains in the Sped-QA-Engine copy of `reasoning-contracts`
> per D-048 and the D-046 fork. **If that home changes, that is a separate ruling;
> it is not relocated by implication.**

— *Governs:* **D-048** (amended, C3); **D-049**; RC §7; **D-090**.

**3.9 · Evidence-status vocabulary.** Track claim status internally, distinguishing
direct fact, attributed report, direct observation, derived calculation, supported
synthesis, qualified synthesis, hypothesis, and unsupported content. Unsupported
claims are not reportable. Separately distinguish evaluator-confirmed insufficiency
of evidence from an incomplete application payload. *(Do not use the full taxonomy
as report prose or repeated prompt vocabulary.)* — *Governs:* RC EvidenceStatus;
confidence policy.

## 7. Confidence and hedging

**4.1 · Confidence rank table.** State conclusions with the strongest level of
confidence supported by the evidence. Distinguish convergent findings, supported
conclusions with limitations, single-source or partial support, plausible
hypotheses, materially conflicting evidence, and genuine evaluator-confirmed
insufficiency. Application-input gaps do not use report-language insufficiency
stems. *(The full rank table remains normative in policy/QA; the runtime model
usually needs only the resolved confidence instruction.)* — *Governs:* RC
CONFIDENCE_POLICY; PB §5; APP CONFIDENCE_BLOCK.

**4.2 · Confidence stems are non-normative anchors.** Confidence stems are
examples, not required vocabulary. Vary wording naturally while preserving the
intended rank. Do not reproduce a fixed stem at the beginning of every paragraph.
— *Governs:* **D-026**.

**4.3 · Qualification budget.** Qualify each claim only as much as its evidence
requires. Avoid stacking multiple uncertainty markers in the same claim or
repeating the same caveat throughout a section. Use separate qualifications when
distinct source, validity, setting, or discrepancy limits genuinely require them.
*(Deletes "at most one qualification per paragraph"; no replacement count.)* —
*Governs:* PB qualification default; APP hard cap.

**4.4 · Actionable hypotheses.** When a hypothesis is plausible, decision-relevant,
and materially uncertain, identify the observable information that would strengthen
or weaken it when doing so improves actionability. Not every tentative statement
requires a mini-study or explicit confirming observation. — *Governs:* PB §5;
integrated interpretation.

## 8. Fidelity and sourcing

**5.1 · Preserve intensity, frequency, certainty, attribution, and distinctions.**
Preserve each source's meaning, intensity, frequency, certainty, and attribution.
Distinguish observed behavior from respondent opinion, result description from
interpretation, and hypothesis from supported conclusion. Professional paraphrase
is permitted when it does not escalate or distort meaning. In integrated
interpretation, converging sources may support a stronger synthesis than any source
alone, but the synthesis must remain traceable to that convergence. — *Governs:*
PB §5; APP FIDELITY.

**5.2 · Prohibited transformations.** *Runtime rule:* Do not strengthen,
generalize, diagnose, explain, or convert a recommendation into a finding beyond
what the evidence supports. Preserve attribution and the difference between missing
information and a negative finding.

> **Correction C4 (sequencing).** The nine explicit prohibited transformations
> (`sometimes`→`frequently`; `elevated`→`clinically significant`; `teacher
> reported`→`the student is`; low score→diagnosed impairment; cross-informant
> disagreement→situational causation; relative weakness→normative deficit; test
> behavior→generalized trait without corroboration; absence of evidence→evidence
> of absence; recommendation→demonstrated need) **remain in the runtime rule until
> the QA/regression suite exists.** The compact runtime rule ships **alongside, not
> instead of**, the nine examples until the tests are built (gate **G8**). Once the
> regression suite exists, the nine examples move to QA and the runtime keeps only
> the compact rule.

— *Governs:* PB §5 prohibited transformations; APP subset; consolidation F3.

**5.3 · Discrepancy: classify before describing.** Describe meaningful agreement
and difference accurately. Do not average a discrepancy away, silently select the
more severe account, or explain it without supporting evidence. Formal discrepancy
labels may be used internally, may be multi-label, and should not force a single
explanation onto a complex difference. *(Do not treat SETTING_SPECIFIC as a causal
explanation unless the evidence supports the setting account.)* — *Governs:* PB §5;
RC SourceRelationship.

**5.4 · Four ledger rules.** Every report claim must trace to a source or
authorized professional reference; reporter attribution remains immutable; material
conflicts are preserved and may be explained or reconciled **only when evidence
supports** the explanation; and a gap report is surfaced before drafting the
affected claim. A gap blocks only the affected claim or section, not unrelated
report content. *(Absolute "conflicts preserved, not resolved" → "no unsupported
resolution.")* — *Governs:* **D-078**; **D-105**.

**5.5 · Provenance and authority of rules.** Record each rule's source, status,
authority, effective date, amendments, and supersession relationship. Do not inject
this governance metadata into drafting prompts unless a resolved instruction
depends on it. — *Governs:* **D-028** and decision-log governance.

**5.6 · Testing-session assertions require documented session evidence.**
Describe testing-session events — administration procedures and mechanics,
prompting, examinee behavior, effort, engagement, rapport, pacing, examiner
support — only when documented in clinician-authored or clinician-verified
session evidence supplied to that section's generation. Evidence for one
session dimension does not license assertions about another. Paraphrase is
permitted; materially changing documented frequency, intensity, duration,
certainty, or valence is not. Hedged, conditional, and "consistent with"
references to undocumented session events fail identically to direct
assertions. *Clinician-verified* covers dictated notes, imported testing notes,
and confirmed structured administration data — the condition is professional
verification, not manual typing.

**This rule is ENFORCED, not instructed** (D-141). The enforcement is a narrow
post-generation adjudicator that can reject the section, specified in
`governance/session-fidelity-adjudicator-v1.md`; it runs on every generated
section with no prefilter, fails closed, permits exactly one targeted
regeneration through the identical gate, and surfaces a second failure to the
clinician. The pre-generation structural refusal for DIRECT_OBSERVATION without
an observation source is unchanged and is the rule's other enforcement point. —
*Governs:* **D-140**.

**5.7 · A safeguard is code that can reject output.** No prompt-level
instruction may be represented — here, in the decision log, in a status report,
or to a customer — as a safeguard. "Gate," "guard," "enforced," "prevented,"
and "cannot" are reserved for code paths that can return a rejection; where only
a prompt instruction exists, the honest words are "instructed," "asked," or
"steered." A specification describing a prompt block as a control must name the
code that enforces the same rule, or state plainly that none exists yet. A build
item is not complete because its prompt text was written — the completion
condition is a rejecting code path plus a test that proves it rejects. This does
not reduce the value of prompt authoring; D-110 and D-111 are unaffected. What
is regulated is what a prompt is claimed to *guarantee*. *(Generalizes retired
rule 3.7; binds the QA Engine as well as PsychReport.)* — *Governs:* **D-141**;
supersedes **3.7** in operative form.

## 9. Length and proportionality

**6.1 · Proportionality first; length is an outcome.** Let section length follow
the number, complexity, discrepancy, validity, and decision relevance of the
findings — not the number of instruments or a target word count. Avoid redundant
paragraphs. Organize material so each paragraph has a clear purpose and the section
remains readable. — *Governs:* PB §7; RC proportionality.

**6.2 · Length governance sole-sourced; absolute limits inactive.** During
calibration, record output length and revision burden without enforcing absolute
section limits. Any future limits must be configurable, artifact-specific, and
justified by observed quality or workflow needs. *(Pilot/configuration rule, not a
model instruction.)* — *Governs:* **D-025**; PB §7.

**6.3 · Table/prose division.** Tables carry comprehensive numerical detail. Prose
selects and explains the results needed to understand the construct, the student's
performance, meaningful patterns, validity, and conclusions. Use the level of
detail required to communicate the finding: do not merely convert a table into
sentences, and **do not compress away a meaningful subtest, scale, rater, or
error-pattern difference.** Rating-scale prose should preserve the informant's
situated account and may integrate raters when doing so does not flatten meaningful
differences. *("One level coarser" → "adds explanatory value and preserves
clinically meaningful detail." D-095 merged into Rule 8.9.)* — *Governs:* PB §6
P1–P3; **D-092**; **D-095**.

**6.4 · Paragraph content inventory.** Include the context, support, qualification,
and explanation needed to make the finding understandable. Omit elements that do not
add value. Do not require a fixed number of paragraph components or a fixed
rhetorical sequence. — *Governs:* PB paragraph inventory.

## 10. Eligibility and artifact boundaries

**7.1 · Artifact boundary: no autonomous eligibility verdict.** The active artifact
profile determines which conclusions are authorized. In a school psychoeducational
report, PsychReport may draft criteria-referenced findings and, **when the user or
district workflow explicitly enables it, editable adverse-impact or SDI-related
language framed for team consideration.** PsychReport does not autonomously issue a
team eligibility verdict. Private and community profiles may authorize diagnostic
conclusions under their own rules. *(Removes the blanket refusal and schema
exclusion; preserves the drafting-vs-predetermining distinction.)* — *Governs:*
**D-005/D-034 amendments**; RC §6 (flagged for sync); PB §2/§12 (flagged for sync).

**7.2 · Founding exclusion decision, as amended.** Predetermination is a process
violation, not a property of particular words. Report language may address
eligibility-relevant findings when required by the artifact profile or template,
provided claims remain traceable, editable, appropriately framed, and do not
falsely represent a team decision that has not occurred. *(Original decision
retained in history; only the amended rule shown here.)* — *Governs:* **D-005/D-034
amendment history**.

**7.3 · SDI-need language: user-initiated, default off.** SDI-need language is
disabled by default and becomes available only through explicit user initiation or
an approved district template. Output remains editable and must distinguish
evaluator analysis from a final team determination. — *Governs:* SDI ruling;
**D-082**.

**7.4 · Planning coverage is not a report concern.** Do not generate unsupported
statements that a team considered, reviewed, or ruled out a domain merely to
demonstrate planning coverage. A report may accurately describe the evaluation
battery or rationale when that information is supplied and relevant. — *Governs:*
**D-090**.

## 11. Instrument library and reference model

**8.1 · Construct exposition is optional reference, not mandated library content.**
Standard generic instrument and construct exposition may be generated from
professional model knowledge, supplied instrument metadata, and optional curated
reference content. Student-specific claims remain case-grounded. Reference
availability is **not** a prerequisite for supporting an instrument. — *Governs:*
**D-093** (superseded in operative form).

**8.2 · Library as one solution to the FIDELITY/exposition contradiction.** Resolve
the contradiction by distinguishing case claims from generic professional
exposition. Optional reference content may improve consistency and scope, but the
model may generate exposition when no reference exists. The evaluator reviews all
prose in the ordinary workflow. — *Governs:* **D-094**.

**8.3 · One level more meaningful than the table.** Prose must add explanatory value
and preserve clinically meaningful detail. Use the level of granularity needed to
communicate the finding; do not simply restate all numbers and do not erase a
meaningful within-measure difference for the sake of coarser narration. —
*Governs:* **D-092**.

**8.4 · Slot schema is storage, not a rendering template.** Do not require every
instrument entry or report paragraph to follow five slots. Structured storage may
distinguish construct anchors, generic task context, composition, and caveats when
useful, but it does **not** determine sentence order or paragraph assembly. Do not
create empty placeholders for content the registry does not need. *(Result facts
remain deterministic case data; performance synthesis remains generated.)* —
*Governs:* **D-103** (mandatory five-slot rendering retired).

**8.5 · Lightweight optional reference registry (D-107).** A reference entry may
contain instrument, edition, score or scale identity, optional semantic anchors,
optional generic task context, composite constituents, approved automatic-caveat
identifiers, provenance status, and version. The model draws on available reference
content rather than concatenating stored fields. Student result facts come from the
case data, not the registry. *(Removes mandatory integration pointers,
generated-performance slots, per-commodity-sentence citations, and per-slot
rendering order.)* — *Governs:* **D-107** (adopted as lightweight optional
registry).

**8.6 · Conditional content inserts only on determination.** A raw score spread,
discrepancy, modification flag, or missing field may surface a review question; it
must not automatically assert a psychometric conclusion. Insert, suppress, or block
high-consequence language only after the required examiner determination or an
explicit validated rule. — *Governs:* **D-104**.

**8.7 · Closed caveat sub-library.** Automatic caveats must come from a small,
versioned, instrument- or condition-specific registry with fixed approved text,
explicit trigger conditions, controlled variables, placement, and action. The
closed registry governs automatic insertion; it does not prevent an evaluator from
explicitly requesting or editing case-specific limitation language. — *Governs:*
**D-108**; **D-106**.

**8.8 · Provenance states, none gating use (manual-verification gate retired).**
Ordinary construct exposition does not require verification against a purchased
manual. Reference content may be generated, practitioner-reviewed,
organization-approved, or publisher-grounded when official material is available.
**No provenance state is a prerequisite for using a long-tail instrument**, though
uncurated output remains subject to evaluator review. Do not use global
high-volume/low-volume designations; curate opportunistically based on use,
correction burden, customer demand, or organization preference. — *Governs:*
**D-109** (manual-verification gate retired); **P-07 (D-116)**.

**8.9 · Score-in-prose rule.** Tables should carry comprehensive numeric detail.
Name an exact score in prose when it materially clarifies a finding, discrepancy,
validity issue, referral question, or the selected report style — or when no table
supplies the result. Avoid mechanically converting every table value into
sentences. *(Merges D-095 and PB P1; no separate drifting exception list.)* —
*Governs:* **D-095** (merged here); PB P1.

## 12. Caveats and gap handling

**9.1 · Gaps become user-facing flags, not report prose.** When required case
information is missing from the application, surface a user-facing gap that
identifies the affected claim and the information needed. Do not convert an
application-input gap into report prose. Continue drafting unrelated supported
content. A limitation may enter the report only when the evaluator confirms that
the evaluation itself — not merely the software payload — was limited. — *Governs:*
**D-105**; **D-078** ledger.

**9.2 · Caveats are clinical judgments, not system limitations.** A report caveat
must describe a clinically relevant assessment condition or evaluator-endorsed
interpretive limitation. It must not describe what PsychReport lacked, could not
calculate, or failed to receive. *(Remove references to "Slot 5" now that mandatory
slot architecture is retired.)* — *Governs:* **D-106**.

**9.3 · Limitations under a DESCRIBE_ONLY ceiling.** When the examiner-resolved
ceiling is DESCRIBE_ONLY, report the verified descriptive information and omit
normative or higher-order interpretation beyond that ceiling. Do not derive
DESCRIBE_ONLY automatically from a bare modification flag; record the nature of the
modification and the examiner-approved interpretive consequence. — *Governs:* PB
§4; APP modified branch.

## 13. Precedence, governance, and engineering

**10.1 · Precedence stack.** Resolve conflicts in this order: (1) artifact
authorization and user role; (2) source validity, scope, and case fidelity; (3)
active rhetorical task or mode; (4) clinical reasoning and confidence; (5)
presentation, style, template, and organization preferences. A lower layer may
specialize a higher default but may not weaken a higher safeguard. *(Inject the
resolved instructions, not the full precedence explanation.)* — *Governs:* PB §1.

**10.2 · Precedence is sole-sourced in the parameter block.** Maintain one
canonical precedence policy. Other files may reference or import it but must not
restate independent competing stacks. Test prompt assembly to confirm that the
resolved order — not file concatenation order — governs behavior. — *Governs:* PB;
APP duplication.

**10.3 · House conventions govern expression, not evidence.** House conventions may
govern voice, terminology, section order, instrument- versus domain-centered
organization, score narration, and other presentation choices. They may not alter
case facts, source attribution, validity, scope, artifact authorization, or
evidentiary confidence. — *Governs:* PB §11.

**10.4 · Amendment discipline.** Preserve original decisions and append dated
amendments or supersession records. The current operational specification displays
only the effective rule and links back to the governing decisions. A clean
operational specification does not replace or erase the historical log. — *Governs:*
**D-038**; **P-05 (D-114)**.

**10.5 · Stage-1 quarantine (provenance corrected).** Record the Stage-1
application pilot as an infrastructure failure ("Failed to fetch") that produced no
content evidence. Attribute writing-quality findings to the later constrained-prompt
comparison and prompt-source analysis. **Delete claims that Stage-1 demonstrated
diagnostic drift, boundary leakage, or over-rigidity in generated prose.** Continue
quarantine until the stale eligibility boundary, validity wiring, duplicate
resolver, prompt contradictions, and accepted amendments are corrected and tested.
— *Governs:* **D-101/D-102 correction**.

**10.6 · Shared-layer location unresolved.** Resolve the shared-package location so
the case model and reasoning contracts can build and test together. Repository
placement does not belong in the report-writing prompt or clinical operational
specification except as an implementation dependency. — *Governs:* **D-046**; gate
**G5**.

## 14. Resolution of consolidated findings F1–F5

- **F1 · DESCRIPTIVE_RESULTS granularity** — resolved in favor of the
  meaning-centered Rule 6.3 / 8.3. "One level coarser" is superseded (D-092). Prompt
  distillation must retain the finer-grain permission (P-02).
- **F2 · Canonical vs app resolver** — ⚠ **OPEN.** Neither secondary claim accepted
  as proven. Retire the duplicate app resolver and verify D-097 through
  canonical-code inspection and executable inputs, including whether
  `COMPARE_WITHIN_SOURCE` can be returned and how unknown runtime data are
  validated. Gates G1/G2 (C1).
- **F3 · Nine transformations vs three-item prompt subset** — keep the nine in
  QA/regression; use the concise general fidelity rule in runtime **unless testing
  shows a specific example is needed** (C4 sequencing, gate G8).
- **F4 · Eligibility wall vs amended decisions** — rewrite the operational files and
  schema to implement artifact-profile and configured-workflow permissions; the
  historical flat wall remains only in the decision history (D-005/D-034; §17
  file-sync is a build item).
- **F5 · FIDELITY source location** — FIDELITY is authored in the app prompt and
  mirrored in the parameter block, **not** in reasoning-contracts. A missing block
  in one package is not an extraction gap.

## 15. Proposed runtime prompt kernel

This kernel shows the **maximum** recurring prompt structure. The prompt builder
supplies only the active profile, resolved mode, relevant source limits, and case
data. Governance, resolver logic, and QA examples remain outside the prompt (P-01).

- **ROLE AND REGISTER** — "Draft the requested block of a [ARTIFACT_PROFILE]
  evaluation report in the measured, accessible voice of an experienced
  psychologist writing for the intended professional and family audience. Keep the
  student at the center of the prose. Use concrete language, precise professional
  terms, and natural paragraph structure. Do not display the analytical
  scaffolding."
- **CASE FIDELITY** — "Every student-specific factual claim must be supported by the
  supplied case data. Preserve meaning, intensity, certainty, and attribution. Do
  not invent or alter history, observations, scores, interventions, diagnoses, or
  quotations. Standard generic instrument exposition and professional recommendation
  knowledge are permitted when authorized by the task, but must not be presented as
  facts about the student."
- **ACTIVE TASK** — "[INSERT THE RESOLVED MODE-SPECIFIC LANGUAGE FROM RULES 2.1–2.5.
  Do not append all five modes.]"
- **SOURCE LIMITS** — "[INSERT ONLY THE RESOLVED VALIDITY, SCOPE, AND CEILING LIMITS
  THAT AFFECT THIS BLOCK. Do not include the resolver algorithm or unused metadata.]"
- **CONFIDENCE** — "State conclusions with the strongest confidence the supplied
  evidence supports. Distinguish established findings, qualified conclusions, and
  hypotheses. Avoid repetitive or stacked hedging. [INCLUDE ONLY WHEN INFERENCE IS
  PART OF THE ACTIVE TASK.]"
- **OUTPUT** — "Return only the report-ready prose requested for this block. Do not
  mention the model, prompt, application gaps, or drafting process."

**Mode-specific snippets** (SOURCE_FAITHFUL, DIRECT_OBSERVATION, DESCRIPTIVE_RESULTS,
INTEGRATED_INTERPRETATION, RECOMMENDATION) are inserted at ACTIVE TASK per the
resolved mode; see the docx source for the exact snippet wording.

## 16. Artifact-profile minimum requirements

**SCHOOL_PSYCHOEDUCATIONAL** — eligibility verdicts remain team-reserved;
adverse-impact and SDI-related language follow explicit district/user workflow and
remain editable; educational function, school setting, and multi-informant
distinctions are central; diagnostic language follows applicable professional and
district role boundaries.

**PRIVATE_PSYCHOLOGICAL** — diagnostic conclusions may be authorized when supported
and within the evaluator's scope; educational eligibility and team-reserved school
conclusions are not assumed; functional implications may concern home, community,
employment, treatment, or daily life as supported by the case; report organization
and instrument use may be more measure- or diagnosis-centered per practice
convention.

## 17. Amendment and build queue (status)

**Immediate decision amendments — DONE this session** (dated D-038 notes in the
log): D-005/D-034 (artifact-profile permissions); D-092 (meaning-centered
narration + finer-grain clause); D-093/D-094 (optional reference + live exposition;
FIDELITY narrowed to case claims); D-103/D-107 (five-slot rendering retired;
lightweight optional registry); D-109 (manual-verification gate retired); D-095
(merged into 8.9); D-100 (finding-centered default); D-098 (prompt-authoring
standard + regression test); D-101/D-102 (Stage-1 provenance corrected); C2→D-032;
C3→D-048.

**Prompt and operational-file changes — BUILD ITEMS (not this session):** rewrite
global VOICE as register-only and move integrated exemplars into the integration
mode; remove the hard one-qualification cap; remove paragraph element counts from
runtime; replace no-blended-mode rendering with claim-level permissions; move
detailed prohibited transformations to QA **(gated on the regression suite — C4,
G8)**; scope recommendation structure by type; synchronize the parameter block,
reasoning contracts, app prompt, and schema (incl. RC §6, PB §2/§12).

**Engineering verification — OPEN GATES (Session B):** see the gate list in the
decision log after D-116 — G1 (D-097 resolver test), G2 (duplicate-resolver check),
G3 (component-level validity), ~~G4 (payload wiring, D-099)~~ **closed 2026-08-09,
D-141**, G5 (shared-package
placement, D-046), G6 (distillation-loss regression), G7 (reversed-pattern
regression), G8 (transformations sequencing, C4).

## 18. Ratification standard

A proposed rule is ratified only when it serves a legitimate current purpose; is
coherent with higher-level rules and positive exemplars; does not unnecessarily
suppress sound professional writing; is placed in the correct system layer; and
addresses either a genuine observed defect or a sufficiently consequential
foreseeable risk. **Code claims require primary-source verification (P-03).**
Runtime prompt instructions must additionally earn their token and attention cost
(P-01).

---

*End of operational specification v1. Current-effective-rules document; governed by
the decision log (`suite/decisions.md`) per P-05 (D-114). Session B (2026-07-27)
resolved D-097 (retired) and Rule 3.3 (verified — dormant divergent duplicate,
D-118). **VS-3 (2026-08-09) retired Rule 3.7 / D-099 as fulfilled and closed gate
G4** (payload wired, canonical resolver invoked, tests present), generalizing it
into rule 5.7 / D-141; rule 5.6 / D-140 was added with its enforcing adjudicator.
Remaining build gates: G3, G6, G7, G8.*
