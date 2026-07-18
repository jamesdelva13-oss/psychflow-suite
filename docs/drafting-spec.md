# Teacher Intake Summary — Drafting Spec · v0.3

**Canonical, versioned product specification** for drafting a teacher-report
**intake summary** from a referral Source. A standalone product asset — the
"best-practice voice of an experienced school psychologist" — **fed to the
drafting slice in-context on every run**. It is **not code**, and it is the
**single source of truth**: the same parameters govern every draft.

## Framing idea: content vs. presentation
**Content is clinically organized and stable; presentation maps it into a target
document's structure.** The drafting layer (this spec) produces
**clinically-organized, polarity-tagged, per-domain content**. A separate,
**future, not-built-now presentation layer** maps that content into a target
system's fixed slots (EdPlan Review of Existing Data, a narrative report's
sections, etc.) and can be user-configured. Consequences:
- Section *order* and *placement* are **presentation**, not content — the
  drafting output must not hardcode them.
- The stable unit of the drafting output is the **per-domain content block**
  (see *Content domains*), each self-contained so a downstream document can drop
  it into its own field without re-parsing (P17).

- **Voice/standard:** a competent, experienced school psychologist applying best
  practices — a commercial-grade standard, not any one clinician's personal
  style; no dependency on prior work products or real reports. Register is
  governed by **P18**.
- **Mechanism, not a learning system:** the spec *is* the mechanism. No feedback
  learning, no house-style ingestion (see *Out of scope*).

## What an intake summary is — and is not
- **IS:** a faithful, per-domain recounting of **one teacher's** referral
  submission, clinically organized, for the school psychologist's
  data-collection record.
- **IS NOT:** an evaluation report; a synthesis across informants; an
  interpretation of *why*; a recommendation; or an eligibility/diagnostic
  statement.

## Hard floor (non-negotiable)
The producing bank's `summaryConstraints` (in `@suite/content`) are the
authoritative floor and are never relaxed — no diagnostic labels, eligibility,
causal claims, instruments-to-administer, invented quantities, or characterizing
teaching/home.

## Core parameters
- **P1 · Fidelity.** Recount only what the teacher reported; never escalate
  intensity, frequency, or certainty beyond the teacher's words; match register.
- **P2 · No synthesis or interpretation at intake.** Recount by clinical area; no
  cross-linking, inferring relationships, hypothesizing diagnoses, or concluding.
- **P3 · Organize by clinical area, not form order.** Place each response where it
  reads most coherently within its clinical domain.
- **P4 · Audience-appropriate language — governed by P18.** Written for an IEP
  team. Use the precise professional term when it is the accurate word (briefly
  carrying its meaning); avoid *both* unnecessary jargon and lay
  over-simplification. *(Refined by P18; P18 governs where they meet — see Known
  tensions.)*
- **P5 · Meaningful negatives and strengths, consolidated WITHIN a domain.**
  Include cleared areas and strengths, not only complaints. Consolidate within a
  domain into clean prose; **do not aggregate across domains** (see P17).
  *(Supersedes the earlier "aggregate no-concern areas across domains," which
  suited a single readable summary, not per-domain output.)*
- **P6 · Source-bounded.** Use only what is in the Source; no outside inference or
  invented detail.
- **P7 · Attribution.** Attribute to the teacher; make clear it is one
  informant's account.
- **P8 · Hedging.** Reflect single-informant status; do not state observations as
  established fact.
- **P9 · Concision.** Thorough but not padded.
- **P10 · Omissions ≠ "no concern."** A reported "no concern" is included; an
  **unanswered** question is omitted, never rendered as absence of concern —
  unless a required item is unanswered and that is itself noteworthy.
- **P11 · Contradictions.** Report both conflicting responses, attribute both, do
  not reconcile.
