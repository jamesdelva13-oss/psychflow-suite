# decisions.md

Architectural and product decision log. Accepted decisions are constraints:
any deliverable — from Claude, ChatGPT, or a human — that contradicts an
entry here is rejected unless a new entry supersedes it. Entries are never
deleted; superseded entries are marked as such and left in place.

Format: D-NNN · Title · one-paragraph decision · Status · Date · Proposed / Ratified.

---

## D-001 · Platform framing
One platform, multiple capabilities, shared architecture, potentially
separable commercial products. Engineering is modular (packages); the user
experience is one integrated workspace. Customers are never asked to think
in "products."
**Status:** Accepted · 2026-07-14 · Proposed: ChatGPT · Ratified: JD

## D-002 · Clinical reasoning is a first-class data object
The platform stores evidence, construct mappings, claims, provenance, and
review decisions — not documents. Any report, summary, or export is a
rendering of those objects, never the primary artifact. Features that
persist prose without underlying structure violate this decision.
**Status:** Accepted · 2026-07-14 · Proposed: ChatGPT · Ratified: JD

## D-003 · Single-psychologist tenancy for MVP
The psychologist is the account holder and customer. No Organizations /
Schools / district-admin layer in the MVP. Schema remains district-ready
via nullable `organizationId` on relevant tables. District SaaS is the
destination, not the start.
**Status:** Accepted · 2026-07-14 · Proposed: Claude · Ratified: JD

## D-004 · Retained store with controls
Intake submissions persist server-side, encrypted, under the
psychologist's account, with: per-case deletion, a configurable auto-purge
window (e.g., N days after export), pseudonymous AI processing, and no
model training on user data. Relay-and-purge is a configuration option,
not a separate architecture. Retention/deletion fields exist in the first
schema, not retrofitted.
**Status:** Accepted · 2026-07-14 · Proposed: Claude · Ratified: JD

## D-005 · MVP scope exclusions
No voice input, no SMS, no SSO, no multilingual, no SIS integration, no
autonomous AI interviewing, no assessment-battery automation, no parent
conversational AI (parent intake = structured forms with free text).
Reintroducing any of these requires a superseding decision.
**Status:** Accepted · 2026-07-14 · Proposed: joint · Ratified: JD

## D-006 · `@suite/case-model` is the canonical data model
Five core entities — Case, Informant, Source, Evidence, Claim — defined
once in a shared package that every product imports. All database schemas,
API contracts, and AI output schemas derive from this package; schemas are
never invented per-document or per-feature. Student ↔ Case is one-to-many.
Minimal PII throughout.
**Status:** Accepted · 2026-07-14 · Proposed: Claude · Ratified: JD

## D-007 · Source → Evidence → Claim is the required pipeline
Raw responses are stored (Source) before any AI processing. Extraction
produces construct-tagged, source-linked Evidence. Narratives are composed
of Claims, each carrying a claim-type label (reported fact · respondent
opinion · cross-source synthesis · system inference · missing information ·
recommended follow-up) and links to supporting Evidence IDs. Unsupported
claims never silently appear: they are deleted, marked as inference, or
moved to follow-ups.
**Status:** Accepted · 2026-07-14 · Proposed: joint (layers: ChatGPT; entity mapping: Claude) · Ratified: JD

## D-008 · AI reliability controls
Schema-constrained JSON on all model output; validation before persistence;
every extracted concern cites ≥1 response ID; quote verification (cited
text must appear in the referenced response); contradiction flags surface
rather than auto-resolve; deterministic code computes all numbers; prompt,
schema, and model versions are stored with every generation.
**Status:** Accepted · 2026-07-14 · Proposed: ChatGPT · Ratified: JD

## D-009 · Claude API is the primary model provider
The AI layer is built on the Claude API with schema-constrained JSON
outputs. Chosen for existing account/skills posture; capability-equivalent
alternatives are not a point of debate absent a superseding decision.
**Status:** Accepted · 2026-07-14 · Proposed: Claude · Ratified: JD

## D-010 · Three-layer adaptive intake
Layer 1: deterministic branching (author-written rules). Layer 2:
deterministic completeness rules. Layer 3: AI selects follow-up questions
only from the approved follow-up bank; free-form AI question generation is
restricted. Layers 1–2 ship in Phase 1; Layer 3 in Phase 4.
**Status:** Accepted · 2026-07-14 · Proposed: ChatGPT · Ratified: JD

## D-011 · Taxonomy governance
Construct IDs are permanent dot-path identifiers; additions over mutations,
deprecation over deletion; the taxonomy carries a version number. Aliases
and display labels live at the presentation layer. Instrument mappings
belong in the crosswalk, never as taxonomy nodes. Current version: v0.3.
**Status:** Accepted · 2026-07-14 · Proposed: Claude · Ratified: JD
> **Amendment note (2026-07-23, per D-038):** the "Current version: v0.3" line
> above is stale — the taxonomy is at **v0.4** (`taxonomy.v0-4.json`). Corrected
> by **D-057**. Original text preserved.

## D-012 · Behavior is layered, not merged
Observable behavior uses the topography vocabulary (noncompliance,
avoidance, aggression, withdrawal, disruption) plus optional hypothesized
FBA function on Evidence; dimensional BEH constructs remain the spine.
Topography → construct mapping is many-to-many and hypothesis-grade until
corroborated. Software may suggest; only converging evidence or the
psychologist promotes a hypothesis to a finding.
**Status:** Accepted · 2026-07-14 · Proposed: Claude · Ratified: JD

## D-013 · Question bank governance
Question banks validate against `question-bank.schema.ts`. Question IDs are
permanent. Published bank versions are immutable — changes create a new
version; a completed response remains bound to the exact wording it was
shown. Summary constraints (prohibitions + required framings) travel with
the bank.
**Status:** Accepted · 2026-07-14 · Proposed: joint · Ratified: JD

## D-014 · Repository governance
The repository is the source of truth: Foundation Spec, `@suite/case-model`,
question banks, and this file. JD is the architect of record. Every
deliverable from any collaborator is reconciled against this log before
merge. Scope changes are decisions, not momentum.
**Status:** Accepted · 2026-07-14 · Proposed: Claude · Ratified: JD

## D-015 · Development process
Commit-based deliverables in small, shippable increments. Per-feature build
order: database → API → backend → frontend → AI → tests → documentation,
with docs shipping alongside code. A sprint is a small shippable increment;
multi-milestone roadmaps are roadmaps.
**Status:** Accepted · 2026-07-14 · Proposed: ChatGPT · Ratified: JD

