# Psych Suite v6 design package — READ THIS FIRST

**Adopted by decision D-121 (see `/decisions.md`). Read order and precedence below
govern any session using this package.**

## What this package is

The v6 product direction for the Psych Suite's evaluation-workspace surface:
three standalone, independently purchasable evaluation products (PsychReport,
Speech Studio, OT Studio — working names), an optional district Evaluation
Platform coordination layer, Documentation Support tools, and Sped QA remaining
a separate review product. It was produced across two agents in sequence:

1. Claude Cowork wrote a ratified decision set (D1–D14) and a handoff **before**
   the v6 prototype existed.
2. ChatGPT then completed the v6 clickable prototype
   (`https://psychreport-prototype.ngsjq7pfqx.chatgpt.site`, owner-only) and
   wrote the authoritative implementation handoff against it.

Saved copies of all sixteen prototype screens (T1–T16) live in the project
owner's Downloads as `PsychReport — Prototype v6 T*.htm` (T1–T8 district shell,
T9–T11 PsychReport standalone, T12–T14 Speech Studio, T15–T16 OT Studio).

## Files and precedence (highest wins)

1. **`/decisions.md`** — the suite's single canonical decision log
   (D-001–D-12x). Always governs. The v6 package never overrides it except
   through numbered entries there (D-121+).
2. **`v6-handoff-chatgpt.md`** — the authoritative v6 implementation spec
   (JD-designated, 2026-08-04). Closest to the prototype design. Where it
   conflicts with the Cowork documents, it wins.
3. **`v6-decisions-cowork.md`** — Cowork's ratified D1–D14 product decisions.
   **This is NOT a second canonical decision log**; its numbering (D1–D14) is
   package-local. Superseded by the ChatGPT handoff where they conflict (known
   examples: "Team Documentation" → "Documentation Support"; case-tab framework
   universal to all profiles, not district-only; standalone Documentation
   Support tab exists with Parent Summary / Meeting Brief / Information
   Request).
4. **`v6-handoff-cowork.md`** — Cowork's process handoff. Historical
   provenance. Its Task 1 file-placement instruction (create
   `docs/decisions/DECISIONS.md`) is **superseded** — that would have created a
   competing canon; the adoption is logged in `/decisions.md` instead. It
   references a `V6-BUILD-DIRECTIVE.md` that was **never delivered**; its
   "seven visible changes" scope is reconstructed in `build-plan-v6.md` from
   this handoff's Task 2 plus the ChatGPT handoff §17–§18.

## Build plan

`build-plan-v6.md` — the reconciled build plan, including the open sequencing
gate (v6 build vs. the JD-ratified 2026-07-28 sequence RIE → D-046 → Sped QA
design → PsychReport). Do not begin v6 shell construction until that gate is
resolved by JD in `/decisions.md`.
