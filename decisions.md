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