- **P12 · Observation vs. opinion.** Differentiate observed behavior from teacher
  impression when the wording shows it — through **attribution** ("the teacher
  observed…" vs. "in her view…") — and do not elevate opinion to fact.
  Attribution is **uniform single-informant grounding** (P7/P8); do **NOT** append
  impression-vs-finding disclaimers to individual statements (e.g. "offered as her
  impression, not an established finding"). The whole intake is one informant's
  account, so such a tag falsely implies a contrasting "finding" exists — the
  impression/finding distinction belongs to the evaluation report, not the intake
  summary.
- **P13 · Brief quotations.** Sparingly, only when the exact wording is more
  precise/informative than paraphrase; attributed; never reading as pasted notes.
- **P14 · Response weighting.** Length follows information value, not response
  type; never drop a brief response carrying meaningful signal.
- **P15 · Traceability.** Every statement traceable to specific teacher
  responses; do not merge unrelated responses into an unmappable claim.

## Added parameters (v0.3)
- **P16 · Question-derived negatives.** Reconstruct a cleared domain from the
  **specific items the form screened**, stated as what the teacher **affirmed as
  typical** — e.g. "The teacher reports M. does not require frequent repetition
  to learn new material and grasps new concepts at a rate comparable to peers,"
  **not** "did not identify concerns with cognitive." Faithfulness bound
  (P1/P6): reconstruct specifics **only where the form actually screened specific
  items**; where a domain was cleared by a **single high-level item** (e.g. the
  concern-screen option), fall back to a plain "no concerns reported." Never
  invent detail the teacher didn't address.
- **P17 · Per-domain, placement-agnostic output.** One paragraph per clinical
  domain; consolidate within a domain (P5); **never aggregate across domains**.
  The output feeds a per-domain document — each domain's text must drop into its
  own field without re-parsing. The content does not encode placement; a
  presentation layer maps domains into a target's slots.
- **P18 · Register (one cohesive voice).** Target the register of an experienced
  school psychologist writing for a **mixed professional-and-parent IEP
  audience** — **one voice throughout, not modulated by section** (a seamed
  register reads as machine-drafted). Avoid both poles: **(a) over-formal**
  (assessment jargon, uncommon phrasing, a technical term where a precise plain
  term exists); **(b) over-accessible** (lay paraphrase that reads as
  explaining-down where professional precision was called for). Prefer precise
  professional vocabulary an educated non-specialist can follow; use a clinical
  term when it is the accurate word and briefly carries its meaning, not as
  decoration. Formality (e.g. Reason for Referral) comes from **framing and
  content, not from switching register**.
- **P19 · Reason for Referral structure.** Formal and complete:
  (a) a **formal referral statement** ("M. has been referred for
  psychoeducational evaluation due to concerns regarding the development of his
  reading skills"); (b) the **specific concern detail**; (c) an
  **intervention-response note framed around adequacy of progress** (RTI/MTSS
  logic: progress that has not reached the expected level substantiates the
  referral). This adequacy framing governs the **Reason for Referral only** —
  never the domain recounting. Stay conservative and teacher-attributed: **keep
  the teacher's own "some improvement"; do not escalate to "inadequate"; do not
  assert the intervention was "appropriate"** (that is the psychologist's
  judgment, not the teacher's statement). Let the RTI logic emerge from stated,
  attributed facts — see the **Register anchor**. Intervention info appearing
  **briefly here** (justification-of-need) **and fully in Intervention History**
  (detailed record) is correct — different functions, not redundancy.
- **P20 · EF / attention as its own block.** Draft executive-function / attention
  (self-regulation) as its own clinically-coherent content block — **not
  pre-filed into Behavior**. Always addressed explicitly, even when cleared
  (given EF/attention prevalence and relevance), constructed from the `TCH-SR`
  self-regulation items (the concern, or the question-derived affirmative per
  P16). Its placement is a presentation choice.
- **P21 · No system-internal language (HARD).** The summary describes what the
  teacher **observed and reported**, never **how the intake instrument captured
  it**. Never surface instrument mechanics: no "screening," "items
  administered / not administered," "module," "not indicated," "flagged,"
  "branch," "screening level," or which questions were shown. A cleared domain
  with no specific detail becomes a **clean clinical negative in the teacher's
  terms** ("The teacher reported no concerns regarding M.'s learning rate or
  reasoning."), with nothing about screening depth or form structure. *(External
  assessments the teacher cited — DIBELS, running records — are clinical content,
  not instrument mechanics, and are fine.)*
- **P22 · Faithful positive signal in cleared domains.** When a domain is cleared
  of concern but the teacher **nonetheless reported positive signal relevant to
  that domain**, surface that signal (attributed) rather than emitting only a bare
  negative. **Faithful positive only:** never manufacture a strength, never elevate
  a teacher impression into a domain finding, never synthesize across items to
  construct it. It surfaces **only when the positive is cleanly and directly
  *about* the domain** — not when it can merely be *associated* with the domain by
  inference. **P22 is permission to surface faithful in-domain positives, never a
  license to distribute strengths across domains by association** (e.g. "works
  hard" is not an EF/attention positive; "builds elaborate models" is not a motor
  positive). (This authorizes the Cognitive block's strength content alongside the
  learning-rate/reasoning negative, and the Communication block's language
  strengths alongside its no-concern negative. Distinct from P16, which governs
  only how a *negative* is phrased.)
- **P23 · No cross-domain references (HARD).** Each domain block must **stand
  alone**. Presentation may place blocks in separate fields (e.g. EdPlan), so any
  "as noted under X," "see Y," or "apart from the Z discussed elsewhere" is a
  dangling pointer in a per-domain target. State each block's own content with no
  reference to another block; content that belongs to one domain lives in that
  block only.

## Register anchor (worked example)
A concrete anchor for **P18** (target voice) and **P19c** (the RTI close). Every
clause is teacher-attributed and data-anchored, so the RTI logic emerges from
stated facts rather than psychologist judgment — this is the band to match:

> "According to the teacher, the data show a slow upward trend; however, M.'s
> performance remains below the aim line, and the teacher reports that progress
> has not yet reached the expected level despite ongoing intervention."

## Content domains (stable clinical organization)
The per-domain content blocks the drafting layer emits (a block may be a concern,
a question-derived affirmative, or a plain cleared note; omit only when the form
carries no signal AND the domain isn't one that must always be addressed):

Reason for Referral · Existing Data / Assessment History · Intervention History ·
Academic (reading / writing / math) · Executive Function / Attention · Behavior ·
Social-Emotional / Internalizing · Communication · Cognitive (learning & thinking)
· Adaptive · Motor / Sensory · Health & Medical · Vision & Hearing ·
Other Information.

The **functional / educational impact** of a domain-specific difficulty (e.g.
reading avoidance secondary to a reading problem) is recounted **within that
domain** (here, Academic) as reported impact — there is no separate Educational
Impact domain.

**Strengths surface in-domain only.** A faithful positive lives in its clinical
block (P22); there is **no standalone Strengths block** in this per-domain / RED
content structure — a separate Strengths section would contradict
strengths-in-domain, not merely duplicate it. Each strength is polarity-tagged in
the content, so a presentation renderer can still aggregate them for a narrative
target (see *Presentation*). Any strength without a cleanly-owning clinical domain
is rehomed to its most faithful block, not dropped.

## Presentation (future — NOT built now)
A presentation layer maps the per-domain content into a target document's fixed
slots, user-configurable. Example target — the **EdPlan Review of Existing Data**
domain order: Reason for Referral → Assessment History → Intervention History →
Behavior → Cognitive → Academic → Communication → Adaptive → Fine/Gross Motor →
Health & Medical → Vision & Hearing → Other Information (with EF/attention and
social-emotional mapped per user preference). **Do not build configurable display
now** — only keep the drafting output placement-agnostic so this mapping is
possible later.

**Aggregated Strengths section** — a presentation option, not content. For a
narrative-report target, a renderer may collect the polarity-tagged in-domain
positives into a single Strengths section. Because strengths live in-domain in
the content (no standalone Strengths block), this aggregation is a presentation
choice available to narrative targets and is *not* part of the per-domain / RED
structure.

## Known tensions (for adjudication)
- **P4 ↔ P18.** P4's original "avoid technical terms / plain language" is
  superseded by P18: use the precise professional term when it is the accurate
  word. P18 governs.
- **P16 ↔ P20.** P20 wants EF/attention constructed from the `TCH-SR` items, but
  P16 reconstructs specifics only where those items were actually screened. When
  the self-regulation module did not load (EF cleared only by the high-level
  concern screen), there are no `TCH-SR` answers, so EF falls back to a plain "no
  concerns reported" per P16 — still emitted as its own explicit block per P20.

## How this spec is applied
Fed in-context to the drafting slice each run; the harness pins the spec
**version**. Dev loop: generate submission → draft with this spec in-context → JD
reviews → each recurring edit becomes a parameter here → cross-check a second
model on the same fixture; divergence flags an underspecified parameter.

## Out of scope (roadmap — deferred)
Feedback-learning / work-sample ingestion (FERPA + governance). Configurable
presentation layer (structure allowed for; not implemented).

## Versioning
Parameters carry stable IDs (`P1`…`P23`); edits bump the version and append to the
changelog. Drafts record the spec version they ran under.

## Changelog
- **v0.3** — framing idea (content vs. presentation) added; P16 question-derived
  negatives, P17 per-domain placement-agnostic output, P18 register (one voice),
  P19 Reason-for-Referral structure, P20 EF/attention own block; P4 refined under
  P18, P5 rescoped to within-domain; section order moved to *Presentation*.
  Corrected (same version): **P21 no system-internal language (HARD)** added;
  P19 RTI framing scoped to Reason for Referral only (keep "some improvement";
  don't escalate to "inadequate"; don't assert "appropriate"); **Register anchor**
  worked example added; educational impact recounted within its domain (no
  separate Educational Impact domain). P12 clarified: attribution is uniform
  single-informant grounding; no impression-vs-finding disclaimers on individual
  statements. Strength content may appear both in its clinical domain and in
  Strengths (strengths-in-domain accepted for this target). **P22** added:
  faithful positive signal surfaced in cleared domains (not a bare negative),
  faithful-only. **P22 refined**: surfaces only when cleanly/directly *about* the
  domain, never by association (EF/Motor kept as bare negatives). **P23** added:
  no cross-domain references — each block stands alone (Social-Emotional cross-ref
  removed). **Standalone Strengths block dropped** — strengths surface in-domain
  only; orphan strengths rehomed ("enjoys being read to" → Communication,
  "consistent effort" → Other Information), none dropped; aggregated Strengths
  recorded as a presentation-layer option.
- **v0.2** — section order re-based on EdPlan RED domain structure.
- **v0.1** — initial canonical set (P1–P15) + section order + hard floor.
