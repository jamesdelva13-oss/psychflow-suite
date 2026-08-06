# Psych Suite — Vertical-Slice Build Directive v1.1

**Status:** Ratified (D-126) — the build of record at the D-124 sequence-revisit point; executable after deployable RIE and D-046  
**Date:** August 6, 2026 (v1.0 and v1.1)  
**Changelog:** v1.1 — amended per the Aug 6, 2026 governance pass (D-126–D-131, amendments A-1..A-9): precedence adds DESIGN-SYSTEM.md v1.1 + tokens.css (§1); §14.1 visual language re-grounded in the Design System; `--ai-*` semantic rule added to §4 product laws; naming scrub ("RIE Capture", D-127); multidisciplinary data-model requirement in VS-1 (D-131); AIProposal Proposal/Revision variants (Stage H, §10); Evidence Spine action-relevance scope (Stage F); Avery Williams canonical fixture (§6); Gate C fixed viewports + Design System §8 merge (§18)  
**Audience:** Claude Code / implementation team  
**Repository:** `psychflow-suite`  
**Current application:** `apps/intake` (RIE)  
**Stack:** Next.js 15 + Supabase/Postgres with row-level security  
**Parent specification:** `Psych_Suite_v6_Claude_Code_Handoff.md`  

---

## 0. Executive instruction

Do not build the breadth of Psych Suite next. Build one exceptionally polished end-to-end case that proves the suite thesis:

> **Work captured once should become useful throughout the case without re-entry, copying, or loss of professional control.**

The vertical slice is:

> **Teacher Intake + RIE Capture → reviewed shared Case Record → PsychReport → source-linked drafting and review → Documentation Support reuse → DOCX export**

*"RIE" (product) and "RIE Capture" (module) are working names — final name pending ratification (D-127). No user-facing product name appears in slice UI.*

The RIE is already functioning software. Preserve it. The purpose of this slice is to connect its reviewed outputs to a standalone-excellent PsychReport experience through the shared case architecture, while proving the interaction quality expected of a market-leading product.

Do not interpret this directive as permission to supersede ratified sequencing. The currently ratified sequence is:

1. Finish deployable RIE.
2. Complete D-046 shared-layer consolidation.
3. Revisit sequence under D-124.

This directive defines the **recommended build candidate at step 3**. It becomes executable only after JD ratifies that choice.

---

## 1. Source-of-truth precedence

When implementation sources disagree, use this order:

1. **Current `decisions.md` in `psychflow-suite@main`** — canonical ratified decisions, including D-121–D-131 and any later decisions.
2. **Current database migrations and tested repository behavior** — reality of the running system.
3. **`DESIGN-SYSTEM.md` v1.1 + `tokens.css`** — the visual and interaction source of truth (A-1).
4. **This vertical-slice directive** — scope and implementation target after D-046.
5. **Psych Suite v6 Claude Code Handoff** — broader architecture, product behavior, and future-state reference. *Superseded for visual/interaction language* by DESIGN-SYSTEM.md v1.1 + tokens.css (A-1); the rest of the handoff retains this position.
6. Earlier prototypes/specifications — interaction reference only where not superseded.

If this document conflicts with a ratified decision, stop and surface the conflict. Do not silently choose this document.

Do not resurrect a removed feature because it exists in an older prototype.

---

## 2. Why this slice exists

Psych Suite's differentiation is not that it can generate a report. Report generation is becoming table stakes.

The suite must prove a larger proposition:

> **Psych Suite removes work across the professional workflow because each approved piece of case information can be reused where it is legitimately relevant.**

This slice must make that proposition tangible.

A school psychologist should be able to:

1. Create a case once.
2. Receive structured teacher input.
3. Capture and summarize an interview, observation, or call.
4. Review/confirm the material once.
5. Open PsychReport and find that reviewed context already organized.
6. Generate useful report content without re-entering it.
7. Inspect why content appears and where it came from.
8. Revise with AI without surrendering control of approved text.
9. Reuse approved findings for one downstream documentation task.
10. Export a professional Word document.

The magic is not a dashboard explaining the architecture. The magic is that the psychologist does not have to do the same work twice.

---

## 3. Current implementation baseline — preserve, do not rebuild

As of August 5, 2026, RIE has a working end-to-end path. Treat these capabilities as existing assets unless repository inspection shows otherwise.

### 3.1 Existing RIE intake and RIE Capture behavior

