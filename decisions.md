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
**Status:** Accepted · 2026-07-14 · Proposed: Claude · Ratified: JD ·
**Corrected 2026-07-18 (see D-033): current taxonomy version is v0.4, not v0.3.**

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

## D-021 · Repo is an npm-workspace monorepo
psychflow-suite ships a root package.json declaring workspaces for
case-model, content, and referral-engine-core. It is the source of
truth for local @suite/* resolution: install once at the root, never
per-package (the @suite/* names are local, unpublished, and 404 against
the registry). Cross-package test imports are by relative path.
**Status:** Accepted · 2026-07-16 · Ratified: JD

## D-022 · Per-package install flow superseded
The standalone per-package `npm install` in docs/phase1-session1-brief.md
is superseded by the workspace-root install (D-021). From the repo root:
`npm install`, then `npm test --workspace <name>`.
**Status:** Accepted · 2026-07-16 · Ratified: JD

## D-023 · Package export hygiene
Package export hygiene — referral-engine-core declares main; case-model index
avoids duplicate star exports of ConstructId/Topography. Consumers import
@suite/* by bare name.
**Status:** Accepted · 2026-07-16 · Ratified: JD

## D-024 · Respondent session model
Respondents have no account. The invitation token is validated once at
`/r/[token]` (`checkInvitation`) and exchanged for a **signed, HTTP-only
session cookie bound to that one invitation**. All later autosave/submit calls
are authorized by that cookie — never by re-presenting the token, never by a
Supabase identity. A cookie minted for one invitation cannot act on another
(`authorizeRespondent`). Because React Server Components cannot set cookies,
`/r/[token]` is a route handler that sets the cookie and redirects to the form.
**Status:** Accepted · 2026-07-16 · Ratified: JD

## D-025 · Evidence-tier ladder; T1-obs is a distinct tier
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
**Status:** Accepted · 2026-07-18 · Proposed: JD (settled) / Claude (implementation) · Ratified: JD

## D-026 · Affirmative capture scoped to Cognitive and Adaptive only
The 1.3.0 instrument adds affirmative screeners (T2/T3 data) for Cognitive and
Adaptive only. *Rejected:* adding them for Written Expression, Math, Behavior,
Communication, and Motor now. Reason: Cognitive and Adaptive carry rule-out weight
for intellectual disability, so an affirmative "within/above" reading is
clinically load-bearing there; and every added follow-up costs completion rate on
an instrument already near ~31 shown items. The ladder itself is built
domain-agnostic (P29), so later expansion to the other domains is an INSTRUMENT
VERSION BUMP, not a spec migration.
**Status:** Accepted · 2026-07-18 · Proposed: JD (settled) / Claude (implementation) · Ratified: JD

## D-027 · Closed lists over stated principle for licensed T2/T3 language
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
**Status:** Accepted · 2026-07-18 · Proposed: JD (settled) / Claude (implementation) · Ratified: JD

## D-028 · Derived concern set; screeners never mutate the base answer
Cognitive/Adaptive affirmative screeners can ADD a domain to a DERIVED concern set
(`concernSet = CORE-008 selections ∪ {domains rated "below" on a screener}`),
carrying per-domain entry provenance (`via: core-008 | screener`). Branch rules
BR-010/BR-012 are repointed at the computed `$concernSet` (engine-injected), not at
CORE-008. *Rejected:* writing a screener "below" back into CORE-008's stored answer
(the concern set it populates). Reason: that corrupts the verbatim record — a
downstream audit would misreport what the teacher selected — the same class of
error as the referral-source/onset collapse (D-030). *Also rejected:* a second
branch rule per domain (two entrances to maintain). Screeners are always-shown,
suppressed once the domain is flagged on CORE-008, capping the cost at two items.
**Status:** Accepted · 2026-07-18 · Proposed: JD (settled) / Claude (implementation) · Ratified: JD

## D-029 · Block scope declared everywhere, enforced on RfR only
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
**Status:** Accepted · 2026-07-18 · Proposed: JD (settled) / Claude (implementation) · Ratified: JD

## D-030 · Referral source, concern onset, contributing informants are three fields
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
**Status:** Accepted · 2026-07-18 · Proposed: JD (settled) / Claude (implementation) · Ratified: JD

## D-031 · Question banks are stored as versioned files (honors D-013)
Bank storage moves from a single mutable `teacher-form.v1.json` to per-version
files: `teacher-form.v1.2.0.json` is frozen (byte-identical to the prior
published bank) and `teacher-form.v1.3.0.json` is added. This honors D-013
("published bank versions are immutable; changes create a new version") at the
file level, so a completed response's version pin stays resolvable. The app and
engine load the latest published version (1.3.0); golden fixtures keep their own
pins (fixture #1 → 1.2.0, fixture #2 → 1.3.0). *Rejected:* bumping the single file
in place and re-pinning fixtures — re-pinning defeats what a pin is for (the v0.6
fixture #2 draft is only reproducible if the bank it names still exists).
**Status:** Accepted · 2026-07-18 · Proposed: JD (D-013 resolution) / Claude (implementation) · Ratified: JD

## D-032 · Case Data Model version bump 0.2.0 → 0.3.0
`@suite/case-model` bumps 0.2.0 → 0.3.0 for the D-030 referral-provenance fields,
the shared `InformantRole`, and the `BlockRegistry` contract (D-029). Additive;
existing entities unchanged except `Case` (new fields) and `Informant.role`
(refactored to the shared enum, same values).
**Status:** Accepted · 2026-07-18 · Proposed: Claude · Ratified: JD

## D-033 · Correction: taxonomy current version is v0.4 (was mislabeled v0.3)
D-011's closing line ("Current version: v0.3") went stale when the taxonomy was
bumped to v0.4 (`taxonomy.v0-4.json`; case-model tests assert "0.4"). The stale
label was the demonstrated cause of a downstream error in a work prompt (a
"bump from 0.3" instruction for the Case Data Model, which was actually at 0.2.0).
Logged as an explicit correction rather than a silent edit so the episode is on
record. Current taxonomy version: **v0.4**.
**Status:** Accepted · 2026-07-18 · Proposed: Claude · Ratified: JD