## D-016 · "PsychFlow" name retired
Knockout search found PsychFlow® (NeuroCog Systems, practice management)
and psyflow.io (case management for school psychologists — direct
competitor, same buyer). No name investment until a candidate passes a
knockout search (USPTO, domains, app stores). Mission language adopted
independent of name: "School psychologists change lives. Paperwork
shouldn't get in the way." Company filter: does this reduce paperwork
without reducing professional judgment?
**Status:** Accepted · 2026-07-14 · Proposed: Claude (search) / ChatGPT (mission) · Ratified: JD

## D-017 · Pilot posture and external prerequisites
Teacher form pilots first (lower sensitivity). District data-governance
sign-off is required before piloting on district students; the staffing
agency contract is reviewed (IP assignment / outside work) before entity
formation. These block piloting and incorporation respectively — never
building.
**Status:** Accepted · 2026-07-14 · Proposed: Claude · Ratified: JD

## D-018 · Contracts/instances package split [SUPERSEDED by D-020]
`@suite/case-model` holds contracts and shared vocabulary: entity schemas,
taxonomy schema + versioned taxonomy data, question-bank and crosswalk
schemas. `@suite/content` holds authored clinical instances: question
banks, crosswalk data, and future state or language variants. Content
depends on case-model, never the reverse. No localization/variant
machinery until a variant exists. Bank question-ID uniqueness is enforced
by content tests.
**Status:** Accepted · 2026-07-15 · Proposed: ChatGPT · Refined: Claude · Ratified: JD

## D-019 · Mobile-first delivery format
Primary deliverables to JD are single-file, self-contained HTML: panel-HTML
review documents for content, and repo-bundle HTML (per-file view/copy/
download + one-paste restore block) for code handoff. Bare zips and raw
JSON/TS files are secondary artifacts, never the only channel. Applies to
deliverables from all collaborators.
**Status:** Accepted · 2026-07-15 · Proposed: JD (problem) / Claude (mechanism) · Ratified: JD

## D-020 · Three-layer architecture (supersedes D-018)
`@suite/case-model` owns architectural contracts and the canonical
vocabulary. `@suite/content` owns authored clinical content that conforms
to those contracts. Applications consume both but own neither.

Layer 1 — Platform (`@suite/case-model`): entity schemas, question-bank and
crosswalk schemas, taxonomy schema AND versioned taxonomy data. The
taxonomy stays here because construct identity is an architectural
contract, not authored content: changing EF.WORKING_MEMORY changes the
platform; changing a question changes content. Depends on nothing.

Layer 2 — Clinical content (`@suite/content`): question banks, crosswalk
data, follow-up banks, summary constraints, future state/language
variants. Depends only on Layer 1. Bank question-ID uniqueness enforced by
content tests. No localization/variant machinery until a variant exists.

Layer 3 — Applications (Referral Engine, PsychReport, QA Engine,
BehaviorIQ): depend on both lower layers. **Applications must never
hard-code authored clinical content** — all banks, follow-up banks,
crosswalks, and summary constraints are loaded from `@suite/content`, so
content can ship new versions without application changes. This is an
enforceable review criterion for every application PR.
**Status:** Accepted · 2026-07-15 · Proposed: ChatGPT (split concept, layer framing, no-hardcode rule) / Claude (contracts-vs-instances cut, taxonomy placement) · Ratified: JD
> **Amendment note (2026-07-22, per D-038):** Superseded in part.
> `@suite/reasoning-contracts` is inserted as **Layer 0** (depends on nothing);
> `@suite/case-model` now depends on it alone, so this decision's "Layer 1 …
> Depends on nothing" no longer holds for case-model. Layers 2–3 and the
> no-hardcode rule are unchanged. Original text above is preserved verbatim
> per the amendment rule in D-038.

## D-021 · De-identification mapping: storage and recovery [OPEN]
The de-identification pass replaces names, dates of birth, and school names
with placeholders before any model call. Undecided: whether the reverse map
persists anywhere, and what happens when it is lost. Three candidate
positions, none ratified. (a) **Memory-only** — the map lives in browser
memory and dies with the tab; a lost map means the pseudonymous output cannot
be re-identified and the pass is simply re-run. Maximum privacy, and a
mid-session crash costs the user their work. (b) **Encrypted local
persistence** — the map is written to local storage under a
psychologist-held key, surviving reload but never leaving the machine.
Recoverable, and it creates a re-identification artifact at rest that did not
previously exist. (c) **Deterministic derivation** — placeholders are derived
from a case-scoped salt, so the map is reconstructible rather than stored.
No artifact at rest, and the salt becomes the sensitive object instead.
Blocking: nothing currently — Layer B ships after Gate 2. Blocks: any pilot
on real student records (D-017).
**Status:** OPEN · Logged 2026-07-20 · Proposed: — · Ratified: —

## D-022 · Teacher-facing identifier level [OPEN]
What a teacher sees when they open an invitation link. Undecided between:
(a) **full student name**, which is what the teacher already knows and makes
the form unambiguous when a teacher is completing forms for several students;
(b) **first name + last initial**, which reduces exposure if a link is
forwarded or a screen is shared; (c) **case code only**, which means an
intercepted link discloses nothing, and which risks the teacher completing
the form for the wrong child. The invitation token is the credential (no
respondent accounts), so the identifier shown is the only in-form
confirmation that the teacher has the right case. This trades misattribution
risk against disclosure risk and the two do not have a common unit.
Blocking: teacher form pilot (D-017 names teacher forms as the first pilot
surface).
**Status:** OPEN · Logged 2026-07-20 · Proposed: — · Ratified: —

## D-023 · PII scrub: advisory or blocking [OPEN]
Free-text fields in teacher and parent intake will contain identifying
material the form never asked for — sibling names, addresses, clinician
names, other students. The scrub detects these. Undecided whether detection
is **advisory** (flag it, let the respondent decide, accept the submission
either way) or **blocking** (refuse submission until the flagged span is
edited or acknowledged). Advisory preserves the respondent's account in their
own words and lets PII through by design. Blocking guarantees the store is
cleaner and will produce false positives on legitimate content — a teacher
writing "he does better in Ms. Alvarez's room" is describing an intervention,
not leaking data — and every false positive is friction on a respondent who
is doing this as a favour. A middle position exists (block on high-confidence
detections, advise on the rest) and is not yet costed.
Blocking: nothing currently. Blocks: retention posture under D-004, since
what is stored determines what auto-purge has to reach.
**Status:** OPEN · Logged 2026-07-20 · Proposed: — · Ratified: —

## D-024 · `PRECEDENCE` leaves the shared package
The precedence stack is exported only from the PsychReport parameter block
(§1), not from `@suite/reasoning-contracts`. It orders competing *drafting*
instructions; the QA Engine does not draft and has no consumer for the
ordering, so shipping it in the shared package made every QA build import a
PsychReport authoring opinion. The stack itself is unchanged — this is a
relocation, not a revision.
**Status:** Accepted · 2026-07-21 · Proposed: JD · Ratified: JD

