# Psych Suite Design System v1.1

**Status:** Ratified (v1.0 + amendments A-1, A-2, A-6, A-7, A-8, A-9 as refined in the ratification instruction of Aug 6, 2026) · **Consumers:** Claude Code, all suite products
**Companion files:** `tokens.css` (source of truth for all values) · `preview.html` (visual reference — regenerates against the Avery Williams fixture during VS-2)
**Precedence:** This document and `tokens.css` supersede v6 Handoff §6 as the visual and interaction source of truth (A-1). They sit below `decisions.md` and repository reality, above the Vertical-Slice Directive, in the precedence order.

---

## 0. The One Rule

**Never write ad-hoc UI.** Every screen is composed from the components in §5 using only the values in `tokens.css`. If a screen needs something no component provides, stop and propose a new component or token — do not improvise inline styles, one-off colors, or local variants. Consistency is the product's polish; improvisation is how it dies.

---

## 1. Design stance

Psych Suite looks like a **clinical instrument, not a SaaS toy**. The user is a credentialed professional producing legally consequential documents; the buyer is a district reducing risk. Every visual decision serves one sentence:

> **The interface appears simpler than the work, because the sophistication is underneath — and the provenance of every claim is always one glance away.**

Five principles:

1. **Calm surface.** Cool paper background, white panels, borders over shadows, no gradients, no decoration. Density is professional, not cramped.
2. **One interaction hue.** Cobalt (`--accent-600`) is the only brand color. Anything cobalt is interactive or selected. Nothing else is cobalt.
3. **Violet means machine.** The `--ai-*` token family appears *only* on AI-proposed, not-yet-accepted content. Accepting content removes it. This is a standing suite-wide semantic rule unless explicitly superseded by a future design-system decision, and its invariant is defined by meaning, not by color-name pedantry: **no ordinary product, brand, navigation, status, or discipline element may be visually confusable with the unaccepted-AI state.** This is the interface's trust contract.
4. **Green is ceded.** The competitor is named Sage. Green appears only as small verified/complete marks — never as surface, brand, or atmosphere.
5. **Documents are serif.** Report content renders in `--font-doc` (Source Serif 4); everything around it is `--font-ui` (Public Sans — a face designed for government services, which is what this software ultimately serves). The typeface change *is* the boundary between "the tool" and "the document."

---

## 2. The signature: the Evidence Spine

The suite's ownable visual grammar, derived directly from the RIE evidence ladder. **The spine is a 3px left rule encoding provenance — rendered where provenance or review status is relevant to the user's current action, not merely because the underlying object has evidence metadata (A-7):**

| Spine style | Meaning |
|---|---|
| Solid, `--spine-source` (slate) | Verbatim or structured from a source document |
| **Dashed**, `--spine-ai` (violet) | AI-proposed; no human has accepted it |
| Solid, `--spine-verified` (green) | Human-verified / accepted |
| Solid, `--spine-review` (amber) | Flagged — needs review before use |

**Renders on:** AI proposals and revisions · review and verification states · source/evidence inspection surfaces · impact-review/stale states · reviewable generated sections. **Does not render on:** every paragraph of an ordinary draft · every Case Materials file · cards that merely happen to be Source-backed · completed reading-mode reports · export preview · exported documents.

Rules: the spine is the *only* place these four meanings are encoded positionally, and it renders identically across all suite products and the Assistant. Evidence-tier labels (T0/T1/T1-obs/T2–T3) are internal ontology — never rendered by default anywhere; they appear only inside EvidenceChips behind interaction. Users learn *source-linked / AI-proposed / needs review / verified*; they never learn the ladder. Visual test during VS-3: if a working screen starts looking striped, the spine is overused — narrow it.

---

## 3. Typography

| Role | Face | Size / weight | Use |
|---|---|---|---|
| Eyebrow | UI | `--text-xs`, semibold, uppercase, `--tracking-eyebrow`, `--ink-500` | Section labels, chip text |
| Body UI | UI | `--text-base`, regular, `--leading-body` | Default |
| Dense data | UI | `--text-sm`, tabular-nums | Tables, scores |
| Panel title | UI | `--text-lg`, semibold | Cards, drawers |
| Page title | UI | `--text-xl`, semibold | Screen headers |
| Case name | UI | `--text-2xl`, bold | Case Workspace header only |
| Document body | Doc | `--text-md`, regular, `--leading-doc` | Report editor content |
| Machine data | Mono | `--text-sm` | IDs, timestamps, raw file names |

Numerals in any table are tabular (`font-variant-numeric: tabular-nums`). Scores never wrap; confidence intervals set as `95% CI 88–102` in dense data style.

---

## 4. Layout, density, motion

