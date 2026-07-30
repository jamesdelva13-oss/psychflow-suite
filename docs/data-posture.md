# RIE Data-Posture Statement

**Status:** DRAFT v0.1 · 2026-07-29 · pending JD review, then district/legal review
**Scope:** Referral Intelligence Engine MVP (single-psychologist tenancy, teacher
intake vertical slice). Required by the build handoff (README-FIRST, "complete
build"; 05 §Security and privacy). This document states what the system stores,
where, how it is protected, what reaches an AI model, and what never exists in
the system at all. Where a control is committed but not yet implemented, the
table in §9 says so plainly — this document does not claim more than the code does.

Language note (positioning rules): this document describes controls; it does not
claim the product is "compliant" or "audit-proof," and no statement here is
legal advice.

---

## 1. What the system is for

A school psychologist collects structured teacher (later parent) input about a
referred student, reviews an evidence-linked summary, and exports approved
content. The system is built so that the *minimum* information needed for that
job is collected, and nothing else.

## 2. What is stored

| Category | Contents | Notes |
|---|---|---|
| Psychologist account | Email, authentication record | The only account holder in MVP (D-003). |
| Case | Pseudonymous student reference; first name + last initial (D-120); grade and developmental band; evaluation type; referral provenance; retention settings | **No full name, no date of birth (age as years:months only), no student ID, no address.** The psychologist's own records hold identity; the case record cannot reconstruct it. |
| Informant | Name, role, relationship to student, contact for delivery | Contributor identity is separate from content (case-model contract). |
| Invitation | SHA-256 hash of the access token, expiry, use/revocation state, pinned bank id + version | **The raw token is never stored** — it exists once, in the link/QR handed to the psychologist. |
| Source | The locked, checksummed submission exactly as the respondent answered it, plus bank/taxonomy version pins and the session's grade band + mapping version | Immutable after locking (D-007). Corrections create new artifacts; they never rewrite a Source. |
| Evidence / Claims (Phases 2–3) | Atomic statements derived from Sources, each linked to the exact response it came from; generated summary sentences linked to Evidence | Nothing in this layer exists without a pointer back to a Source. |
| Audit events | Who accessed, generated, approved, exported, deleted, and when | Committed for the complete build; see §9. |

## 3. What never exists in the system

- Full student name, DOB, SSN or any government identifier, address, photos.
- Respondent accounts or passwords — teachers and parents never create logins.
- Personal data in URLs, query strings, QR payloads, or routine logs.
- Any student data in analytics.
- Model-training use of user data — in any configuration, at any tier.
- Cross-tenant visibility: one psychologist's cases are invisible to any other
  account (enforced in the database, not the application — see §5).

## 4. Where data lives and how it moves

- **At rest:** a managed Postgres instance (Supabase). Provider-managed
  encryption at rest; TLS for every connection. No student-adjacent data is
  stored on respondent devices beyond the browser session in progress.
- **In transit:** HTTPS/TLS only, including all respondent form traffic and
  every server-to-database call.
- **In the browser:** respondents hold a signed, HTTP-only session cookie bound
  to exactly one invitation (D-024). The question bank content they see is
  rendered server-side; no engine logic or other students' data ships to the
  client.

## 5. Access model

- Every data table is row-level-security scoped to the owning psychologist via
  the case join; the database itself refuses cross-account reads.
- Respondents have **no** direct database access of any kind. Their reads and
  writes pass through server routes using a service role that is never present
  in any client bundle or public environment variable.
- A respondent session authorizes exactly one invitation: a cookie for
  invitation A cannot read or write invitation B (verified by tests).

## 6. Secure delivery (links, QR, email)

- Invitation tokens are single-purpose, expiring, and revocable; only their
  hash is stored. Regeneration mints a new link; revocation is immediate.
- The teacher-facing page shows the student as first name + last initial only
  (D-120). Full identity never appears in a link, a page, or a log line.

## 7. What reaches an AI model

- **Phase 1 (current slice): nothing.** Intake, routing, validation, and
  locking are fully deterministic; no model is called.
- **Phases 2+ (extraction, summaries):** model calls are server-side through a
  provider adapter. Payloads are pseudonymous (the D-120 fields are replaced
  with neutral placeholders before any call), schema-constrained, and logged
  with pinned bank, taxonomy, prompt, schema, and model versions. Quoted text
  is verified against the Source; output that cannot cite a source is dropped
  or demoted, never silently kept. No data is used for model training.

## 8. Retention and deletion

- **Per-case deletion:** deleting a case removes its informants, invitations,
  sources, and derived records.
- **Configurable auto-purge:** each case carries retention settings (D-004);
  the psychologist chooses the retention window.
- **Relay-and-purge (committed):** a configuration in which the system relays
  collected input and retains nothing beyond the audit trail.

## 9. Current state vs. committed target — read this table honestly

| Control | State today |
|---|---|
| Token hashing, expiry, revocation, one-invitation sessions | **Implemented and tested** |
| RLS psychologist scoping; service-role isolation | **Implemented**; policies not yet exercised by automated integration tests (planned before any deployed environment holds non-synthetic data) |
| TLS + provider encryption at rest | Provider defaults; verified at deployment |
| D-120 minimal identity (first name + last initial, single-char enforced) | **Contract implemented**; UI display lands with the four-step build |
| Pseudonymization before model calls | Specified; no model calls exist yet |
| Per-case deletion | Partial (retention fields exist; deletion flow is Phase-1 work) |
| Auto-purge job; relay-and-purge mode | Committed, not yet built |
| Formal audit-event log | Committed, not yet built (route-level logs only) |
| Accessibility (WCAG) verification | Committed; testing planned with the four-step UI |

## 10. Environments and pilots

Development and automated tests use **synthetic data only** — the golden-set
corpus is synthetic or fully de-identified before it enters any repository or
environment an automated tool can read. **No live student pilot occurs** until
district data-governance approval and the contract/IP review are cleared
(README-FIRST, "complete build"), and the §9 table reads "implemented" for RLS
integration tests, deletion, and audit logging.