## D-025 · Length governance leaves the shared package
`LengthGovernance` and `DEFAULT_LENGTH_GOVERNANCE` are removed from
`@suite/reasoning-contracts` and sole-sourced in the parameter block (§7).
Word targets are a house judgment about report length; in the shared package
they would let QA flag another evaluator's report for exceeding *our*
preference — the same class of error as enforcing House Conventions on
outside documents. `PILOT_METRICS` is deliberately retained in the shared
package: it is instrumentation both products read, not a length rule, and
keeping it is what allows any future absolute limit to be derived from pilot
data rather than asserted as taste. Absolute limits stay inactive for pilot;
introducing one requires a superseding decision, not a style edit.
**Status:** Accepted · 2026-07-21 · Proposed: JD · Ratified: JD

## D-026 · Confidence stems are non-normative anchors
In `CONFIDENCE_POLICY`, the normative content is the `rank` ordering and its
mapping to `condition` and `evidenceStatus`. The `stem` strings are
calibration examples locating each rank in natural English — not a closed
vocabulary, a required phrasing, or a matchable literal. PsychReport may use
any wording at or below the permitted rank; emitting the six stems verbatim
across every report would manufacture exactly the boilerplate the parameter
block prohibits. QA must not implement any check as string-matching against a
stem: detection targets rank overreach, never vocabulary divergence. Editing
or reordering a stem is not a semantic change and needs no version bump;
changing a rank, condition, or evidenceStatus is and does.
**Status:** Accepted · 2026-07-21 · Proposed: JD · Ratified: JD

## D-027 · M10 style checks stay unnumbered
The Master Rubric's style checks live unnumbered under M10 and already carry
ADVISORY impact and best-practice authority. The intended STYLE-001–006
demotion is therefore satisfied in substance, and no such IDs exist to cite.
They stay unnumbered: assigning stable IDs to advisory style checks invites
them being referenced as findings in review memos, which is the failure mode
the demotion was meant to prevent. Any document referring to "STYLE-001–006"
should be reworded to name the unnumbered M10 checks instead.
**Status:** Accepted · 2026-07-21 · Proposed: Claude · Ratified: —

## D-028 · `authority` is a field on RuleMetadata, orthogonal to `SourceStatus`
`RuleMetadata` carries both `sourceStatus` (8 values, unchanged) and a new
`authority` field with the three ratified values: **mandated ·
defensibility · craft**. The two are orthogonal and neither is derived from
the other: provenance answers *where the rule came from*, authority answers
*what happens if a report breaks it*. `SourceStatus` cannot express the
second — nothing in it separates "will not survive due process" from "our
house prefers it," and that separation is what QA output must display to a
district and what bounds the attorney's review scope. A
`LEGAL_OR_REGULATORY_RULE` maps to mandated, but not conversely: a
`SOURCE_DERIVED_OPERATIONALIZATION` of a legal requirement is also mandated,
and a `CLINICAL_EXPERT_RULE` is usually defensibility. Two guards enforce it:
`mayPhraseAsRequirement()` (mandated only) and `inAttorneyReviewScope()`
(mandated + defensibility). Supersedes the July 21 withdrawal in
`contamination-audit.md`, which over-corrected: the specific three-tier
*enum* proposed on July 20 was designed against a phantom schema and stays
withdrawn, but the ratified three-value axis it was trying to express is
sound and is restored here as a field rather than a replacement.
**Status:** Accepted · 2026-07-21 · Proposed: JD · Ratified: JD

## D-029 · Repo canonicity; Project Context copies are snapshots
The repository is the single canonical home for every governed document.
Three consequences, in force immediately:

1. **Downloads artifacts are disposable.** Copies in `~/Downloads` or loose
   `~/Documents` folders are delivery exports, not sources. They are never
   edited, never cited, and may be archived or deleted without ceremony.
   Editing a Downloads copy is not a change to anything.
2. **Any copy in a Claude Project Context is a snapshot**, and it goes stale
   silently the moment the repo moves. Project Context must be re-uploaded
   after each ratified amendment. A stale grounding document is worse than a
   missing one: sessions cite it with confidence and produce work that
   reconciles against nothing.
3. **"Refresh Project Context" joins the end-of-session checklist**, so
   grounding documents and repo never disagree. See
   `suite/docs/end-of-session-checklist.md`.

Verified 2026-07-21: the four QA docs in `(repo)/docs/` and the loose
`~/Documents/PsychReport QA Engine/` folder were byte-identical (md5), so the
loose copy was archived rather than reported as a divergence. The QA Engine
Project Context copy was not inspectable from this session and its currency
is unknown — treat it as stale until re-uploaded.
**Status:** Accepted · 2026-07-21 · Proposed: JD · Ratified: JD

## D-030 · Authority assignment across the 44 rubric checks
Every Master Rubric check carries an `authority` value assigned by
*consequence* — what happens if a report violates it — not by source.
Mandated requires a specific quotable citation in an uploaded source
document; **no pin, no mandated**, without exception. Where a call was close,
the lower tier was assigned and the row flagged, because over-claiming
mandated is the dangerous error while under-claiming merely routes a check to
attorney review. The attorney punch list is therefore generated
mechanically: mandated rows plus flagged rows.

Result: 16 mandated · 24 defensibility · 4 craft · 9 flagged · 23 rows in
attorney scope. All of M10 is craft; the fidelity and overreach cluster is
defensibility. Full table with page-level pins:
`docs/authority-assignment-v1.md`.

District-rule checks (currently only 12.1) are mandated *within that
district's deployment*, cited to the district checkpoint document, and stay
out of statutory attorney review.

Two caveats ride on this: NC Policies is the March 2021 edition and every
NC-pinned mandated row inherits the unresolved supersession question; and 34
CFR Part 300 is still absent from the repo, so federal requirements are
pinned via the state document restating them rather than the primary source.
**Status:** Proposed · 2026-07-21 · Proposed: Claude · Ratified: — *(pending
review of the 9 flagged rows)*

---

<!-- ════════════════════════════════════════════════════════════════════ -->
<!-- Merged 2026-07-22 from the 2026-07-20 clinical-writing session log.    -->
<!-- Origin numbering (session D-0N) is noted per entry. Duplicates and     -->
<!-- spec-covered entries were NOT merged; see docs/session-log-merge-map.md.-->
<!-- Two entries (session D-04, D-11) conflict with existing decisions and  -->
<!-- are held for JD, not merged — see the merge map.                       -->
<!-- ════════════════════════════════════════════════════════════════════ -->

