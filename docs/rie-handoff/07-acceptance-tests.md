# 07 — Acceptance Tests

## Invitation and session

1. Raw invitation tokens are never stored.
2. Expired, revoked, or already-consumed tokens cannot establish a new session.
3. Respondent receives a signed HTTP-only cookie and does not create an account.
4. Teacher-facing identity is first name plus last initial.
5. Submission locks the Source while preserving an auditable correction workflow.

## Routing and response semantics

6. An 11th-grade respondent does not receive early phonemic-awareness items unless explicitly configured for a developmental reason.
7. An ungraded student can be assigned a developmental band directly.
8. A music teacher can answer “Not enough opportunity to observe” for academic ratings.
9. Not observed never renders as no concern.
10. Unanswered never renders as no concern.
11. A routed-hidden item can be reconstructed from bank version, band, and routing configuration.
12. A required rating cannot be submitted without an explicit option.
13. Checklists are not interpreted as exhaustive unless their question contract says so.

## Four-step flow

14. Teacher can complete: About your work → What have you noticed? → Relevant follow-up → Impact, support, and hopes.
15. Parent can complete: About your child and family → Development and history → Home and community functioning → Impact, support, and hopes.
16. Back, resume, autosave, validation, progress, and submit work on mobile and keyboard-only navigation.
17. The one-year aspiration is optional and appears in output only when answered.

## Follow-up

18. Every follow-up identifies its deterministic rule or approved-bank selection.
19. No follow-up is asked solely to improve prose richness.
20. A concern with adequate context does not trigger redundant questions.
21. A material contradiction is surfaced, not resolved.
22. The model cannot emit a respondent-facing question outside the approved bank.

## Extraction and summary

23. Every Evidence record links to a response and Source.
24. Every ordinary summary Claim links to Evidence.
25. Verbatim quotes match source text.
26. Severity/frequency/cause is not escalated.
27. Cleared domains are bounded to what was actually screened.
28. Internal tiers, item IDs, and routing rules do not appear in report prose.
29. Attention/self-management remains an explicit block when applicable.
30. Human edits preserve original generated text, editor, and timestamp.

## Review and export

31. Psychologist can inspect source support for each paragraph.
32. Missing information and collect-elsewhere flags are distinct from contradictions.
33. Sections can be approved/rejected individually.
34. Unapproved content cannot export.
35. PsychReport import retains provenance and version pins.

## Security and operations

36. Model payload contains pseudonymous identifiers only.
37. PII is absent from URLs and routine logs.
38. Per-case deletion removes or cryptographically renders inaccessible all governed data according to policy.
39. Auto-purge executes and is auditable.
40. Tenant isolation tests prevent cross-account reads.
41. Accessibility tests cover focus, labels, errors, contrast, motion, and screen readers.
42. Safety-positive responses create expedited-review handling.

## Assessment Planning and assistant — phased

43. Suggestions cite case evidence and remain editable.
44. Conditional measures are visually distinct from core options.
45. No recommendation is represented as a prescribed battery.
46. Assistant cannot retrieve a case outside the current user’s authorization.
47. Assistant answers identify sources and uncertainty.
48. Assistant cannot approve a section, determine eligibility, or diagnose.

