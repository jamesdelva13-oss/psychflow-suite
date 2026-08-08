# CLAUDE.md — Psych Suite (suite repo)

This file orients any Claude Code / Cowork session working in this repository.
Read it fully before acting. It is the onramp; the authoritative rules live in the
files it points to.

---

## 0. How to work with me (standing instruction — applies every session)

**Explain your work as you go.** After each meaningful change, state in plain
language: (1) what you did, (2) why, (3) what could break or what you're unsure
about, (4) what you recommend next. Assume I am technical-adjacent but not a
developer — I reason about code and architecture but am not fluent in tooling
internals. Do not report only commit hashes, file lists, and status lines. When you
hit a genuine fork you can't resolve from the specs, **stop and ask** — a plausible
wrong guess is more expensive than a question.

**Never trust a claim about code without verifying it against the canonical file.**
This project was burned by a confident-but-wrong code claim (see the D-097
retirement in `decisions.md`). Read the actual file; show code or test output, not
a summary.

**Commit and push are one action.** Governance/code artifacts have been lost four
times by being committed locally and never pushed, or left uncommitted in a working
tree. Nothing is "done" until committed AND pushed to `origin/main` and
`git status -sb` reads clean. End every session by confirming this.

---

## 1. What this project is

The **Psych Suite** is three products for special-education practice sharing one
reasoning core:

- **RIE (Referral Intelligence Engine)** — structured referral intake feeding the
  other two. Multi-modal (async forms + live clinician capture). Phase 1 already
  built. Closest to done; front of the workflow.
- **Sped QA Engine** — a reasoning-layer compliance reviewer that reads the
  *content* of the whole eval/sped package (reports, RIE intake, IEPs, the full
  case file) and checks it against pinned regulations. The **market differentiator**:
  incumbents (EdPlan, ECATS, Frontline, PowerSchool) verify a box is filled, not
  that content is correct. No one offers proactive content-level compliance QA.
- **PsychReport** — AI-assisted psychoeducational report writer. Ingests source
  documents, generates prose grounded in a claims ledger where every sentence
  traces to a source. Largest build; most crowded market.

**The shared core** makes it a suite, not three apps: a document parser, the
`reasoning-contracts` package (modes, evidence tiers, interpretive ceilings), the
authority-tier system, and the decision log. Build the core once; both products
import it.

**Founder context:** solo technical founder building with AI tools; domain expert
(NCSP school psychologist), not a professional developer. Optimize for shippable
increments over architectural completeness. Cost and time-to-market matter; a
competitor reaching the QA differentiator first is the risk being raced.

---

## 2. Where the rules live (source of truth — always current)

Do not rely on this file for specific rules; it goes stale. Read these:

- **`decisions.md`** — the ratified decision log (currently through the D-120s). The
  provenance record. Amendments are dated and appended, never rewritten (D-038).
  When two decisions conflict, the later governs and the earlier gets a dated note.
  Canonical; must stay identical across all copies (D-029).
- **`governance/operational-spec-v1.md`** — the *current effective rules* for
  PsychReport generation, derived from and cross-referenced to `decisions.md`. Build
  generation logic against this. If it and `decisions.md` disagree, `decisions.md`
  wins and the spec needs fixing.
- **`governance/rules-consolidated.md`** — full rule inventory the spec was distilled
  from. Reference, not operative.
- **`governance/prompts-verbatim.md`** — current generation prompts, verbatim. Source
  for any prompt work.
- **`library/wisc-v.draft.md`** — DRAFT instrument-library content, unverified. Needs
  practitioner review before use.
- RIE build work: see `docs/rie-handoff/` — `README-FIRST.md` governs read order and
  source-conflict precedence.
- **v6 product architecture** (PsychReport / Speech Studio / OT Studio standalone
  products + district coordination layer + Documentation Support): adopted by
  **D-121–D-123**. Design package at `docs/psych-suite-v6/` — its `README-FIRST.md`
  governs precedence (the ChatGPT v6 handoff is authoritative within the package).
  Build plan and the sequencing gate live in
  `docs/psych-suite-v6/build-plan-v6.md`. **Gate partially resolved (D-124):**
  RIE first, then D-046; the rest of the sequence is deferred until after D-046
  — v6 shell work stays blocked until JD revisits. **D-125:** Capture
  (clinician notetaking + summarization, verification-gated) is in scope for
  the first deployable RIE.

---

## 3. Governance rules that constrain how you build

- **Cross-product governance contract (D-117).** A `[suite]` rule states a shared
  principle each product implements in its own context. A product may NOT silently
  narrow a suite rule, and a product specific may NOT silently widen into a suite
  rule — either needs a logged decision. Two kinds of suite item: *shared principles*
  (implemented per-product) and *shared artifacts* (implemented once, imported, never
  forked — e.g. `reasoning-contracts`, the parser). Do not fork a shared artifact.
- **Product decoupling (D-035).** QA and PsychReport are decoupled: QA must
  review reports from *any* psychologist, not just PsychReport's output, and must
  never be tuned so PsychReport passes — its independence is the value. QA may not
  import PsychReport's case-model.
- **The shared vocabulary is the bridge.** `reasoning-contracts` is imported by both
  and imports nothing — the one place shared epistemic vocabulary lives.
