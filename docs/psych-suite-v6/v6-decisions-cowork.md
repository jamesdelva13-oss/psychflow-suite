# Decision Log — Ratified

Product: multidisciplinary evaluation platform (all names temporary).
Status of every entry below: **Ratified** (owner: James Delva, August 2026).
These decisions supersede all earlier prototype directions (v1–v5). Any change requires an
explicit new entry here — do not re-litigate them inside build tasks.

---

## D1 — Product philosophy

Every feature must remove or dramatically reduce work from the clinician's current week,
without creating new workflow burdens. If a feature does not reduce work today, it lives
behind the scenes or not at all. The interface must always appear simpler than the work it
is doing: if the system runs twenty checks, the clinician sees one sentence. Progressive
disclosure everywhere — detail on request, never imposed.

## D2 — Reasoning lives in the architecture, not the UI

The internal case model (provenance, evidence links, cross-section and cross-report
consistency checks) is retained and invested in — it is the machinery that makes
multidisciplinary cohesion possible. It is never surfaced as dashboards, badges, claim
types, source ceilings, or status chrome. The clinician experiences "this understands
evaluations"; the architecture is why reports never contradict each other.

## D3 — Structured input: infer convenience, require accountability

The AI infers everything inferable from uploads, notes, forms, and prior reports.
Explicit clinician confirmation is REQUIRED wherever a signature carries legal weight:

- Score verification
- Administration-validity confirmation
- Clinical conclusions
- Eligibility representations
- Final attestation
- Export approval

This is deliberate calibration between two failure modes: rule-heavy "engineer's UI"
(original) and full inference with no accountability structure (overcorrection). Neither
is acceptable.

## D4 — Three product categories, never conflated

1. **Standalone evaluation products** — PsychReport, Speech, OT. Each is complete and
   independently purchasable: own case/client list, ingestion, templates, assessment
   library, writer, assistant, review, export, settings. Full loop with no district
   dependency: case → upload → draft → review → template → export. Each feels complete,
   never like a restricted district account.
2. **District platform** — a coordination layer, not another writer. Licenses products and
   adds: shared student record, shared demographics/background, team assignments, shared
   timeline, cross-report consistency, developing integrated summary, admin/permissions,
   coordinated eligibility preparation.
3. **Team documentation** — case tools, not disciplines: IEP Drafting, MDR Documentation,
   Eligibility Preparation, Meeting Brief. Downstream, event-driven, reuse the case
   record. Not in standalone shells unless separately purchased. Capped at these four
   unless a new tool both reuses the case record and removes meaningful work.

Sped QA is a separate review product (second-reader review, packet-level checks, district
rubrics, formal findings, remediation). Writers keep only lightweight preventive
safeguards.

## D5 — Distribution: bottom-up, individually ratifiable

Entry is the individual purchase in three provable markets (psych, speech, OT). Cohesion
is a layer that **activates** when providers on the same evaluation are on the platform —
not a bundle that is sold. The district purchase is the expansion event that formalizes
organic team usage; it is never the entry motion. The integration bar: if the only
integration is a shared homepage, it is a bundle, and the bundle has failed. Integration
must remove repeated work (enter student once, upload records once, write shared history
once, propagate demographics, reuse approved information, detect cross-report
inconsistency, prepare the integrated summary).

## D6 — Organization and profile isolation

Records never cross organizations or private-practice profiles implicitly. Access occurs
only through explicit case assignment, invitation, or authorized transfer, with purpose,
permissions, provenance, and revocation recorded. Within a district, ordinary role-based
team assignment suffices — users do not manually share every case artifact. Same human,
separate worlds: one person may own a private-practice profile and belong to a district
team; their caseloads never bleed in either direction. FERPA/HIPAA-relevant; build it
into the data layer from the start.

## D7 — Navigation

District: **case-first and role-aware.** Users enter through Cases. Inside a case:
Overview · Case Materials · Evaluations · Team Documentation · Timeline. The rail stays
minimal and shows only products the district licenses AND the user's role warrants. No
disabled "coming soon" entries anywhere.

Standalone: **product-first.** PsychReport: Home · Cases · Assessment Library · Templates.
Speech Studio / OT Studio: Home · Clients · Assessment Library · Templates. No team
features present or implied. PsychReport defaults to school-based vocabulary
(students/cases); a practice-type setting switches to private-practice vocabulary
(clients).

## D8 — The assistant

Persistent and prominent, not a corner button. Product homes open with a conversational
starting point ("What do you need to get done?") that routes to ingestion, drafting,
retrieval, or an existing case. The writer has a right assistant rail: open by default on
wide screens, collapsible to a clear vertical handle without losing the conversation,
selected-text mode on highlight, prominent bottom sheet on narrow screens. Grounded in
the current case and active document. Every state-changing response ends with an explicit
action (Preview change · Apply revision · Add to draft · Keep current version). It never
silently changes approved content. Smart interruptions arrive through the assistant as
conversation.

Interruption bar: interrupt only when the answer materially changes the draft, the
clinician is accountable for verifying it, or proceeding silently creates meaningful
risk. Every missing field is NOT an interruption.

## D9 — Versioning and approval

AI changes are proposals. Accept/reject controls; approved content is protected from
silent regeneration; stale markers when new evidence affects approved text; comparison
with the prior version. Accurate audit history throughout.

## D10 — Human-decision boundary

The system never generates eligibility verdicts, category rankings, defensibility
scores, or manifestation determinations. Eligibility Preparation organizes evidence by
criteria, surfaces unanswered team questions, summarizes exclusionary-factor
consideration, and preserves each evaluator's conclusions. The IEP tool does not convert
findings into placement, services, SDI, final goals, or accommodations — AI proposes
reviewable drafts; teams decide. The objective is a defensible human-decision boundary
and accurate audit history.

## D11 — Publisher-content boundary

Assessment libraries store test metadata, constructs, score structures,
publisher-approved descriptors, and clinician-entered results. Never copyrighted items,
protocols, proprietary norm tables, or reproduced manual content.

## D12 — MDR is incident-driven

MDR appears under Team Documentation, in the relevant student case, and as a
deadline-sensitive home item only while active. It never permanently occupies visual
space equal to daily evaluation writing. Two-prong organization, incident evidence,
disability-related evidence, IEP/BIP implementation records, service-delivery
documentation. The platform prepares the meeting brief; the team makes the determination.

## D13 — Sequencing

1. Each product's magic moment undeniable on its own (polish beats breadth).
2. The sharing moment between any two products.
3. District tier packaged only once organic team usage exists.

The **invitation flow** (standalone user shares a case with an off-platform provider, who
lands in a working product with the shared background already written) is **v7's first
feature** — it tests acquisition, permissions, data ownership, and standalone-to-platform
conversion simultaneously. It is deliberately NOT in v6; do not add it early.

## D14 — Language kept verbatim

"Added once, available where it belongs." — retained through to marketing copy.
