# Handoff to Claude Code — ratify, commit, push, then build v6

## Context (one paragraph)

This project is a multidisciplinary special-education evaluation platform (all names
temporary): three complete, independently purchasable evaluation products — PsychReport
(psych), Speech, OT — connected by an optional district coordination layer, with team
documentation tools (IEP, MDR, Eligibility Preparation, Meeting Brief) that reuse the
case record. Strategy, architecture, and UI direction were settled across prototype
rounds v1–v5 and are now frozen in two documents accompanying this handoff:
`docs/decisions/DECISIONS.md` (fourteen ratified decisions, D1–D14) and
`docs/decisions/V6-BUILD-DIRECTIVE.md` (exact scope for the next build). Treat both as
authoritative. Do not re-litigate ratified decisions inside build tasks; if
implementation genuinely forces a change, stop and surface it as a proposed new decision
entry instead of silently diverging.

## Task 1 — before any build work: commit the ratification

1. Place the two markdown files in the repo at:
   - `docs/decisions/DECISIONS.md`
   - `docs/decisions/V6-BUILD-DIRECTIVE.md`
2. If a `CLAUDE.md` exists, add a short pointer: "Product decisions are ratified in
   docs/decisions/DECISIONS.md — read before making product-shaped choices." If none
   exists, create one containing that pointer.
3. Commit on the current working branch (or `main` if that is the convention here):
   - Suggested message: `Ratify product decisions D1–D14 and v6 build directive`
4. Push to the remote. Confirm the push succeeded before starting Task 2.

## Task 2 — build v6

Scope is exactly the seven visible changes in `V6-BUILD-DIRECTIVE.md`, in this
suggested order (dependency-friendly):

1. Workspace shells and navigation first: the standalone PsychReport shell, the
   standalone Speech/OT shells if not present, and the district shell with case-first,
   role-aware navigation (D4, D7). The prototype's workspace switcher demonstrates all
   four shells; a real account receives only its own.
2. The assistant rail and home command bar (D8) — it touches every screen, so build it
   before the screens that host it.
3. Drop-All ingestion → "case is ready" result screen.
4. Case overview (lightweight; no audit queues).
5. Revision proposal interaction (D9).
6. Template-to-export completion.
7. Sweep the removals/non-goals list last and verify the acceptance checks.

## Guardrails that are easy to violate accidentally

- **Profile isolation (D6)** is a data-layer rule, not a UI rule. No query should be able
  to join records across organizations or private-practice profiles without an explicit
  assignment/invitation/transfer record carrying purpose, permissions, provenance, and
  revocation.
- **Approved content is immutable to the AI (D9).** Regeneration paths must be physically
  unable to touch approved sections; proposals only.
- **No eligibility/manifestation conclusions anywhere (D10)** — including in prompts,
  fixtures, demo data, or "helpful" summaries.
- **Publisher content (D11):** no test items, protocols, or norm tables in code,
  fixtures, seeds, or tests. Metadata and structures only.
- **Interruption bar (D8):** when adding any new blocking prompt, check it against the
  three-condition test before shipping it.

## Reference materials

- Design language: the saved prototype stylesheets in the project owner's Downloads
  ("PsychReport — Prototype v5 GPT_files/index-CbtcHJ5A.css" is the current reference;
  the v4 stylesheet shows the earlier DM Sans/Newsreader document aesthetic). The
  document/paper serif treatment in the writer is intentional and should be preserved.
- Voice: statuses and progress read as human sentences ("One decision remains",
  "Everything needed to draft this section is ready"), never as indicator clusters.
- Keeper line, verbatim (D14): "Added once, available where it belongs."

## Definition of done for this handoff

Ratification commit pushed; v6's seven changes implemented; the five acceptance checks
in the directive pass; nothing from the removals list reappears; the invitation flow
(v7) untouched.