- Authenticated psychologist creates a minimally identified case under D-120.
- Secure teacher invitation supports link/QR flow.
- Invitation token is hashed, single-use, and revocable.
- Teacher form supports the four-step-capable workflow, autosave, deterministic branching, and safety-gate flagging.
- Submission locks into a checksummed immutable `Source`.
- RIE Capture supports clinician notes for interviews, observations, and calls.
- Model summary is a proposal beside raw notes.
- Server refuses unconfirmed model proposals from entering the finalized record.
- Notes-only finalize remains allowed.
- Finalization locks the RIE Capture session into an immutable checksummed `Source`.
- Provenance records whether the final summary was model draft verbatim, edited, or clinician-authored.
- Prompt/schema/model versions are pinned for proposals.
- Case Activity renders audit events in human language.
- Audit metadata is mechanically restricted so it cannot become a shadow store of deleted narrative content.
- Per-case deletion performs FK-safe hard deletion of case-scoped data while preserving only the allowed content-free audit residue.
- Row-level security has a repeatable integration suite. The current reported baseline is 19/19 isolation checks plus 48 unit tests green.
- Accessibility improvements include semantic choice groups, labeled required/error states, live regions, focus management, reduced-motion support, and touch-friendly targets.

### 3.2 Existing gates before deployable RIE

Do not let the vertical slice bypass these.

- Ratify Teacher Bank v1.6.0; continue serving the last ratified bank until then.
- Decide retention/auto-purge semantics.
- Connect invitation email delivery as required by the deployable-RIE definition.
- Resolve P-OPEN-01–08 before building parent intake.
- Complete any other ratified RIE deployment gates added after this directive.

### 3.3 D-046 before vertical-slice implementation

D-046 consolidates split shared contracts/parser functionality into the canonical shared package structure. Complete it before connecting PsychReport to the case record.

Do not create a second Case/Source/Evidence vocabulary to accelerate the slice.

---

## 4. Product laws carried forward from v6

These are not optional styling preferences.

### 4.1 Reduce work today

Every visible feature should remove meaningful effort from a real evaluation workflow. If it does not, defer it or keep it behind the scenes.

### 4.2 Appear simpler than the work

The underlying system may perform many checks. The screen should normally show one useful result and one next action.

### 4.3 One primary action per screen

Secondary actions must be visibly subordinate. Do not create control panels simply because the data model supports many actions.

### 4.4 AI-first, structure-second

Use strong model context plus light, deterministic validation. Do not force the psychologist through a visible reasoning pipeline.

### 4.5 Infer convenience; require accountability

Infer and organize aggressively where doing so saves work. Require explicit professional confirmation where the clinician is accountable for accuracy or a decision.

At minimum, explicit confirmation remains for:

- extracted scores used in a report;
- administration validity representations;
- material clinical conclusions where required by the ratified workflow;
- eligibility representations if a future authorized artifact supports them;
- final attestation;
- export approval.

### 4.6 No silent mutation

AI proposes. The professional previews and applies. Approved report content is never silently regenerated.

If later evidence could materially affect approved text, mark that content for impact review. Preserve the current version until the professional acts.

### 4.7 Progressive disclosure

Provenance, evidence details, mappings, model versions, audit history, and technical validation should appear only when requested or action-relevant.

### 4.8 Calm professional presentation

Psych Suite should feel like premium professional software, not a compliance dashboard and not a collection of AI utilities.

### 4.9 The unaccepted-AI state is unmistakable (A-2)

The `--ai-*` visual state marks unaccepted machine-proposed content only, and nothing else in the product may be visually confusable with it. Standing rule unless explicitly superseded by a future design-system decision.

---

## 5. Scope of the vertical slice

### 5.1 Build now, after ratification

Implement one complete Psychology path using one synthetic case.

Required functional surfaces:

1. Existing RIE Teacher Intake.
2. Existing RIE Capture.
3. Shared case handoff/context generated through D-046 contracts.
4. PsychReport standalone shell.
5. Shared case-level navigation in PsychReport:
   - Overview
   - Case Materials
   - Evaluations
   - Documentation Support
   - Timeline
6. PsychReport ingestion/context review for existing RIE sources plus directly added evaluation materials.
7. A real report writer capable of producing and editing a meaningful synthetic psychological evaluation draft.
8. Persistent contextual assistant.
9. Source inspection / “Why this is here.”
10. One clinically meaningful smart interruption.
11. Score verification.
12. One AI revision proposal with preview/apply/keep behavior.
13. Approved-content protection and stale/impact-review behavior.
14. One standalone Documentation Support reuse flow.
15. Template-to-DOCX export with final approval.
16. Timeline/activity presentation appropriate to the standalone case.

### 5.2 Explicitly not required for this slice

Do not build breadth merely to make the suite look complete.

- Full district coordination shell
- Multidisciplinary Psychology + Speech + OT workflow
- Complete Speech Studio
- Complete OT Studio
- Full Sped QA integration
- District IEP Drafting
- District MDR Documentation
- District Eligibility Preparation
- Full district administration
- SSO
- SIS integration
- Invitation flow between independent professionals from v7
- Autonomous interviewing
- Assessment-battery automation
- Parent conversational AI
- Voice/SMS expansion beyond already ratified RIE and RIE Capture work
- Full assessment-library breadth
- Full template marketplace/library
- Analytics dashboards
- Visible evidence/reasoning dashboards