## D-031 · Governing clinical-writing framework adopted
*(Origin: 2026-07-20 session log, D-01.)*
The framework derived from Flanagan (ed., 2024), *Clinical Guide to Effective
Psychological Assessment and Report Writing*, as amended across that session,
governs PsychReport's clinical writing. Most shipped parameters are
`SOURCE_DERIVED_OPERATIONALIZATION`, not principles stated verbatim by any
publisher. Do not present them as though Springer, APA, or Cambridge stated
them directly. Cross-ref: `SourceStatus` enum in `reasoning-contracts` §4.
**Status:** Accepted · 2026-07-20 · Proposed: session · Ratified: JD

## D-032 · Five section modes, subtractive modifiers
*(Origin: 2026-07-20 session log, D-02.)*
The modes are `SOURCE_FAITHFUL · DIRECT_OBSERVATION · DESCRIPTIVE_RESULTS ·
INTEGRATED_INTERPRETATION · RECOMMENDATION`. Modifiers (`multisourceFactual`,
`proceduralOnly`, `noNewInference`, `teamReserved`) may only *subtract*
permissions from the base mode, never expand them. **Why five, not ten:** the
QA Engine must infer mode from arbitrary district prose, and classification
accuracy degrades as class count rises; since the enum is shared, PsychReport's
convenience would be paid directly in QA's mode-confidence scores. No blended
modes — mode attaches to a content block, never a heading. `DESCRIPTIVE_RESULTS`
inference is binary: within-measure description permitted, extrapolation
prohibited. Cross-ref: `reasoning-contracts` §1, `MODE_CONTRACTS`.
**Status:** Accepted · 2026-07-20 · Proposed: session · Ratified: JD

## D-033 · Interpretive ceiling and source scope are orthogonal
*(Origin: 2026-07-20 session log, D-03.)*
Ceiling governs *how far* a source may be pushed; scope governs *where, when,
and about what* it speaks. A fully valid Conners teacher form supports claims
about school and says nothing about home — not because its ceiling is low, but
because HOME is outside its scope. Two fail-safe guards: `NOT_ESTABLISHED`
never resolves to `FULL_INTERPRETATION`; an absent or empty scope means
UNKNOWN, never UNRESTRICTED (empty settings/constructs degrade to
`DESCRIBE_ONLY`). Never read `interpretiveCeiling` directly — call
`effectiveCeiling()`. Cross-ref: `reasoning-contracts` §0; guard tests
`tests/ceilings.test.ts` 1–13.
**Status:** Accepted · 2026-07-20 · Proposed: session · Ratified: JD

## D-034 · Adverse impact and SDI structurally excluded from PsychReport
*(Origin: 2026-07-20 session log, D-05.)*
Adverse-impact language in an evaluation report constitutes predetermination;
these statements are used at the eligibility meeting after eligibility is
established. PsychReport has no `adverse_impact` and no `need_for_sdi` section —
not a flag, not a prompt, not an export field. Enforced by schema, not
prompting. Adverse impact and SDI move to `@suite/eligibility-artifacts` with
their own authorization states (`DRAFT_HELD` → `TEAM_AUTHORIZED` → `RELEASED`).
Evidence rule: eligibility category and scores may *contextualize* an
adverse-impact analysis but cannot *establish* it; candidates without evidence
are dropped, not hedged. QA rule is inverted: not "adverse-impact statement
missing from the report" but "the evaluation contains insufficient functional
evidence to support a later determination." Cross-ref: parameter block §2;
`reasoning-contracts` §6 (`PsychReportSection`, deliberately-absent types).
This is the decision the authority rulings on rows 8.1/8.2 rely on.
**Status:** Accepted · 2026-07-20 · Proposed: session · Ratified: JD

## D-035 · Products decoupled; semantics shared; QA is not self-certifying
*(Origin: 2026-07-20 session log, D-12.)*
PsychReport starts with structured case evidence and generates prose; QA starts
with an arbitrary completed document and reconstructs claims from prose —
different computational problems. Shared: the *semantics*. Separate: the
*implementation*. **PsychReport must not become QA's answer key.** If QA is
tuned until PsychReport passes, it becomes self-certification rather than an
independent second reader. QA's validation corpus must include district reports
written without PsychReport, strong reports by experienced psychologists, seeded
defects, and reports containing appropriate disagreement. Acceptable contract:
PsychReport should not *systematically* trigger QA findings — not that every
PsychReport output must score perfectly. A correct report may still require
review when evidence is incomplete.
**Status:** Accepted · 2026-07-20 · Proposed: session · Ratified: JD

## D-036 · Prompts rebalanced exemplar-first (v2)
*(Origin: 2026-07-20 session log, D-13.)*
v1 mode prompts ran roughly 70% prohibition, producing correct but lifeless
prose. v2 leads with the voice, gives each mode an exemplar and a contrast
pair, then states guardrails compactly — roughly 50/50. Positive exemplars do
the style control; mechanical negative rules stay in QA. This is the decision
behind the still-unbuilt prompts file the manifest tracks: parameter block §10
holds three tone exemplars against this spec's five-exemplar-plus-contrast-pair
target, so the file is authored-partial, not complete.
**Status:** Accepted · 2026-07-20 · Proposed: session · Ratified: JD

---

## D-037 · No timeline check ships without its tolling conditions
A rubric check that enforces an evaluation or referral timeline must encode the
statutory exceptions that pause or excuse it, or it is not shippable. A bare
"N days" check produces false positives on legitimately tolled evaluations,
which trains evaluators to dismiss the tool's findings — worse than no check.
Concretely: NC 1503-1(d) carries three exceptions (parent repeatedly fails to
produce the child; parent repeatedly fails to respond to a consent request;
mid-year transfer), while 34 CFR 300.301(d) carries two (produce-the-child;
transfer). A check must use the exception set of the jurisdiction it is
enforcing — federal exceptions are not importable into a state check, and vice
versa.

