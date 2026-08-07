# VS-0 Implementation Map

**Session:** VS-0 repository/decision audit · 2026-08-06
**Basis:** `psychflow-suite@main` at `4a6324c` (post Step-0 hygiene commit) ·
decision log head **D-132** · directive = Vertical-Slice Build Directive v1.1 (D-126)
**Status:** For JD review. **VS-1 does not start until JD rules on this map and
the Deferred Rulings in §6.**

> **RULED (JD, 2026-08-07 — session VS-1A):** CF-1 → (a); CF-2 → (b);
> CF-3–CF-9 → as proposed. Deferred (a) → A2; Deferred (b) → B1 with
> mandatory conformance testing; Deferred (c) → approved, including
> differentiated exit codes. Attached condition: the Avery fixture is
> disposable implementation data — migration to the v1.6.1 bank is a planned
> re-seed, never an ad hoc edit. Recorded in `decisions.md` as **D-133–D-136**
> plus dated amendment notes under D-038 (CF-4), D-046 (CF-3), D-121 (CF-7).
> VS-1 is unblocked.

Everything below was verified against the repository this session, not carried
from prior summaries (P-03/D-112). Verification evidence: all workspace unit
suites green (intake 63/63, reasoning-contracts 30/30, document-extraction
24/24, case-model / content / extraction-core / referral-engine-core all pass);
RLS integration suite **32/32 against the live dev instance** — which also
proves migrations 0006 (contributor tables) and 0007 (source supersession
columns + triggers) are **applied**, not merely authored; QA repo suite 6/6
green consuming `@suite/reasoning-contracts` and `@suite/document-extraction`
as `file:` dependencies; `verify-suite.sh` 48/48 after Step 0.

---

## 1. Prerequisite status (directive §0: deployable RIE → D-046 → slice)

| Prerequisite | Status | Evidence |
|---|---|---|
| **D-046 shared-layer consolidation** | **Complete** | All six `@suite/*` packages live here under npm workspaces; QA repo imports two of them as `file:` deps; parse-trust vocabulary test 30/30 includes the D-046 check; D-046 completion record logged 2026-08-06. |
| **Deployable RIE — email delivery gate (§3.2)** | **Complete** | `lib/email/sender.ts` (vendor-swappable, Resend-shaped, no-content-logging rule) wired through `invitation-create-core.ts` into the invitations route; unit-tested (`invitation-email.test.ts`). Delivery degrades to link/QR when unconfigured. |
| **Deployable RIE — Teacher Bank ratification gate (§3.2)** | **OPEN** — see conflict CF-1 | App serves ratified v1.3.0; v1.5.0 is an unratified draft behind `INTAKE_BANK_PREVIEW`; D-132 ratified the **v1.6.1 structure** but item wording remains draft (`docs/drafts/teacher-v1.6.1-clinical-review-draft.json`); no v1.6.x bank file exists in `@suite/content`. |
| **Deployable RIE — retention/auto-purge semantics gate (§3.2)** | **OPEN** — see conflict CF-2 | No decision entry rules the semantics; data-posture: "Auto-purge job; relay-and-purge mode — committed, not yet built." Per-case deletion is implemented and tested. |
| **P-OPEN-01–08 (§3.2)** | Not slice-blocking | The gate binds parent-intake construction only; the slice contains no parent intake. |
| **JD ratification of the slice as the step-3 choice** | D-126 ratifies the directive as build-of-record; **this map's review is the remaining go signal** per the session instruction. |

---

## 2. What exists vs. what the slice needs — stage by stage

### VS-1 · Shared case consumption

**Exists**
- `@suite/case-model` 0.4.0: five entities with D-007/D-008 constraints;
  `contributors.ts` (Organization / ProfessionalProfile / CaseAssignment,
  `mayActOnCase` as the sole authorization answer); Source
  version/supersession validation.
- Migrations 0001–0007 **applied to dev** (verified live this session);
  supersession immutability enforced by DB trigger, "superseded" derived.
- 32-check RLS suite covering all core tables plus the three D-131 contributor
  tables (deny-by-default organizations, self-select-only profiles,
  ownership-gated assignments).
