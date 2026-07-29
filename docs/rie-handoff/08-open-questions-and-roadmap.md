# 08 — Open Questions and Roadmap

## Parent form: decisions genuinely open

These are not adopted merely because the prototype displayed them.

### P-OPEN-01 — Canonical domain set

Decide whether the parent bank uses:

- The current 10-module v1.0.0 bank structure.
- A smaller user-facing four-step structure with modules nested beneath it.
- A revised domain set aligned more directly to the shared taxonomy.

Required ruling: distinguish clinical storage domains from parent-facing navigation labels.

### P-OPEN-02 — Universal baseline vs. concern-triggered depth

Decide which parent domains receive:

- Universal structured baseline.
- Concern-triggered full treatment.
- Sensitive-topic gating.
- Optional/skippable treatment.

Do not assume the teacher tier model transfers unchanged. Parents have broader historical access but some questions are more sensitive and less reliably recalled.

### P-OPEN-03 — Response formats

Determine item by item whether parent content uses comparison, frequency, independence/support, single choice, checklist, or open text. “Don’t recall/not sure,” “prefer to discuss,” and “not applicable” may be distinct from “not observed.”

### P-OPEN-04 — Parent/teacher disagreement

Decide how cross-informant disagreement appears:

- Preserve separately with side-by-side attribution.
- Flag only when responses address the same construct and comparable context.
- Define when a discrepancy warrants a psychologist-facing follow-up.
- Never ask the system to reconcile which informant is correct.

This requires shared case-level logic; it does not belong inside either source-faithful summary.

### P-OPEN-05 — Developmental-history sensitivity

Rule on pregnancy/birth, early development, trauma/life events, diagnoses, medications, family composition, and services:

- Required vs. optional.
- Skip/prefer-to-discuss options.
- Sensitive-topic gating.
- Data minimization.
- Help text and storage/retention.

### P-OPEN-06 — Regression and school change

Preserve the previously added lifetime regression and “school change for cause” concepts, but ratify exact wording, routing, safety significance, and summary treatment in the next parent bank.

### P-OPEN-07 — Parent summary output

Decide:

- Same per-domain structure as teacher summary or parent-specific ordering.
- Whether developmental history is a separate block.
- How parent questions/hopes appear.
- Rules for rendering “don’t recall,” skipped, and prefer-to-discuss responses.

### P-OPEN-08 — Parent pilot timing

The July 14 canon makes teacher form the lower-sensitivity pilot. Decide what evidence clears the parent form for live pilot.

## Teacher bank open questions

- Final response format per item/domain.
- Revised v1.5.0 domain/module structure.
- Four-band mapping and developmental override.
- Which baseline items are required.
- Maximum reasonable adaptive follow-up per session based on pilot data.
- Behavior repeat-group burden and cap.
- Safety help text and operational escalation.
- Clinical validation of cognitive/learning wording.

## Product open questions

- Product/company name remains unresolved; RIE is the scope label.
- Claude vs. provider-neutral model adapter: canon names Claude API, architecture should preserve adapter boundaries without reopening the initial provider choice silently.
- Final production hosting and identity vendor.
- Data-retention defaults.
- District pilot and data-governance approval.
- Staffing-agency IP/outside-work contract review.
- Whether Assessment Planning or the suite assistant advances into MVP; requires a decision.

## Roadmap

### Phase 0 — Reconcile content and decisions

- Log D-089 supersession/amendment.
- Ratify teacher v1.5.0 response model.
- Resolve parent open questions.
- Publish data-posture document.
- Freeze synthetic golden fixtures.

### Phase 0.5 — Shared contracts

- Verify/build `@suite/case-model`.
- Align taxonomy and question-bank schema.
- Align SpEd QA intermediate representation.

### Phase 1 — Intake foundation, no AI

- Cases, authentication, secure invitations, QR.
- Versioned rendering, autosave, deterministic routing/completeness, submission locking.
- Teacher vertical slice.

### Phase 2 — Extraction

- Responses/uploads to Evidence.
- Validation, quote verification, missing-data and contradiction flags.

### Phase 3 — Narrative and review

- Evidence-only Claims.
- Source-linked review, section approval, secure export.

### Phase 4 — Approved-bank adaptive follow-up

- Model selects from approved questions.
- Evaluation and monitoring.

### Phase 5 — Parent intake and PsychReport integration

- Sequence parent release based on resolved decisions and pilot posture.
- Approved section import with provenance.

### Phase 6 — Assessment Planning and suite assistant

- Implement only after explicit scope decision, evidence evaluation, permissions, and safety tests.

### Phase 7 — District readiness

- Organization tenancy, SSO/integrations as separately approved work.
- Security/privacy review, accessibility, penetration testing, incident response, support, and district controls.

## First implementation ticket

Create the teacher-intake vertical slice using synthetic data only. Acceptance requires tests 1–5, 8–14, 18, 23–35, and 36–42 from `07-acceptance-tests.md`. Do not begin assistant, Assessment Planning, or district administration work in the first slice.