**Row 11.3 resolution (2026-07-22).** NC branch pins to NC 1503-1(c), 90 days.
SC branch: SEED and the accessible text of SC Reg 43-243 are both silent on an
evaluation timeline (the reg delegates detailed timelines to the SCDE *Policies
and Procedures* document, not retrieved). Per the federal-fallback rule the SC
branch pins to **34 CFR 300.301(c)(1)(i), 60 days**, with the two federal
tolling exceptions. Secondary sources report SC has adopted the same 60 days in
its SCDE policies document; retrieving and quoting that would re-pin the SC
branch to STATE authority without changing the 60-day behavior. Flagged, not
closed. Source text: `docs/reference/34-CFR-Part-300-key-sections.md`.
**Status:** Accepted (principle) · SC pin Proposed pending SCDE policies doc ·
2026-07-22 · Proposed: Claude · Ratified: —
> **Update (2026-07-22): SC 11.3 re-pinned to STATE.** The SCDE *Policies and
> Procedures* doc is now in `docs/reference/`. Verbatim, p. 47 §300.301: *"The
> initial evaluation must be conducted within 60 days of receiving parental
> consent for evaluation."* SC branch now pins STATE (SCDE) with 34 CFR
> §300.301(c)(1) as secondary support. The SCDE doc is silent on tolling, so the
> two federal §300.301(d)/(e) exceptions carry over — sourced federal, noted as
> such. SC additionally sets a 15-day eligibility-determination timeline (SCDE
> p. 47 §300.306), distinct from the 60-day evaluation clock. The federal-fallback
> pin and its uncertainty flag are withdrawn; the tolling-conditions principle is
> unchanged and now satisfied for the SC branch.

---

## D-038 · `@suite/reasoning-contracts` is Layer 0 (resolves the held D-04 conflict)
*(Origin: 2026-07-20 session log, D-04, previously held against D-020.)*
The dependency graph gains a layer beneath D-020's three:

```
reasoning-contracts -> (nothing)                          [Layer 0]
case-model          -> reasoning-contracts                [Layer 1]
psychreport         -> reasoning-contracts, case-model
qa-engine           -> reasoning-contracts   ONLY (never case-model, never psychreport)
eligibility         -> reasoning-contracts, case-model
```

`reasoning-contracts` owns the shared epistemic types (`EvidenceStatus`,
`InterpretiveCeiling`, `ValidityStatus`, `SourceScope`,
`SourceInterpretationPolicy`, `SectionMode`, confidence policy, rule
provenance). They cannot live in `case-model` because QA assigns
`EvidenceStatus` to prose it has no case model for and QA may not import
`case-model`. This contradicts D-020's literal "Layer 1 (`@suite/case-model`)
depends on nothing"; D-020 was written before `reasoning-contracts` existed as
a package. D-020 receives a dated amendment note and keeps its original text.

**General rule established here (governance):** when two ratified decisions
conflict, **the later decision governs and the earlier receives a dated
amendment note pointing to it. Ratified entries are never silently rewritten** —
the original text stays legible so the change is auditable. This rule is itself
the mechanism used to reconcile D-020 above.
**Status:** Accepted · 2026-07-22 · Proposed: session D-04 / Claude (rule) · Ratified: JD

