# 03 — Interaction and UX Specification

## Information architecture

Primary navigation:

1. Cases
2. New Intake
3. Forms
4. Assessment Planning — phased

The suite assistant may appear persistently for authenticated psychologists when its phase is enabled. Respondents never see psychologist navigation or the assistant.

## Psychologist: New Intake

1. Choose Upload Existing or Send Secure Intake.
2. For Send, choose student/case, respondent type, delivery method, and form version.
3. Optionally open “Adjust questions for this case.”
4. Send email, copy link, or generate QR.
5. Show invitation status, expiry, and revoke/regenerate controls.

## Forms library

Each form card shows description, published version, status, estimated completion data when available, Preview, Configure Questions, and Version History.

Configuration screen:

- Domain list.
- Concise baseline/full-treatment designation where supported.
- Preview exact questions and response formats.
- Enable/disable optional questions for a case.
- Add a case-specific question without mutating the bank.
- Display grade-band applicability.
- Save a reusable draft only with explicit name and versioning.

## Teacher respondent flow

### Step 1 — About your work with the student

- Role.
- Duration and frequency of contact.
- Instructional settings/subjects.
- Opportunity to observe.
- Strengths and interests.

Purpose: establish observation scope before interpreting domain responses.

### Step 2 — What have you noticed?

- Display grade/developmentally appropriate domain accordions.
- Each accordion states the response instruction.
- Use required scales when every response state is clinically meaningful.
- Use check-all-that-apply when selection identifies nonexhaustive examples.
- Use single choice for observation status or global comparison.
- Show progress per domain without interpreting answers.

**Not observed presentation**

- Always-visible scale option: “Not enough opportunity to observe.”
- Never hide it inside help text.
- Selecting it completes the item but does not clear the domain.
- If a whole domain is unobservable, allow one domain-level action to mark remaining applicable items not observed, with confirmation.
- Store as an explicit response state, not null and not “no concern.”

### Step 3 — Relevant follow-up

Display only questions licensed by:

1. A deterministic branch triggered by a response.
2. A deterministic completeness rule identifying a material gap.
3. In the later adaptive phase, model selection from the approved follow-up bank.

A follow-up is material only when it clarifies at least one of:

- Observable behavior/skill.
- Context or setting.
- Frequency, duration, or intensity when the respondent can report it.
- Functional impact.
- Support or intervention attempted and response.
- Safety information.
- A contradiction within the same submission.

Do not ask a follow-up merely to create fuller prose. Do not generate unrestricted questions. Avoid multiple outreach attempts by resolving material gaps within the original session when possible.

### Step 4 — Impact, support, and hopes

- Educational/participation impact.
- Supports attempted and what happened.
- Work samples or data availability.
- Optional one-year aspirational outcome.
- Optional additional context.
- Safety instruction and submission confirmation.

## Parent respondent flow

The four step names are:

1. **About your child and family**
2. **Development and history**
3. **Home and community functioning**
4. **Impact, support, and hopes**

Detailed content remains subject to the parent decision register in `08-open-questions-and-roadmap.md`. The interface must allow skip/prefer-to-discuss for sensitive optional content and “don’t recall/not sure” for developmental history.

## Psychologist review screen

The review workspace must:

- Present a readable domain-organized draft.
- Link every generated Claim to supporting Evidence and the original Source response.
- Show source wording on demand without forcing internal IDs into report prose.
- Identify explicit no-concern, not-observed, unanswered, and routed-not-shown states.
- Surface structured/narrative contradictions without resolving them.
- Show missing-information and collect-elsewhere flags.
- Explain which follow-up was triggered and by which rule.
- Allow edit, approve, reject, and regenerate at section level.
- Preserve the generated original, human edits, approver, and timestamps.
- Prevent export of unapproved sections.
- Provide export to PsychReport with provenance.

The screen must not display claims such as “district coverage confirmed.” Coverage is a later case-file determination, not an intake-form attestation.

## Visual system

Direction: glossy, modern, restrained, Apple-inspired.

- Content-first layouts with generous whitespace.
- Large, confident headings and short supporting copy.
- Progressive disclosure instead of dense administrative panels.
- Subtle translucency, restrained shadows, high-quality easing, and reduced-motion support.
- One dominant action per screen.
- Clear distinction between respondent simplicity and psychologist depth.
- Avoid dashboard clutter, novelty gradients, excessive pills, and decorative clinical imagery.