Preserve architectural room for the broader v6 product. Do not implement its entire surface.

---

## 6. The synthetic vertical-slice case

Use synthetic data only.

The fixture should be clinically coherent enough to stress the workflow rather than merely populate UI.

### Primary case

**Student:** Avery Williams  
**Grade:** 4  
**School:** Union Elementary  
**Evaluation:** Initial evaluation  
**Psychologist:** James Delva  

Avery Williams is the canonical fixture across seeds, tests, AI regression, screenshots, export verification, accessibility, visual regression, and demos (A-8). The Design System preview (`preview.html`) regenerates against Avery during VS-2. A future clinical-regression corpus of additional cases is separate from, and does not replace, the canonical product fixture.

RIE-side material should include:

- a completed teacher intake;
- a finalized RIE Capture session, such as a parent/teacher interview or behavioral observation;
- at least one concern relevant to the psychological evaluation;
- at least one strength;
- enough source-specific detail to demonstrate attribution and source reuse.

PsychReport-side material should include enough synthetic evaluation data to demonstrate:

- background/reason for referral;
- behavioral or observational material;
- assessment results;
- academic findings;
- integration/interpretation;
- recommendations;
- source inspection;
- score verification;
- one contradiction, gap, or missing measurement that creates a legitimate smart interruption.

The existing v6 sample scores may be used if consistent with the canonical fixture:

- WIAT-4 Word Reading: 71
- WIAT-4 Pseudoword Decoding: 69
- WIAT-4 Reading Comprehension: 76

Do not place real student data in demo fixtures, screenshots, tests, seeds, logs, or prompts.

---

## 7. End-to-end user journey

The build is not complete unless this journey works as one coherent product story.

### Stage A — Work is captured upstream

The psychologist has already created Avery's case in RIE.

Teacher input is completed and finalized as a Source.

The psychologist completes one RIE Capture session. A model proposes a summary, the psychologist reviews it, and finalization creates its Source.

The user should not have to “export from RIE and import into PsychReport” in order to continue.

### Stage B — PsychReport recognizes the case context

On entering PsychReport, Avery appears as an available case through the authorized shared case model.

Opening Avery reveals the standard five-tab case shell:

> Overview · Case Materials · Evaluations · Documentation Support · Timeline

The user should experience continuity, not product switching plumbing.

### Stage C — Case Materials demonstrates reuse

Case Materials clearly shows the finalized Teacher Intake and RIE Capture Source alongside evaluation-specific materials.

Use plain-language labels. Do not expose internal object taxonomies as the primary UI.

The page should communicate something like:

> **Everything organized in one place**  
> Teacher input and your finalized interview notes are already available for this evaluation.

Primary action: **Add materials** if more evaluation data is needed.

### Stage D — PsychReport produces immediate value

From Evaluations or Overview, the psychologist starts/continues the psychological evaluation.

PsychReport should use reviewed case context automatically. It must not require the psychologist to re-paste Teacher Intake or RIE Capture summaries.

Before generation, surface only action-relevant exceptions. Do not present a mandatory data-cleaning dashboard.

The ingestion/result moment should be concise, for example:

> **Avery's evaluation is ready to draft.**  
> Teacher input and interview material are already organized. Assessment results were identified. One score needs verification.

Primary action: **Start the report**.

### Stage E — Report writing is document-centered

The report opens as the main work surface.

Layout:

- compact section outline on the left;
- report/document canvas in the center;
- contextual assistant rail on the right on wide screens.

The assistant must not become the application. The report is primary.

### Stage F — Grounding is inspectable, not intrusive

Generated prose may show subtle source markers.

Selecting a marker or “Why this is here” opens the minimum supporting context necessary to understand the statement:

- source identity/type;
- relevant source excerpt or structured response;
- whether the material was clinician-confirmed where applicable.

Do not show claim types, source ceilings, evidence ladders, or provenance tables by default.

The Evidence Spine renders only where provenance or review status is relevant to the user's current action — proposals, revisions, verification and review states, evidence inspection, impact review — never on every evidence-backed paragraph or file card, and never in reading mode, export preview, or exported documents. Tier labels stay progressively disclosed. Assess during VS-3: a striped screen means overuse. (A-7; Design System §2)

### Stage G — One smart interruption proves judgment support

Use a clinically meaningful gap, not a missing administrative field.

Example from v6:

> The teacher described reading-fluency concerns, but no fluency measure appears in the case materials. Continue with current evidence?

The user must be able to continue, add information, or otherwise resolve the interruption without entering a new workflow maze.

### Stage H — AI revision proves professional control