- Finalized-Source discipline in the app: checksummed immutable Sources for
  both teacher intake and Capture; server refuses unconfirmed proposals.
- `@suite/document-extraction` (parsers → IR → entity extraction) and
  `@suite/reasoning-contracts` 0.2.0 as the shared vocabulary.

**Slice needs (not present)**
- Any PsychReport-side consumption path — `apps/` contains only `intake`.
- A case-context resolver: finalized Sources → canonical case context under
  the D-046 contracts, refusing unfinalized Capture proposals.
- Contributor attribution wiring: audit `actor` is today a string
  (psychologist auth-id or `respondent:<invitationId>`); the profileId bridge
  exists in schema (`auth_user_id`) but no activity write attributes by
  profile.
- The Avery Williams fixture (exists only as a name in pseudonymization unit
  tests; no seeded case/Sources).
- The §17.2 integration tests (see §5 exit list).

### VS-2 · PsychReport shell + case workspace

**Exists:** DESIGN-SYSTEM.md v1.1 + `tokens.css` (ratified, A-1). Five-tab
shell definition (D-123). WorkspaceCapabilities concept in the v6 handoff.
**Needs:** the entire shell — Home/Cases/Assessment Library/Templates nav,
five functional case tabs on real synthetic data. `preview.html`, which the
Design System names as a companion, **does not exist yet** (DS says it
regenerates during VS-2 — it must first be created then).

### VS-3 · Ingestion + report writer core

**Exists:** canonical `MODE_CONTRACTS`/`SectionMode` + `effectiveCeiling` in
reasoning-contracts (fails safe; guard-tested); operational-spec-v1 as the
current-effective rule set; verbatim v2 prompt extract
(`governance/prompts-verbatim.md`) from the quarantined `stage1-mode-prompts`
branch; `@suite/document-extraction` for added-materials ingestion; one
**draft** instrument-library entry (`library/wisc-v.draft.md`).
**Needs:** the writer itself. Two inherited-defect guards from the log are
binding build requirements, not history: the old prototype's live path
enforced **no ceiling** because `callMode` passed no sources (D-099/D-118),
and its in-file resolver is a divergent buggy duplicate — the slice writer
must import the canonical resolver and wire the full source/validity payload
from day one. Score-verification flow and source markers are net-new.

### VS-4 · Assistant + revision control

**Exists:** AIProposal Proposal/Revision variant definitions (DS §5.4, A-6);
D-088 assistant boundaries. **Needs:** everything at runtime.

### VS-5 · Dependency/impact review

**Exists:** the full DB substrate — 0007 supersession chain, immutability
triggers, derived "superseded," `validateSupersession` in case-model.
**Needs:** impact detection (superseding Source → affected approved content),
the calm impact-review state, clinician-action flow (§12.4: actionable and
reversible, never silent regeneration).

### VS-6 · Documentation Support (Meeting Brief)

**Exists:** nothing at runtime; boundaries defined (D-122, directive Stage J:
reuse approved content, never create eligibility/placement/service/SDI/goal/
accommodation decisions). **Needs:** the one Meeting Brief flow.

### VS-7 · Template + DOCX export

**Exists:** nothing — no DOCX **writer** dependency anywhere in the repo
(document-extraction reads docx, it does not write). **Needs:** template
mapping, export approval/attestation, professional DOCX output, §16 quality
bar including visual inspection of a fixture export.

### VS-8 · Hardening / release gates

**Exists:** Gate C checklist (directive §18, D-130) with fixed viewports
1440/1024/390; the RLS + unit suites as the Gate A base. **Needs:** the gate
runs themselves, visual regression corpus, AI regression fixtures (§17.3).

---

## 3. Conflicts between directive v1.1 and repository reality

Surfaced, not chosen (directive §1: "stop and surface the conflict").
CF-1 and CF-2 require JD rulings before VS-1; the rest are recorded with
proposed dispositions JD can accept or override.

