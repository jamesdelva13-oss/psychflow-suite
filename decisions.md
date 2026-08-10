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
> **Amendment note (2026-07-23, per D-038):** Strike "customers are never asked to think in 'products.'" Integration is a UX property *within a segment*; **separable naming, pricing, and sale are permitted**, and **QA's independence from PsychReport is a selling point** (resolves the tension with D-012 / D-035). See D-062 (sequencing) and D-063 (bundling). Original text preserved above.

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
> **Amendment note (2026-07-23, per D-038):** Split into **buyer / tenancy / data architecture**. **Segment map:** district-employed psych; special-ed department; private-practice / IEE evaluator (**defensibility tier**, **mandated tier for IEEs**); independent contractor. The **runtime is now resolved hosted** (D-060). Single-psychologist tenancy stays the MVP *schema* posture; the *buyer* picture is broader than one segment. Original text preserved above.

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
> **Amendment note (2026-07-23, per D-038):** The original rationale is **corrected, not merely relaxed**. Adverse-impact language in a report **does not itself constitute predetermination**; predetermination is the **process violation** defined in D-082 (deciding eligibility/SDI without the team or without data). **Permitted:** criteria-referenced findings and adverse impact **grounded in evaluation data and framed for the team**, where district templates require them — mechanism is `TEAM_RESERVED` + `eligibility_relevant_findings`, with **no mandated boilerplate**. The **schema exclusion becomes a district-template setting**, not a hard structural wall. SDI per D-082. Original text preserved above.
> **Amendment note (2026-07-27, per D-038; Session A reconciliation):** Superseded in operative form by the **artifact-profile** model (operational-spec-v1 §7, Rules 7.1–7.3, and §16). The flat MVP exclusion of adverse-impact/SDI language is replaced by **artifact-profile + configured-workflow permissions**: in SCHOOL_PSYCHOEDUCATIONAL, editable adverse-impact/SDI language framed for team consideration is available only through an explicit district/user workflow; eligibility verdicts remain team-reserved. **Predetermination is a process violation, not word-presence** (D-082). Original text and the 2026-07-23 note preserved above.

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
> **Amendment note (2026-07-23, per D-038): CLOSED.** No aliased mode is being built, so no de-identification mapping / storage-recovery layer exists (superseded by the identified-by-design ruling, D-061). If a solo tier ever ships, **reopen narrowly** — recorded leading pattern is **zero-knowledge sync + keyfile export**. Original text preserved above.

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
> **Amendment note (2026-07-23, per D-038): CLOSED by D-084** — teacher-facing identification is **first name + last initial**, carried in the URL fragment so it never transits or logs server-side. Original text preserved above.

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
> **Amendment note (2026-07-23, per D-038): CLOSED.** The advisory-vs-blocking PII-scrub question is **moot under the identified-by-design ruling (D-061)** — the suite no longer treats student identity as something to scrub. Original text preserved above.

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
> **Amendment note (2026-07-27, per D-038; Session A reconciliation — C2):** The **QA-classifier rationale is struck from PsychReport's side** of this contract. "Why five, not ten … QA's mode-confidence scores" is a product-local justification and is **not** the basis on which PsychReport evaluates its own five-mode taxonomy; PsychReport evaluates the taxonomy on its own drafting needs (operational-spec-v1 Rule 2.0). **However — the mode vocabulary in `reasoning-contracts` is shared with QA, so any change to the mode taxonomy itself remains a `[suite]`-level ruling** and may not be made product-locally. Also retired: the universal "no blended modes; use two blocks" **rendering** rule (a mode sets the claim ceiling, not a required visible block per claim type); SOURCE_FAITHFUL content may not be silently promoted into interpretation. Original text preserved above.
> **Amendment note (2026-07-27, per D-038; Session B — Gate 4 confirmation):** Session B (Gate 4) confirmed the mode taxonomy is physically shared — both PsychReport and the Sped QA engine read the same MODE_CONTRACTS definitions. The C2 ruling (mode-taxonomy changes are suite-level; rationale is product-local) stands on verified ground. *(Verification detail: `SectionMode` + `MODE_CONTRACTS` have a single canonical definition in `reasoning-contracts` with no divergent copy anywhere; QA currently mirrors the shared vocabulary locally pending workspace wiring (D-046), so "shared" today = single-source canonicity + architectural contract, not yet a live import.)* Original text preserved above.

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
> **Amendment note (2026-07-23, per D-038):** Corrected together with D-005 (see there). The adverse-impact/SDI schema exclusion is **no longer an absolute structural wall** — it becomes a **district-template setting**; criteria-referenced adverse-impact findings grounded in evaluation data and framed for the team (`TEAM_RESERVED` + `eligibility_relevant_findings`) are permitted where a district template requires them. Predetermination is a process violation (D-082), not a property of report words. The QA-side inverted rule (evidence-sufficiency, not "statement missing") is unchanged. Original text preserved above.
> **Amendment note (2026-07-27, per D-038; Session A reconciliation):** The structural schema exclusion ("no `adverse_impact`/`need_for_sdi` section … enforced by schema") is superseded by the **artifact-profile** model (operational-spec-v1 §7, Rules 7.1–7.2, and §16). PsychReport may draft criteria-referenced findings and, when the artifact profile and an explicit district/user workflow enable it, **editable adverse-impact or SDI-related language framed for team consideration**; it does not autonomously issue a team eligibility verdict. Private/community profiles may authorize diagnostic conclusions under their own rules. `RC §6` and `PB §2/§12` are flagged for synchronization (operational-spec-v1 §17 — build item, not this session). Original text and the 2026-07-23 note preserved above.

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
> **Amendment note (2026-08-07, per D-038; CF-4 correction — QA's legal imports):** The diagram's line `qa-engine → reasoning-contracts ONLY` is amended to **`qa-engine → reasoning-contracts, document-extraction (never case-model, never psychreport)`**. Per the D-046 consolidation, QA also imports `@suite/document-extraction` (verified in the QA repo's package.json and imports; QA imports case-model nowhere). The law's purpose — QA independence from the case model (D-035) — is unchanged; only its letter was outdated. Evidence type-shapes are consumed via reasoning-contracts per **D-134**, which adds no new import. See docs/VS0-IMPLEMENTATION-MAP.md, CF-4. Original text preserved above.

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

## D-046 · [suite] Shared-layer consolidation [COMPLETED 2026-08-06]
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
**Status:** Accepted · Logged 2026-07-23 · Proposed: Claude · Ratified: JD (D-046 completion instruction of 2026-08-06)
> **Amendment note (2026-08-06, per D-038; COMPLETION RECORD):** The leading option is implemented: **psychflow-suite is the single home for all `@suite/*` packages.** What landed: **(1)** `@suite/reasoning-contracts` (already rescued into this repo 2026-08-x) is canonical here; version 0.2.0 adds the parse-trust vocabulary (`ParserConfidence`), formerly defined in the QA repo's `findings.ts`. **(2)** New package `@suite/document-extraction` — the Sped QA parser / IR / entity-extraction stack relocated wholesale from the QA repo (per amendment 1 below), with its tests and docx fixtures; instrument libraries are injected by consumers, and a frozen copy of the QA seed serves as a test fixture only. **(3)** The QA repo's local `RuleAuthority` mirror (D-041 debt) is deleted; QA now imports `@suite/reasoning-contracts` and `@suite/document-extraction` as **`file:` dependencies** — the QA repo stays its own repo consuming `@suite/*` as dependencies. The "fold QA into the monorepo" question is thereby resolved *for now* as consume-as-dependency; folding in later would be its own decision. **(4)** `@suite/case-model` 0.4.0 adds the canonical organization/profile/role/assignment model (D-131) — additive; Case/Source/Evidence schemas' identity and semantics unchanged — and Source version/supersession semantics (directive §12.2): finalized Sources are immutable, corrections are new Sources chained by `supersedesSourceId`, "superseded" is derived, with migrations 0006 (contributor tables + RLS) and 0007 (supersession columns + DB immutability triggers), both additive; migrations are **authored, not yet applied** to the dev instance, and the RLS integration suite must gain per-table checks for the three new tables when applied. RIE behavior unchanged; all suites green both repos. **Open remainder noted, not resolved here:** sharing the *evidence-object model* with Sped QA (amendment 2 below) collides with the standing dependency law "qa-engine never imports case-model" — reconciling those is a separate ruling. Original text preserved below.
> **Amendment note (2026-07-23, per D-038; stays OPEN):** Two consolidation consequences added. **(1)** The Sped QA parser / IR / entity-extraction stack must become a **shared package** — PsychReport reuses it for source-document ingestion (D-077) and cannot import from the Sped QA repo. **(2)** The **evidence-object model should be shared** across Sped QA and PsychReport rather than duplicated, alongside the parser stack. **Caveat:** QA judges *actual prose*, so shared extraction **supports** its checks but **never replaces reading the source sentence**. Still OPEN. Original text preserved above.
> **Amendment note (2026-07-27, per D-038; Session B — Gate 5 confirmation):** Session B (Gate 5) confirmed the starting state — `reasoning-contracts` lives in the QA-Engine repo (no workspaces field); the working `case-model` + npm workspaces live in psychflow-suite, which does NOT contain `reasoning-contracts`; the QA-repo `case-model` is missing its taxonomy files; and PsychReport cannot yet cleanly import the shared `reasoning-contracts` (the app is unwired vanilla JS with zero imports). Consolidation remains the prerequisite as logged; no change to disposition. Original text preserved above.
> **Amendment note (2026-08-07, per D-038; CF-3 factual correction):** The completion record's migration-state clause is stale. Verified against the live dev instance (VS-0 session, 2026-08-06): migrations 0006 and 0007 are **applied**, not merely authored, and the per-table RLS checks the record called for exist — the committed 32-check RLS integration suite covers the three D-131 contributor tables and is green. The evidence-object-model remainder noted in the completion record is now resolved by **D-134**. See docs/VS0-IMPLEMENTATION-MAP.md, CF-3. Original text preserved above.

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
> **Amendment note (2026-08-06, per D-038; location caveat discharged):** D-046 resolved; the relocation contemplated above is complete. The psychflow-suite `packages/reasoning-contracts` is the single canonical copy (v0.2.0), and the QA repo now consumes it as a dependency rather than holding its own. The evidence-tier vocabulary, `satisfiesDomainAddressed()`, and the no-inference-upgrade rule all live there unchanged. Original text preserved above.

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
> **Amendment note (2026-07-27, per D-038; Session A reconciliation — C3):** **Usage clarified (not relocated).** Evidence tiers govern **intake, coverage, and collection logic**, not report prose: a direct "no concern" means the source did not report concern in the screened area (not broad evidence the condition is absent); an unanswered item or insufficient opportunity remains missing information and may trigger collection elsewhere; tiers never upgrade by inference; the ladder is not injected into PsychReport drafting unless a specific output operation requires it (operational-spec-v1 Rule 3.8). **The vocabulary's shared-package home is unchanged by this note** — it remains in the Sped-QA-Engine copy of `reasoning-contracts` per the original text and the D-046 fork. **If that home changes, that is a separate ruling; it is not relocated by implication this session.** Original text preserved above.

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
> **Amendment note (2026-07-25, per D-038):** Partially reopened by **D-089**. Affirmative per-domain capture is **no longer scoped to Cognitive and Adaptive only** — every domain must capture can-do / area-of-difficulty, so the instrument must supply affirmative data by design (via a per-domain checklist). The tier-ladder interaction (D-049) is deferred to v0.7. Original scoping text preserved above.

> **Amendment note (2026-08-06, per D-038):** Reconciled by **D-132** — refined, not abandoned. The middle position ratified: baseline affirmative capture extends to **all domains** (capped, checkbox-only); deeper clinical capture remains conditional on selected pathways. The completion-rate concern that motivated the original scoping is honored by the cap and by confining free text to one optional field on the concern path. See D-132.

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

## D-059 · [suite] Rename ratified — "Sped QA Engine"
The QA Engine is formally **Sped QA Engine** (the GitHub repo is already renamed
to `Sped-QA-Engine`). The old name "PsychReport QA Engine" / "QA Engine" is
retired from all new documents. Existing ratified entries keep their original
wording; only new material uses the new name.
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD

## D-060 · [suite] Runtime — one hosted platform, three modules
All three products are **hosted** — one platform, three modules, shared
auth/ops. Identity handling is a **deployment-context configuration, not an
architectural fork**. The **district tier ships first**. The
community/private-practice tier is **deferred pending HIPAA/BAA analysis**:
private clinicians are likely HIPAA-covered, so hosting their data requires a
BAA — an attorney item. This resolves the long-open "runtime model" question:
hosted, not client-only.
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD

## D-061 · [suite] Privacy strategy — identified-by-design, controls not de-identification
**De-identification is abandoned as the suite's privacy strategy.** It is
incompatible with the nature of the work: teachers must know the student,
reports name the student, and case files are student records. Privacy is
addressed instead through a control set, not through pretending the data is
anonymous.

**Legal / contractual controls.** DPAs with each district (the FERPA-context
equivalent of a BAA — note BAAs apply only if a HIPAA-covered community tier is
ever built, per D-060); **zero-retention terms with the model provider**;
subprocessor disclosure; written security overview for IT review; zero-retention
terms recorded contractually.

**Built controls.** **Tenant isolation enforced at the database layer** (not
application-query filtering); **role-based access** (psych caseload vs. director
portfolio, never cross-district); **tamper-evident audit logging**; **encryption
in transit and at rest**; **deliberate retention with deletion-on-request and
litigation-hold discipline**. **Data minimization at the schema level is
retained** — it is cheap and credited by assessors.

**Dual-purpose observation (record it):** role separation and audit logging are
**already required** by the escalation and finding-resolution workflows (D-072) —
they are product features that also satisfy compliance, not compliance overhead.

**Third-party verification, budgeted pre-pilot.** **Annual third-party
penetration testing** covering the web app, API surface, authentication, tenant
isolation, and the inference pipeline (including prompt-injection and
data-exfiltration scenarios), plus a **security assessment against a recognized
framework**. This is a **five-figure cost required before first district
go-live, not after.** **SOC 2 deferred** until a district requests it. Rationale:
competitor credibility derives from **external verification**, not from merely
possessing the controls.

**Consequences (same entry):** all **"de-identified by design" marketing
language must be retired**; an **incident-response plan** and **cyber liability
insurance** are required before first district go-live.
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD
> *(Folds in the compliance control set and third-party-verification items from
> the competitive-architecture review — logged here as detail rather than as
> parallel entries, to avoid the duplication this week has been undoing.)*

## D-062 · [suite] Sequencing — district land-and-expand wedge
Build/sell order is **RIE → PsychReport → Sped QA Engine**, framed as a
**district land-and-expand wedge**, NOT as solo-market distribution: RIE deploys
into the pilot district as low-cost entry; PsychReport follows; QA is the
director-level sale. **Solo/individual distribution is deferred until district
revenue exists.**
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD

## D-063 · [suite] Bundling — separate and integrated
Products sell **separately and as an integrated district package**. Constraint:
the claim is **"stronger paired," never "QA requires PsychReport."** QA's
independent value on reports written *without* PsychReport is load-bearing per
D-035 and must not be undercut by bundling language.
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD

## D-064 · [suite] Chat meta-rule — extends D-058 to chats
D-058 is extended: **decisions ratified in a chat session must be entered into
the canonical trunk before the chat closes**, exactly as for product repos. The
same structural reason applies — a decision made where the trunk is not in view
forks the record unless a mechanical step captures it.
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD

## D-065 · [suite] Attorney engagement rescoped — five items
Attorney engagement is rescoped to five items: (1) authority-table review;
(2) pre-signature findings structure (how QA findings **strengthen rather than
damage** the district's position); (3) SDI/predetermination phrasing; (4)
conflict analysis for selling into districts where JD contracts through a
staffing agency; (5) HIPAA/BAA posture for a future community-clinician tier.
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD

## D-066 · [suite] Pin discipline extended to marketing claims
The citation-pin discipline extends to marketing: **no cost/ROI figure ships
without a current citation.** The older survey figures are flagged as stale; the
**$30k/hearing figure is a current local report, usable as such**.
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD

## D-067 · [SpedQA] Positioning — incumbents are distribution, not competition
Incumbent systems (EdPlan, ECATS, Frontline, PowerSchool) are
documentation/workflow systems, **not QA** — they verify *existence*, not
*content*. They are **distribution, not competition**: their output is the
primary ingestion format, and the plausible endgame is
**partnership/acquisition as their content layer**. Explicitly **out of scope**:
rebuilding timeline tracking, live service-log reconciliation, SIS/LMS/email
integrations.
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD

## D-068 · [SpedQA] Scope — reasoning-layer QA across the full document set
Sped QA Engine does **reasoning-layer QA across the full special-education
document set** (evaluation → eligibility → IEP → PWN → FBA/BIP → MDR →
transition → progress reports), **not compliance-metric tracking**.
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD

## D-069 · [SpedQA] Four-layer architecture
Ratified: **L1 Document QA** (existing rubric work); **L2 Cross-Document
Consistency** (referral ↔ evaluation ↔ eligibility ↔ IEP ↔ PWN ↔ BIP
contradiction detection); **L3 Case Timeline Intelligence** (chronology reasoned
from documents only; **backward-chained milestone achievability** — "is day 60
still reachable," not "is it late" — with **tolling conditions encoded**, per
D-037); **L4 District Benchmarking** (**descriptive aggregates only, never
predictive**).
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD

## D-070 · [SpedQA] Rejected — Surveillance Engine
A live-feed monitoring engine is **rejected**: it requires per-district
SIS/behavior/attendance/email integration — a different company outside the
moat. Recorded alternative: **the unit of analysis is the case file**, not the
student and not the single document.
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD

## D-071 · [SpedQA] Rejected — Outcome Learning Engine (full rationale preserved)
An outcome-learning engine is **rejected**; the full rationale is preserved so it
is not reinvented: **(a)** student-level referral prediction from
discipline/referral data **encodes documented racial disproportionality** and
conflicts with §300.173 / SC 43-243.1 **overidentification obligations**;
**(b)** the "documentation patterns → corrective action" reformulation is
**worse**, because corrective action tracks **advocacy access** (which families
push back on), not document quality — the model would learn to scrutinize cases
with well-resourced families and pass thin reports for families who never
complain; **(c)** due process is a **rare event with too few labels**, and
successful intervention **destroys its own training signal**. **L4's descriptive
benchmarking achieves the organizational-learning goal with no learning target.**
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD

## D-072 · [SpedQA] Mandatory finding resolution — no unresolved alerts
**No unresolved alerts.** Every finding enters a **closure workflow** (reviewed /
not applicable with rationale / information requested / action taken) **before
signature**; an open finding at signature is the dangerous artifact. Escalation
is **role-shaped**: psych-level action list, director-level portfolio view;
**acknowledgment paths required** so the record shows response, not just
detection.
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD

## D-073 · [SpedQA] Actionable findings — remediation in the schema
Every check carries **finding + pinned authority + required action** as a
**schema field, not render-time prose**. Constraint: remediation is
**procedural, not clinical** ("obtain cross-setting data before finalizing,"
never "administer instrument X"). Origin note (JD): *"knowing what's wrong tells
you how to fix it, and if it doesn't it should."*
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD

## D-074 · [SpedQA] Schema pass queued (do not implement this session)
Queued, not to be implemented now: rubric checks gain a **`scope` field**
(document / cross-document / case-timeline); findings gain **document-ID +
locator**; the **remediation field** per D-073.
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD

## D-075 · [SpedQA] Sequencing within QA — depth-first
**Depth-first:** attorney review and **one paid pilot on the evaluation-report
rubric before any breadth**. The next increment after the wedge is
**cross-document consistency checks** (cheaper than new full rubrics —
extraction, not legal grounding). The **canonical demo** is a de-identified
packet that passed every EdPlan check, run through the engine. **Pilot metric:
IEE funding requests** (attributable, measurable within a year), **not "hearings
avoided."**
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD

## D-076 · [PsychReport] Full-report scope supersedes results-only generation
**Full-report scope supersedes results-only generation.** Spec committed at
`~/Documents/psychreport/docs/PsychReport — Full-Report Scope Spec v1.0.html`.
*(Path note: the ratifying prompt cited `psychreport-full-report-spec-v1.html`;
the committed file is the "Full-Report Scope Spec v1.0.html" above — same
artifact, corrected here for precision.)* Supersedes the earlier unexecuted
results-only ratification session.
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD

## D-077 · [PsychReport] Ingestion pipeline reuses the QA parser/IR/entity stack
The ingestion pipeline **reuses the Sped QA parser / IR / entity-extraction
stack**, redirected to **source documents**, with the seven document classes.
**Consequence:** the parser stack **must become a shared package** — PsychReport
cannot import from the Sped QA repo — which **feeds D-046** (noted there; D-046
stays OPEN).
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD

## D-078 · [PsychReport] The four ledger rules
Four ledger rules: **(1) no orphan prose; (2) immutable reporter attribution;
(3) conflicts preserved, not resolved; (4) gap report precedes drafting.**
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD

## D-079 · [PsychReport] Per-section reasoning contracts
**Per-section reasoning contracts extending `reasoning-contracts`**, with the
**section-to-mode bindings from the spec**.
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD

## D-080 · [PsychReport] referral_package v0.1 — the RIE→PsychReport interface
**`referral_package v0.1`** is the RIE → PsychReport interface: **capture-mode
agnostic**; referral questions carried as the **Summary checklist**.
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD

## D-081 · [PsychReport] Handwritten observation notes are NOT deferred
**Multimodal transcription of photographed handwritten observation notes enters
at M1/M2**, with a **mandatory clinician verification step** (transcription
shown beside the image; confirmed/corrected **before any claim enters the
ledger**). Rationale: it is the **highest-frequency self-authored input**, and it
is an **image-in-existing-call-pattern, not an OCR subsystem**. *(Also recorded
as a dated amendment block in the spec HTML itself.)*
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD

## D-082 · [PsychReport] SDI-need language — user-initiated, editable, default off
SDI-need language is **user-initiated after report review, editable, default
off; provisional pending counsel**. Clarification (JD): **predetermination is a
process violation** — deciding eligibility/SDI without the team or without data —
**not a property of words in a report**.
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD

## D-083 · [PsychReport] M1–M5 build order — OPEN
The M1–M5 build order is **OPEN**, pending re-sequencing under the case-file
architecture (D-070) and the RIE-first wedge (D-062).
**Status:** OPEN · Logged 2026-07-23 · Proposed: JD · Ratified: —

## D-084 · [RIE] Teacher-facing identification — first name + last initial (closes D-022)
Teacher-facing identification is **first name + last initial**. Implementation
note: **carry it in the URL fragment so it never transits or logs server-side.**
This **closes D-022** (previously OPEN).
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD

## D-085 · [suite] Model-router / provider abstraction
All LLM calls go through an **internal inference layer**, not direct vendor SDK
calls scattered through the codebase. **The IP is the case model, evidence
structures, reasoning contracts, rubric, and remediation logic — the model is a
component.** Practical drivers: task-appropriate **cost tiering**, districts that
**mandate a specific vendor**, and **DPA/zero-retention coverage that varies by
provider**. **Honest scope limit (record it):** this abstracts the **call
boundary, not output equivalence** — the v2 exemplar-first prompts are tuned to a
specific model's voice, so any provider swap **requires revalidation**, and **one
primary model is designated at a time**. **Do not promise model-agnostic output
quality.**
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD

## D-086 · [suite] Rejected — confidential computing / secure enclaves
**Rejected:** confidential computing / secure enclaves (Intel SGX, AWS Nitro,
Azure Confidential Computing). Rationale (so it isn't reinvented): **unverified
as a competitor practice, materially more expensive, and not something district
IT reviewers ask for.** Tenant isolation plus a pen-test report answers the
questions actually asked. **Factual correction recorded:** frontier model weights
are **not licensed for self-hosting** — the mechanism is enterprise/cloud-hosted
endpoints (Bedrock, Vertex, Azure OpenAI, or direct API with ZDR terms). **No
budget line should assume self-hosted models.**
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD

## D-087 · [suite] Go-to-market — frictionless DPA
A **pre-filled DPA matching SC and NC standard frameworks** is offered **at first
contact, not produced during procurement.** Paired deliverable: a **written
security overview for IT review**. Competitive lesson: **legibility to a
compliance reviewer is the differentiator, not the sophistication of the
controls.**
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD

## D-088 · [suite] Assistant chat at every product level
**Chat is included at every product level**, scoped to the **active case**, bound
by **each product's contracts and rubric authority**, **audit-logged**, **never a
resolution path for findings** (findings close only through the D-072 workflow),
and with **refusal boundaries defined per product**.
**Status:** Accepted · 2026-07-23 · Proposed: JD · Ratified: JD

## D-089 · [RIE] Required per-domain functional capture; concern-flagging changes depth, not visibility
Every domain block must capture what the student can do and where they struggle,
regardless of whether a concern is flagged. The current branching design — which
hides downstream questions when no concern is reported — is **rejected**: it
produces domains that read as *absence of information* rather than as a positive
picture of functioning, which fails the requirement (confirmed in EdPlan district
practice) that each domain show it was actually **addressed**, not merely that one
informant had nothing to add.

**Redesign:** conditional-hide becomes **conditional-depth**. Each domain always
asks a baseline can-do / area-of-difficulty set; a flagged concern **adds
follow-up** rather than gating the baseline. A **per-domain checklist instrument**
is the preferred vehicle — faster for the teacher than prose, cleaner as
structured data for the referral/background section, and equally usable in
async-form and live-capture modes.

This **strengthens and partially reopens Workstream A (v0.6)**: affirmative
capture (T2/T3) was scoped as *reachable when the instrument supplies affirmative
data* (D-050); it is now **required per domain**, so the instrument must supply
that affirmative data **by design**. Interaction with the tier ladder (D-049) to
be specified in v0.7.
**Status:** Accepted · 2026-07-25 · Proposed: JD (EdPlan orientation training) · Ratified: JD

> **Amendment note (2026-07-29, per D-038):** Amended by **D-119**. The
> universal-consideration and conditional-depth requirements remain in force;
> the **paired can-do/difficulty checklist mechanism is superseded** — response
> formats are selected per the information being elicited, always-shown items
> carry an explicit observation escape where non-observation is coherent, and
> grade/developmental routing excludes categorically irrelevant content. See
> D-119. Original text preserved above.

> **Amendment note (2026-08-06, per D-038):** Further amended by **D-132** —
> an amendment, not a supersession. The objective of universal domain
> consideration is retained; the implementation mechanism is amended from
> comprehensive per-domain capture to **concise baseline capture with
> conditional depth**: an affirmative baseline checklist in every domain
> (initial cap: five items, subject to clinical bank review and pilot
> validation), derived from the district referral form's per-domain fields,
> with difficulty capture conditional on a reported concern. The lesson is
> not "collect less" — it is "collect each thing once, at the right depth,
> for the right purpose." See D-132. Original text preserved above.

## D-090 · [PsychReport] Clarification (non-change): evaluation-planning coverage is not a report concern
PsychReport reports **assessments administered** — what a given instrument found.
Documentation of which domains were **considered but not evaluated** during
planning is a **referral/eligibility-planning artifact** (RIE and the eligibility
process), **not a results section**. No "the team considered [domain]" or
coverage-attestation prose is added to PsychReport. Existing conventions stand:
only scales with provided scores appear; no domain is manufactured to demonstrate
consideration. *(Corrects an earlier proposal in conversation to render
team-considered framing inside report sections — withdrawn.)*
**Status:** Accepted · 2026-07-25 · Proposed: JD · Ratified: JD

## D-091 · [SpedQA] Cross-document check: all suspected areas addressed in evaluation planning
A **mandated cross-document check** verifies that every **area of suspected
disability** — as evidenced in the referral/RIE intake, parent/teacher concerns,
and prior data — was **addressed in the evaluation**. This is a **case-file
(Layer 2/3) check** reconciling referral-stage evidence against the evaluation,
not a single-document scan, and **not** a check that pushes PsychReport to pad
domains (per D-090). **Primary pin: 34 CFR §300.304(c)(4)** — *the child is
assessed in all areas related to the suspected disability* — with **SEED/NC
equivalents to be located and pinned** per the mandated-check discipline (**no
citation, no mandated**). Maps to the Tier-2 due-process risk *"failure to
evaluate in all areas of suspected disability."* This is a class of finding
**EdPlan structurally cannot produce**, since it never reads content.
**Status:** Accepted · 2026-07-25 · Proposed: JD · Ratified: JD

## D-092 · [PsychReport] DESCRIPTIVE_RESULTS governing principle — "one level more meaningful than the table"
Replace "write one level coarser than the table / do not restate the numbers"
with **"one level more meaningful than the table."** Rationale: the original rule
conflated three content types — **construct exposition, result description, and
interpretation** — into one anti-redundancy prohibition, and in suppressing
score-transcription it also suppressed **required construct exposition**. The
corrected principle keeps the legitimate rule (prose must not merely transcribe
the table) while **permitting exposition and pattern-description the table cannot
carry.** Origin: Stage-1 pilot + independent cross-check, 2026-07-25. *Build item.*
**Status:** Accepted · 2026-07-25 · Proposed: JD · Ratified: JD
> **Amendment note (2026-07-27, per D-038; Session A reconciliation):** Affirmed and extended. Current effective rule: operational-spec-v1 Rules 6.3 and 8.3 — prose "must add explanatory value and preserve clinically meaningful detail; use the level of granularity needed to communicate the finding." The **finer-grain escape clause is now explicit**: do not erase a meaningful within-measure difference (subtest, scale, rater, or error-pattern) for the sake of coarser narration. "One level coarser" is superseded (consolidation finding F1). Prompt distillation must retain the finer-grain permission (P-02). Original text preserved above.

## D-093 · [PsychReport] Construct exposition is app-supplied library content, not model-generated
Descriptions of **what an instrument and each index/subtest measure** are static
per instrument and must come from a **versioned, citable instrument-description
library, not the model.** Rationale: (1) a subtly wrong statement about what a
test measures is a **due-process liability**, and authored content is reviewable
in a way per-generation output is not; (2) **consistency across reports**; (3) it
**resolves the contradiction in D-094**. Refinement (from side-by-side
comparison, 2026-07-25): the library holds **two keyed levels** —
**instrument-level** ("what the WISC-V is") and **index/subtest-level** ("what the
WMI measures") — so the app assembles **definition → student-specific performance
prose → bounded interpretation.** Only the definition is retrieved; the
performance and interpretation are generated under the mode contract. Each library
entry carries a **source field** (test manual or JD's standard phrasing) so it is
defensible the way a pinned citation is — **every entry is effectively a small
ratified decision** about how these reports characterize that construct. Net-new
work; JD-authored. *Build item.*
**Status:** Accepted · 2026-07-25 · Proposed: JD · Ratified: JD
> **Amendment note (2026-07-27, per D-038; Session A reconciliation):** Softened from "must come from a library, not the model" to **optional-reference-plus-live-exposition**. Current effective rule: operational-spec-v1 Rules 8.1–8.2 and 1.1 — standard generic instrument/construct exposition **may be generated from professional model knowledge, supplied instrument metadata, and optional curated reference content**; a curated reference is **not a prerequisite** for supporting an instrument. Student-specific claims remain case-grounded; FIDELITY is narrowed to student-specific case claims (see the D-094 note). Optional reference still improves consistency and defensibility. Original text preserved above. (Pairs with D-094.)

## D-094 · [PsychReport] The FIDELITY/exposition contradiction (rationale for D-093, logged separately so it isn't lost)
FIDELITY instructs the model to **use only supplied case data and invent
nothing**; construct descriptions are **not in the case data**; so under the
current architecture describing what an index measures is **either a fidelity
violation or forces the model to improvise clinical content and mislabel it as
case-derived.** Making construct exposition **app-supplied library content**
dissolves the contradiction — referenced library text is **not "invented,"**
exactly as a pinned regulation is not invented in QA. Origin: cross-check
analysis, 2026-07-25.
**Status:** Accepted · 2026-07-25 · Proposed: JD · Ratified: JD
> **Amendment note (2026-07-27, per D-038; Session A reconciliation):** The FIDELITY/exposition contradiction is resolved by **narrowing FIDELITY to student-specific factual and inferential claims**, not by mandating a library. Current effective rule: operational-spec-v1 Rules 1.1 and 5.1 — generic construct exposition, connective prose, and professional recommendation knowledge may be used when authorized and must not be presented as facts about the student; the model may generate exposition when no reference exists, and the evaluator reviews all prose in the ordinary workflow. Original text preserved above. (Pairs with D-093.)

## D-095 · [PsychReport] Score-in-prose rule
A score may be named in narrative **only when the number itself is evidence a
reader must inspect** (e.g., a material within-domain split such as Word Reading
68 vs. Pseudoword Decoding 88, where **the gap is the finding**); otherwise **the
table carries the number and the prose carries the pattern.** Narrower than a
general "selective anchoring" allowance; bound by standing conventions (**no
age/grade equivalents; tables hold scores**). **Confirm against the ratified
convention set before implementation.** Origin: JD convention + cross-check,
2026-07-25. *Build item.*
**Status:** Accepted · 2026-07-25 · Proposed: JD · Ratified: JD
> **Amendment note (2026-07-27, per D-038; Session A reconciliation):** **Retired as a standalone rule and merged into the score-in-prose principle** (operational-spec-v1 Rule 8.9, with PB §6 P1). Effective rule: tables carry comprehensive numeric detail; name an exact score in prose when it materially clarifies a finding, discrepancy, validity issue, referral question, or the selected report style, or when no table supplies the result. The separate "selective-anchoring exception list" is **not** maintained (it drifts). Standing conventions (no age/grade equivalents; tables hold scores) are unchanged. Original text preserved above.

## D-096 · [PsychReport] Component-level validity in the data model
Validity must be representable at the **component (subtest) level, not only the
source level**: when an **invalid subtest feeds a composite**, the composite may
be compromised, but a source-level-only gate **cannot see this** and may report
the composite as valid while excluding one of its inputs. A component's
invalidity **must be able to flag or qualify any composite it feeds.** Data-model
defect, generalizes beyond the pilot case. *Build item.* **Flag: likely touches
`reasoning-contracts` (shared) — D-046 interaction.**
**Status:** Accepted · 2026-07-25 · Proposed: JD · Ratified: JD

## D-097 · [PsychReport] effectiveCeiling corrections
(1) **Unknown/absent validity must fail safe to the conservative ceiling
(describe-only)**, mirroring existing unknown-scope behavior; the current
fall-through to `FULL_INTERPRETATION` is **backwards.** (2) `COMPARE_WITHIN_SOURCE`
is **defined but never returned** by the resolver — **restore its return path.**
Add guard tests for both. *Build item.* **Flag: `reasoning-contracts` (shared) —
D-046 interaction.**
**Status:** Accepted · 2026-07-25 · Proposed: JD · Ratified: JD
> **Amendment note (2026-07-27, per D-038; Session A reconciliation — OPEN GATE, C1):** **Disposition deferred, not ratified.** The two corrections (fail-safe on unknown/absent validity; restore the `COMPARE_WITHIN_SOURCE` return path) and the related retirement of the duplicate app resolver (operational-spec-v1 Rule 3.3) are **pending canonical-code verification (Session B)**. Per P-03, no decision about resolver behavior is ratified from a secondary summary; the canonical file must be read and representative missing/unknown/invalid/modified/restricted inputs executed against it, documenting every return path — including whether `COMPARE_WITHIN_SOURCE` can be returned. **Retire the duplicate resolver only if confirmed.** Recorded as Session B gates G1/G2 below. No engineering result is presumed this session. Original text preserved above.
> **Retirement note (2026-07-27, per D-038; Session B ratification):** Retired 2026-07-26 following Session B canonical-code verification. Claim A ("unknown validity falls through to FULL_INTERPRETATION") is refuted: `validityStatus` is required by the type and the guard clause returns a conservative ceiling — the code already fails safe, which is the behavior this decision sought to add. Claim B ("COMPARE_WITHIN_SOURCE defined but never returned") is refuted with nuance: the symbol IS present in two permitted-operation lists; it is a permitted operation, not a resolver return value, so "never returned by the resolver" is technically true but immaterial — it was never intended as a resolver return. Both claims originated from an external code reading not verified against canonical source. Had D-097 been implemented, it would have modified a resolver that was already correct, risking introduction of the bug it claimed to fix. This is the second worked example (after P-06/D-117) of the verify-before-ratify discipline (P-03/D-112) catching an error before it hardened. Original text preserved above.

## D-098 · [PsychReport] Exemplar de-hazarding
The reading exemplar in `VOICE` and `DESCRIPTIVE_RESULTS` depicts the
**clinically-typical pattern** (decoding unfamiliar words harder than
familiar-word reading); when a real case is the **reverse**, a primed model may
**reproduce the typical pattern against the actual scores.** Fix: **neutral
exemplars, or case-matched exemplar selection**, so no exemplar overrides case
data. Origin: pilot stress-test, 2026-07-25. *Build item.*
**Status:** Accepted · 2026-07-25 · Proposed: JD · Ratified: JD
> **Amendment note (2026-07-27, per D-038; Session A reconciliation):** Relocated to the **prompt-authoring standard plus regression tests**, not gated on a demonstrated failure. Current effective rule: operational-spec-v1 Rule 2.3a — use neutral, structurally focused, or deliberately varied exemplars that teach the permitted operation rather than a common clinical pattern; exemplar content must never override case data; test prompts with reversed/atypical patterns before release. Remains **anticipatory** (a cheap prophylactic fix). The reversed-clinical-pattern regression test is recorded as Session B gate G7 below. Original text preserved above.

## D-099 · [PsychReport] Stage-1 wired the prompts but not the payload
The live `callMode` invocation passes **only `{data}`**, bypassing the
sources/validity/scope/ceiling blocks `buildPrompt` is built to apply — **the
validity architecture exists and is switched off in production.** Wiring the full
payload is a **prerequisite for D-096/D-097 to have any effect.** **Sequence
before merging Stage-1 to main.** *Build item.*
**Status:** Accepted · 2026-07-25 · Proposed: JD · Ratified: JD
> **Amendment note (2026-07-27, per D-038; Session B — Gate 3):** See **D-118**. **Verified correction to the proposed framing:** D-099's "payload not wired" framing is CONFIRMED CORRECT — Gate 3 showed the app's ceiling resolver is never reached precisely because `callMode` passes no sources (`sourcePolicyBlock` returns ""). It is therefore NOT superseded by a "resolver absence" framing: a resolver IS present in the app (a divergent DUPLICATE, `index.html:839`), it is simply never invoked. The compounding finding (the present resolver is a buggy duplicate, not canonical) is logged in D-118. Net effect: the running app enforces no interpretive ceiling. Original text preserved above.

## D-100 · [PsychReport] Unit of analysis is the domain, not the single instrument
A domain may draw on **multiple instruments**; section generation must operate
**at the domain level**, integrating multiple instruments within a domain while
**preserving each source's attribution and validity.** Consistent with the
EdPlan-confirmed principle that a domain must be shown as addressed (cf. D-089,
RIE side). *Design item; interacts with D-093 and D-099.*
**Status:** Accepted · 2026-07-25 · Proposed: JD · Ratified: JD
> **Amendment note (2026-07-27, per D-038; Session A reconciliation):** Softened from a **universal** domain-level architecture to a **finding-centered default**. Current effective rule: operational-spec-v1 Rule 1.4 — organize the report around clinically meaningful findings; **domain-level integration is preferred when it improves understanding**, and **measure-specific narration is permitted when it serves the finding** (validity, a meaningful within-measure pattern, the referral question, the selected template, or practice convention). Do not treat domain-as-unit as a universal architecture across school and private/community reports. Original text preserved above.

## D-101 · [PsychReport] Stage-1 is not cleared to merge to `main` pending D-092–D-100
The mode-scoped wiring is **confirmed sound** (clean per-section network failure
in the pilot), but the **content architecture beneath it is incomplete** in the
ways D-092–D-100 specify. The **`stage1-mode-prompts` branch stays quarantined**;
**`main` remains the known-good July 2 baseline** until these resolve. Origin:
Stage-1 pilot, 2026-07-25.
**Status:** Accepted · 2026-07-25 · Proposed: JD · Ratified: JD
> **Amendment note (2026-07-27, per D-038; Session A reconciliation):** Stage-1 provenance corrected. The Stage-1 application pilot was an **infrastructure failure ("Failed to fetch") that produced no content evidence**; the mode-scoped wiring's soundness rested on that run and is therefore **not** demonstrated by generated prose. Quarantine of `stage1-mode-prompts` **continues** until the stale eligibility boundary, validity wiring, duplicate resolver, prompt contradictions, and the accepted amendments are corrected and tested (Session B). Current effective statement: operational-spec-v1 Rule 10.5. Original text preserved above. *(Logged this session for spec/log consistency under P-05; see the session report — this goes slightly beyond the Part-2 list and is reversible.)*

## D-102 · [PsychReport] Meta-note — the pilot surfaced what paper did not
D-092–D-100 were surfaced by a **single Stage-1 pilot plus one independent
cross-check — none were visible on paper.** Recorded as evidence for the
**pilot-before-build discipline**: piloting converted "the architecture is
specified" into **nine concrete defects and one principle correction.** Origin:
2026-07-25.
**Status:** Accepted · 2026-07-25 · Proposed: JD · Ratified: JD
> **Amendment note (2026-07-27, per D-038; Session A reconciliation):** Provenance of the D-092–D-100 findings corrected. They were **not** surfaced by the Stage-1 app pilot (which failed to fetch and produced no content); they came from the **later constrained-prompt comparison and prompt-source analysis**. Claims that Stage-1 demonstrated diagnostic drift, boundary leakage, or over-rigidity in generated prose are **withdrawn**. The pilot-before-build discipline still holds in principle, but this specific attribution is retracted. Current effective statement: operational-spec-v1 Rule 10.5. Original text preserved above. *(See the D-101 note re P-05 / Part-2 scope.)*

## D-103 · [PsychReport] Instrument-library entry schema — five-slot modular model
Each library entry (per instrument, per index/subtest) is composed of **five
slots, not a single paragraph**, each carrying a **provenance tag** that
determines who produces it and what governs it:

1. `construct_definition` — **library-static, cited. Always inserted.**
2. `generic_task_example` — **library-static, cited. Usually inserted.** Phrased
   in explicitly generic terms ("Tasks measuring X ask a child to…") so it can
   **never read as case-specific.**
3. `student_performance` — **model-generated, bounded by the DESCRIPTIVE_RESULTS
   contract, sourced to case data.** The **only freely generated slot** in the
   instrument section.
4. `functional_connection` — **model-generated under INTEGRATED_INTERPRETATION
   only**, and included **only when classroom/case evidence supports it.** Does
   **NOT render inside the instrument section** — the library entry holds only a
   **pointer** noting the construct's functional implications are generated later,
   in integration. Rendering slot 4 in the instrument section **reintroduces the
   cross-domain boundary leak the mode contracts prohibit** (cf. D-097 boundary
   check).
5. `variability_context` / conditional caveat — **library-static text,
   rule-inserted on determination** (see D-104). **Never scatter-triggered.**

The schema is thus: **three static/authored fields + one determination-gated
static field + one pointer to generated integration content.** Every sentence in
a rendered instrument section traces to **either authored library text or a
bounded generated slot.** Refines D-093. Origin: modular-architecture analysis,
2026-07-25.
**Status:** Accepted · 2026-07-25 · Proposed: JD · Ratified: JD
> **Amendment note (2026-07-25, per D-038):** Refined by **D-107** — the final, implementable five-slot schema (two-part slot 1; composite entries drop slot 2 and add a `composition` field; per-slot provenance + `{instrument, edition, location}` source + distinct version/edition stamps). Original slot model preserved above; D-107 governs implementation. Caveat sub-library is D-108; manual-verification discipline is D-109.
> **Amendment note (2026-07-27, per D-038; Session A reconciliation):** Mandatory five-slot **rendering** is retired. The slots become an **optional storage/provenance structure**, not an assembly order: structured storage may distinguish construct anchors, generic task context, composition, and caveats when useful, but **does not determine sentence order or paragraph assembly**, and no empty placeholders are created for content the registry does not need. Current effective rule: operational-spec-v1 Rule 8.4 (registry: Rule 8.5). Original text and the 2026-07-25 note preserved above.

## D-104 · [PsychReport] Conditional interpretive content inserts on determination, never on raw-number thresholds
Conditional content (FSIQ variability caveat, compromised-composite caveat, any
"interpret with caution" text) is inserted **only when an examiner judgment or
validated interpretive-logic condition is met** — **never automatically from raw
score patterns** such as index scatter. Rationale: **large index discrepancies
are statistically common and do not by themselves make a composite unreliable**;
an auto-inserted caveat makes an **unendorsed psychometric claim, which is a
liability rather than a safeguard.** This is the same shape as D-096 (a
compromised composite is flagged by a **validity determination, not inferred from
scores**) and the ledger principle that a clinical judgment must be **made, not
auto-derived.** Generalizes across **all conditional interpretive content.**
Origin: cross-check + JD ratification, 2026-07-25.
**Status:** Accepted · 2026-07-25 · Proposed: JD · Ratified: JD

## D-105 · [PsychReport] Gap-surfacing rule — missing information becomes a user-facing flag, never report-voice prose
When the generator lacks information a competent evaluator would have (discrepancy
base rates, comparison significance, normative statistics), it must **surface the
gap to the user out-of-band** — a gap flag / to-do / placeholder the psychologist
fills — and must **NOT narrate the limitation in the report's voice** (e.g.,
"formal statistical-comparison information was not available"). Rationale: such
sentences **describe the tool's access, not the child**, and their presence
signals the report was written by a system with **incomplete access to
interpretive/scoring manuals** — an admission that **undermines the document's
authority in due process.** This is the **mirror of D-094** (never invent missing
content); here the failure is **confessing the gap** rather than inventing around
it. Both violate the same boundary. Implementation: extends the ledger's existing
**"gap report precedes drafting"** (D-078) — a slot whose required source is
absent raises a **user gap flag, never a report-voice caveat.** Origin: JD, review
of generated report, 2026-07-25.
**Status:** Accepted · 2026-07-25 · Proposed: JD · Ratified: JD

## D-106 · [PsychReport] Slot 5 caveats are clinical judgments, not system limitations
The conditional-caveat slot may **only ever produce a caveat the evaluator
clinically endorses** (e.g., "the FSIQ should be interpreted with caution given
the variable profile"). It must **never produce a caveat that is actually a system
limitation in disguise** (e.g., "comparison data was not available") — that case
is a **gap flag per D-105, not a caveat.** The library schema must make this
distinction **explicit so no generation path can route a missing-data condition
into caveat prose.** Sharpens D-103 slot 5. Origin: JD, 2026-07-25.
**Status:** Accepted · 2026-07-25 · Proposed: JD · Ratified: JD

## D-107 · [PsychReport] Amendment to D-103 — final instrument-library entry schema
Refines the five-slot model in D-103 with the structure settled across the WISC-V
template work (2026-07-25). Original D-103 text preserved; this is the
**implementable schema.**

**Index entry:**
- **Slot 1 — definition, two-part:** `core_definition` (**stable, manual-sourced,
  always rendered**) + `secondary_descriptor` (**optional** interpretive-adjacent
  framing, e.g. "independent of acquired knowledge"; rendered only when
  configured, **structured even when empty**). The split exists because the second
  kind of content is accurate but **edges toward interpretation**, and separating
  it keeps slot 1's core **auditable and stable.**
- **Slot 2 — `generic_task_example`:** static, cited, phrased generically ("Tasks
  measuring X ask a child to…") so it **can never read as case-specific.**
- **Slot 3 — `student_performance`:** model-generated under **DESCRIPTIVE_RESULTS**,
  sourced to case data.
- **Slot 4 — `functional_connection`:** model-generated under
  **INTEGRATED_INTERPRETATION only**, rendered in the integration section, **never
  in the instrument section**; the entry holds only a **pointer.**
- **Slot 5 — `variability_context` / caveat:** **rule-inserted from the caveat
  sub-library (D-108) on determination**, never scatter-triggered (D-104), never
  generated (D-106).

**Composite entry:** slots **1, 3, 4, 5** plus a **`composition` field** naming the
constituent indexes/subtests (e.g., FSIQ → VCI, VSI, FRI, WMI, PSI). **No slot 2**
— a composite has no distinct task set; the composition field is its **honest
analogue.**

**Per-slot metadata, every slot:** provenance tag (`library-static` /
`model-generated` / `rule-inserted`); structured source `{instrument, edition,
location}`; a **version stamp** (this library's revision of the entry) and a
**separate edition stamp** (the test-manual edition the content is sourced from).
Version and edition are **distinct fields** so the library can be queried for
currency when a new test edition ships — *"which entries are still sourced to the
superseded manual"* requires edition as its own field.
**Status:** Accepted · 2026-07-25 · Proposed: JD · Ratified: JD
> **Amendment note (2026-07-27, per D-038; Session A reconciliation):** Adopted as a **lightweight optional reference registry**, not a mandatory rendering template. Current effective rule: operational-spec-v1 Rule 8.5 — a reference entry may contain instrument, edition, score/scale identity, optional semantic anchors, optional generic task context, composite constituents, approved automatic-caveat identifiers, provenance status, and version; **the model draws on available reference content rather than concatenating stored fields.** Mandatory integration pointers, generated-performance slots, per-commodity-sentence citations, and per-slot rendering order are removed. Student result facts come from case data, not the registry. Original text preserved above. (Amends D-103 further; pairs with the D-103 note.)

## D-108 · [PsychReport] Caveat sub-library — closed, keyed, authored strings
Conditional caveats (slot 5) are drawn from a **closed sub-library of authored
strings, not composed by the model.** Each entry is a **fixed string with variable
slots** (e.g., `[child]`), **keyed to the determination condition** that triggers
it. Initial set: **FSIQ/composite variability caveat; compromised-composite
caveat** (invalid component feeding a composite, per D-096); **scope/administration
caveat.** A caveat may only ever express a **clinical judgment the evaluator
endorses** — never a system limitation (D-106); a **missing-data condition routes
to a gap flag (D-105)**, never into this sub-library. **Closed set, not free
composition**, is what keeps caveats auditable and prevents drift. Origin: WISC-V
template work, 2026-07-25.
**Status:** Accepted · 2026-07-25 · Proposed: JD · Ratified: JD

## D-109 · [PsychReport] Library content is manual-verified, not model-adopted
All library content — definitions, task examples, composition lists, citations —
must be **authored and verified by JD against the primary test manual before
entry**, regardless of how fluent or agreed-upon draft text from any model (Claude
or ChatGPT) appears. **Two models converging on a definition certifies the format
is stable; it does not certify the content**, since both draw on overlapping
training data and can be **confidently wrong in the same way.** This is
D-093/D-094 applied to the **library's own construction**, and the pin discipline
(no claim without a verified source) applied to interpretive content. **Practical
consequence:** library entries reach **"content-complete with citation
placeholders"** from drafting, but **"verified" only after a manual-open authoring
pass**; the **two states are tracked distinctly.** Origin: 2026-07-25.
**Status:** Accepted · 2026-07-25 · Proposed: JD · Ratified: JD
> **Amendment note (2026-07-27, per D-038; Session A reconciliation):** The **mandatory manual-verification gate is retired.** Ordinary construct exposition does **not** require verification against a purchased manual. Reference content may be **generated, practitioner-reviewed, organization-approved, or publisher-grounded** — these are **provenance states, none of which gates use**; uncurated output remains subject to ordinary evaluator review. Global high-volume/low-volume curation designations are not used (P-07); curate opportunistically from use, correction burden, customer demand, or organization preference. Current effective rule: operational-spec-v1 Rule 8.8. Original text preserved above.

<!-- ══════════════════════════════════════════════════════ -->
<!-- Session A reconciliation, 2026-07-27 (JD-ratified). Adopts the reconciled -->
<!-- operational specification (operational-spec-v1) as the current-effective-  -->
<!-- rules document (P-05). Logs process rules P-01–P-07 as D-110–D-116; applies -->
<!-- the §17 amendment queue as dated D-038 notes above (D-005/D-034, D-092,      -->
<!-- D-093/D-094, D-095, D-097 [OPEN GATE], D-098, D-100, D-101/D-102,            -->
<!-- D-103/D-107, D-109) and corrections C1–C4 (C2→D-032, C3→D-048). Engineering  -->
<!-- dispositions are OPEN GATES pending Session B — see the gate list after      -->
<!-- D-116. No code verified, no resolver retired, no engineering result presumed. -->
<!-- ══════════════════════════════════════════════════════ -->

## D-110 · [suite] P-01 · Minimum-necessary prompt
*(Session A reconciliation, 2026-07-27. Ratifies process rule P-01 from operational-spec-v1 §3. Systemic governance rule.)*
**Effective rule (operational-spec-v1 §3, P-01):** "A runtime instruction remains only when it protects a legitimate product, evidentiary, validity, or artifact boundary and its benefit exceeds its cost to natural writing."
Governs runtime-prompt construction for any suite product that builds generation prompts; the runtime prompt is a task-specific subset of the operational spec, not a copy of it. Cross-ref: operational-spec-v1 §2, §15, §18; D-025 (length sole-sourced); D-036 (exemplar-first). Scope: [suite] — any product that constructs LLM prompts.
**Status:** Accepted · 2026-07-27 · Proposed: reconciliation spec / JD · Ratified: JD

## D-111 · [suite] P-02 · Preserve permissions during distillation
*(Session A reconciliation, 2026-07-27. Ratifies process rule P-02 from operational-spec-v1 §3. Systemic governance rule.)*
**Effective rule (operational-spec-v1 §3, P-02):** "When a source rule contains a permission, default, qualification, or escape clause that materially prevents over-constraint, the distilled prompt must carry it in the same instruction or reference the complete resolved rule."
Addresses the prompt-distillation-loss failure that turned flexible rules rigid (e.g., the D-092 finer-grain clause). Cross-ref: operational-spec-v1 §1, F1; D-026; Session B gate G6 (distillation-loss regression tests).
**Status:** Accepted · 2026-07-27 · Proposed: reconciliation spec / JD · Ratified: JD

## D-112 · [suite] P-03 · Verify code claims
*(Session A reconciliation, 2026-07-27. Ratifies process rule P-03 from operational-spec-v1 §3. Systemic governance rule.)*
**Effective rule (operational-spec-v1 §3, P-03):** "No decision about resolver behavior, data representation, or application fall-through is ratified from a secondary summary alone. Verify the canonical file and execute representative tests."
The basis for logging engineering dispositions as OPEN GATES this session (C1). Cross-ref: operational-spec-v1 §3.2–3.3, §18; D-097 (OPEN GATE); the Session B gate list below.
**Status:** Accepted · 2026-07-27 · Proposed: reconciliation spec / JD · Ratified: JD

## D-113 · [suite] P-04 · Claims versus scaffolding
*(Session A reconciliation, 2026-07-27. Ratifies process rule P-04 from operational-spec-v1 §3. Systemic governance rule.)*
**Effective rule (operational-spec-v1 §3, P-04):** "Student-specific factual and inferential claims require case support. Generic construct exposition, connective prose, and professional recommendation knowledge may be used when authorized, but may not smuggle unsupported claims."
The principle that resolves the FIDELITY/exposition contradiction (D-093/D-094). Cross-ref: operational-spec-v1 Rules 1.1, 5.1, 8.1–8.2. Scope: [suite] — any product generating over case data.
**Status:** Accepted · 2026-07-27 · Proposed: reconciliation spec / JD · Ratified: JD

## D-114 · [suite] P-05 · Current spec versus history
*(Session A reconciliation, 2026-07-27. Ratifies process rule P-05 from operational-spec-v1 §3. Systemic governance rule.)*
**Effective rule (operational-spec-v1 §3, P-05):** "The operational specification contains only current effective rules. The decision log preserves original decisions, amendments, and supersession history."
Governs the relationship between operational-spec-v1 and this decision log; the reason every spec rule cross-references its governing decision(s) and every superseded rule keeps its original text (D-038). Cross-ref: operational-spec-v1 header and §10.4; D-029; D-038.
**Status:** Accepted · 2026-07-27 · Proposed: reconciliation spec / JD · Ratified: JD

## D-115 · [suite] P-06 · Artifact profiles
*(Session A reconciliation, 2026-07-27. Ratifies process rule P-06 from operational-spec-v1 §3. Systemic governance rule.)*
**Effective rule (operational-spec-v1 §3, P-06):** "Product boundaries are resolved by artifact profile. School psychoeducational, private psychological, and future specialty profiles may authorize different conclusions while sharing fidelity and validity safeguards."
The mechanism that replaces the flat adverse-impact/SDI wall (D-005/D-034 amendments). Cross-ref: operational-spec-v1 §7, §16; D-005/D-034; D-082. Scope: [PsychReport] — PsychReport-local product boundaries (flag for [suite] promotion if other products adopt profiles).
**Status:** Accepted · 2026-07-27 · Proposed: reconciliation spec / JD · Ratified: JD
> **Amendment note (2026-07-27, per D-038; Session A closeout):** Scope tag corrected **[PsychReport] → [suite]**. Scope note: the artifact-profile mechanism — deployment context authorizing different conclusions — is suite-level, shared in principle with the Sped QA authority tiers and RIE's deployment-tiered identity handling. The concrete profiles (SCHOOL_PSYCHOEDUCATIONAL, PRIVATE_PSYCHOLOGICAL, future profiles) are PsychReport-specific and are NOT inherited by other products. A future QA or RIE session shares the pattern, not these profiles.
> **Note (2026-07-27, Session B):** P-06 is the first worked example of **D-117**'s scope-symmetry clause (a suite pattern a default narrowed to one product).

## D-116 · [PsychReport] P-07 · No universal curation tiers
*(Session A reconciliation, 2026-07-27. Ratifies process rule P-07 from operational-spec-v1 §3. Systemic governance rule.)*
**Effective rule (operational-spec-v1 §3, P-07):** "Do not classify instruments as globally high-volume or low-volume. Curated reference content is optional and may grow from use, customer demand, corrections, or organization preference."
Governs the instrument-reference registry (D-107) and complements retirement of the manual-verification/high-low curation gate (D-109). Cross-ref: operational-spec-v1 Rules 8.5, 8.8; D-107; D-109. Scope: [PsychReport] — instrument reference curation.
**Status:** Accepted · 2026-07-27 · Proposed: reconciliation spec / JD · Ratified: JD

## D-117 · [suite] · Scope-symmetry clause
*(Proposed 2026-07-27 during the P-06 scope correction; ratified 2026-07-27 (Session B). Language as proposed by Claude and adopted by JD; see session report — reversible.)*
A governance scope tag may be corrected in either direction on review: a suite-level pattern narrowed to one product by a session default may be promoted to **[suite]** once the shared pattern is recognized, and conversely a rule may be narrowed. **Product-specific concretions of a suite pattern are not inherited by other products — a later session inherits the pattern, not the instance.** First worked example: **P-06 (D-115)** — the artifact-profile *pattern* is suite-level; the concrete profiles (SCHOOL_PSYCHOEDUCATIONAL, PRIVATE_PSYCHOLOGICAL) are PsychReport-specific.
**Status:** Accepted · 2026-07-27 · Proposed: Claude · Ratified: JD

## D-118 · [PsychReport] Running app enforces no interpretive ceiling (resolver present but never invoked)
*(Session B, Gate 3, 2026-07-27. **Text revised from the proposed wording to match verified ground truth** — see the provenance note below and the session report.)*
Verified finding (Session B, Gate 3): the running PsychReport app enforces **no** validity/interpretive-ceiling protection — every ceiling-enforcement rule the spec describes (describe-only on invalid, no interpretation past the ceiling, scope limits) exists in the contract and **not** in the running product. Mechanism (verified against `index.html`): the app **does contain a ceiling resolver — a divergent DUPLICATE `effectiveCeiling` (line 839)**, wired into `buildPrompt` via `sourcePolicyBlock` — but it is **never invoked** in the live path, because `callMode` passes only `{data}` and no sources, so `sourcePolicyBlock` returns "" and the resolver is never reached. Two compounding defects: **(1)** the payload is unwired — **this confirms D-099's framing rather than superseding it** (payload absence is the immediate cause the resolver never runs); **(2)** the resolver that *would* run is a buggy duplicate divergent from canonical (it manufactures `FULL_INTERPRETATION` as a fall-through and never returns `COMPARE_WITHIN_SOURCE`), so integration must both **wire the payload and replace the duplicate with the canonical resolver**. Consequence (unchanged from the proposed finding): the current app is a prose generator with its safety architecture specified but not present; **resolver integration is foundational, not an incremental fix**, and this independently confirms the correctness of the Stage-1 quarantine (D-101) — merging Stage-1 to main would have shipped generation with zero ceiling enforcement.
> **Provenance note:** the proposed wording stated "the app … neither imports the canonical resolver nor maintains a duplicate … the issue is resolver absence, not payload absence," and that this entry supersedes D-099. Session B Gate 3 **refutes** the "no duplicate / resolver absence" premise (a divergent duplicate is present at `index.html:839`) and **confirms** D-099's payload framing; the text above is corrected accordingly, per this session's rule that rulings follow verified ground truth, not a prior reading. The substantive conclusion (running app enforces no ceiling; integration foundational; Stage-1 quarantine vindicated) is unchanged.
**Status:** Accepted · 2026-07-27 · Proposed: JD (finding); text corrected per Session B Gate 3 · Ratified: JD

## Session B — Engineering-Verification Gate List (verdicts recorded 2026-07-27)
*(Logged Session A per Part 5 / P-03. Session B verified Gates 1–5 against canonical files; verdicts below. Gates not covered by Session B remain OPEN. Where a verdict contradicted a proposed disposition, the ruling follows verified ground truth — see the session report.)*

- **G1 · D-097 resolver test** — **RESOLVED / REFUTED → D-097 RETIRED.** Canonical `effectiveCeiling` already fails safe (INVALID→DO_NOT_INTERPRET, NOT_ESTABLISHED→DESCRIBE_ONLY, empty scope→DESCRIBE_ONLY); it never manufactures `FULL_INTERPRETATION` and can return `COMPARE_WITHIN_SOURCE` via passthrough. Both D-097 claims refuted against canonical source (see the D-097 retirement note).
- **G2 · Duplicate-resolver check** — **RESOLVED / VERIFIED: a divergent duplicate resolver EXISTS but is dormant.** `index.html:839` defines its own `effectiveCeiling` (wired into `buildPrompt`), diverging from canonical, but it is never invoked (callMode passes no sources; payload unwired, D-099). Disposition: **"retire the duplicate" is NOT moot** — the duplicate is real and must be replaced by the canonical resolver during integration (spec Rule 3.3 amended; finding logged as D-118). *NB: the proposed "no duplicate exists" framing is refuted by this verdict.*
- **G3 · Component-level-validity build** — **OPEN / still pending** (not covered by Session B). D-096; D-104; spec 3.6.
- **G4 · Payload wiring (D-099)** — **OPEN / still pending**; verified-relevant — G2/D-118 show the unwired payload is the immediate cause the resolver never runs.
- **G5 · Shared-package placement (D-046)** — **RESOLVED / CONFIRMED starting state** (see the D-046 Gate-5 note). Consolidation remains the prerequisite; no disposition change.
- **G6 · Prompt-distillation regression tests** — **OPEN / still pending** (not covered by Session B). P-02.
- **G7 · Reversed-clinical-pattern regression tests** — **OPEN / still pending** (not covered by Session B). D-098.
- **G8 · Prohibited-transformations sequencing (C4)** — **OPEN / still pending** (not covered by Session B). Nine transformations stay in runtime until the QA regression suite exists.

*Also verified (not an original G1–G8 gate): mode-taxonomy sharing — CONFIRMED (Gate 4); C2 stands (see the D-032 note).*

## D-119 · [RIE] D-089 amendment — universal consideration without a universal instrument format

Every grade/developmentally applicable domain must produce an interpretable disposition. D-089's universal-consideration and conditional-depth requirements remain in force. Its paired can-do/difficulty checklist mechanism is superseded.

Question authors must select response formats according to the information being elicited. Structured responses are used when nonselection would be clinically ambiguous; checklists may be used when identifying nonexhaustive examples is sufficient. This is a governing authoring principle, not a ratified assignment of formats to domains or items. Item-level decisions belong to versioned clinical-bank review.

Every always-shown item for which insufficient opportunity to observe is logically possible must provide an explicit observation escape. This requirement does not apply to factual/contextual items — such as respondent role — for which non-observation is not a coherent response.

Grade/developmental routing is the preferred mechanism for excluding categorically irrelevant content. Respondent burden is governed through pilot-measured completion, abandonment, and clinical yield rather than a fixed item-count ceiling. Form configuration resides with the relevant form and optional case-specific setup rather than global navigation.

Design test recorded with this decision: safe specification requires the system to preserve meaningful states, provenance, or professional control; risky specification prescribes extensive content, fixed item assignments, or broad prose prohibitions before demonstrated failure justifies them. This amendment primarily removes unnecessary mechanism while preserving clinical correctness.
**Status:** Accepted · 2026-07-29 · Proposed: JD · Ratified: JD

> **Amendment note (2026-08-06, per D-038):** Narrowed by **D-132**. The
> format-follows-information principle and the pilot-governed burden rule
> remain in force. The supersession of the paired can-do/difficulty
> checklist is narrowed: the paired structure returns in bounded form — a
> capped affirmative baseline shown regardless of disposition, plus a
> conditional difficulty checklist — justified by the district referral
> form's per-domain strengths fields (an output contract), not by richer
> narratives. The five-item baseline cap is an authoring bound on baseline
> lists, not a reintroduction of the fixed item-count ceiling this decision
> rejected for burden governance. See D-132. Original text preserved above.

## D-120 · [RIE] Respondent-facing student identity: first name + last initial

Respondent-facing student identity is first name plus last initial. The Case contract adds these as minimal identity fields; full name is never stored, and links, logs, and model payloads continue to exclude them. Supersedes initials-only display.
**Status:** Accepted · 2026-07-29 · Proposed: Claude (handoff reconciliation, per handoff 01 respondent-experience requirement) · Ratified: JD

## D-121 · [suite] · Psych Suite v6 product architecture adopted (design package)
*(v6 reconciliation session, 2026-08-04. Records a ratification JD made in the
v6 package documents; entry text by Claude — corrections go in as amendments.)*
Adopts the v6 product direction: **three standalone, independently purchasable
evaluation products — PsychReport, Speech Studio, OT Studio (working names) —
plus a district Evaluation Platform that is a coordination layer, not another
writer; Documentation Support tools; and Sped QA remaining a separate review
product.** Distribution is bottom-up: individual purchase is the entry motion in
three provable markets; cohesion activates when providers on the same evaluation
are on the platform; the district purchase is the expansion event, never the
entry. Integration bar: if the only integration is a shared homepage, it is a
bundle and has failed.
The package lives at `docs/psych-suite-v6/`. Precedence inside the package
(JD-designated): the ChatGPT v6 implementation handoff
(`v6-handoff-chatgpt.md`) governs over the Cowork decision set
(`v6-decisions-cowork.md`, package-local numbering D1–D14) and the Cowork
process handoff. The package's D1–D14 are recorded as ratified product
direction; they are **not** a second canonical log — this log governs, and any
conflict is resolved only by a numbered entry here. The Cowork instruction to
create `docs/decisions/DECISIONS.md` is superseded (it would have created a
competing canon). The referenced `V6-BUILD-DIRECTIVE.md` was never delivered;
its scope is reconstructed in `docs/psych-suite-v6/build-plan-v6.md`.
**Reconciliation notes:**
- Package D10 does **not** reinstate the flat adverse-impact/SDI wall. The
  artifact-profile model (D-005 amendments, D-115) still governs; the package's
  "separately authorized and gated" is the configured-workflow permission.
- Package silence on **RIE** does not retire RIE (later-governs applies to
  actual conflict only, D-038). RIE remains a product and step 1 of the
  ratified build sequence.
- Speech Studio and OT Studio enter this log as products; scope tags
  `[Speech]` and `[OT]` are now valid.
- Package D4 §Sped QA confirms D-012/D-035 (QA independence).
- Package D6 (profile isolation) extends the D-003/D-004 lineage and is a
  data-layer requirement from the first schema.
- Keeper line, verbatim (package D14): "Added once, available where it
  belongs."
**OPEN GATE (sequencing):** the Cowork handoff's "build v6" instruction
conflicts with the JD-ratified 2026-07-28 build sequence (RIE → D-046 → Sped QA
design → PsychReport). This entry does NOT resolve it. Recommendation recorded
in `build-plan-v6.md` §0 (keep the sequence; v6 workspace build absorbs the
"PsychReport redesign" step). Resolution requires a new numbered entry.
**Status:** Accepted · 2026-08-04 · Proposed: Claude (v6 reconciliation) · Ratified: JD (per v6 package ratification, August 2026)
> **Amendment note (2026-08-07, per D-038; CF-7 parent-spec pointer):** The Vertical-Slice Build Directive names a parent spec `Psych_Suite_v6_Claude_Code_Handoff.md`; no file of that name exists. All directive references to the parent spec are read as pointing to the v6 package at `docs/psych-suite-v6/`, where `v6-handoff-chatgpt.md` governs per this entry's precedence. Filename pointer only; no substantive change. See docs/VS0-IMPLEMENTATION-MAP.md, CF-7. Original text preserved above.

## D-122 · [suite] · "Documentation Support" naming; standalone Documentation Support tab
*(v6 reconciliation session, 2026-08-04. ChatGPT handoff §4.3 governs over the
Cowork package's "Team Documentation" label per D-121 precedence.)*
The label is **Documentation Support** everywhere; "Team Documentation" is
retired in current and future UI. District Documentation Support tools: IEP
Drafting, MDR Documentation, Eligibility Preparation, Meeting Brief — case
tools, not disciplines, never peer product cards. Standalone products carry a
case-level Documentation Support tab with **product-appropriate tools only**:
Parent Summary, Meeting Brief, Information Request. District team tools (IEP,
MDR, Eligibility Preparation, cross-discipline coordination) never appear in a
standalone case absent a separately licensed future commercial model. MDR
remains incident-driven and deadline-sensitive (package D12): it rises to Home
and the global Documentation Support queue only while active.
**Status:** Accepted · 2026-08-04 · Proposed: Claude (v6 reconciliation, per ChatGPT handoff §4.3/§7.7) · Ratified: JD (per v6 package ratification)

> **Amendment note (2026-08-08, per D-038) — Documentation Support is broader
> than reuse-of-approved-content; MDR Brief and MDR Documentation are distinct
> concepts. Original text preserved.**
>
> **Ruled (JD, 2026-08-08):**
> 1. **A file-drop integrated-summary surface is in Documentation Support's
>    scope.** The practitioner may drop all files related to an **MDR, FBA,
>    IEP, or reevaluation where additional assessment is not needed** and
>    receive an **integrated summary under practitioner-selected headings.**
>    This is a materially different capability from D-122's original framing
>    (product-appropriate tools reusing approved suite content): its inputs are
>    external, unreviewed documents the suite did not author.
> 2. **MDR Brief ≠ MDR Documentation.** They remain separate concepts: the
>    **Brief** prepares the psychologist/team for the meeting; the
>    **Documentation** tool creates the actual manifestation-determination
>    paperwork. D-122's district-tool restriction was written against the
>    latter and does not, by itself, bar the former from a standalone case.
> 3. **The brief family and its source bases** (JD's table, 2026-08-08):
>    *Referral / Evaluation Planning* ← RIE + case information (explain why
>    evaluation is being considered and what the team has); *Eligibility* ←
>    approved PsychReport + meeting context (present the psychologist's
>    synthesis clearly); *MDR* ← IEP, evaluation, BIP/FBA, discipline records,
>    implementation evidence (organize evidence for the team's manifestation
>    decision); *FBA / Behavior Review* ← ABC data, observations, interviews,
>    rating/input data (explain behavioral patterns and support development of
>    a functional hypothesis).
>
> **OPEN — not ruled, required before build:**
> - **(a)** Whether D-122's standalone-vs-district prohibition itself is
>   amended, and in what terms. JD: "given the breadth of Documentation
>   Support, the prohibition **may** need to be amended" — hedged, so the
>   restriction stands as written until a numbered entry replaces it.
> - **(b)** `Parent Summary` vs. the parent-friendly referral brief: D-122
>   names Parent Summary as its own standalone tool. Same artifact, or Meeting
>   Brief in a parent register? Unaddressed in the 2026-08-08 ruling.
> - **(c)** **Provenance model for dropped files** — the load-bearing
>   engineering question. Briefs over approved Sources inherit checksum,
>   bank pin, and supersession; briefs over dropped external documents inherit
>   none of that unless ingestion makes them first-class Sources on the case
>   (`@suite/document-extraction` is the existing path, per D-046). Until
>   ruled, no brief may present dropped-file content with the same confidence
>   affordances as approved-Source content.
> - **(d)** Sequencing against directive Stage J, which specifies **one**
>   Documentation Support flow for the slice rather than several shallow
>   tools. This surface is larger than one flow; it either redefines VS-6 or
>   follows it.
>
> **Unchanged and binding:** directive §11 — no brief or summary generates a
> manifestation determination, eligibility determination or category ranking,
> placement, service, SDI, final goal, or final accommodation. **D-135 is now
> load-bearing rather than theoretical:** dropped IEPs, BIPs, and discipline
> records are real student data, and D-135 blocks any deployment carrying real
> student data until retention/auto-purge semantics are ruled in a numbered
> entry and the purge job is built and verified.

## D-123 · [suite] · Shared case-tab framework in every profile
*(v6 reconciliation session, 2026-08-04. ChatGPT handoff §5.3 — "the latest
architecture correction" — governs over the Cowork package D7, which specified
case tabs for district only.)*
Opening a case/client in **every** profile — district, PsychReport, Speech
Studio, OT Studio — reveals the same five tabs: **Overview · Case Materials ·
Evaluations · Documentation Support · Timeline.** The framework is constant;
contents are capability-driven (`WorkspaceCapabilities`, handoff §16):
district cases may show assigned disciplines and district tools; standalone
cases show only the licensed product's evaluation and standalone Documentation
Support tools, with no shared-team language. "Case tabs exist" must never be
encoded as a district-only condition. Global navigation remains product-first
in standalone shells and case-first in the district shell (package D7,
unchanged on this point).
**Status:** Accepted · 2026-08-04 · Proposed: Claude (v6 reconciliation, per ChatGPT handoff §5.3/§16) · Ratified: JD (per v6 package ratification)

## D-124 · [suite] · D-121 sequencing gate partially resolved: RIE, then D-046; remainder deferred
Resolves the immediate portion of the OPEN GATE recorded in D-121. **The build
order for now is: (1) finish RIE and make it deployable, (2) D-046 shared-layer
consolidation.** The ordering of what follows — Sped QA design pass versus the
v6 workspace build (which would absorb the step-4 PsychReport redesign per
`docs/psych-suite-v6/build-plan-v6.md` §0) — is **deliberately deferred**; JD
will revisit the sequence after D-046. Until then, v6 shell construction
remains blocked, and the 2026-07-28 sequence stands for steps 1–2 unchanged.
**Status:** Accepted · 2026-08-04 · Proposed: JD · Ratified: JD

## D-125 · [RIE] · Capture (clinician notetaking + summarization) ships in the first deployable RIE
The live clinician-capture mode — quick notetaking during interviews,
observations, and calls, with model-drafted summarization — is **in scope for
the first working/deployable RIE**, not a later phase. This amends the
rie-handoff roadmap's "Phase 1 — intake foundation, no AI" boundary: the
deployable v1 includes async forms AND Capture, so a narrow slice of
summarization AI enters v1. Guardrails, consistent with existing decisions:
- Captured notes are **clinician-authored Sources**; model summaries are
  **proposals** reviewed and confirmed by the clinician before anything enters
  Evidence (the D-081 verification pattern: draft shown beside the raw notes,
  confirmed/corrected first).
- `referral_package` remains capture-mode agnostic (D-080); per-domain
  functional capture (D-089/D-119) applies in both async-form and live-capture
  modes.
- Unchanged exclusions: no autonomous interviewing, no unrestricted
  model-authored interview questions (approved-bank follow-up stays Phase 4),
  no parent conversational AI (D-005 lineage; handoff 01 exclusions).
- Data posture per `docs/data-posture.md`; summarization calls carry
  minimum-necessary content (D-110).
**Status:** Accepted · 2026-08-04 · Proposed: JD · Ratified: JD

## D-126 · [suite] · Vertical-slice build ratified
The Vertical-Slice Build Directive (v1.1, as amended by the Aug 6, 2026
governance pass) is the ratified build at the sequence-revisit point required
by existing D-124. Prerequisites unchanged: deployable RIE, then D-046, then
the slice.
**Status:** Accepted · 2026-08-06 · Proposed: Claude (Aug 6 governance pass) · Ratified: JD (ratification instruction of 2026-08-06, A-1..A-9)

## D-127 · [RIE] · RIE rescope ratified; name open
RIE is rescoped as the suite's multi-modal intake/evidence layer: forms,
document upload, and structured interview/observation/call capture first;
voice phased later. "RIE" remains the internal codename. No user-facing
product name ships without a ratified naming decision. Naming constraint of
record: the prior candidate failed as accurate-but-generic-and-passive; the
replacement must name the value created (organized, reusable, attributed
professional case information), not the input action, and must not presume
"referral" scope.
**Status:** Accepted · 2026-08-06 · Proposed: Claude (Aug 6 governance pass) · Ratified: JD (ratification instruction of 2026-08-06, A-1..A-9)

## D-128 · [PsychReport] · PsychReport standalone excellence protected
PsychReport must be independently excellent and independently purchasable.
No ecosystem prerequisite, ever. Suite integration adds value; it never
gates value.
**Status:** Accepted · 2026-08-06 · Proposed: Claude (Aug 6 governance pass) · Ratified: JD (ratification instruction of 2026-08-06, A-1..A-9)

## D-129 · [SpedQA] · QA independence positioning
The Sped QA Engine is positioned as independent review regardless of
authoring source — machine-drafted, competitor-drafted, or human-written.
Attorney involvement is design input; no marketing or product surface may
state or imply legal certification or legal review of an individual
document. "AI grading AI" is retired as external language.
**Status:** Accepted · 2026-08-06 · Proposed: Claude (Aug 6 governance pass) · Ratified: JD (ratification instruction of 2026-08-06, A-1..A-9)

## D-130 · [suite] · Polish is release-gated
No slice surface ships without passing Gate C of the directive, which
incorporates Design System §8 at fixed viewports 1440/1024/390 against the
canonical fixture. The internal checklist is the standard of record; no
competitor is named in decision text.
**Status:** Accepted · 2026-08-06 · Proposed: Claude (Aug 6 governance pass) · Ratified: JD (ratification instruction of 2026-08-06, A-1..A-9)

## D-131 · [suite] · Multidisciplinary architecture is first-class
The canonical case model must support multiple professional
contributors/assignments across disciplines without changing case identity
or Source/Evidence semantics. Case activity preserves actor attribution.
Authorization remains governed by the canonical
organization/profile/role/assignment model — not embedded ad hoc in
contributor records. Psychology is the first discipline through the full
pipe; additional disciplines phase in after slice validation, sequenced by
design-partner demand. No multidisciplinary UI is built in the slice.
**Status:** Accepted · 2026-08-06 · Proposed: Claude (Aug 6 governance pass) · Ratified: JD (ratification instruction of 2026-08-06, A-1..A-9)

## D-132 · [RIE] · Teacher Intake v1.6.1 ratified — universal baseline capture, conditional depth
Teacher Intake v1.6.1 adopts universal domain consideration through concise
baseline observation capture. Additional clinical detail is conditional on
identified concerns, developmental applicability, and evaluation planning
relevance. Future revisions should be guided by practitioner review and
observed completion data rather than predetermined expansion of the
instrument.

**Mechanism ratified (the hybrid change set of 2026-08-06, replacing the
compression pass of the same date):**

- Every domain shows an affirmative baseline checklist regardless of
  disposition; a Yes disposition **adds** a deficit-phrased difficulty
  checklist plus one optional example field. Conditional depth, not
  conditional existence. "Not enough opportunity to observe" skips the
  baseline as well and is stored as an explicit observation gap — never
  rendered as "No".
- **Grounds for baseline capture — an output contract, not narrative
  enrichment:** the district referral form carries a per-domain strengths
  field, and RIE's job is to populate the district's document. Baseline item
  sets are derived from the district form's per-domain fields and are not
  freely authored. Downstream prose, evidence-tier, and rendering
  requirements still do not independently create respondent questions — but
  the district form's own fields legitimately do.
- **Initial baseline item cap: five statements per domain, subject to
  clinical bank review and pilot validation.** This is an authoring bound
  whose purpose is to prevent each domain from becoming a mini rating scale
  — it is NOT a burden-governance ceiling and does not reopen D-119's rule
  that respondent burden is governed by pilot-measured completion,
  abandonment, and clinical yield. Not a permanent architectural constraint.
- **One meaning per list.** Ratified hint strings — baseline: "Check what
  you have observed this student do. Leaving an item unchecked means you
  have not observed it or it does not apply at this grade — it is not
  recorded as a difficulty." Difficulty: "Check the difficulties you have
  observed. Leaving an item unchecked means it is not a difficulty you have
  observed — it is not recorded as a strength." "Not observed" is carried by
  the disposition, never by an empty checkbox. Observation-escape and the
  baseline cap are enforced in `question-bank.schema.ts`, not stated as
  principle.
- **Both safety items restored** (Social/Emotional: self-harm/suicide
  statements; Behavioral: risk-of-harm behavior), always asked regardless of
  disposition, escalation sentence beside each; emergency notice at the top
  of Step 1 and the end of Step 4. The self-harm overlap is deliberate: one
  item measures observed behavioral risk, the other a statement indicating
  ideation. Safety items are risk management, not burden.
- **Grade renders read-only from the case record** — the teacher never
  re-enters it, and grade-band routing depends on data that exists before
  the invitation is sent.
- The autism set is named **"Autism-related observation questions"** — never
  "screener." Four restricted/repetitive items on a four-point verbal
  frequency (Never observed · Occasionally observed · Frequently observed ·
  Not sure), no neutral midpoint, never summed, scored, or presented as a
  probability. The social-communication half is already collected under
  Communication and Social/Emotional — collect each thing once.
- **Attention/organization items are authored once** (under Behavioral) and
  mapped to relevant constructs; the teacher answers once and the evidence
  may inform Behavioral, Cognitive, and ADHD/OHI consideration. No duplicate
  item set; no elaborate provenance system. The depth-entry case (Cognitive
  flagged, Behavioral not) surfaces the same authored set, not a second one.
- **Vision & Hearing** moves from a Step-2 domain to a Step-1 access screen
  of four observable signs. Screening records assemble at case level;
  teachers are never asked records questions. Vision/hearing is a case-level
  information source, not a teacher judgment domain.
- **Other/Miscellaneous domain deleted; all four contents relocated** —
  attendance and regression as first-class Step-1 items, health/medical and
  environmental context as one light school-observable Step-1 item, the
  residual caught by Step 4's "anything else."
- **Magnitude ratings are not reintroduced.** If ever reintroduced,
  non-academic domains only — the academic block already collects objective
  performance data, and a teacher severity judgment beside a benchmark
  number is the weaker of two fields that can then contradict each other.

**Relation to prior decisions.** D-089's objective of universal domain
consideration is retained; its implementation mechanism is amended from
comprehensive per-domain capture to concise baseline capture with
conditional depth. The lesson is not "collect less" — it is "collect each
thing once, at the right depth, for the right purpose." D-119's
format-follows-information principle and pilot-governed burden rule remain
in force; its supersession of the paired can-do/difficulty checklist is
narrowed — the paired structure returns in bounded form (capped affirmative
baseline + conditional difficulty), justified by the district output
contract. D-050 is thereby refined, not abandoned: baseline affirmative
capture extends to all domains; deeper clinical capture remains conditional
on selected pathways. D-049's T1 vs T1-obs distinction is unchanged. D-091
is untouched — evaluation-coverage verification stays in the case process;
the teacher form captures referral-stage information only.

**Draft artifact:** `docs/drafts/teacher-v1.6.1-clinical-review-draft.json`.
This decision ratifies the structure, the quoted strings above, and the
change set; item wording remains draft until practitioner review and pilot
(per D-119, item-level decisions belong to versioned clinical-bank review).
Open items logged in the draft: attention depth-entry routing, grade-band
applicability, the baseline-to-district-field mapping, magnitude, escalation
wording, and the LANG fluency/voice taxonomy gap.
**Status:** Accepted · 2026-08-06 · Proposed: Claude (hybrid change set) with ChatGPT advisory review · Ratified: JD (ratification instruction of 2026-08-06)

<!-- ════════════════════════════════════════════════════════════════════ -->
<!-- VS-1A rulings, 2026-08-07 (JD-ratified). JD ruled on the VS-0            -->
<!-- Implementation Map (docs/VS0-IMPLEMENTATION-MAP.md): CF-1 → (a),         -->
<!-- CF-2 → (b), CF-3–CF-9 as proposed; Deferred (a) → A2, (b) → B1 with      -->
<!-- mandatory conformance testing, (c) → approved incl. differentiated exit  -->
<!-- codes; one attached condition (Avery-fixture disposability, see D-136).  -->
<!-- Standing policy lands as D-133–D-136 below; factual corrections land as  -->
<!-- dated amendment notes under D-038 (CF-4), D-046 (CF-3), D-121 (CF-7).    -->
<!-- ════════════════════════════════════════════════════════════════════ -->

## D-133 · [suite] · Two-log policy — the trunk is the only D-numbered canon; product repos may keep architecture logs
Resolves VS-0 Deferred Ruling (a) as **option A2** (docs/VS0-IMPLEMENTATION-MAP.md
§5a). A1 (migrate the QA repo's local entries into this trunk) is rejected: those
entries are implementation-grade, and absorbing them would pull the trunk below
the altitude it was deliberately kept at.

Permanent policy:
- **This file is the only place decision IDs (D-NNN) are minted.**
- A product repo may keep a **local architecture log** for implementation-grade
  forks, under three mandatory conditions: dated prose entries; **no D-IDs
  minted there**; a subordination notice at the top naming this file as the
  canonical log.
- **Decision-grade line (ruled):** anything touching product scope, shared
  vocabulary, cross-product contracts, or authority/status semantics is
  decision-grade and must be minted here per D-058 before session end.
  Implementation-grade material (parser offsets, section heuristics,
  table-confidence grading, and similar engineering micro-decisions) may live
  in the local log.
- The QA repo's `docs/decisions.md` subordination notice (2026-08-06) is
  ratified as the reference implementation of this policy.

D-058/D-064 are unchanged and still govern the dangerous case: decision-grade
content originating where the trunk is not in view must be merged here before
the session or chat closes.
**Status:** Accepted · 2026-08-07 · Proposed: Claude (VS-0 map §5a, option A2) · Ratified: JD (VS-1A ruling instruction of 2026-08-07)

## D-134 · [suite] · Evidence contracts — type-shapes in `@suite/reasoning-contracts`; persistence and behavior stay in case-model
Resolves VS-0 Deferred Ruling (b) as **option B1**, reconciling D-046
amendment 2 (the evidence-object model should be shared across Sped QA and
PsychReport) with the D-038 dependency law (qa-engine never imports
case-model):

- The **structural shape of an evidence object** — construct tags, source
  link, quote span, provenance descriptor — lives as **pure types in
  `@suite/reasoning-contracts`** (`EvidenceShape` and its component types).
  This fits the package's charter: shared epistemic vocabulary, depends on
  nothing.
- **case-model's zod `Evidence` implements the shape.** Persistence, the
  D-007/D-008 behavior-carrying constraints, and the five-entity pipeline stay
  in case-model; the shape carries structure only.
- **Conformance testing is mandatory (JD condition):** a case-model test
  asserts, under the type checker, that `TEvidence` is assignable to
  `EvidenceShape` and that the shared runtime vocabulary matches the zod
  enums, so the two cannot drift. Removing or skipping the conformance test
  is itself a violation of this decision.
- QA consumes the shape for its findings without ever seeing Case/Source
  persistence. The D-038 import law is unchanged in letter and purpose (QA
  independence per D-035 intact); no new import is added to QA's legal set.
- Rejected: **B2** (a dedicated `@suite/evidence-contracts` package — package
  overhead for a handful of types) and **B3** (types-only case-model import —
  dissolves the D-035 boundary and is not mechanically enforceable).
**Status:** Accepted · 2026-08-07 · Proposed: Claude (VS-0 map §5b, option B1) · Ratified: JD (VS-1A ruling instruction of 2026-08-07, with mandatory conformance testing)

## D-135 · [suite] · Retention/auto-purge semantics are a deployment gate, not a slice gate (resolves CF-2)
Resolves VS-0 conflict CF-2 as **option (b)**. The retention/auto-purge
semantics named by the directive's deployable-RIE gate (§3.2) — purge window,
trigger event, what auto-purge reaches — remain unruled, and the auto-purge
job remains unbuilt. The vertical slice runs on synthetic data only, so this
gate does **not** block VS-1–VS-8.

**Explicitly recorded as blocking — so the gate is not silently lost:** no
district deployment, and no deployment in any configuration carrying real
student data, may occur before (1) the retention/auto-purge semantics are
ruled in a numbered entry here, and (2) the auto-purge job is built and
verified against that ruling. This entry converts a deployable-RIE
prerequisite into a deployment prerequisite without weakening it. D-004's
retention fields and commitments (per-case deletion, configurable auto-purge
window, relay-and-purge as configuration) are unchanged.
**Status:** Accepted · 2026-08-07 · Proposed: Claude (VS-0 map §3, CF-2 option b) · Ratified: JD (VS-1A ruling instruction of 2026-08-07)

## D-136 · [RIE] · Teacher Bank gate read as satisfied in substance by D-132; slice fixture seeds on v1.3.0; the fixture is disposable (resolves CF-1)
Resolves VS-0 conflict CF-1 as **option (a)**. The directive §3.2 gate
("ratify Teacher Bank v1.6.0") is read as satisfied in substance by D-132,
which post-dates the directive and ratified the v1.6.1 structure and quoted
strings. VS-1 proceeds now: the Avery Williams fixture (directive §6) seeds
against the bank the app actually serves — ratified **v1.3.0** — while
v1.6.1 bank publication proceeds in parallel on the practitioner-review track
(item wording per D-132/D-119: versioned clinical-bank review).

**Attached condition (JD, binding): the Avery fixture is disposable
implementation data,** not a governed artifact. When the v1.6.1 bank publishes
in `@suite/content`, migrating the fixture is a **planned re-seed** —
regenerate the case, Sources, and downstream objects against the new bank —
**never an ad hoc edit** of seeded data. Nothing may accrete on the v1.3.0
fixture that would make the re-seed expensive; any test pinned to fixture
content must survive a re-seed or pin the bank version explicitly.
**Status:** Accepted · 2026-08-07 · Proposed: Claude (VS-0 map §3, CF-1 option a) · Ratified: JD (VS-1A ruling instruction of 2026-08-07, with the fixture-disposability condition)

## D-137 · [suite] · Authorization enforcement boundary — database-authoritative time, enforced at the mutation
D-131 defines WHO may act on a case: the canonical
organization/profile/role/assignment model, with `mayActOnCase` in
`@suite/case-model` as the single canonical *definition* of the active-
assignment question. D-131 is left intact; this decision answers WHERE that
authorization must be enforced.

**The rule.** For protected contributor mutations (today: profile-attributed
`audit_events` writes, actor form `profile:<profileId>`), authorization must
ALSO be enforced at the database mutation boundary, using database-
authoritative time. Application-layer checks (`mayActOnCase` and its
callers) provide preflight/UX behavior — fast refusals, useful messages —
but do not independently confer authority. The database's answer is final.

**Mechanics ratified:**
- **Database time is authoritative** for assignment activity. No local
  machine clock participates in an authorization decision; the app preflight
  obtains `now` from the database (`db_now()`), and the boundary check runs
  on the database's own clock. (Origin: the VS-1 harness flake of
  2026-08-07 — clock skew between the dev machine and the dev instance made
  a just-created assignment "not yet started".)
- **The boundary check serializes against revocation.** The enforcement
  trigger locks the relevant assignment rows (`FOR UPDATE`) before judging
  them, so a concurrent write and revocation order deterministically:
  whichever wins the row lock, the loser sees the winner's committed state.
  No interval exists in which a contributor is simultaneously revoked and
  authorized. Placement inside a trigger alone is NOT assumed to establish
  atomicity; the lock is the requirement.
- **The boundary mirrors the canonical rule exactly, plus profile liveness**
  (`deleted_at is null`). It must never be weaker than `mayActOnCase`; it is
  also not stricter — any active assignment role authorizes *attributable
  activity* (a reviewer's review is attributable), while role-based CONTENT
  gating remains `mayContributeContent` at the app layer until a content
  mutation path exists. RLS cannot serve as this boundary for these writes:
  the service-role write path bypasses RLS, so the trigger (migration 0008,
  precedent: 0007's Source-immutability triggers) is the enforcement point
  unless the service architecture itself changes — such a change would
  revisit this mechanism, not this rule.
- **Contract tests keep the layers aligned** (VS-1 suite, D-137 block):
  (1) started assignment → immediate write accepted; (2) ended assignment →
  immediate write refused; (3) a write reaching the database WITHOUT a valid
  preflight (the stale-preflight/TOCTOU shape) is refused by the boundary;
  (4) app/database clock disagreement → database time governs. A true
  two-transaction interleaving test of the lock ordering requires direct
  Postgres access the harness does not currently have (PostgREST holds no
  open transactions); it becomes mandatory when direct DB access enters the
  toolchain (district tier at latest).

Comment corrections accompany this decision: `contributors.ts` and
`attribution.ts` no longer describe `mayActOnCase` as the sole authorization
*answer* — it is the sole canonical *definition* and the preflight.
**Status:** Accepted · 2026-08-07 · Proposed: Claude Code + external review (ChatGPT), three-round exchange of 2026-08-07 · Ratified: JD (enforcement-boundary ruling of 2026-08-07: "Proceed, with D-131 left intact")

## D-138 · [suite] · Destructive tooling hard-fails outside known dev instances; checksum fix proven against the original failing structure (D-137-session follow-ups, resolved)
Two follow-ups relayed by JD (2026-08-08) from the review of the D-137
session's work, both logged and resolved here. JD's instruction referenced
"D-137"; that ID was already minted for the enforcement boundary, so the
follow-ups are recorded as this entry.

**1 · Hard dev-environment guard on destructive scripts.** The Avery re-seed
teardown was scoped by fixture name (`student_ref`), and the integration
harnesses scope deletes to rows they created — which protects the right rows
on the right instance, and protects nothing if the script is pointed at the
wrong instance. **Rule:** every script that deletes rows must call the shared
guard (`tools/assert-dev-instance.mjs`) before opening a database client. The
guard admits localhost and a committed allowlist of known dev project refs
(today: the single dev instance) and otherwise refuses with exit 3. **There
is deliberately no environment-variable override** — the only way to
authorize a new instance is to edit the committed allowlist in its own
commit, so every authorization is visible in history. Wired into all three
existing destructive scripts (`tools/seed-avery.ts`, the RLS harness, the
VS-1 harness); each now logs the verified target before any write. Binding on
future destructive tooling, including the D-135 auto-purge job's dev tooling
(the production purge job itself is a governed feature, not a dev script, and
is out of this rule's scope).

**2 · Corrected checksum proven against the exact structure that failed.**
The 2026-08-07 `canonicalChecksum` fix carried regressions on a synthetic
minimal submission; the defect-shape regression now locks the exact Avery
Williams teacher-response structure (bank v1.3.0, mixed open_text /
single_select / multi_select under question-id keys) — frozen in the engine
suite as a historical artifact independent of fixture evolution — and proves
both halves: (a) faithful reproduction — the pre-fix replacer-array
algorithm, reproduced verbatim, serializes that payload with
`"responses":{}` and hashes two different Avery submissions identically;
(b) the fix — the corrected algorithm distinguishes them, every submitted
question id and answer participates in the hashed serialization, and the
stored checksum recomputes from the payload alone.
**Status:** Accepted & resolved · 2026-08-08 · Proposed: external review follow-up (D-137 session) · Ratified: JD (log-and-resolve directive of 2026-08-08)

## D-139 · [PsychReport] · Meeting Brief availability: VS-2 gating is temporary scaffolding, not product behavior — trigger states OPEN for the Meeting Brief slice
VS-2 shipped Documentation Support with Meeting Brief gated on "report
approved" — chosen there only to avoid a dead control before any report
exists. JD's review (2026-08-08) accepts that as **temporary gating and
explicitly declines to ratify it as the product rule**: a psychologist may
want the Brief precisely to prepare for the eligibility/evaluation meeting,
potentially while still finalizing the report.

**At least three plausible availability states, recorded so the design space
is not narrowed by the scaffold:**
1. Report draft exists → preliminary Meeting Brief.
2. Report approved → final Meeting Brief.
3. The case record alone carries enough evidence, even with no completed
   PsychReport report → case-based Meeting Brief (the interesting one as the
   suite matures — Documentation Support consuming the canonical case
   directly, not just the report).

**Binding now:** do not change the VS-2 behavior; do not treat "approved
report required" as a constraint in any other design work. **OPEN:** the real
availability/trigger model is decided when Meeting Brief becomes a real
vertical slice (VS-6 in the current sequence), against these three states as
the starting frame.
**Status:** Accepted (interim gating) with the trigger model OPEN · 2026-08-08 · Proposed: Claude Code (VS-2 judgment call) · Ruled: JD (VS-2 review, 2026-08-08)

**Amendment note (2026-08-08, D-038 form) — JD's Meeting Brief family; two
classification questions OPEN against D-122.** JD articulated the artifact
shape the trigger model above was holding open: Documentation Support is a
**family of briefs keyed by meeting type, each with its own source basis**,
not one brief with maturity levels —
(1) **parent-friendly brief for the referral meeting**, based on RIE and other
provided details; (2) **brief for the eligibility meeting**, based on the
PsychReport; (3) **MDR briefs**; (4) **FBA briefs**. This confirms the D-139
reading that a pre-report brief organizes rather than synthesizes — it serves a
*different meeting*, not a degraded version of the eligibility brief — and it
confirms JD's ruling that where a report exists its synthesis is the spine of
the brief (the eligibility meeting is anchored on the report; a brief that
re-synthesizes could diverge from the signed document in the room where that
matters most).

**OPEN — two collisions with D-122 that JD must classify before any build:**
- **(a) Parent-friendly referral brief vs. the existing `Parent Summary` slot.**
  D-122 already names three standalone Documentation Support tools — Parent
  Summary, Meeting Brief, Information Request. Is the parent-friendly referral
  brief the Parent Summary tool, or Meeting Brief carrying a parent register?
  Naming and tool count both follow from the answer.
- **(b) MDR brief vs. D-122's district classification.** D-122 rules MDR
  Documentation a *district team tool* that "never appear[s] in a standalone
  case absent a separately licensed future commercial model." A brief that
  prepares a practitioner for an MDR meeting may be a distinct artifact from
  the district tool that produces determination paperwork — or may not. Under
  D-117 this is a scope boundary that cannot be narrowed or widened silently.

**Binding regardless of those answers (directive §11, Stage J):** no brief in
this family may generate a manifestation determination, eligibility
determination or category ranking, placement, service, SDI, final goal, or
final accommodation. The MDR and FBA members carry the sharpest form of this —
the manifestation answer and the FBA's function hypothesis are precisely the
questions their meetings exist to decide, so those briefs organize the record
for the team and never answer it.


> **Correction (2026-08-08, per D-038) to the amendment note above — the FBA
> claim was wrong and contradicted D-012. Original text preserved.**
>
> The note states "the manifestation answer and the FBA's function hypothesis
> are precisely the questions their meetings exist to decide, so those briefs
> organize the record for the team and never answer it." **The FBA half is
> incorrect.** Corrected by JD (2026-08-08, concurring with external review):
> the purpose of an FBA is precisely to analyze evidence and develop a
> hypothesis about behavioral function — that is clinical-analytic work, not a
> final team determination.
>
> **D-012 already ratified this** (2026-07-14): Evidence carries "optional
> hypothesized FBA function"; topography → construct mapping is
> "hypothesis-grade until corroborated"; **"Software may suggest; only
> converging evidence or the psychologist promotes a hypothesis to a
> finding."** Directive §11 permits the system to "organize, summarize, draft,
> compare, explain, and **propose**," and its prohibition list does not
> contain functional hypotheses; `operational-spec-v1.md` §4.4 ("Actionable
> hypotheses") governs how they are stated. A proposed functional hypothesis
> is therefore permitted, hypothesis-grade, human-promoted — the same posture
> as PsychReport's drafted interpretation under directive §9.5.
>
> **The manifestation half of the original sentence stands** (§11 names
> manifestation determinations explicitly). **The real FBA-adjacent boundary**
> is downstream of the hypothesis: the behavior plan's service, placement, and
> SDI consequences remain forbidden (§11, §9.7), as does routing an FBA into
> an eligibility determination. The line is *propose the hypothesis; never
> convert it into a service, placement, or eligibility verdict.*
## D-140 · [PsychReport] · Testing-session assertions require documented session evidence, enforced by a narrow post-generation adjudicator
**The defect this answers.** The first live VS-3 generation produced, against
the Avery fixture: *"Across both tasks, Avery read a limited number of items
correctly before reaching the discontinue criterion."* Nothing in the case data
documents item counts, discontinue events, or any testing-session behavior —
the case carries a teacher intake, a clinician interview summary, and a WIAT-4
score set. FIDELITY ("Invent nothing") and the DESCRIPTIVE_RESULTS mode
contract both prohibited that sentence. Both are prompt text, and the sentence
was generated anyway. Per D-141, that means nothing prevented it from reaching
the clinician.

**The rule.** PsychReport may describe testing-session events — including
administration procedures and mechanics, prompting, examinee behavior, effort,
engagement, rapport, pacing, and examiner support — only when those events are
documented in clinician-authored or clinician-verified testing-session evidence
supplied to that section's generation. Evidence supplied for one
testing-session dimension does not license assertions about another. Generated
prose may summarize or naturally rephrase such evidence, but may not materially
change documented frequency, intensity, duration, certainty, or valence; where
those dimensions are explicitly documented, the paraphrase must preserve them.
Hedged, conditional, or "consistent with" references to undocumented session
events fail identically to direct assertions — qualification reduces certainty,
it does not create an evidentiary basis.

**"Clinician-verified" is deliberate.** Dictated notes, imported testing notes,
and confirmed structured administration data all qualify. The condition is
professional verification, not manual typing.

**Enforcement — one rule, two points.**
1. **Before generation:** the existing structural refusal stands unchanged. A
   section whose mode is DIRECT_OBSERVATION with no observation source is
   refused rather than drafted from adjacent material.
2. **After generation:** a **narrow adjudicator** — a separate, closed-ended,
   server-side model call whose only question is whether the generated prose
   states or implies an administration event, examinee behavior, examiner
   action, or testing-session condition not documented in the session evidence
   supplied to that section. Structured return: `pass`,
   `unsupportedStatements[]`, `reason`.

**Mechanics ratified:**
- **Scope constraint is normative and lives in the spec**
  (`governance/session-fidelity-adjudicator-v1.md` §2), not only in the prompt
  string. The adjudicator must not evaluate general report quality, clinical
  interpretation, attribution outside this rule, or overall fidelity. Widening
  its question is a spec change requiring the same review as a change to the
  rule. The reason is operational: an adjudicator that drifts into general
  fidelity judging produces findings the clinician cannot act on, and a
  clinician who learns to dismiss the gate has no gate.
- **Runs on every generated section from launch. No lexical prefilter.** A
  filter that decides whether the safeguard runs is itself a safeguard, and a
  missed phrase is indistinguishable from having no check. The implementation
  runs on all five modes — a superset of the mode-derived eligibility, chosen
  because "this mode doesn't contain session content" is precisely the kind of
  prompt-level belief D-141 refuses to trust. A prefilter may be reconsidered
  post-launch, and only against measured recall on real usage.
- **Fails closed.** Call error, model refusal, missing or unparseable
  structured return, an internally contradictory verdict, or a quoted statement
  that does not appear in the section text — any of these means the section
  does not pass. A gate failure goes straight to needs-review with no retry:
  there is no named statement to instruct against, and re-rolling the draft
  does not repair the adjudicator.
- **Exactly one regeneration**, carrying a targeted instruction that names the
  unsupported statement verbatim and forecloses hedging as a fix. The
  regenerated section clears the **identical** gate — same adjudicator, same
  prompt version, same evidence set. The retry is not the remedy; the gate is.
  The bound is a loop constant in the orchestration and a CHECK constraint in
  the schema, not a convention.
- **Second failure surfaces to the clinician as needing review.** Never loop,
  never silently delete language: the prose is shown with the unsupported
  statements named, and the clinician decides.
- **Two kinds of test, deliberately separate.** Deterministic orchestration
  with a mocked adjudicator runs every commit and asserts the properties the
  judge cannot provide (reject, one retry, same gate, surface, fail closed). A
  six-case live evaluation runs periodically, not in CI, and measures the judge
  itself — including the exact Avery sentence against the exact Avery score
  set. A false alarm on innocent prose is treated as severe as a miss.
- **Persistence** (migration 0009, amended): generated text, generation model /
  prompt version / spec version, the supplied evidence set as a **snapshot**
  (supersession and section scoping make later reconstruction unreliable),
  adjudicator model and prompt version, the structured verdict and rejection
  reason, the retry record with the rejected draft preserved as its own frozen
  row, clinician edits, and append-only approval history. A CHECK constraint
  makes it impossible to store a machine-generated section that no gate judged.

**Explicitly rejected, not deferred:** claim-level Evidence binding,
character-span coverage validation, claim-type taxonomies, and sentence-level
source attribution in any form. That architecture degrades prose quality and
exceeds this defect. This decision adds one narrow fidelity gate for
testing-session fabrication and nothing else.
**Status:** Accepted · 2026-08-09 · Proposed: Claude Code (VS-3 continuation, from the first live-generation defect) · Ratified: JD (VS-3 fidelity-gate directive of 2026-08-09)

**Amendment note (2026-08-09, D-038 form) — deployment modes; measure before
enforcing.** JD's VS-3 continuation directive adds a `shadow` | `enforce`
deployment mode to the gate before it blocks anything in front of a clinician.
Nothing about the rule, the adjudicator's scope, or D-141 changes.

- **Configuration, not a code path fork.** The adjudicator runs identically in
  both modes — same model, prompt version, evidence set, and fail-closed
  validation. In `shadow` the verdict is recorded and the section proceeds; in
  `enforce`, the behavior ratified above. Default `enforce`; resolution fails
  safe, so any unrecognized configuration is stricter, never quieter.
- **Shadow does not regenerate.** Regeneration changes the output, which is
  enforcement, and it would destroy the number shadow exists to produce.
- **The mode is persisted on the generation record**, with distinct outcome
  values only shadow may write. Migration 0009 cross-constrains mode and
  outcome, so a shadow rejection cannot be stored as an enforced one or read
  as one later.
- **Rejected and unusable are distinct clinician-facing states.** Rejected
  names the statement and is about the draft; unusable says the check could
  not run and is not about the draft. A sustained adjudicator outage must not
  read to a clinician as the model suddenly writing badly. In shadow the
  clinician sees neither.

**Measured, 2026-08-09** (n=10 per case/condition, `governance/session-fidelity-adjudicator-v1.md` §9):
adjudicator catch rate **100%** (40/40), false-alarm rate **0%** (0/50),
unusable 0% (0/90). Drafting baseline with the D-140 block present 90% clean
first drafts vs. 80% without it — **a one-draft difference that does not
distinguish the two arms at this n, and is recorded as inconclusive rather
than as support for the block.** Retry resolution 3/3. The corpus was authored
alongside the prompt, so the false-alarm figure bounds nothing about real
usage; a shadow pilot is what answers that, reading the `would_enforce`
counterfactual column.
**Amendment status:** Accepted · 2026-08-09 · Proposed: Claude Code · Ratified: JD (VS-3 measure-before-enforcing directive of 2026-08-09)

**Amendment note (2026-08-09, D-038 form) — two scope tests promoted from model
judgment to specification.** The rule in D-140 is unchanged; what changes is
where the adjudicator's boundary is *written*. Both tests NARROW the gate.

- **The locating test (spec §2.1).** A claim is in scope only if it locates the
  event inside an encounter the evaluator conducted for this evaluation.
  Assertions about the classroom, the home, or any other setting are outside
  this gate regardless of phrasing and regardless of who reports them. The
  encounter decides, not the setting name — an evaluator's own classroom
  observation is an encounter, while a general claim about classroom
  functioning is not. Rationale: the adjudicator receives only session
  evidence and never the rest of the case, so it cannot distinguish a
  fabricated session event from a fact documented elsewhere in the case file;
  anything it cannot locate in an evaluator-conducted encounter must be left
  alone rather than guessed at. Widening its inputs to resolve this was
  considered and rejected — that would make it a general fidelity checker,
  which §2 forbids. Origin: a false positive in the 5-report run of
  2026-08-09 on "comprehension improves markedly when text is read aloud to
  him," which is documented in the teacher interview.
- **Task demand versus asserted behavior (spec §2.2).** Naming what a task
  requires is not asserting anyone watched the examinee do it; the line is
  whether the examinee is the actor. Origin: one report produced both forms of
  the same activity and the gate split them correctly — but the distinction was
  emergent from model judgment, which is exactly what §2 being normative
  exists to prevent. The specification wording is the adjudicator's own
  articulation, promoted.

Versions move because the boundary moved: spec `session-fidelity-adjudicator-v1.1`,
prompt `session-fidelity-adjudicator-prompt-v2`, both persisted per generation.
Six regression cases pin the two tests (spec §8.2 cases 10–15), including the
two phrases from the live run; cases 10/11 must split and 13/15 must diverge.
Re-measured at 15 cases × 10: catch 100% (60/60), false alarm 0% (0/90),
unusable 0% (0/150).
**Amendment status:** Accepted · 2026-08-09 · Proposed: Claude Code · Ratified: JD (scope-narrowing instruction of 2026-08-09)

**Amendment note (2026-08-10, D-038 form) — §2.2 narrowed from actor to
manner.** The rule in D-140 is unchanged. What changes is the adjudicator's
boundary, and it narrows again.

The 2026-08-09 amendment promoted the adjudicator's own articulation to
specification: "the line is whether the examinee is the actor," gerunds out and
finite verbs in. **That was syntactic, and it was wrong in a way the corpus
could not show.** The drafting prompt's VOICE block requires the examinee as
subject — *"The student is the subject of nearly every sentence. The verbs are
things a person can be seen doing — read, retained, lost track of,
performed"* — so the gate and the voice specification disagreed about the same
sentence shape. Across two five-report runs it produced every clinician-visible
finding, and the retry could not escape a rule the voice spec required: in one
report the model removed a genuine fabrication and its clean replacement was
flagged too.

**The narrowed rule is semantic.** A statement with the examinee as subject is
a session assertion only where the verb describes HOW the task was gone about —
strategy, approach, effort, pace, hesitation, self-correction, asking for help.
Where it describes WHAT was achieved — accuracy, level, standing relative to
age, comparison between tasks — it is a result, whoever the grammatical
subject is. Naming the task an instrument administers is naming the measure.
Administration mechanics, examiner actions, and session conditions are exempt
from the distinction and remain in scope by their own definitions, so item
counts and discontinue events are still caught.

Option 2 (exempting DESCRIPTIVE_RESULTS) was rejected: making the gate's scope
depend on which section it judges is the prefilter shape the spec refuses — a
rule that decides how hard the safeguard looks is itself a safeguard. Option 3
(amending VOICE) was rejected because VOICE is right; it was the gate that had
drifted.

Versions: spec `session-fidelity-adjudicator-v1.2`, prompt
`session-fidelity-adjudicator-prompt-v3`, both persisted per generation. Five
new regression cases (spec §8.2 cases 11, 16–19); **11 and 16 must split**, and
**19 guards the exemption** — if it ever passes, the manner test has swallowed
administration mechanics and the original discontinue-criterion defect is
unguarded again. Re-measured at 19 cases × 10: catch 100% (80/80), false alarm
0% (0/110), unusable 0% (0/190).
**Amendment status:** Accepted · 2026-08-10 · Proposed: Claude Code · Ratified: JD (§9.7 narrowing ruling of 2026-08-10)

**Amendment note (2026-08-10, D-038 form) — §2.2 replaced: score-supported
performance versus testing-session events.** D-140's rule is unchanged. This
supersedes both earlier formulations of the adjudicator's §2.2 in operative
form; the originals are preserved in the spec's §9.7 record.

**The ruled text.** §2.2 distinguishes score-supported task performance from
testing-session events. An examinee serving as the grammatical subject of a
finite verb does not, by itself, constitute an asserted observation. Verified
score or response data may support statements describing the task performed,
the level of performance, and clinically appropriate comparisons or patterns.
Clinician-authored or clinician-verified testing-session evidence is required
for statements describing administration mechanics, response process or
strategy, manner, pacing, effort, engagement, affect, prompting, examiner
support, self-correction, or other behavior occurring during the session.
**When a sentence combines supported performance with an unsupported process
characterization, the entire sentence fails** until the unsupported
characterization is removed or supported.

§2.1's settings narrowing is unchanged and layered above this. **VOICE is
preserved unamended. No mode exemptions; adjudication continues across all
modes.**

**One implementation clause was required that the ruling did not state.** Its
must-pass set contains "Avery read printed words and *decoded* unfamiliar
letter strings with comparable difficulty" — and "decoded" is both the name of
an administered subtest and, in ordinary usage, a near-synonym for "sounded
out", which the ruling puts on the must-fail side. Without a clause anchoring
subtest-naming verbs to the measure the adjudicator split on the same verb
(10/10 versus 4/10 on near-identical sentences). The clause is recorded in the
spec as derived from the ruled corpus rather than added to the rule.

**Measured, 42 cases × 10 = 420 adjudications:** catch 100% (239/240), false
alarm **0%** (0/180 across 18 clean cases), one call failed closed. Every ruled
sentence lands where the ruling puts it. Two of the session's own expectations
were wrong and the corpus said so: the report-5 gerund case bundled an effort
characterization and correctly fails under the combination rule, and "the three
clean replacements" are two distinct sentences, one of which contains pacing
and effort and correctly continues to fail.

Versions: spec `session-fidelity-adjudicator-v1.3.1`, prompt
`session-fidelity-adjudicator-prompt-v5`, both persisted per generation.
**Amendment status:** Accepted · 2026-08-10 · Proposed: JD (ruled text) · Ratified: JD (§2.2 replacement of 2026-08-10)

## D-141 · [suite] · A safeguard is code that can reject output; no prompt-level instruction may be represented as one
**The rule.** No prompt-level instruction may be represented — in a
specification, a decision record, a status report, marketing copy, or a claim
made to a customer — as a safeguard. A safeguard is code that can reject
output. Prompt instructions steer a model; they are a quality input, and they
are worth writing well, but they cannot be relied on, tested for enforcement,
or counted as protection. Anything that cannot refuse is not a control.

**Scope: `[suite]`.** This binds the QA Engine as well as PsychReport (D-117:
a suite rule states a shared principle each product implements in its own
context). For PsychReport it means every generation-time protection must have a
rejecting counterpart in code. For the QA Engine it means the same standard the
engine already applies to its own Layer B — the Finding constructor caps status
rather than the prompt asking it to; the evidence-grounding guard drops
unmatched quotes in code — applies to every protection the engine claims,
including any it claims about how reports are produced.

**What this generalizes.** Rule 3.7 of `operational-spec-v1.md` said: *"Do not
represent the validity resolver as an active safeguard until its payload,
invocation, and tests are wired in production. During quarantine, disclose the
implementation gap internally and prevent dependent features from claiming
protection they do not yet have."* It was written as an implementation
condition about one resolver (D-099's finding: the live `callMode` invocation
passed only `{data}`, so the entire ceiling architecture was specified and
switched off). The principle it instantiated is not specific to that resolver,
and the VS-3 discontinue-criterion sentence (D-140) is the same failure in a
different place: a prohibition that existed only as prompt text, described as
though it protected something.

**Rule 3.7 is retired as fulfilled.** Its condition is met — the payload is
wired (`GenerationInputs` cannot be constructed without every source's
interpretation policy), the canonical resolver is invoked (`effectiveCeiling`
in `@suite/reasoning-contracts`, and `apps/psychreport/lib/source-policy.ts`
defines no resolver of its own — D-118's divergent duplicate lived in the
legacy vanilla-JS app that VS-3 replaced), and the tests exist
(`apps/psychreport/tests/prompts.test.ts`,
`apps/psychreport/tests/source-policy.test.ts`). The historical rule text and its rationale are
preserved above and in the spec's own retirement note; retirement is not
deletion.

**Practical consequences, binding now:**
- A specification may not describe a prompt block as a control. It may describe
  it as guidance, and must name the code that enforces the same rule — or state
  plainly that none exists yet.
- "Gate," "guard," "enforced," "prevented," and "cannot" are reserved for code
  paths that can return a rejection. Where only a prompt instruction exists, the
  honest words are "instructed," "asked," or "steered."
- A build item is not complete because its prompt text was written. The
  completion condition is a rejecting code path plus a test that proves it
  rejects.
- Nothing here reduces the value of good prompt authoring. D-110 and D-111
  (minimum-necessary prompt, preserve escape hatches) are unaffected. The
  claim being regulated is what a prompt *guarantees*, not whether it helps.
**Status:** Accepted · 2026-08-09 · Proposed: Claude Code (VS-3 continuation, generalizing Rule 3.7 / D-099 at JD's instruction) · Ratified: JD (VS-3 fidelity-gate directive of 2026-08-09)