## D-039 · Style constraints live post-draft in QA (resolves the held D-11 conflict)
*(Origin: 2026-07-20 session log, D-11, previously held against D-027.)*
Negative style constraints in a drafting prompt make writing stilted; the same
constraints applied post-draft are precise and cost nothing at generation time.
Therefore: **drafting prompts carry positive style targets and exemplars; the
mechanical negative style checks live in QA, as the M10 advisory checks.**
(D-11's original wording said "STYLE-001–006"; those identifiers do not exist —
the checks are unnumbered under M10 — so this entry substitutes "the M10
advisory checks." **D-027 stands as ratified**: the M10 checks stay unnumbered.)
D-039 and D-027 agree — QA-owned, advisory — and no longer conflict once the
phantom identifiers are dropped.
**Status:** Accepted · 2026-07-22 · Proposed: session D-11 · Ratified: JD

## D-040 · Retire check 11.4; cancel the 11.4-SLD build
Check 11.4 (credential/signature block) and the proposed SLD-conditional
11.4 check are both **retired**, for **both SC and NC**.

**Rationale (user ruling, confirmed for both states).** Every evaluator signs a
**Summary of Assessment Results** page inside the special-education management
system — **EdPlan in SC, ECATS in NC** — for every eligibility category. That
signature is required to finalize the eligibility documents; the system will not
let the packet close without it. The written-certification obligation of 34 CFR
§300.311(b) ("each group member must certify in writing whether the report
reflects the member's conclusion") is therefore **operationalized in the
management-system artifact, not in the psychologist's report.** QA reviews the
report; it does not review the EdPlan/ECATS Summary page. A signature-block check
run against the report would be looking for the obligation in the wrong document —
it would fire on reports that are perfectly compliant because the certification
lives, correctly, in the platform. This resolves §300.311(b) for good: it is
**satisfied elsewhere by design**, and must not be reopened as a report-level
check.

**Generalizable principle (governance).** **No check ships against an artifact
the engine never reviews.** Every future check proposal must first identify
*which reviewed document carries the obligation* before any detector is built. A
legal requirement being real is necessary but not sufficient — the requirement
has to live in the artifact QA actually inspects, or the check belongs to a
different tool (or to a human step), not to report review.

**Residual edge case (preserved, no check now).** §300.311(b) has a disagreement
clause: a dissenting group member "must submit a separate statement presenting the
member's conclusions." That separate statement is the one path by which
certification *content* (not just a signature) could surface as a reviewable
document — and only if the engine ever ingests full eligibility packets rather
than single reports. No check today; recorded so the edge case isn't rediscovered
from scratch if packet-level review is ever built.

**Consequences.** 11.4 is removed from the authority table's active rows and from
the attorney punch list; counts updated. The compliance value is relocated, not
lost: a pre-meeting checkpoint is added to the District Checkpoint Spec —
"confirm the Summary of Assessment Results page is signed by all evaluators" —
which verifies the platform artifact that actually carries the §300.311(b)
obligation.
**Status:** Accepted · 2026-07-22 · Proposed: JD (ruling) / Claude (principle) · Ratified: JD

## D-041 · Attorney-review routing moves to QA and becomes mandated-or-flagged
`inAttorneyReviewScope` is removed from `@suite/reasoning-contracts` and lives in
the QA package at `packages/core/review-routing.ts`. Routing which findings a
human attorney reviews is a QA detection/workflow concern, not shared epistemic
vocabulary — consistent with D-038 (QA owns detection; reasoning-contracts owns
the `authority` tier vocabulary the routing consumes). The **uncertainty flag**
moves with it: it is now a QA-side `flagged` boolean on the reviewable rule, not
a field on the shared `RuleMetadata`.

The definition also changed. The old function routed **mandated ∪
defensibility**; it now routes **mandated ∪ flagged** — every mandated rule, plus
any row the assignment pass flagged as uncertain, of any tier. This matches the
actual attorney punch list: a flagged defensibility/craft row is exactly what the
attorney promotes, while a settled (unflagged) defensibility row needs no legal
pass. On the current 43-row table this yields **22 rows** (16 mandated + 7 flagged
− 7.1, which is both). Former reasoning-contracts guard test 22 was ported to
`packages/core/review-routing.test.ts` and redefined accordingly; the shared guard
suite is now 23 tests. `mayPhraseAsRequirement` stays in reasoning-contracts — it
is a claim rule both products need, not a QA-only workflow.
**Status:** Accepted · 2026-07-22 · Proposed: Claude · Ratified: —

---

<!-- ════════════════════════════════════════════════════════════════════ -->
<!-- Fork reconciliation, 2026-07-23 (JD-ratified). The RIE repo             -->
<!-- (psychflow-suite) kept its own decisions.md that shared D-001→D-020     -->
<!-- with this trunk, then forked: its D-021→D-024 named different decisions -->
<!-- than this log's D-021→D-024. Those four RIE entries are merged here as  -->
<!-- D-042→D-045 with original wording preserved, per the amendment rule in  -->
<!-- D-038 (later governs; nothing already ratified is renumbered). This     -->
<!-- trunk is canonical (D-014/D-029); the RIE repo's decisions.md is        -->
<!-- replaced with this merged file. Scope markers [RIE]/[suite]/[QA]/       -->
<!-- [PsychReport] are used from here forward.                               -->
<!-- ════════════════════════════════════════════════════════════════════ -->

## D-042 · [RIE] Repo is an npm-workspace monorepo
*(Fork reconciliation: was RIE `decisions.md` D-021, origin repo psychflow-suite. Original wording preserved, per the amendment rule in D-038.)*
psychflow-suite ships a root package.json declaring workspaces for
case-model, content, and referral-engine-core. It is the source of
truth for local @suite/* resolution: install once at the root, never
per-package (the @suite/* names are local, unpublished, and 404 against
the registry). Cross-package test imports are by relative path.
**Status:** Accepted · 2026-07-16 (orig.) · merged 2026-07-23 · Ratified: JD

## D-043 · [RIE] Per-package install flow superseded
*(Fork reconciliation: was RIE `decisions.md` D-022, origin repo psychflow-suite. Wording preserved except the internal sibling reference, updated from the original "(D-021)" to "(D-042)" so it still points at the workspace-monorepo decision after renumbering. Per the amendment rule in D-038.)*
The standalone per-package `npm install` in docs/phase1-session1-brief.md
is superseded by the workspace-root install (D-042). From the repo root:
`npm install`, then `npm test --workspace <name>`.
**Status:** Accepted · 2026-07-16 (orig.) · merged 2026-07-23 · Ratified: JD

## D-044 · [RIE] Package export hygiene
*(Fork reconciliation: was RIE `decisions.md` D-023, origin repo psychflow-suite. Original wording preserved, per the amendment rule in D-038.)*
Package export hygiene — referral-engine-core declares main; case-model index
avoids duplicate star exports of ConstructId/Topography. Consumers import
@suite/* by bare name.
**Status:** Accepted · 2026-07-16 (orig.) · merged 2026-07-23 · Ratified: JD

## D-045 · [RIE] Respondent session model
*(Fork reconciliation: was RIE `decisions.md` D-024, origin repo psychflow-suite. Original wording preserved, per the amendment rule in D-038.)*
Respondents have no account. The invitation token is validated once at
`/r/[token]` (`checkInvitation`) and exchanged for a **signed, HTTP-only
session cookie bound to that one invitation**. All later autosave/submit calls
are authorized by that cookie — never by re-presenting the token, never by a
Supabase identity. A cookie minted for one invitation cannot act on another
(`authorizeRespondent`). Because React Server Components cannot set cookies,
`/r/[token]` is a route handler that sets the cookie and redirects to the form.
**Status:** Accepted · 2026-07-16 (orig.) · merged 2026-07-23 · Ratified: JD

<!-- Scope-marker convention (from D-042 onward): tag each new entry [suite] -->
<!-- (cross-cutting), [QA], [RIE], or [PsychReport]. Entries D-001→D-041     -->
<!-- predate the convention and are not retro-tagged. -->

## D-046 · [suite] Shared-layer consolidation [OPEN]
`@suite/*` is currently split across two repos. The QA Engine repo holds
`suite/packages/reasoning-contracts` (and a broken `suite/packages/case-model`
missing its taxonomy files); the `psychflow-suite` repo holds a working
`@suite/case-model` (with `taxonomy.schema.ts` + `taxonomy.v0-4.json`),
`@suite/content`, `@suite/referral-engine-core`, and already-wired npm
workspaces. Each repo holds roughly half of the shared layer, and neither can
build the whole `@suite` graph on its own.

**Leading option:** make `psychflow-suite` the single home for all `@suite/*`
packages — it already has the workspace wiring and the canonical case-model —
and move `reasoning-contracts` into it. This would also discharge the standing
workspace-wiring / `npm ci` debt (the reason `packages/core/review-routing.ts`
mirrors `RuleAuthority` locally instead of importing it, D-041) and resolve the
`@suite/case-model` "missing taxonomy files" defect by adopting psychflow-suite's
v0.4 copy rather than restoring v0.3.

Not yet ruled: whether the QA Engine (`packages/core`, a separate app tree)
folds into the same monorepo or stays its own repo consuming `@suite/*` as
dependencies. Blocks: nothing today; blocks any clean cross-package import wiring
until resolved.
**Status:** OPEN · Logged 2026-07-23 · Proposed: Claude · Ratified: —

## D-047 · [RIE] P33 render-layer purity — adopted as an RIE self-check, not a QA row
The render-layer-purity rule designed in the July 18 chat was never implemented;
no P33 exists in the committed v0.6.1 spec. **Ratified:** adopt it, but as an
**RIE pre-emission self-check in the v0.7 spec**, not a QA rubric row. The
rendered draft carries only report prose; tier labels (`T0`–`T3`), P-rule cites,
item IDs, version strings, and routing commentary are prohibited in block bodies
and live in the IR / reproducibility pin / P14a pass instead. **The italic
reproducibility-pin subtitle is metadata by definition and exempt** — stated
explicitly so it is not stripped.

**Why not a QA row:** metadata literals like `T1-obs` or `P29` can only appear in
a document RIE itself drafted, so a QA check for them would tune QA against our
own output — the self-certification failure D-035 warns against — and QA reviews
arbitrary district reports it did not write. The proposed regexes
(`\bP\d{1,2}\b`, `v\d+\.\d+`) would also throw false positives on ordinary
district prose. If it ever earns a QA row, it is **advisory-tier and narrowly
scoped to `T1-obs`-style literals only** (ratified ceiling, so scope can't creep).
Rule text staged in `psychflow-suite-build/docs/v0.7-candidates.md`; the committed
v0.6.1 spec is untouched.
**Status:** Accepted · 2026-07-23 · Proposed: Claude · Ratified: JD

## D-048 · [suite] Evidence-tier vocabulary moves to `@suite/reasoning-contracts`
The **epistemic** core of P29 is shared vocabulary (D-038) and moves to
`@suite/reasoning-contracts`: the **T0/T1/T1-obs/T2/T3 ladder**, the
**no-inference-upgrade** hard rule, and the **QA contract** that a "domain
addressed" check is satisfied by **T1** and **NOT** by **T1-obs** (evidence of
absence vs. absence of evidence). P29's *render forms*, licensed-sentence counts,
and instrument mapping **stay in RIE** — only the vocabulary and the
domain-addressed guard are shared.

Implemented as a `Tier` type, the T1-obs/T1 distinction documented in comments,
and a `satisfiesDomainAddressed()` guard, with tests in the existing guard-suite
style. **Location caveat (D-046 fork):** `reasoning-contracts` currently lives in
the **Sped-QA-Engine** repo while `case-model` lives in `psychflow-suite`. The
vocabulary is added to the Sped-QA-Engine copy as the current canonical and is
**not** duplicated into psychflow-suite; it **relocates wholesale when D-046
resolves** (psychflow-suite as single `@suite` home).
**Status:** Accepted · 2026-07-23 · Proposed: Claude · Ratified: JD

---

<!-- ════════════════════════════════════════════════════════════════════ -->
<!-- Second fork reconciliation, 2026-07-23 (JD-ratified). The RIE repo      -->
<!-- (psychflow-suite) committed nine v0.6.1 decisions as its own D-025–D-033 -->
<!-- while this trunk's D-025–D-033 were different (QA/suite work). Those     -->
<!-- nine RIE entries are merged here in original order as D-049–D-057,        -->
<!-- wording preserved, per the amendment rule in D-038. Sibling cross-refs   -->
<!-- to old RIE numbers are repointed (disclosed per entry). Nothing already  -->
<!-- ratified is renumbered. See D-058 for the recurrence fix.                -->
<!-- ════════════════════════════════════════════════════════════════════ -->

## D-049 · [RIE] Evidence-tier ladder; T1-obs is a distinct tier
*(Fork reconciliation: was RIE `decisions.md` D-025, origin repo psychflow-suite. Original wording preserved, per the amendment rule in D-038. The shared-vocabulary half of this decision was later migrated to `reasoning-contracts` as D-048.)*
Domain blocks render at one of five evidence tiers (drafting-spec P29): T0 not
asked, T1 asked/no-concern (bare negative), T1-obs asked/insufficient
opportunity, T2 affirmatively within-or-above (one attributed sentence), T3 T2
plus detail. Tiers never upgrade by inference. **T1-obs is NOT folded into T1**:
T1 is evidence of absence, T1-obs is absence of evidence; collapsing them makes
an unexamined domain look cleared. This carries real weight for Adaptive, where a
gen-ed teacher may lack a window into self-care/community/home routines and where
adaptive functioning is a rule-out for intellectual disability under SC SEED.
Unwaivable QA-Engine contract: a "domain addressed" check is satisfied by T1 and
NOT by T1-obs; T1-obs raises a collect-elsewhere flag naming alternate sources;
the distinction lives in the IR, never re-derived from rendered prose. *Rejected:*
folding T1-obs into T1 (cheaper render, but destroys the addressed-vs-observable
distinction the tool exists to protect).
**Status:** Accepted · 2026-07-18 (orig.) · merged 2026-07-23 · Proposed: JD (settled) / Claude (implementation) · Ratified: JD

## D-050 · [RIE] Affirmative capture scoped to Cognitive and Adaptive only
*(Fork reconciliation: was RIE `decisions.md` D-026, origin repo psychflow-suite. Original wording preserved, per the amendment rule in D-038.)*
The 1.3.0 instrument adds affirmative screeners (T2/T3 data) for Cognitive and
Adaptive only. *Rejected:* adding them for Written Expression, Math, Behavior,
Communication, and Motor now. Reason: Cognitive and Adaptive carry rule-out weight
for intellectual disability, so an affirmative "within/above" reading is
clinically load-bearing there; and every added follow-up costs completion rate on
an instrument already near ~31 shown items. The ladder itself is built
domain-agnostic (P29), so later expansion to the other domains is an INSTRUMENT
VERSION BUMP, not a spec migration.
**Status:** Accepted · 2026-07-18 (orig.) · merged 2026-07-23 · Proposed: JD (settled) / Claude (implementation) · Ratified: JD

## D-051 · [RIE] Closed lists over stated principle for licensed T2/T3 language
*(Fork reconciliation: was RIE `decisions.md` D-027, origin repo psychflow-suite. Original wording preserved, per the amendment rule in D-038.)*
Licensed affirmative language (drafting-spec P30) is governed by a CLOSED set of
mandatory attribution frames and a CLOSED prohibited-descriptor list, not by a
prose principle. Permitted evaluative vocabulary (adequate, consistent with peers,
keeping pace, …) is allowed once a frame is present; prohibited terms are barred
even with attribution because the term itself asserts a measurement occurred:
"within normal limits"/"WNL" reads as a standardized-score claim; "average"/"low
average"/"borderline" are classification-table labels that would falsely
correspond to score tables elsewhere in the same report (highest-priority);
"age-appropriate" (milestone sense) is ambiguous, replaced by "consistent with
grade-level peers." Direct quotation of the informant is always licensed (escape
hatch). *Rejected:* a stated principle ("use norm-free language"). Reason: the QA
Engine is a pre-signature compliance tool — a closed list is lintable and testable
against fixtures; a principle drifts across drafters and model versions.
**Status:** Accepted · 2026-07-18 (orig.) · merged 2026-07-23 · Proposed: JD (settled) / Claude (implementation) · Ratified: JD

## D-052 · [RIE] Derived concern set; screeners never mutate the base answer
*(Fork reconciliation: was RIE `decisions.md` D-028, origin repo psychflow-suite. Wording preserved except the internal sibling reference, updated from the original "(D-030)" to "(D-054)" so it still points at the referral-source/onset decision after renumbering. Per the amendment rule in D-038.)*
Cognitive/Adaptive affirmative screeners can ADD a domain to a DERIVED concern set
(`concernSet = CORE-008 selections ∪ {domains rated "below" on a screener}`),
carrying per-domain entry provenance (`via: core-008 | screener`). Branch rules
BR-010/BR-012 are repointed at the computed `$concernSet` (engine-injected), not at
CORE-008. *Rejected:* writing a screener "below" back into CORE-008's stored answer
(the concern set it populates). Reason: that corrupts the verbatim record — a
downstream audit would misreport what the teacher selected — the same class of
error as the referral-source/onset collapse (D-054). *Also rejected:* a second
branch rule per domain (two entrances to maintain). Screeners are always-shown,
suppressed once the domain is flagged on CORE-008, capping the cost at two items.
**Status:** Accepted · 2026-07-18 (orig.) · merged 2026-07-23 · Proposed: JD (settled) / Claude (implementation) · Ratified: JD

## D-053 · [RIE] Block scope declared everywhere, enforced on RfR only
*(Fork reconciliation: was RIE `decisions.md` D-029, origin repo psychflow-suite. Original wording preserved, per the amendment rule in D-038. References to D-006 and D-020 are to the shared ancestor block, unchanged in the trunk.)*
Every drafting block declares `scope: case | informant | hybrid` (drafting-spec
P31), in the drafting spec's Content-domains list AND a machine-readable registry
in @suite/content (schema `BlockRegistry` in @suite/case-model per D-020).
Enforcement rules are written for Reason for Referral only this version.
*Rejected:* (a) full enforcement now — merge semantics for multi-source
case-scoped blocks is genuinely hard, not yet blocking (one intake type exists),
and is deferred to v0.7; (b) declaring scope only on RfR — the classification is
cheap now and expensive to retrofit, so fixtures are born with it and later
enforcement is additive (no second migration). "Blocks" are NOT a sixth canonical
entity (D-006 holds at five); constraining `Claim.outputSection` to the registry
is the natural v0.7 follow-on (a free-form string → enum), paired with merge
semantics — not done now.
**Status:** Accepted · 2026-07-18 (orig.) · merged 2026-07-23 · Proposed: JD (settled) / Claude (implementation) · Ratified: JD

## D-054 · [RIE] Referral source, concern onset, contributing informants are three fields
*(Fork reconciliation: was RIE `decisions.md` D-030, origin repo psychflow-suite. Original wording preserved, per the amendment rule in D-038. Referenced by D-052 and D-056.)*
The Case gains three first-class fields (case-model 0.3.0): `referralSource`
(required, enum, with `multiple` requiring ≥2 `referralContributors` and
`unknown_not_yet_captured` as the honest default), `concernOnset` (when a concern
was first noticed), and `contributingInformants` (list). A referral is
case-scoped; a teacher intake is one contributing source, never "the referral."
Checkable rule: an onset item (e.g. CORE-010) MUST NOT populate referralSource —
enforced structurally (distinct types) and by `referralSourceForSingleIntake()`,
which always returns `unknown_not_yet_captured` (a lone intake never establishes
who referred), covered by a case-model test. *Forward check (B-4):* the design
survives a no-teacher-instrument case (private-practice live parent interview) —
referralSource is `parent_guardian`, contributingInformants a parent, onset from
the parent; nothing in Workstream A/B hard-assumes an async teacher form.
*Deferred follow-on:* the DB migration (cases columns) and case-construction
wiring that populate these fields — additive, not in this batch.
**Status:** Accepted · 2026-07-18 (orig.) · merged 2026-07-23 · Proposed: JD (settled) / Claude (implementation) · Ratified: JD

## D-055 · [RIE] Question banks are stored as versioned files (honors D-013)
*(Fork reconciliation: was RIE `decisions.md` D-031, origin repo psychflow-suite. Original wording preserved, per the amendment rule in D-038.)*
Bank storage moves from a single mutable `teacher-form.v1.json` to per-version
files: `teacher-form.v1.2.0.json` is frozen (byte-identical to the prior
published bank) and `teacher-form.v1.3.0.json` is added. This honors D-013
("published bank versions are immutable; changes create a new version") at the
file level, so a completed response's version pin stays resolvable. The app and
engine load the latest published version (1.3.0); golden fixtures keep their own
pins (fixture #1 → 1.2.0, fixture #2 → 1.3.0). *Rejected:* bumping the single file
in place and re-pinning fixtures — re-pinning defeats what a pin is for (the v0.6
fixture #2 draft is only reproducible if the bank it names still exists).
**Status:** Accepted · 2026-07-18 (orig.) · merged 2026-07-23 · Proposed: JD (D-013 resolution) / Claude (implementation) · Ratified: JD

## D-056 · [RIE] Case Data Model version bump 0.2.0 → 0.3.0
*(Fork reconciliation: was RIE `decisions.md` D-032, origin repo psychflow-suite. Wording preserved except internal sibling references, updated from the original "(D-030)"→"(D-054)" and "(D-029)"→"(D-053)" after renumbering. Per the amendment rule in D-038.)*
`@suite/case-model` bumps 0.2.0 → 0.3.0 for the D-054 referral-provenance fields,
the shared `InformantRole`, and the `BlockRegistry` contract (D-053). Additive;
existing entities unchanged except `Case` (new fields) and `Informant.role`
(refactored to the shared enum, same values).
**Status:** Accepted · 2026-07-18 (orig.) · merged 2026-07-23 · Proposed: Claude · Ratified: JD

## D-057 · [RIE] Correction: taxonomy current version is v0.4 (was mislabeled v0.3)
*(Fork reconciliation: was RIE `decisions.md` D-033, origin repo psychflow-suite. Original wording preserved, per the amendment rule in D-038. This is the correction entry D-011's amendment note now points to.)*
D-011's closing line ("Current version: v0.3") went stale when the taxonomy was
bumped to v0.4 (`taxonomy.v0-4.json`; case-model tests assert "0.4"). The stale
label was the demonstrated cause of a downstream error in a work prompt (a
"bump from 0.3" instruction for the Case Data Model, which was actually at 0.2.0).
Logged as an explicit correction rather than a silent edit so the episode is on
record. Current taxonomy version: **v0.4**.
**Status:** Accepted · 2026-07-18 (orig.) · merged 2026-07-23 · Proposed: Claude · Ratified: JD

## D-058 · [suite] A decision logged in a product repo must be merged to the trunk before session end
Any session that logs a decision inside a product repo (RIE/psychflow-suite,
PsychReport, or any future product repo) MUST, before ending, merge that entry
into the canonical `suite/decisions.md` trunk and re-sync all copies (D-029).
**Rationale — this is structural, not a discipline failure:** a Claude Code
session working inside a product repo can only see that repo's files, so it logs
locally because the trunk is not in view. That has now forked the decision log
**twice** — D-042–045 (first RIE fork) and D-049–057 (this one) — and will recur
every time without a mechanical guardrail. The fix is a checklist step, not an
exhortation: it goes in the end-of-session checklist beside the working-directory
check, and it is the reason both those merges were needed.
**Status:** Accepted · 2026-07-23 · Proposed: Claude · Ratified: JD