### CF-1 · Teacher Bank gate: directive says "v1.6.0"; ratified reality is v1.6.1-structure with draft wording — **JD ruling required**
Directive §3.2: "Ratify Teacher Bank v1.6.0; continue serving the last
ratified bank until then." Reality: D-132 (post-directive) ratified the
**v1.6.1** structure and quoted strings, with item wording explicitly left
draft pending practitioner review and pilot; no v1.6.x bank exists in
`@suite/content`; the app correctly serves ratified v1.3.0.
**Options:**
- **(a)** Treat the gate as satisfied in substance by D-132: the slice's Stage-A
  fixture seeds against the bank the app actually serves (v1.3.0), and v1.6.1
  bank publication proceeds in parallel on the practitioner-review track.
  Fastest; the fixture then demonstrates the flow on an instrument D-132 has
  since amended.
- **(b)** Hold VS-1 until v1.6.1 item wording clears review and ships as a
  published bank in `@suite/content` (schema-enforced cap + observation
  escape per D-132), so the canonical fixture is born on the current
  instrument. Cleaner fixture; unbounded wait on clinical review.
- **(c)** Start VS-1 data-layer work (which is bank-agnostic) now; gate only
  the Stage-A fixture seeding on the v1.6.1 bank.

### CF-2 · "Deployable RIE" prerequisite vs. the open retention/auto-purge gate — **JD ruling required**
The directive makes deployable RIE prerequisite to the slice, and its §3.2
lists retention/auto-purge semantics as a deployable-RIE gate. No ratified
entry defines those semantics; the job is unbuilt.
**Options:**
- **(a)** Rule the semantics now (a small decision: purge window, trigger
  event, what auto-purge reaches) and build the job before VS-1.
- **(b)** Declare the gate deployment-blocking but not slice-blocking: the
  slice runs on synthetic data only, so retention semantics gate the district
  pilot, not the build. Record that explicitly so the gate isn't silently
  lost.

### CF-3 · D-046 completion record is stale on migration state
The completion note (2026-08-06) says migrations 0006/0007 are "authored, not
yet applied" and that the RLS suite "must gain per-table checks … when
applied." Verified reality: both are applied to dev, and the 32-check suite
covering the three contributor tables is committed and green (Step 0 of this
session). **Proposed:** a dated D-038-style amendment note under D-046 in the
next governance commit. Factual correction only; no ruling needed unless JD
objects.