Demonstrate one contextual revision.

The user can select text and ask the assistant to:

- make it more parent-friendly;
- shorten it;
- make the wording more precise; or
- incorporate a reviewed source.

The model returns a proposal.

Required actions:

- **Apply revision**
- **Keep current version**

Preview before mutation. Preserve version history.

Machine-proposed content always renders in one of the two AIProposal variants (Design System §5.4, A-6):

- **Proposal** — new content, nothing approved yet. Actions: **Accept · Edit · Regenerate · Dismiss**.
- **Revision** — a machine-proposed change to already-approved text. A previewed diff against the current approved version; actions: **Apply revision · Keep current version**. The prior version is preserved.

The Assistant spawns either variant; conversation alone never mutates content.

### Stage I — New evidence proves safe reuse

After one section has been approved/reviewed, add or modify a reviewed case input that materially affects it.

Psych Suite must not silently regenerate the section.

Instead, mark the affected content with a calm impact-review state such as:

> **New case information may affect this section. Review change →**

Show what changed and allow the psychologist to decide whether to update the report.

### Stage J — Documentation Support proves downstream reuse

In the standalone PsychReport case, implement **one** useful Documentation Support flow rather than several shallow tools.

Preferred slice: **Meeting Brief**.

The Meeting Brief should reuse approved evaluation content and produce a concise, reviewable preparation artifact without requiring re-entry.

It may summarize approved strengths, key findings, questions, and recommendations. It must not create eligibility, placement, service, SDI, goal, or accommodation decisions.

Do not build district IEP/MDR/Eligibility tools in this slice.

### Stage K — Export completes the professional loop

The report can be mapped/rendered to one synthetic target template and exported as DOCX.

The ideal completion state remains:

> **Union County Initial Evaluation — everything required by the template is mapped.**

Primary action: **Export report**.

The full mapper appears only behind **View mapping**.

Export requires final approval/attestation as defined by the canonical decisions.

The generated Word document must be professionally usable, not merely technically valid.

---

## 8. PsychReport case workspace specification

Implement the v6 case shell in the standalone Psychology profile only for this slice, but make the shell capability-driven so District/Speech/OT can use the same structure later.

### 8.1 Global PsychReport navigation

- Home
- Cases
- Assessment Library
- Templates

Settings remain under the user/profile menu.

Do not show District, Speech, OT, IEP, MDR, or Eligibility as unavailable/coming-soon features.

### 8.2 Case header

Show only useful case identity/context and the five tabs:

> Overview · Case Materials · Evaluations · Documentation Support · Timeline

Do not place redundant progress meters in the header if the current surface already communicates progress.

### 8.3 Overview

Target one calm screen.

Required:

- one readiness sentence;
- one next best action;
- current psychological evaluation state;
- at most one or two professional judgment items;
- one quiet message demonstrating reuse of upstream context.

Example:

> **The record is mostly complete.**  
> Teacher input and your finalized interview are already available. One score verification remains before the draft is ready for final review.

Avoid queue cards, audit summaries, evidence dashboards, and repeated status badges.

### 8.4 Case Materials

Required:

- finalized RIE Teacher Intake Source;
- finalized RIE Capture Source;
- direct PsychReport uploads/materials;
- plain-language status;
- Add materials action;
- source inspection.

The system must preserve source identity and provenance internally without making the file list look like a forensic evidence system.

### 8.5 Evaluations

Show only Psychological Evaluation.

Primary action: **Continue writing** or **Start the report**, depending on state.

Include a quiet message:

> Reviewed teacher input, interview material, observations, and scores are available in the writer without re-entering them.

### 8.6 Documentation Support

For this slice, implement Meeting Brief as the working tool.

Other standalone tools from v6 may remain unimplemented and should not appear as dead controls.

Do not show district-specific Documentation Support.

### 8.7 Timeline

Show meaningful case milestones, not every API or model event.

Possible milestones:

- Teacher intake received
- RIE Capture summary finalized
- Evaluation opened
- Assessment results organized
- Score verified
- Report section reviewed
- New information flagged for impact review
- Report exported

The lower-level audit trail may remain available where required, but the Timeline is a professional workflow view, not a raw audit viewer.

---

## 9. PsychReport writer specification

### 9.1 Writing modes

Preserve the established mode-scoped drafting architecture where applicable:

- `SOURCE_FAITHFUL`
- `DIRECT_OBSERVATION`
- `DESCRIPTIVE_RESULTS`
- `INTEGRATED_INTERPRETATION`
- recommendation mode as defined by the current canonical prompt set

Do not collapse everything into one generic “write psych report” prompt.

Do not expose these internal mode labels in routine UI.

### 9.2 Narrative quality

Generated writing should be professionally natural, cohesive, parent-accessible where appropriate, and faithful to source boundaries.

