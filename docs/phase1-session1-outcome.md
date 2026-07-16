# Phase 1 · Session 1 Outcome — Referral Intelligence Engine

Records what was built in Session 1 (the `apps/intake` intake app), the
behaviors verified, the design decisions taken, and what was deferred. The
Session 1 brief is `docs/phase1-session1-brief.md`; the constraints it binds
(D-003, D-004, D-007, D-013, D-020) held throughout.

## What got built (commits 0002–0007)

- **0002 — RLS** (`migrations/0002_rls.sql`). Every data table scoped to the
  psychologist via the case join; `psychologists` self-scoped. Respondents get
  **no** direct table access — their flows run only through server routes using
  the service role (which bypasses RLS). No `anon` policies by design.
- **0003 — skeleton + auth** (`apps/intake`, Next 15 + Tailwind). Supabase
  email auth for the psychologist; middleware guards `/dashboard`; the
  psychologist row is provisioned at first login (`id = auth.uid()`). The engine
  is walled server-side (`lib/engine.ts` `import "server-only"`).
- **0004 — cases + invitations API.** `POST /api/cases`,
  `POST /api/cases/[id]/invitations` (token → hash, QR, bank id+version pinned
  per D-013, raw token returned once). Dashboard create-case + invite panel.
- **0005 — respondent form runtime.** `/r/[token]` validates the token and
  starts a session; `/respond` renders the form; autosave (`PATCH
  /api/respond/[invitationId]`) upserts drafts and returns the engine-recomputed
  visible set. Banks load from `@suite/content` — zero question text in app code
  (D-020).
- **0006 — submission locking + dashboard status.** `POST
  /api/respond/[invitationId]/submit` validates → locks a canonical `Source`
  (raw payload + 64-hex checksum, D-007) → sets the safety-gate flag → completes
  the invitation. Dashboard shows invitation status + Revoke/Regenerate.
- **0007 — tests + docs.** Route-handler unit tests over injectable cores with a
  mocked Supabase client; this document; D-024.

## Behaviors verified

End-to-end against the running app (throwaway test data, deleted after), and as
unit tests (`apps/intake/tests`, 17 passing):

- **Token hash only.** The invitations row stores `token_hash` (64-hex); the raw
  token appears nowhere in the DB — only in the one-time URL/QR.
- **Missing-required → 422 with exact instance keys**, including repeat-group
  form `TCH-BEH-G01::aggression` alongside plain ids.
- **Safety gate server-side.** `TCH-BEH-002 = yes` (or `PAR-BEH-002`) sets
  `cases.priority_flag = true` in the submit route; `no` leaves it false.
- **Completed/expired/revoked link rejection** (409 at submit; the entry route
  shows an "already completed / expired" page).
- **Cookie-gated to one invitation.** A session cookie for invitation A cannot
  autosave or submit invitation B (401); tampered/forged cookies are rejected.
- Live branching works with **zero engine code in the browser** (the `/respond`
  client bundle is ~2.3 kB; the engine stays server-side).

The three package suites remained green and untouched: case-model 17, content
14, referral-engine-core 34.

## Design decisions

- **Respondent session model (D-024).** Token validated once at `/r/[token]`,
  then a signed HTTP-only cookie authorizes autosave/submit. `/r/[token]` is a
  route handler (not an RSC) because RSCs can't set cookies.
- **Server-side engine boundary.** `@suite/referral-engine-core` uses
  `node:crypto` and runs only in route handlers / server components, funnelled
  through `lib/engine.ts` (`import "server-only"`). The browser renders engine
  *output* and calls routes for all token/submission/locking work.
- **Live branching via server round-trips.** Each answer debounce-PATCHes
  drafts; the server returns freshly recomputed `visibleQuestions` +
  `pendingFollowUps`. No bank or engine ships to the client.
- **Answer pruning at submit.** Drafts left behind by branches the respondent
  later closed are pruned to the currently-visible set before validate/lock, so
  the locked payload is clean.
- **Package export hygiene (D-023).** `referral-engine-core` gained a `main`
  field; the case-model index de-duplicated `ConstructId`/`Topography` star
  exports — so consumers import `@suite/*` by bare name.
- **Testability seams.** Security-critical route logic lives in injectable cores
  (`lib/submit-core.ts`, `lib/invitation-core.ts`, `lib/respondent-guard.ts`,
  `lib/respondent-cookie.ts`); routes are thin wrappers, unit-tested with a
  mocked Supabase client (no live DB).

## Deferred (later sessions / phases)

- **Migrations applied by hand.** `0001`/`0002` are run in the Supabase SQL
  editor; no automated migration runner yet.
- **`0002_rls.sql` not exercised by automated tests** — RLS is enforced by
  Postgres; app tests mock the client. A future integration test against a real
  (pglite/Supabase) instance would cover the policies directly.
- **Parent form path.** The parent bank is wired (`bankForRole`), but the
  dashboard only generates *teacher* invitations in Session 1.
- **Email delivery** stubbed to copy-link (D-005); no SMS/voice/SSO/multilingual.
- **Phase 2 pipeline** (Evidence/Claims extraction, AI layers) — tables exist
  from `0001` but are **unpopulated: there are no `Source` records yet.** The
  first extraction fixture will be **authored deliberately at the start of
  Phase 2** — a submission written to exercise specific constructs, then
  hand-annotated as the golden-set "correct" extraction. The `A.B.` case stays
  as-is (clean case, `pending` invitation) as a live demo, not a fixture.
- **Regenerate** mints a fresh link without auto-revoking the prior one; explicit
  Revoke is provided.
