# 01 — Product Requirements

## Product definition

RIE is the referral-triage and planning module of the Psych Suite, an AI-supported clinical quality platform for school psychologists. It sits above ECATS, PowerSchool, Frontline, EasyIEP, and comparable systems rather than replacing them. Its moat is structured evidence, provenance, clinical reasoning, and defensibility—not case-management data entry or generic summary generation.

## One-year aspirational outcome

Within one year of production launch, a school psychologist should be able to collect or upload teacher and parent input, understand the student across clinically relevant domains, identify material gaps, review a faithful evidence-linked summary, and begin defensible assessment planning in materially less time—without transferring professional judgment to the software or imposing an unnecessarily long form on unpaid respondents.

## Primary users

- Account holder: individual school psychologist in MVP.
- Respondents: teacher/specialist and parent/guardian.
- Future: district administrators and multidisciplinary collaborators; no Organizations/Schools layer in MVP.

## Core value loop

1. Collect structured or uploaded respondent information.
2. Preserve each submission as a Source.
3. Extract atomic Evidence without unsupported inference.
4. Render placement-agnostic, source-faithful domain summaries.
5. Let the psychologist inspect sources, contradictions, gaps, and provenance.
6. Approve content for export to PsychReport or district workflow.

## MVP functional requirements

### Cases

- Create a case with minimal, pseudonymous student information.
- Support one student conceptually having multiple cases over time.
- Record referral source, concern onset, and contributing informants as distinct fields.
- Provide per-case deletion and configurable auto-purge.

### Intake entry points

- Upload an existing PDF, DOCX, image, or text form.
- Send a secure teacher intake by email link.
- Produce a secure link and QR code.
- Parent intake uses the same delivery model when enabled.

### Forms

- Forms library contains Teacher Intake and Parent/Caregiver Intake.
- Each form exposes Preview, Configure Questions, version information, and usage status.
- Configuration belongs to the form; no permanent top-level Configure Domains navigation.
- Allow optional case-specific overrides without mutating the published bank.

### Respondent experience

- No respondent account.
- Invitation token establishes a signed, HTTP-only respondent session.
- Display first name and last initial only; do not expose full identity in links or logs.
- Autosave, resume, progress display, validation, explicit submission, and submission locking.
- Mobile-first and WCAG-conformant.

### Adaptive behavior

- Layer 1: deterministic branching.
- Layer 2: deterministic completeness rules.
- Layer 3: model selects only from an approved follow-up bank; deferred until its phase.
- No unrestricted model-authored interview questions in MVP.
- Concern selection changes depth, not the existence of essential baseline consideration.
- Grade/developmental routing removes categorically irrelevant content.

### Review

- Show generated content beside or linked to the exact source evidence.
- Surface contradictions rather than resolving them.
- Separate missing information from no concern.
- Allow section approval, editing, rejection, regeneration, and source inspection.
- Export only approved content.

## Explicit MVP exclusions

- District/organization administration.
- SSO, SIS integrations, SMS, voice input, multilingual forms.
- Autonomous interviewing.
- Parent conversational AI.
- Automated assessment-battery selection.
- Eligibility or diagnosis determination.
- Live surveillance feeds, outcome-prediction ML, or student-risk prediction.

## Phased capabilities

- Uploaded-form extraction.
- Parent intake after its open questions are resolved.
- AI-selected approved follow-ups.
- PsychReport import with provenance.
- Assessment Planning support.
- Case-aware suite assistant.
- District tenancy and dashboard.

## Release gates

- No hard maximum question count is a product requirement.
- Pilot measurement must include median completion time, abandonment, domain skip patterns, follow-up rate, correction rate, unsupported-claim rate, and respondent satisfaction.
- A bank version does not ship merely because it validates structurally; it must demonstrate acceptable completion and clinical yield.