The model should be allowed to reason within the authorized mode. Do not constrain it with so many prohibitions that output becomes lifeless or templated.

### 9.3 Source-faithful content

Informant content must preserve attribution, disagreement, omissions, and uncertainty. Do not convert reported impressions into established fact.

### 9.4 Score narration

Deterministic calculations and score structures should remain deterministic. The model narrates validated results; it does not invent or silently correct scores.

### 9.5 Interpretation

The model may draft professional interpretation from reviewed evidence. The psychologist remains responsible for clinical conclusions and final report approval.

### 9.6 Recommendations

Recommendations may be proposed as reviewable report content within the ratified PsychReport boundary. Do not cross into final team determinations reserved for IEP/eligibility processes.

### 9.7 Adverse impact / SDI boundary

Carry forward the existing PsychReport boundary: adverse-impact and SDI language are not ordinary PsychReport content unless a later ratified decision explicitly changes that architecture.

---

## 10. Assistant specification for the slice

The assistant is persistent and prominent but secondary to the case/report.

### Case context

Example:

> Working in: Avery Williams · Overview

Useful actions:

- find a reviewed record;
- explain what remains;
- prepare the next report section;
- open the evaluation;
- draft a Meeting Brief from approved content.

### Writer context

Example:

> Working in: Academic Achievement  
> Can use: Avery's reviewed case materials

Useful actions:

- revise selected text;
- make prose more parent-friendly;
- explain supporting sources;
- prepare the next section;
- surface a relevant case record;
- preview a proposed change.

### State-change rule

State-changing AI responses must end with explicit user actions such as:

- Preview change
- Apply revision
- Add to draft
- Keep current version

Never make a hidden write to approved report content from conversation alone.

State-changing responses resolve into one of the two AIProposal variants defined in Stage H and Design System §5.4 (A-6): **Proposal** for new content, **Revision** (previewed diff) for changes to approved text.

### Responsive behavior

- Wide writer: right rail open by default.
- Collapsed rail: clear Assistant handle, conversation preserved.
- Narrow/mobile: bottom sheet.
- Assistant must not shrink the document to an unusable width.

---

## 11. Human-decision boundaries

The system may organize, summarize, draft, compare, explain, and propose.

It must not make final professional/team determinations.

Do not generate as system verdicts:

- eligibility determinations;
- eligibility-category rankings;
- manifestation determinations;
- placement decisions;
- service determinations;
- SDI determinations;
- final IEP goals;
- final accommodations;
- defensibility scores/grades;
- final clinical attestation.

The interface should not repeatedly lecture the user about these boundaries. Enforce them in architecture and show concise explanation only when relevant.

---

## 12. Shared data and provenance contract

### 12.1 One canonical case

The slice must not create a second PsychReport-only copy of Avery's case merely for convenience.

PsychReport may own evaluation-specific state, but case identity and approved/reviewed shared material must resolve through the canonical shared contracts established by D-046.

### 12.2 Source integrity

Finalized RIE intake and RIE Capture Sources remain immutable. PsychReport consumes them; it does not rewrite their history.

Corrections or updates must follow the canonical version/supersession model rather than mutating finalized source content in place.

### 12.3 Provenance

The system must be able to answer internally:

- Where did this input originate?
- Was it raw, model-proposed, edited, or clinician-authored?
- Who confirmed it?
- What version was used for generation?
- What report content depended on it?

Ordinary users should see only the subset needed to understand or act.

### 12.4 Dependency/impact behavior

When an approved source changes or a superseding source is added, identify potentially affected report content.

Do not silently regenerate.

Impact state must be actionable and reversible.

---

## 13. Security and privacy requirements

Do not weaken RIE security controls to make cross-product reuse easier.

### Required

- Preserve RLS on student/case data.
- Preserve profile/organization isolation.
- Test cross-case and cross-account access for every new table/path.
- Keep respondent-facing access token-scoped and least-privilege.
- Do not expose service-role privileges to the client.
- Add authorization tests for server routes that use privileged database access.
- Preserve safe deletion behavior across newly added case-scoped records.
- Ensure audit/timeline metadata cannot become an uncontrolled narrative store.
- Avoid student narrative in operational logs, analytics events, error reporting, or test snapshots.
- Keep model-call data posture consistent with the ratified privacy statement.

### Model-call identity handling

Do not overclaim “de-identified” or “pseudonymized” model calls based only on replacement of the known first-name/last-initial case identifier. RIE Capture free text can contain names, schools, relatives, emails, phone numbers, or other identifiers.

Follow the ratified data-posture policy. If the product promises broader pseudonymization, implement and adversarially test that broader claim before representing it as guaranteed.

---

## 14. Market-leader product-quality bar

Passing unit tests is necessary and insufficient.