- **Minimum-necessary prompt (D-110) + preserve escape hatches (D-111).** Runtime
  prompts carry only what the task needs; when compressing a rule into a prompt,
  carry its permission/escape clause too — dropping escape hatches caused past
  quality failures.
- **Claims vs. scaffolding (D-113).** Student-specific claims need a source;
  connective/exposition prose does not, but must not smuggle unsupported claims.
- **No check ships against an artifact the engine never reviews** (QA governance) —
  identify which reviewed document carries the obligation before building a detector.

---

## 4. Current build state and sequence

**Verified reality (D-118):** the current PsychReport app invokes NO validity/ceiling
resolver — the entire safety layer is specified in the rules but absent from the
running code. The app is a prose generator with its safety architecture on paper
only. PsychReport needs a rebuild, not a patch; resolver integration is foundational.

**Repos:**
- `psychflow-suite` (this repo) — governance, `decisions.md`, `reasoning-contracts`,
  `case-model`, shared core. Branch `main`.
- `psychreport` — current vanilla-JS app. Stage-1 work quarantined on branch
  `stage1-mode-prompts` (NOT cleared to merge — D-101). `main` is the known-good
  July-2 baseline.
- `PsychReport QA Engine (repo)` — the QA monorepo (parser, IR, rubric).

**Build sequence (JD-ratified, 2026-07-28):**
1. **RIE — finish and make deployable.** Closest to done (Phase 1 built and pushed),
   simplest (structured intake, no generation architecture, no resolver), front of
   the workflow — produces the referral data the others consume. The cheap district
   land-and-expand wedge.
2. **D-046 — shared-layer consolidation.** Merge `reasoning-contracts` + the parser
   into one importable package. Unblocks QA and PsychReport. A defined refactor.
3. **Sped QA Engine — design pass, THEN MVP.** The differentiator, currently
   UNDER-designed relative to its importance: it has a rubric and a decision log but
   no product-design package (unlike PsychReport). Its scope is broad by necessity —
   it reviews the whole eval/sped package (PsychReport output, RIE intake, IEPs, the
   case file), the four-layer cross-document case-file architecture. Give it the
   product-design treatment PsychReport received (screens, case-intake model,
   finding-resolution workflow, district-vs-evaluator views) BEFORE building. This is
   the one remaining design gap worth closing — it's the wedge. Reuses the D-046
   parser. Pilot with one district.
4. **PsychReport redesign.** Last — biggest build, most crowded market, already fully
   specified. Document-centered case workspace (design package exists), hosted runtime
   (MakerKit foundation), resolver integration (D-118) foundational, built against
   `operational-spec-v1.md`.

**Do not** start PsychReport or QA screens before D-046 (the parser they reuse)
exists. Do not merge the Stage-1 branch. Further *design* is justified only for the
QA Engine (step 3); PsychReport is over-specified — stop designing it and build.

---

## 5. Conventions

- **Amend, never rewrite** ratified decisions (D-038): append a dated note, preserve
  original text.
- **`decisions.md` refreshed in all copies whenever it changes** (D-029); everything
  else batches at milestones.
- **Provenance-tag every new decision** with scope: `[suite]`, `[SpedQA]`,
  `[PsychReport]`, or `[RIE]`. `[suite]` only if it constrains more than one product
  (D-117).
- **node_modules never travels between machines** — fresh `npm ci` on arrival before
  any build/test touching native binaries (macOS-copied rollup/esbuild fail
  elsewhere).
- **Confirm the working directory at session start** — a past session logged under
  the wrong project name because it ran in an unexpected directory.
- **Clinical/report conventions** (Arial, 95% CI, no grade equivalents,
  composite-grouped tables) live in the operational spec and parameter block; read
  them there, do not infer them.

---

## 6. When to escalate to the founder (JD) vs. proceed

**Proceed** on: defined refactors, code against an existing spec, test writing, file
operations with a clear target, anything the specs already answer.

**Stop and ask** on: a genuine fork the specs don't resolve; anything that would
narrow a suite rule or widen a product rule (D-117); a clinical/regulatory judgment
call (JD is the domain expert — surface it, don't guess); MVP scope decisions;
anything touching student-data handling, deployment posture, or the eligibility
boundary. State the fork, your recommendation, and why — one question, not a list.

---

UI RULES (non-negotiable)
1. Compose all UI from @suite/ui components per DESIGN-SYSTEM.md §5. Never write ad-hoc UI.
2. All style values come from tokens.css. No inline hex, px sizes, or font names.
3. The --ai-* family marks unaccepted AI content only; nothing else in the product may
   be visually confusable with that state. Cobalt marks interaction only. Green marks
   verified only. Never repurpose these.
4. Every component implements ALL states listed in DESIGN-SYSTEM.md before use.
5. Machine-written content always renders inside AIProposal (Proposal or Revision
   variant). Conversation never mutates content directly. No exceptions.
6. The Evidence Spine renders only where provenance/review is action-relevant
   (DESIGN-SYSTEM.md §2); never in reading mode, export preview, or exports.
7. Before committing UI: screenshot at 1440/1024/390 against the Avery Williams
   fixture and verify the DESIGN-SYSTEM.md §8 items within Gate C.
8. If a needed component or token doesn't exist: stop, propose it, wait for ratification.
