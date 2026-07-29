# 06 — LLM and Assistant Specification

## General boundary

The model supports evidence organization and drafting. It does not become the clinical decision-maker. All clinically consequential output remains reviewable, source-linked, and professionally approved.

## Generation modes

- **SOURCE_FAITHFUL:** respondent summaries.
- **DIRECT_OBSERVATION:** only for actual observation sources.
- **DESCRIPTIVE_RESULTS:** future assessment-result narration.
- **INTEGRATED_INTERPRETATION:** outside RIE intake summary; requires licensed evidence scope.
- **RECOMMENDATION:** follow-up and Assessment Planning suggestions.

RIE informant summaries default to SOURCE_FAITHFUL.

## Extraction contract

Input: one immutable Source plus exact question metadata.  
Output: schema-valid Evidence records.

Required behavior:

- Preserve respondent wording and qualifiers.
- Distinguish observed behavior from opinion.
- Do not infer diagnoses, causes, severity, frequency, or cross-setting consistency.
- Encode missing/contradictory information explicitly.
- Cite exact response IDs.

## Summary contract

Input: Evidence records from a declared source scope.  
Output: per-domain Claims with Claim type and Evidence links.

Every sentence must have support. No unsupported sentence may survive into review as ordinary prose.

## Adaptive follow-up

- Phases 1–3: deterministic branching and completeness only.
- Phase 4: model may rank/select from approved follow-ups.
- The model receives the allowed question IDs and returns selected IDs plus rationale.
- It cannot author a new respondent-facing question.
- Selection is capped by material gap, not by a prose-quality goal.

## Suite assistant — phased

Audience: authenticated psychologist only in the initial assistant phase.

Allowed tools:

- Retrieve current-case Sources, Evidence, Claims, and review status.
- Locate supporting response.
- Summarize evidence with citations.
- Identify gaps and contradictions.
- Navigate to a form, source, summary, or Assessment Planning.
- Draft nonclinical communications for user review.
- Propose case-specific form adjustments without publishing bank changes.

Prohibited:

- Eligibility or diagnosis determination.
- Automatic clinical approval.
- Unbounded cross-case access.
- Parent/teacher conversational interviewing in MVP.
- Final battery selection.
- Unsupported “district requirement satisfied” claims.

## Assessment Planning — phased

- Translate referral questions and available Evidence into options to consider.
- Label options core, conditional, or not currently indicated.
- Show evidence prompting each suggestion.
- Require psychologist rationale and final selection.
- Account for existing data, language/culture, accessibility, referral purpose, and local requirements.
- Never imply that a concern mechanically maps to a test.

## Evaluation

Golden fixtures test:

- Fact preservation.
- Omission behavior.
- Unsupported inference.
- Attribution.
- Hedge preservation.
- Contradiction handling.
- T1 vs. T1-obs rendering.
- Source-link completeness.
- Prohibited diagnostic/eligibility language.
- Prompt-injection resistance in uploaded/respondent text.
- Stable output across supported model/version changes.