Every slice screen must pass a separate product-quality review.

### 14.1 Visual language

Visual and interaction language are governed by DESIGN-SYSTEM.md v1.1 and tokens.css (A-1). Carried forward from v6: the dark navy navigation rail (now tokenized). Retired: discipline accent hues — discipline identity is carried by labels. The v6 prohibitions (audit aesthetics, badge proliferation, tiny status text, repeated progress states) remain in force. Typography follows the Design System scale; the 12px floor supersedes v6's 10px eyebrow minimum.

### 14.2 Interaction quality

Every important state needs a deliberate experience:

- empty
- loading
- success
- recoverable error
- permission denied
- AI generating
- AI proposal ready
- stale/impact review
- autosave/saved
- export preparing
- export failed
- export complete

Do not leave framework-default spinners, raw exception text, or layout jumps in the primary journey.

### 14.3 Perceived performance

Long AI/file operations should communicate progress without inventing false precision.

Use optimistic UI only where rollback is safe and the user is not being misled about completion.

Avoid blocking the whole workspace when only one panel is working.

### 14.4 Cognitive load

Before accepting any screen, ask:

- What is the one thing the user should do next?
- What information can disappear until requested?
- Is the same status shown twice?
- Are we exposing a database concept instead of a professional concept?
- Could this interaction be one step instead of two?

### 14.5 No decorative functionality

Every visible button, tab, link, menu item, or control in the slice must work.

Do not display future features as disabled controls to make the product look larger.

---

## 15. Accessibility bar

Preserve the accessibility work already completed in RIE and apply the same standard to PsychReport.

Required:

- semantic headings/navigation/dialogs/forms;
- full keyboard operation;
- visible focus states;
- accessible names for icon controls;
- adequate contrast;
- statuses communicated by more than color;
- screen-reader-friendly errors and confirmations;
- focus management after dialogs, AI proposals, and navigation transitions;
- reduced-motion support;
- touch-friendly targets;
- text scaling without clipped controls;
- report editor usable at 100% zoom on standard laptop screens;
- assistant usable without trapping focus or obscuring the report.

---

## 16. DOCX export quality bar

Export is part of the product, not an engineering afterthought.

For the synthetic template, verify:

- headings map correctly;
- paragraph spacing is professional;
- tables do not break unexpectedly;
- page breaks are sensible;
- headers/footers render as expected where supported;
- fonts/styles degrade predictably;
- no source markers/internal controls leak into the final document unless intentionally included;
- no unresolved template tokens remain;
- final file opens cleanly in Microsoft Word;
- content order matches the target mapping;
- export accurately reflects the approved version.

At least one exported fixture should be visually inspected, not only structurally tested.

---

## 17. Testing strategy

Treat this slice as the beginning of a permanent release corpus.

### 17.1 Existing tests

All RIE unit and RLS tests must continue to pass. Do not weaken or delete a test merely because the new architecture makes it inconvenient.

### 17.2 New contract/integration tests

At minimum test:

- finalized Teacher Intake resolves into PsychReport case context;
- finalized RIE Capture Source resolves into PsychReport case context;
- unfinalized/unconfirmed RIE Capture proposal does not;
- source identity/provenance survives the handoff;
- duplicate ingestion does not duplicate a Source;
- cross-account access remains denied;
- cross-case object IDs cannot be used to retrieve another case;
- deleted case material is not reachable through PsychReport;
- new/superseding source can create impact-review state;
- impact review never silently overwrites approved prose;
- score cannot become verified without the required clinician action;
- AI revision cannot mutate approved text without Apply;
- export uses the approved document version.

### 17.3 AI regression fixtures

Create a fixed synthetic corpus for the major drafting modes used in this slice.

For each important prompt/model change, compare:

- source fidelity;
- unsupported assertions;
- attribution;
- score accuracy;
- tone/professional usability;
- appropriate uncertainty;
- preservation of contradictory informant reports;
- parent accessibility where requested.

Do not rely on snapshot equality for prose quality. Use deterministic checks plus human/LLM-evaluator review as appropriate, with a stable rubric.

### 17.4 Product-flow test

Automate the critical happy path where practical:

> case → finalized teacher source → finalized RIE Capture source → PsychReport case → draft → verify → revise → review → Meeting Brief → export

Also test one recovery path: model/file operation fails, user can recover without losing confirmed work.

### 17.5 Visual regression / rendered QA

Capture key screens at standard laptop and narrow viewport sizes.

At minimum:

- PsychReport Home
- Case Overview
- Case Materials
- Evaluations
- Writer with assistant
- revision proposal
- Supporting Evidence drawer
- impact-review state
- Documentation Support Meeting Brief
- export-ready state

Review typography, overflow, spacing, hierarchy, focus behavior, and control density.

---

## 18. Three release gates

