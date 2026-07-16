# Phase 1 · Claude Code Session 1 Brief — Referral Intelligence Engine

**Read decisions.md first.** All constraints there bind this session, especially
D-003 (single-psych tenancy), D-004 (retention), D-005 (scope cuts), D-007
(raw-before-AI), D-013 (bank version binding), D-020 (never hard-code content).

## What already exists (do not rebuild)
- `packages/case-model` — contracts + taxonomy. 23 tests green.
- `packages/content` — teacher bank v1.1.2 (57 q), parent bank v1.2.1 (88 q),
  crosswalk. 14 tests green.
- `packages/referral-engine-core` — form runtime (visibility, branching,
  repeat groups, validation, completeness), invitation token service, QR
  generation, submission locking → canonical Source. **34 tests green against
  the real banks.** The app is a thin shell around this package.
- `migrations/0001_init.sql` — executed and constraint-verified against real
  Postgres (pglite). RLS enabled (default-deny); policies come in 0002.

## Session 1 goal
A running Next.js app where: JD signs in → creates a case → generates a
teacher invitation (link + QR) → opens the link in a private window → the
teacher form renders from `@suite/content` with live branching → autosave →
submit → a locked Source row with checksum exists → dashboard shows status.

## Build order (per D-015: database → API → backend → frontend → tests → docs)
1. **Repo + Supabase**: restore repo from the bundle; from the repo root run
   `npm install` once (workspace root, D-021), then confirm the suites with
   `npm test --workspace @suite/case-model`, `npm test --workspace @suite/content`,
   and `npm test --workspace @suite/referral-engine-core`;
   create Supabase project; run `migrations/0001_init.sql` in the SQL editor;
   write `migrations/0002_rls.sql`: policies scoping every table to
   `psychologist_id = auth.uid()` via the case join; invitations/draft_responses
   additionally accessible to anonymous respondents ONLY through server routes
   (service role) — respondents never get direct table access.
2. **App skeleton**: `apps/intake` (Next.js 15, TypeScript, Tailwind). Env:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` (server only), `APP_BASE_URL`.
3. **Auth**: Supabase email auth for the psychologist. No respondent accounts
   (invitation token IS the credential — core's `checkInvitation`).
4. **API routes** (all thin wrappers over `@suite/referral-engine-core`):
   - `POST /api/cases` → insert case (+ audit event `case_created`)
   - `POST /api/cases/[id]/invitations` → `generateToken`/`hashToken`, insert,
     return `{ url, qrDataUrl, expiresAt }` (raw token returned once, never stored)
   - `GET /r/[token]` (server component) → look up by `hashToken(token)`,
     `checkInvitation`, mark `opened`, create respondent session cookie, render form
   - `PATCH /api/respond/[invitationId]` → upsert draft_responses (autosave)
   - `POST /api/respond/[invitationId]/submit` → assemble ResponseMap from
     drafts, `lockSubmission()` (throws on invalid — return 422 with
     missingRequired), insert Source row with payload+checksum, mark invitation
     completed, increment uses, audit `response_submitted`
5. **Form renderer**: one client component. On every answer change, call
   `visibleQuestions(bank, responses)` and render exactly that list — the
   engine owns all logic; the component owns only widgets (select, multi,
   textarea, yes/no) and module headers using `displayLabel`/`intro`. Show
   `pendingFollowUps()` results as a gentle "a few more details would help"
   section before submit (Layer 2). Debounced autosave (800ms).
6. **Dashboard**: case list; per case: respondent panel (status: not started /
   opened / completed; expires; [Copy link] [Show QR] [Regenerate] [Revoke]),
   priority flag surfaced when the safety-gate answer is yes.
7. **Tests**: route handlers unit-tested with mocked Supabase client;
   `referral-engine-core` tests must stay green untouched.

## Hard rules for this session
- Banks load from `@suite/content` at build/runtime. Zero question text in app
  code (D-020 — enforceable review criterion).
- Raw tokens: generated, returned in the response body once, never logged,
  never persisted (only hashes).
- Safety gate (TCH-BEH-002 / PAR-BEH-002 = yes) sets `cases.priority_flag`
  at submit time — server-side, in the submit route.
- No SMS/voice/SSO/multilingual (D-005). Email sharing may stub to
  "copy link" in Session 1.
- Every meaningful action inserts an audit_events row; metadata never copies
  narrative content.

## Acceptance criteria (demo script)
1. Sign in, create case (SC, initial, grade 3, initials only — no student name field exists).
2. Generate teacher invitation; QR renders; copy link.
3. Private window: open link → form renders; selecting "Reading" + "Behavior"
   reveals those modules; selecting two behaviors yields 10 ABC instances.
4. Close mid-form; reopen link → drafts restored.
5. Submit with a required field missing → 422 listing the exact instance keys.
6. Complete and submit → invitation completed; reopening link shows
   "already completed"; Source row locked with 64-char checksum; payload
   matches the engine's canonical shape.
7. decisions.md untouched or amended only via new entries.

## Commit plan
- `0001` platform + content foundation (the restored repo)
- `0002` supabase migrations applied + RLS policies
- `0003` app skeleton + auth
- `0004` cases + invitations API with QR
- `0005` respondent form runtime UI + autosave
- `0006` submission locking + dashboard status
- `0007` route tests + session docs
