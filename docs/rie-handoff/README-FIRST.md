# Referral Intelligence Engine — Build Handoff

**Package version:** 0.1 · **Prepared:** 2026-07-29  
**Implementation posture:** Production rebuild informed by a validated prototype.

## Governing rule

Preserve the product reasoning, clinical constraints, evidence model, and ratified decisions. Rebuild the implementation. The prototype is an interaction reference, not production source code or a clinical-content authority.

When sources conflict, use this order:

1. Ratified entries in the canonical `decisions.md`, including later amendments.
2. Shared contracts in `@suite/case-model`, `reasoning-contracts`, and the versioned taxonomy.
3. This handoff package.
4. Versioned teacher and parent question banks.
5. Prototype behavior and appearance.

If implementation requires contradicting levels 1–3, stop and create a proposed decision entry. Do not silently diverge.

## Read in this order

1. `01-product-requirements.md`
2. `02-decision-reconciliation.md`
3. `03-interaction-and-ux-spec.md`
4. `04-clinical-content-spec.md`
5. `05-data-and-technical-architecture.md`
6. `06-llm-and-assistant-spec.md`
7. `07-acceptance-tests.md`
8. `08-open-questions-and-roadmap.md`

## Build target

The first production vertical slice is:

> Psychologist creates a minimally identified case → sends a secure teacher intake → teacher completes the four-step form → RIE stores the exact Source → deterministic extraction creates Evidence → source-faithful generation creates evidence-linked Claims → psychologist reviews and approves → approved content exports.

Parent intake, upload extraction, AI-selected approved follow-ups, Assessment Planning, and the suite assistant follow as separately gated increments unless a new decision changes the sequence.

## Prototype reference

Current interaction prototype:  
https://rie-intake-prototype.ngsjq7pfqx.chatgpt.site

Approved concepts demonstrated by the prototype:

- Upload, email, link, and QR entry points.
- Form-specific configuration under a Forms library.
- Four-step teacher and parent respondent flows.
- Grade/developmentally relevant content.
- Hybrid response formats.
- Source-faithful summary review.
- Psychologist-facing Assessment Planning concept.
- Persistent suite-assistant concept.

Prototype-only:

- Exact code and components.
- Exact question wording.
- Exact scale assignment by domain.
- Current test recommendations.
- Current parent-domain structure.
- Current visual design.

## Definition of “complete build”

A complete MVP is not merely a deployed interface. It includes:

- Authenticated psychologist account.
- Secure invitation tokens and respondent sessions.
- Encrypted retained storage and deletion controls.
- Immutable bank and prompt/schema/model version pins.
- Deterministic routing and completeness checks.
- Source → Evidence → Claim provenance.
- Psychologist review and approval.
- Audit logging, accessibility, automated tests, operational documentation, and a data-posture statement.
- No live student pilot until district governance and contract/IP requirements are cleared.