Do not call the vertical slice complete because the feature list exists.

### Gate A — Engineering quality

Pass when:

- unit/integration/RLS suites pass;
- migrations are reproducible;
- no tenant/profile isolation regression exists;
- deletion/retention behavior includes the new case records;
- privileged server paths are authorization-tested;
- no dead controls exist;
- error paths preserve confirmed work;
- DOCX export succeeds reliably.

### Gate B — Clinical/AI quality

Pass when:

- source-faithful sections do not invent or silently synthesize beyond mode boundaries;
- scores are exact and verified;
- contradictions remain visible rather than reconciled by invention;
- interpretations stay within reviewed evidence;
- revision behavior preserves professional intent;
- Meeting Brief uses approved content without creating team decisions;
- no eligibility/manifestation/placement/service verdict is generated;
- the synthetic report is something a practicing school psychologist could meaningfully edit toward completion.

### Gate C — Product quality

Gate C is the single quality checklist of record (A-9). Its visual review runs at the fixed viewports **1440 / 1024 / 390** against the Avery Williams fixture and incorporates the Design System §8 items:

- token purity — no rogue hex, no off-scale spacing (spot-check computed styles);
- semantic-color correctness — cobalt is interaction only, violet is unaccepted AI only, green is verified only;
- spine grammar — violet dissolves on acceptance; nothing machine-written outside a Proposal/Revision frame; no spine in reading mode or export preview;
- full state coverage — every async region has skeleton, empty, and error states reachable and styled;
- hierarchy — one primary action per view; focus ring visible on tab-through;
- responsiveness and accessibility states hold at all three viewports;
- dense tables hold alignment with realistic data;
- copy passes Design System §7;
- export fidelity — the .docx contains exactly what the DraftSection shows; no spine, markers, or internal controls leak.

Pass when the above hold and:

- the critical workflow can be understood without explanation from the builder;
- each screen has one obvious next action;
- the user never re-enters Teacher Intake / RIE Capture content merely to use it downstream;
- no primary screen looks like an audit console;
- typography and spacing meet the Design System scale (§14.1);
- all loading/error/AI states are deliberate;
- report remains primary when assistant is open;
- common actions feel fast and low-friction;
- exported Word document looks professional;
- a user can complete the synthetic journey without encountering a dead end.

This gate should be judged against modern premium professional SaaS quality, not against an internal prototype.

---

## 19. Recommended implementation sequence inside the slice

After deployable RIE, D-046, and explicit JD ratification of this directive:

### VS-0 — Repository/decision audit

- Read current `decisions.md` completely for decisions affecting the slice.
- Inspect current migrations, packages, app boundaries, tests, and RIE behavior.
- Identify conflicts between this directive and repository reality.
- Produce a short implementation map before mutation.
- Do not redesign already working RIE behavior without a documented reason.

### VS-1 — Shared case consumption

- Establish PsychReport consumption of canonical Case/Source contracts after D-046.
- Prove Teacher Intake and RIE Capture Sources can be read in an authorized PsychReport context.
- The canonical case model supports multiple professional contributors/assignments across disciplines without changing case identity or Source/Evidence semantics; case activity preserves actor attribution; authorization stays in the canonical organization/profile/role/assignment model (D-131).
- Add isolation/deletion/provenance integration tests before UI breadth.

**Exit:** one synthetic case flows across the boundary with no copy/paste/export-import step. A synthetic non-Psychology professional can be added to Avery's case at the data layer and an activity is correctly attributed to that contributor, with zero multidisciplinary UI.

### VS-2 — PsychReport shell + case workspace

- Build the standalone PsychReport shell.
- Implement five functional case tabs.
- Build Overview, Case Materials, Evaluations, Timeline using real synthetic data from the canonical case path.
- Do not add placeholder Speech/OT/District controls.

**Exit:** case continuity is visible and coherent before report generation exists.

### VS-3 — Ingestion + report writer core

- Add evaluation-specific materials.
- Implement exception-focused review.
- Implement the document-centered writer.
- Connect the established mode-scoped generation behavior.
- Add source markers/Supporting Evidence.
- Add score verification.

**Exit:** Avery can reach a meaningful, grounded psychological evaluation draft.

### VS-4 — Assistant + revision control

- Add persistent contextual assistant.
- Add selected-text revision proposal.
- Require explicit Apply.
- Preserve prior version.
- Add one smart interruption.

**Exit:** AI visibly saves work without silently controlling the document.

### VS-5 — Dependency/impact review

- Introduce a new/superseding reviewed case input.
- Mark affected approved content.
- Show comparison/proposed change.
- Require clinician action.

**Exit:** the suite proves that reused case data stays connected after drafting.

### VS-6 — Documentation Support reuse

- Implement standalone Meeting Brief from approved report/case content.
- Keep it reviewable and human-controlled.