- **App frame:** dark navy navigation rail (`--nav-bg` / `--nav-fg`, active items `--nav-active-fg` on `--nav-active-bg`) at `--sidebar-w`, carried forward from v6 per A-1 · content · optional right Assistant panel `--assistant-w`. Content is panels (`--surface`, `--r-md`, `--line` border) on `--paper`. Discipline identity is carried by labels/eyebrows, never by accent hues (discipline colors retired per A-1).
- **Density:** rows `--row-h` (40px), dense tables `--row-h-dense` (36px). Controls `--control-h` (36px). Prose maxes at `--reading-max`; the report editor column is `--editor-col` centered.
- **Elevation:** borders define structure. `--shadow-raised` only on interactive cards; `--shadow-overlay` only on modals, drawers, palette.
- **Motion:** `--t-micro` for hover/press, `--t-panel` for surfaces entering, `--ease` always. **No decorative animation.** Streamed AI text renders as plain text appearing — no shimmer, no typewriter cursor, no sparkle icons anywhere in the product. Respect `prefers-reduced-motion`.
- **Responsive:** desktop-first pro app; must remain fully usable at 1024 (tablet, sidebar collapses to icons) and readable at 390 (phone: single column, Assistant becomes bottom sheet, tables scroll horizontally within their panel).

---

## 5. Component vocabulary

Each component: **Purpose · Anatomy · States · Rules.** All states listed are mandatory to implement — polish dies in the missing states.

### 5.1 CaseStatus
**Purpose:** The header of every case — identity, phase, clock, completion.
**Anatomy:** Case name (`--text-2xl`) · eyebrow row (evaluation type · due date · days remaining) · progress line (2px, `--accent-600` on `--line`) · status sentence · primary action ("Continue evaluation →").
**States:** on-track (ink) · due ≤ 7 days (amber date) · overdue (red date) · complete (green check, action becomes "View report").
**Rules:** Days-remaining is always computed, never stored copy. One primary action only. Never show percentages without the status sentence explaining what's missing.

### 5.2 SourceCard
**Purpose:** One ingested artifact (PDF, form response, interview, note, audio).
**Anatomy:** spine (source) · type icon · title · mono metadata (pages · date · origin) · extraction summary line · overflow menu.
**States:** processing (skeleton + "Reading…") · ready · partially readable (amber note: what failed) · unreadable (red, with the fix: "Re-upload or mark as reference only") · superseded (struck title, "Replaced by v2").
**Rules:** Extraction summary states what was *found* ("14 scores, 2 raters"), never what the model "thinks." Failures name the remedy.

### 5.3 EvidenceChip
**Purpose:** Inline provenance marker attaching a claim to its source.
**Anatomy:** pill (`--r-full`, `--control-h-sm`) · tier label (T0/T1/T1-obs/T2–T3) · source short-name · optional page ref.
**States:** default · hover (raises source preview popover) · active (popover pinned) · broken (red — source removed; claim must be re-supported or deleted).
**Rules:** Chips are the only way provenance is displayed inline. A claim with no chip is by definition the practitioner's own professional judgment — and the UI never fakes a chip for it.

### 5.4 AIProposal — two variants (A-6)
**Purpose:** Every piece of machine-proposed content awaiting human decision. Creating something new and altering something the clinician already approved are not the same event, so the frame has two variants with distinct action lexicons. Conceptually `AIProposal.New` and `AIProposal.Revision`; implementation names are free.

**Variant 1 — Proposal (new content, nothing approved yet).**
Anatomy: dashed violet spine · content · footer: EvidenceChips used · actions **Accept · Edit · Regenerate · Dismiss**.
States: generating (plain streaming, actions disabled) · proposed · editing (inline) · accepted (violet dissolves → spine becomes verified; footer collapses to a quiet "Accepted · edited" mark) · dismissed (removed, undo toast 8s).

**Variant 2 — Revision (machine-proposed change to already-approved text).**
Anatomy: dashed violet spine · previewed diff against the current approved version · footer: actions **Apply revision · Keep current version**.
States: generating · previewing · applied (prior version preserved in history; violet dissolves) · kept (proposal discarded, logged).

