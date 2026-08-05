# Psych Suite v6 — Build Plan (reconciled)

**Date:** 2026-08-04 · **Author:** Claude (reconciliation session) · **Owner:** JD
**Governing decisions:** D-121 (package adoption), D-122 (Documentation Support),
D-123 (universal case-tab framework) — see `/decisions.md`.
**Authoritative spec:** `v6-handoff-chatgpt.md` (this directory).

---

## 0. The open sequencing gate — resolve before building

The Cowork handoff says "build v6." The JD-ratified build sequence (2026-07-28,
recorded in `/CLAUDE.md` §4) says: **RIE first → D-046 shared-layer
consolidation → Sped QA design pass → PsychReport rebuild last**, and "do not
start PsychReport or QA screens before D-046." The v6 package is silent on RIE
entirely. These are not automatically compatible, and per D-117 governance no
session may silently re-sequence.

**Recommendation (for JD to ratify or reject):** keep the ratified sequence and
slot v6 into it, rather than replacing it:

- **RIE stays step 1.** It is nearly done, is the district land-and-expand
  wedge, and nothing in v6 contradicts it. v6's Drop-All ingestion and RIE's
  structured referral intake are complementary front doors, not rivals.
- **D-046 stays step 2.** The v6 writer needs the parser and
  `reasoning-contracts` anyway; consolidation is a precondition, not a detour.
- **Sped QA design pass stays step 3.** v6 §4.4 re-confirms QA as a separate
  product; its design gap is unchanged.
- **The v6 workspace build IS step 4** — it replaces/absorbs "PsychReport
  redesign." The v6 handoff is now the design package for that step. Speech
  Studio and OT Studio shells are configuration variants of the same case-shell
  framework (handoff §16), so they ride along at modest incremental cost, but
  their *clinical content* (assessment libraries, writer prompts, fixtures) is
  new scope that should be sized separately.
- **District Evaluation Platform is last**, consistent with v6-D5/D13: district
  packaging only after organic multi-product usage exists. Build the
  district shell only to prototype-fidelity until then.

If JD instead wants v6 shells before RIE completion, that is a new decision
entry superseding the 2026-07-28 sequence — log it first.

## 1. Foundations (before any v6 screen)

1. **`WorkspaceCapabilities` configuration model** (handoff §16): workspace
   kind, vocabulary (student/client), licensed evaluations, multidisciplinary
   flag, documentation tools, spedQa flag. The case shell renders one tab
   framework everywhere; capabilities determine content. Never encode "case
   tabs exist" as district-only (D-123).
2. **Data-layer profile isolation** (v6-D6 / suite D-003/D-004 lineage): no
   query can join records across organizations or private-practice profiles
   without an explicit assignment/invitation/transfer record carrying purpose,
   permissions, provenance, revocation. Build into the schema now; it is not a
   UI rule.
3. **Approved-content immutability** (v6-D9): regeneration paths must be
   physically unable to touch approved sections. Proposals only; stale markers
   when new evidence lands.
4. **Human-decision boundary** (v6-D10, reconciled with D-005/D-115): no
   eligibility verdicts, rankings, defensibility scores, manifestation
   determinations anywhere — including prompts, fixtures, demo data. The
   artifact-profile model still governs adverse-impact/SDI language: available
   only through an explicit configured district/user workflow, never as
   ordinary report content.
5. **Publisher boundary** (v6-D11 / D-107/D-116 lineage): metadata, constructs,
   score structures, approved descriptors only. No items, protocols, norm
   tables in code, fixtures, seeds, or tests.

## 2. The seven v6 build increments (dependency order)

Reconstructed from the Cowork handoff Task 2 (the never-delivered
V6-BUILD-DIRECTIVE) and validated against the ChatGPT handoff §17:

1. **Workspace shells + navigation.** Standalone PsychReport, Speech, OT
   shells; district shell case-first and role-aware. Global rails per §5.1–5.2;
   universal five-tab case framework per §5.3. Workspace switcher is a demo
   device only — real accounts see only what they own.
2. **Assistant rail + home command bar** (§8). Touches every screen, so it
   precedes the screens that host it. Contextual grounding ("Working in: …"),
   explicit state-change actions (Preview / Apply / Add / Keep), collapse
   without losing conversation, bottom sheet on narrow screens.
3. **Drop-All ingestion → "case is ready" result** (§7.2, 7.5). Upload zone;
   organized-record summary (8 records / 3 assessments / 2 interviews /
   1 verification); plain-language file statuses.
4. **Case Overview** (§7.4). One readiness sentence, one next action, progress,
   at most one (standalone) or two (district) judgment items, one reassurance
   line. No audit queues.
5. **Writer interactions** (§7.9). Outline + document canvas + assistant rail;
   one smart interruption demo; revision proposal (current vs. proposed,
   Keep/Apply, visible accepted state); score verification checkbox gate;
   Supporting Evidence drawer via superscript markers; "Mark reviewed."
6. **Template mapping → export** (§7.10). Ready-to-export state; mapper behind
   "View mapping"; export approval gate.
7. **Removals sweep + acceptance.** Verify nothing on the §14 removed list
   reappears; run the §18 acceptance checklist; §12 accessibility pass
   (type-size floors from §6.2 especially).

## 3. Explicitly out of scope for v6 (do not add early)

- Invitation flow — **v7's first feature** (v6-D13, handoff §15). Not in v6.
- Full district administration, SSO, SIS, voice/SMS, multilingual, autonomous
  interviewing, battery automation, parent-facing conversational AI.
- Anything on the handoff §14 removed/demoted list.

## 4. Known prototype defects — do not replicate

- T16 (OT Studio case): breadcrumb and assistant read "Avery Williams" while
  the open case is Noah Bennett; case header avatar says NB under an
  Avery-labeled breadcrumb. Fixture bleed between demo workspaces — exactly
  what v6-D6 prohibits; treat as a bug, not a spec.
- District T4–T8 sidebar shows "Documentation Support" with a count badge in
  the global rail while the case-level tab carries the same name; ensure the
  global item is the cross-case work queue (§5.1), not a duplicate.

## 5. Acceptance

The ChatGPT handoff §18 checklist is the acceptance gate, plus:

- Sequencing gate (§0 above) resolved in `/decisions.md` before shell work.
- `npm ci`-clean build on a fresh clone (suite convention).
- All committed AND pushed; `git status -sb` clean (suite convention).