**Exit:** approved evaluation work demonstrably saves downstream documentation time.

### VS-7 — Template + DOCX completion

- Map to one synthetic district-style template.
- Implement export approval.
- Produce professional DOCX.
- Visually inspect the fixture output.

**Exit:** the full professional loop ends outside Psych Suite in a usable document.

### VS-8 — Hardening and market-leader polish

- Run all three release gates.
- Run responsive/accessibility QA.
- Resolve visual-regression issues.
- Remove duplicated status, extra actions, placeholder copy, and framework-default states.
- Measure the journey and reduce unnecessary steps.

**Exit:** the vertical slice is ready to show design partners as a product experience, not merely a technical demo.

---

## 20. Acceptance checklist

### Architecture and reuse

- [ ] Deployable RIE remains intact and its tests stay green.
- [ ] D-046 is complete before the slice crosses app/package boundaries.
- [ ] Teacher Intake and finalized RIE Capture are consumed without export/import or copy/paste.
- [ ] A canonical case/source model is used; no duplicate PsychReport case universe is created.
- [ ] Profile/tenant isolation remains enforced.
- [ ] Finalized upstream Sources remain immutable.

### PsychReport standalone completeness for the slice

- [ ] PsychReport has its own functional Home, Cases, Assessment Library, and Templates navigation as needed by this slice.
- [ ] Opening Avery shows Overview, Case Materials, Evaluations, Documentation Support, Timeline.
- [ ] No District/Speech/OT features leak into the standalone case.
- [ ] The case can reach a grounded evaluation draft.
- [ ] The report can be reviewed, revised, approved, mapped, and exported.

### AI and professional control

- [ ] Assistant is contextual and persistent.
- [ ] Report remains primary work surface.
- [ ] AI revision is previewed before application.
- [ ] Approved content is never silently changed.
- [ ] New evidence can create an impact-review state.
- [ ] Score verification requires explicit clinician confirmation.
- [ ] Smart interruption is rare and clinically meaningful.
- [ ] No prohibited team/professional verdict is generated.

### Evidence transparency

- [ ] User can inspect why a material statement appears.
- [ ] Supporting context is concise and source-linked.
- [ ] Internal evidence ontology is not exposed by default.
- [ ] Source provenance remains machine-auditable.

### Downstream reuse

- [ ] Meeting Brief can reuse approved case/report content.
- [ ] User does not re-enter the same information.
- [ ] Meeting Brief stays within standalone Documentation Support boundaries.

### Export

- [ ] One target template maps successfully.
- [ ] Export requires final approval.
- [ ] DOCX contains the approved report version.
- [ ] DOCX has been visually inspected and is professionally usable.

### Product quality

- [ ] One primary action per major surface.
- [ ] No repeated status on the same screen.
- [ ] No dead controls or coming-soon navigation.
- [ ] No essential microcopy.
- [ ] Empty/loading/error/generation/success states are designed.
- [ ] Standard laptop workflow is comfortable at 100% zoom.
- [ ] Narrow-screen behavior remains functional.
- [ ] Keyboard/screen-reader/focus/reduced-motion requirements pass.
- [ ] Critical journey can be completed without builder explanation.

---

## 21. What success should feel like

Do not demo the vertical slice by explaining the data model.

The successful demo is approximately this:

> “The teacher already completed Avery's intake, and I summarized my interview yesterday. When I open Avery in PsychReport, both are already here. I add the test results, verify one extracted score, and start the report. The draft already knows the relevant teacher and interview history. If I want to know why this sentence is here, I can see its source. I can ask the assistant to rewrite this paragraph for parents, but nothing changes until I approve it. When new information comes in, Psych Suite tells me which reviewed section may be affected instead of silently rewriting it. When I finish, it prepares my meeting brief from the approved report and exports into the district Word format.”

If that experience is smooth, the suite thesis has been demonstrated.

If the demo instead requires an explanation of evidence objects, case synchronization, AI modes, or audit states, the implementation is exposing too much machinery.

---

## 22. Final instruction to Claude Code

Build this as a **vertical product**, not a collection of screens.

Protect the RIE implementation already completed. Use D-046 to consolidate the shared foundation before adding cross-product behavior. Then make one Psychology case travel cleanly from intake and RIE Capture through report drafting, evidence inspection, professional revision, downstream reuse, and Word export.

Optimize in this order:

1. **Less repeated work.**
2. **Professional control and fidelity.**
3. **Simple, coherent interaction.**
4. **Security and provenance that hold under adversarial testing.**
5. **Market-leading visual and interaction polish.**

Do not substitute breadth for completeness. Do not substitute architectural sophistication for a good experience. Do not substitute a pretty prototype for working data flow.

The target is one case that makes the value of Psych Suite obvious without a sales explanation.