**Rules (both):** One click to decide. Nothing machine-written ever appears outside one of these frames, and neither frame ever appears on human-written content. Regenerate always starts from sources, not from the prior draft. Conversation with the Assistant alone never mutates content — it can only spawn one of these frames. Approved text is never silently changed (Revision exists precisely so it doesn't have to be).

### 5.5 NeedsReview (VerificationFlag)
**Purpose:** The suite's exception queue — anything requiring practitioner judgment before the case can be trusted.
**Anatomy:** amber spine · one-line issue ("WISC-V VCI transcribed as 112; protocol shows 121") · evidence chips for both sides · actions **Resolve · Open source**.
**States:** open · resolved (collapses to single-line ledger entry with who/when) · dismissed-with-reason (reason required, logged).
**Rules:** Flags are specific and actionable — never "check this section." Count of open flags surfaces in CaseStatus. Resolution is always attributed and timestamped (this is audit-trail material).

### 5.6 DraftSection
**Purpose:** One section of the report inside the editor.
**Anatomy:** section title row (title · spine-status rollup dot · word count) · serif document body at `--editor-col` · section footer (sources drawn on).
**States:** empty (invitation: "Draft from 6 sources" button — an empty section is an action, not a void) · drafting · drafted-unreviewed (dashed violet rollup) · reviewed (green) · flagged (amber).
**Rules:** The editor column contains *only* the document — chips, comments, and AI actions live in the margin/popovers so exported fidelity is what you see. Selection raises the contextual toolbar (§6).

### 5.7 CaseActivity (ActivityItem)
**Purpose:** Append-only case history — uploads, generations, acceptances, resolutions, exports.
**Anatomy:** timestamp (mono) · actor (person or "Psych Suite") · verb phrase · object link.
**States:** default · grouped ("3 documents uploaded") · system-vs-human visually distinguished (machine entries carry a small violet tick).
**Rules:** Every AIProposal acceptance and NeedsReview resolution writes here automatically. This component is the audit trail districts will ask about — it is not a social feed; no avatars, no relative-time-only stamps (always absolute on hover).

### 5.8 AssistantPanel
**Purpose:** The conversational interface *into* the case (never a general chatbot).
**Anatomy:** right panel `--assistant-w` · case-scope header ("Asking about: Jordan Matthews") · thread · composer with suggested case-aware prompts.
**States:** closed (default — the Assistant is summoned, not ambient) · open · answering (plain streaming) · answer-with-evidence (claims carry EvidenceChips) · degraded (offline/failed: says so, offers retry — never fakes an answer).
**Rules:** Answers about the case must cite chips or say "no source found — this would be professional judgment." The panel can *propose* (spawning AIProposals in-place); it never silently edits the document.

### 5.9 CommandPalette
**Purpose:** Keyboard-first navigation and action (⌘K).
**Anatomy:** overlay input · grouped results (Go to · Actions · Cases) · shortcut hints.
**States:** empty (recent + suggested) · results · no-results (offers "Ask the Assistant instead").
**Rules:** Every navigable screen and every AIProposal-level action is reachable here. New features aren't done until they're in the palette.

### 5.10 Primitives
Buttons (primary cobalt / secondary outline / ghost / danger — one primary per view) · Inputs (36px, sunken bg, label above, error text below with the fix) · Tabs (underline style, cobalt active) · Tables (sunken header row, `--line-strong` rules, tabular nums, row hover, sortable headers) · StatusPill (semantic colors, never invent new ones) · Toast (bottom-left, 8s, always undoable when destructive) · Modal/Drawer (`--r-lg`, `--shadow-overlay`, focus-trapped) · Skeleton (for every async panel — no spinners on content surfaces) · EmptyState (icon · one sentence · one action — an empty screen is an invitation to act).

---

## 6. Interaction rules

- **Keyboard:** ⌘K palette · ⌘S saves (and says so) · ⌘Enter accepts a focused AIProposal · Esc closes topmost surface. Focus visible always (`--focus-ring`), tab order follows reading order.
- **Selection = intent:** selecting text in a DraftSection raises the contextual toolbar: *Make parent-friendly · Shorten · Check against evidence · Ask about this*. These spawn AIProposals scoped to the selection.
- **Nothing is silent:** every AI action produces a visible frame (AIProposal), a ledger entry (CaseActivity), or both. Every destructive action is undoable or confirmed — never both silent *and* permanent.
- **Errors name the fix.** Errors never apologize, never blame, never say "something went wrong" without saying what to do.

## 7. Copy rules

Sentence case everywhere. Verbs on buttons say what happens ("Draft from sources," not "Submit"). The system speaks plainly and in the interface's voice: found, flagged, ready, needs — never "I think," never exclamation marks, never praise ("Great job!") — the user is a professional, not a student. AI features are named by what they do ("Draft," "Check against evidence"), never "magic," "✨," or "AI-powered."

## 8. Quality gates — merged into Gate C (A-9)

The checklist of record is **Gate C of the Vertical-Slice Directive**; this section contributes its items to that gate rather than existing as a second checklist. Gate C's visual review runs at the fixed widths **1440 / 1024 / 390** against the **Avery Williams** fixture. A screen ships when a screenshot review confirms:

1. Only token values used (spot-check computed styles — no rogue hex, no off-scale spacing).
2. Every async region has skeleton + empty + error states reachable and styled.
3. Spine grammar correct: nothing violet that's been accepted; nothing machine-written outside a Proposal or Revision frame; spine absent from reading mode and export preview.
4. One primary action per view; focus ring visible on tab-through.
5. Dense tables hold alignment with realistic data (3-digit scores, long instrument names, hyphenated student names).
6. Copy passes §7 (no apologies, no exclamation marks, no naked "error").
7. Export fidelity: what the DraftSection shows is what the .docx contains — no spine, markers, or internal controls leak into the document.

Claude Code: run these items as part of Gate C by screenshotting against the Avery Williams fixture before any UI work is committed.

---

## 9. CLAUDE.md insert

Add verbatim to the repo's CLAUDE.md:

```
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
```

---

*v1.1 — Aug 6, 2026: applied ratified amendments A-1 (precedence, navy rail, discipline hues retired), A-2 (trust-contract wording), A-6 (Proposal/Revision variants), A-7 (spine action-relevance scope), A-8 (Avery Williams fixture), A-9 (§8 merged into Gate C). Changes to this document are decision-log entries, not edits.*
