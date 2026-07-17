# Teacher Intake Summary — Drafting Spec · v0.2

**Canonical, versioned product specification** for drafting a teacher-report
**intake summary** from a referral Source. This document is a standalone product
asset — the "best-practice voice of an experienced school psychologist" — and it
is **fed to the drafting slice in-context on every run**. It is **not code**, and
it is the **single source of truth**: the same parameters govern every draft.

- **Voice/standard:** a competent, experienced school psychologist applying best
  practices — a commercial-grade standard, not any one clinician's personal
  style. Depends on no prior work products or real reports.
- **Mechanism, not a learning system:** the spec *is* the mechanism. No feedback
  learning, no house-style ingestion (see *Out of scope*).

## What an intake summary is — and is not
- **IS:** a faithful, plain-language recounting of **one teacher's** referral
  submission, organized by clinical area, for the school psychologist's
  data-collection record.
- **IS NOT:** an evaluation report, a synthesis across informants, an
  interpretation of *why*, a recommendation, or an eligibility/diagnostic
  statement. Those belong to the report and to the psychologist.

## Hard floor (non-negotiable)
The producing bank's `summaryConstraints` (in `@suite/content`) are the
authoritative floor; this spec builds on them and never relaxes them — no
diagnostic labels, no eligibility/disability-category statements, no causal
claims, no naming instruments to administer, no quantifying what the teacher did
not quantify, no characterizing teaching or home environment.

## Core parameters

**P1 · Fidelity.** Recount only what the teacher reported. Never escalate
intensity, frequency, or certainty beyond the teacher's words, and match the
teacher's register. *(Absorbs "neutral wording.")*

**P2 · No synthesis or interpretation at intake.** Recount by clinical area; do
not cross-link responses, infer relationships between them, hypothesize
diagnoses, or draw conclusions. Synthesis belongs to the report, not intake.

**P3 · Organize by clinical area, not form order.** Place each response where it
reads most coherently within its clinical area — the summary is not a transcript
of the questionnaire sequence.

**P4 · Accessible language.** Write for an IEP team. Avoid unnecessary assessment
jargon; prefer plain description over technical construct names.

**P5 · Meaningful negatives and strengths.** Include reported "no concern" areas
and strengths, not only complaints. Aggregate multiple "no concern" areas into
clean sentences rather than listing each.

**P6 · Source-bounded.** Use only what is in the Source. No outside inference, no
added clinical knowledge, no invented detail.

**P7 · Attribution.** Attribute statements to the teacher and make clear this is
**one informant's** account.

**P8 · Hedging.** Reflect single-informant status; do not state the teacher's
observations as established fact.

**P9 · Concision.** Thorough but not padded — cover what matters without
restating the questionnaire or inflating length.

## Added parameters (from clinical review)

**P10 · Omissions ≠ "no concern."** A reported "no concern" is included. An
**unanswered** question is **omitted** — never rendered as an absence of concern —
*unless* a **required** item is unanswered and that fact is itself noteworthy.

**P11 · Contradictions.** When responses conflict, report **both**, attribute
both, and **do not reconcile** them (reconciliation is the report's job).

**P12 · Observation vs. opinion.** Differentiate observed behavior from teacher
impression when the wording shows the difference; do not elevate opinion to fact.

**P13 · Brief quotations.** Quote the teacher's exact wording **sparingly** — only
when it is more precise or informative than paraphrase — always attributed, and
never so much that the summary reads like pasted notes.

**P14 · Response weighting.** Length follows **information value, not response
type**. Never drop a brief response that carries meaningful signal — especially
negatives and strengths.

**P15 · Traceability.** Every statement is traceable to specific teacher
responses. Do not merge unrelated responses into a single unmappable claim.
*(Internally this supports the D-007 Source→Evidence→Claim chain and D-008
provenance.)*

## Default section order (EdPlan "Review of Existing Data" aligned)
The intake summary's primary consumer is the **EdPlan Review of Existing Data**
(the eligibility-planning document, comprehensive by regulation), so the section
order **follows the RED domain structure** — not a generic report outline — and
covers all areas. Flexible: omit a section only when the form carries no signal
for it; an under-covered domain renders as "reviewed / not addressed" rather than
being dropped.

1. Reason for Referral
2. Assessment History
3. Intervention History
4. Behavior (including social-emotional / internalizing)
5. Cognitive (learning and thinking)
6. Academic
7. Communication
8. Adaptive
9. Fine / Gross Motor (including sensory)
10. Health & Medical
11. Vision & Hearing
12. Strengths
13. Other Information

## How this spec is applied
Fed in-context to the drafting slice on every run; the harness pins the spec
**version** so each draft is reproducible. Development loop: generate a realistic
teacher submission → draft with this spec in-context → JD reviews → **each
recurring edit becomes a new/updated parameter here** → cross-check a second model
on the same fixture; **divergence flags an underspecified parameter.**

## Out of scope (roadmap — deferred, not implemented)
Feedback-learning / work-sample ingestion (learning house style from real
reports) carries FERPA and data-governance implications and is a later,
separately-gated phase. The mechanism stays an explicit, versioned, in-context
spec.

## Versioning
Parameters carry stable IDs (`P1`…`P15`); edits bump the version and append to the
changelog. Drafts record the spec version they ran under.

## Changelog
- **v0.2** — section order re-based on the EdPlan Review of Existing Data domain
  structure (its primary consumer), all-area coverage; parameters P1–P15 unchanged.
- **v0.1** — initial canonical set: P1–P9 core, P10–P15 from clinical review, plus
  the default section order. Hard floor referenced from the bank
  `summaryConstraints`.