### CF-4 · D-038 dependency law is stale on QA's legal imports
D-038's diagram: `qa-engine → reasoning-contracts ONLY (never case-model,
never psychreport)`. Reality per the D-046 completion: QA also imports
`@suite/document-extraction` (verified in the QA repo's package.json and
imports; QA imports no case-model anywhere). The law's purpose — QA
independence from the case model — is intact; its letter is outdated.
**Proposed:** dated amendment note adding document-extraction to QA's legal
import set. Interacts with Deferred Ruling (b).

### CF-5 · Directive §3.1 baseline counts are outdated (benign)
"19/19 isolation checks plus 48 unit tests" → now 32/32 RLS and 63 intake
unit tests, all green. The directive itself says repository inspection
supersedes its baseline. Recorded; no action.

### CF-6 · Directive predates D-132
The directive cites "D-121–D-131." D-132 landed after v1.1 and amends the
teacher instrument the Stage-A fixture depends on — resolved through CF-1.
No separate action.

### CF-7 · Parent-spec filename mismatch (benign)
The directive names `Psych_Suite_v6_Claude_Code_Handoff.md`; no file of that
name exists. The v6 package is `docs/psych-suite-v6/`, where
`v6-handoff-chatgpt.md` governs per D-121 precedence. **Proposed:** read all
directive references to the parent spec as pointing there.

### CF-8 · PsychReport app location and the old prototype
The directive sets Repository: `psychflow-suite`, but no PsychReport app
exists here; the old prototype (vanilla-JS `index.html`, quarantined branch,
D-101) lives outside this repo and its live path enforces no interpretive
ceiling (D-118). **Proposed:** build the slice's PsychReport as a new
workspace app (`apps/psychreport`) against canonical contracts, treating the
prototype as interaction reference only (directive §1 item 6) — nothing from
its generation path is ported. Flagged in case JD intended otherwise.

### CF-9 · MANIFEST.sha256 coverage is stale
The manifest verifies 48 files but tracks nothing under `apps/`, migrations
0004–0007, `@suite/document-extraction`, the Design System files, or the
directive itself. Step 0 regenerated hashes over the existing list only
(per the zero-mutation constraint). **Proposed:** extend coverage in the next
governance commit; JD approves the file list since the manifest is a
governance artifact.

---

## 4. VS-1 work plan (concrete, in order)

0. **JD rulings land:** CF-1, CF-2, and the three Deferred Rulings (§6).
1. **Governance/hygiene commit at VS-1 entry:** D-046 amendment note (CF-3),
   D-038 amendment note (CF-4, shaped by ruling (b)), manifest coverage
   extension (CF-9), plus the RLS-harness hardening fix if ruling (c)
   approves its scope.
2. **App scaffold:** `apps/psychreport` workspace (per CF-8), same Supabase
   project and auth/RLS posture as intake; no new vocabulary — imports
   `@suite/case-model`, `@suite/reasoning-contracts`, `@suite/content`.
3. **Case-context resolver:** authorized server-side read of a case and its
   finalized Sources (teacher intake + Capture) into one canonical context
   object; unfinalized/unconfirmed Capture proposals are structurally
   excluded; supersession chains resolve to the current Source with
   "superseded" derived.
4. **Contributor attribution:** seed a synthetic non-Psychology professional
   profile + assignment on the fixture case; record one activity attributed
   by stable `profileId` (bridged from auth identity); existing audit rows
   and their string-actor format remain valid — attribution is added, not
   rewritten.
5. **Avery Williams fixture seed:** synthetic case per directive §6, one
   finalized teacher-intake Source (bank version per CF-1 ruling), one
   finalized RIE Capture Source, at least one concern + one strength.
6. **Integration tests** (list below) before any UI breadth.

### VS-1 exit-test list

From directive §17.2 (VS-1 slice of it) plus D-131:

1. Finalized Teacher Intake Source resolves into PsychReport case context.
2. Finalized RIE Capture Source resolves into PsychReport case context.
3. An unfinalized/unconfirmed RIE Capture proposal does **not** resolve.
4. Source identity and provenance survive the handoff (checksum, bank pin,
   provenance fields readable on the consumed context).
5. Duplicate ingestion does not duplicate a Source.
6. Cross-account access is denied through every new read path.
7. Cross-case object IDs cannot retrieve another case's material.
8. Deleted case material is not reachable through PsychReport.
9. A superseding Source resolves as current; its predecessor reads as
   superseded (derived, not mutated) — the data-layer seed of VS-5.
10. **D-131 attribution test (non-Psychology contributor):** a synthetic
    `speech_language` profile is assigned to Avery's case at the data layer;
    an activity performed by that contributor is attributed to their
    `profileId`; case identity and Source/Evidence semantics are unchanged;
    ending the assignment removes authorization but not the attributed
    history; **zero multidisciplinary UI exists.**
11. The 32-check RLS suite stays green, extended per-table for any new
    tables/paths VS-1 adds.

**Exit (directive §19):** one synthetic case flows across the boundary with
no copy/paste/export-import step, plus test 10 passing.

---

## 5. Deferred rulings for JD

### (a) Decision-log unification — one canon or a formal two-log policy

**Repo evidence.** The QA repo's `docs/decisions.md` now opens with a
subordination notice (2026-08-06): canonical D-numbered log is
`psychflow-suite/decisions.md`; the QA file is "a local architecture log for
the QA Engine repo only"; "no decision IDs (D-NNN) may be minted here"; the
unify-or-formalize question is explicitly deferred to VS-0. Its entries are
dated prose lines (parser offsets, section heuristics, table-confidence
grading …) — implementation-grade, below the trunk's decision grade. Context:
D-029 (repo canonicity), D-058/D-064 (product-repo decisions must merge to
trunk before session end — written after the log forked twice).

**Options:**
- **A1 · Unify.** Migrate any decision-grade QA entries into the trunk as
  `[QA]`-tagged D-entries; archive the local file as history. One canon,
  zero ambiguity; cost: the trunk absorbs engineering micro-decisions it was
  deliberately kept above, and future QA sessions lose a near-the-code log.
- **A2 · Formalize a permanent two-log policy.** The trunk remains the only
  D-numbered canon; product repos may keep **architecture logs** (dated
  lines, no D-IDs, subordination notice mandatory) for implementation forks;
  anything decision-grade (product scope, shared vocabulary, cross-product
  contracts, authority/status semantics) must be minted in the trunk per
  D-058. Requires ruling the decision-grade line; the existing QA notice
  already implements this shape in miniature.
- Evidence leans A2 (the QA file's content is genuinely sub-decision-grade,
  and D-058 already handles the dangerous case), but this is JD's call.

### (b) Evidence contracts vs. the dependency law (D-046 amendment 2 vs. D-038)

**The collision.** D-046 amendment 2: the evidence-object model "should be
shared across Sped QA and PsychReport rather than duplicated." D-038's law:
`qa-engine → reasoning-contracts ONLY, never case-model`. The Evidence object
lives in case-model.

**Repo reality (verified).** `case-model/src/entities.ts` defines Evidence as
a zod schema with behavior-carrying constraints (≥1 construct tag or
topography per D-007; LLM-extracted evidence must record generation
provenance per D-008) inside the five-entity pipeline. reasoning-contracts
holds epistemic vocabulary only and depends on nothing; QA's
`packages/core/findings.ts` has **no** evidence-object model yet (its Finding
carries locations/spans, not Evidence) — so the sharing question is still
cheap to settle: nothing has been duplicated yet. QA already legally imports
reasoning-contracts and document-extraction; it imports case-model nowhere.

**Options:**
- **B1 · Type-shapes in `@suite/reasoning-contracts`; persistence and
  behavior stay in case-model.** The structural shape of an evidence object
  (construct tags, source link, quote span, provenance descriptor) becomes
  pure types in reasoning-contracts; case-model's zod Evidence is typed as
  implementing that shape (one case-model test asserts conformance so the
  two can't drift); QA consumes the shape for its findings without ever
  seeing Case/Source persistence. Honors the law's letter and purpose
  (D-035: QA reconstructs claims from prose, no case model), costs one
  conformance test. Fits the package's charter ("shared epistemic
  vocabulary; depends on nothing").
- **B2 · New Layer-0 package `@suite/evidence-contracts`.** Same content as
  B1 in a dedicated package added to QA's legal imports (amending D-038 as
  CF-4 already must). Keeps reasoning-contracts lean; adds a seventh package
  for a handful of types.
- **B3 · Amend the law to let QA import case-model types-only.** Rejected on
  the evidence: it dissolves the boundary D-035 depends on (QA independence
  from the case model is a ratified selling point), and "types-only" is not
  mechanically enforceable against a package whose main export is the
  five-entity pipeline.
- Evidence leans B1; ruling is JD's.

### (c) RLS harness hardening — scope only, not implemented

**Defect (verified).** In `apps/intake/tests-integration/rls.integration.mjs`,
the seeding inserts for `informants`, `invitations`, and `capture_sessions`
(lines ~88–110) destructure `{ data }` only and never check `error`. A
transient insert failure (network flake, pooler hiccup) yields `invA =
undefined`, and the suite later reports "✖ A sees own invitation" — a seeding
failure masquerading as an RLS policy failure. The case seed and the new
D-131 seeds already throw on error; the gap is the three original secondary
seeds.

**Proposed scope (~10-line diff, no behavior change on green runs):**
1. Destructure `error` on all three seeds and `throw` with a
   `seed <table> as A:` prefix, matching the existing caseA/org/profile
   pattern.
2. Optional: exit code distinguishes seed-abort (2) from policy failure (1),
   so CI can classify.
No retries, no restructuring; assertion checks stay exactly as they are.
Awaiting JD approval to implement (would land in the VS-1-entry hygiene
commit, item 1 of §4).

---

## 6. What this session did and did not do

- **Did:** Step-0 hygiene commit `4a6324c` (32-check RLS suite committed;
  MANIFEST.sha256 regenerated over its existing file list, verify-suite.sh
  48/48; data-posture "19-check" corrected to the honest 32). Ran every
  suite in both repos; verified migration state against the live dev
  instance; produced this map.
- **Did not:** touch RIE behavior, implement any fix from §5, extend
  manifest coverage, or add any specification content beyond this map.
