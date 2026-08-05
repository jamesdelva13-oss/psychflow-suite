# Psych Suite v6 — Claude Code Handoff

**Status:** Current prototype specification  
**Date:** August 5, 2026  
**Audience:** Claude Code / implementation team  
**Prototype:** `https://psychreport-prototype.ngsjq7pfqx.chatgpt.site`  
**Access:** Owner-only. Do not make public or change access without explicit authorization.  
**Naming:** Psych Suite, Evaluation Platform, PsychReport, Speech Studio, and OT Studio are working names.

---

## 1. Purpose of this document

This is the authoritative handoff for the current v6 prototype. It consolidates the product decisions, design corrections, screen architecture, interaction behavior, content boundaries, visual language, and acceptance requirements established across the prototype iterations.

Claude Code should use this document as the implementation baseline. Do not infer the product from an earlier prototype, restore removed audit-oriented UI, or treat the district shell as the only complete case workspace.

The central product objective is:

> Help school psychologists, speech-language pathologists, and occupational therapists complete evaluation work with substantially less effort while preserving professional control.

The interface should always appear simpler than the work happening behind it.

---

## 2. Strategic product position

Psych Suite is not primarily an audit product and should not look like one. It is an AI-assisted evaluation and professional writing platform with quiet evidence, provenance, consistency, and audit capabilities.

The user does not buy an evidence ontology or visible reasoning architecture. The user buys less work.

### Product differentiation

Competitors may solve:

> Write a report.

Psych Suite should solve more of the professional workflow:

1. Receive or create the case.
2. Organize records.
3. Collect and summarize informant input.
4. Add observations, protocols, scores, notes, and work samples.
5. Draft the evaluation.
6. Review and revise it.
7. Reuse approved information in supporting documentation.
8. Map the report into the required template.
9. Export the final professional document.
10. In district accounts, coordinate work across disciplines and downstream team processes.

The suite’s moat is workflow coverage and cohesion, not an explicit rules engine placed between the clinician and the model.

### Design law

Every proposed feature must answer:

> Does this reduce work today?

If the answer is no, it should remain behind the scenes, be deferred, or be removed.

---

## 3. Non-negotiable UX principles

1. **One primary action per screen.** Secondary actions must be visually subordinate.
2. **AI-first, structure-second.** Give the model relevant context and tools, then use light validation. Do not force the user through a visible reasoning pipeline.
3. **Progressive disclosure.** Evidence details, provenance, mappings, settings, version history, and technical validation appear only when requested or action-relevant.
4. **Infer convenience; require accountability.** Infer what can safely save time. Require explicit confirmation for scores, administration validity, clinical conclusions, eligibility representations, final attestation, and export.
5. **Interrupt rarely.** Interrupt only when the answer materially changes the draft, the clinician is accountable for verifying it, or proceeding silently creates meaningful risk.
6. **Immediate value.** A user should receive something useful within 30–60 seconds of entering a product.
7. **Consistent rhythm.** Across all evaluation products: upload → review → edit → export.
8. **Conversational assistance, document-centered work.** The assistant is prominent, but the report or case remains the main work surface.
9. **No silent mutation.** AI proposes. The professional previews and applies. Approved text is never silently regenerated.
10. **Calm, warm, confident presentation.** Avoid enterprise-dashboard density, visible system internals, repeated status indicators, and explanatory architecture copy.

---

## 4. Product architecture

There are three categories. Do not conflate them.

### 4.1 Standalone evaluation products

- PsychReport
- Speech Studio
- OT Studio

Each is independently purchasable and complete. A private practitioner must be able to purchase Speech or OT without purchasing the district platform or PsychReport.

Each standalone product includes:

- Home
- Cases or Clients
- Complete case-level workspace
- Drop-All ingestion
- Product-specific assessment library
- Templates
- Full report writer
- Contextual assistant
- Review and revision
- Accountability checkpoints
- Template mapping
- Export
- Product/profile settings under the user menu

Each standalone product completes the full loop:

> case/client → upload → draft → review → template → export

Standalone products must never feel like restricted district accounts.

### 4.2 District Evaluation Platform

The district platform is a coordination layer, not another report writer. It licenses one or more evaluation products and adds:

- Shared student record
- Shared demographics and background
- Team assignments
- Shared case materials where appropriate
- Shared timeline
- Cross-report consistency support
- Developing integrated summary
- Role-aware access
- Administration and permissions
- Coordinated Documentation Support

District integration must visibly remove repeated work. Examples:

- Enter the student once.
- Upload general records once.
- Write shared history once.
- Propagate corrected demographics to active work.
- Reuse approved information across assigned disciplines.
- Surface cross-report inconsistencies without exposing an audit dashboard.
- Prepare an integrated summary from approved discipline findings.

If the only integration is a shared homepage, the platform is merely a bundle and has failed.

### 4.3 Documentation Support

“Documentation Support” is the preferred label. Replace “Team Documentation” in current and future UI.

Documentation Support is case-based and downstream from evaluation work. Its contents depend on the workspace.

#### District Documentation Support

- IEP Drafting
- MDR Documentation
- Eligibility Preparation
- Meeting Brief

These are not peer evaluation products and must not appear alongside PsychReport, Speech, and OT in a product-card grid.

#### Standalone Documentation Support

Standalone products also contain a Documentation Support tab inside each case. It contains product-appropriate tools, not district team processes:

- Parent Summary
- Meeting Brief
- Information Request

Do not display IEP, MDR, Eligibility Preparation, district coordination, or other disciplines in a standalone case unless separately licensed in a future commercial model.

### 4.4 Sped QA

Sped QA remains a separate review product. It owns:

- Independent second-reader review
- Arbitrary completed report/packet upload
- Packet-level checks
- District rubrics
- Formal findings
- Remediation support

Evaluation writers retain only lightweight preventive safeguards. PsychReport is not Sped QA’s answer key, and QA must remain structurally decoupled from report generation.

---

## 5. Navigation architecture

The implementation must distinguish global product navigation from case-level navigation.

### 5.1 District global navigation

Minimal left rail:

1. Home
2. Cases
3. Documentation Support
4. Sped QA

Rules:

- District navigation is case-first and role-aware.
- The rail shows only licensed products/functions and what the user’s role warrants.
- No disabled “coming soon” entries.
- Templates and Settings are not daily district destinations. Settings belong under the user/organization menu. Template administration may be available to appropriate roles without occupying primary daily navigation.
- Global Documentation Support functions as a cross-case work queue, especially for deadline-sensitive activity.

### 5.2 Standalone global navigation

PsychReport:

1. Home
2. Cases
3. Assessment Library
4. Templates

Speech Studio and OT Studio:

1. Home
2. Clients
3. Assessment Library
4. Templates

Settings belong under the user/profile menu.

### 5.3 Case-level navigation — required in every profile

This was the latest architecture correction. The following tabs must appear after opening a case/client in **District, PsychReport, Speech, and OT**:

1. Overview
2. Case Materials
3. Evaluations
4. Documentation Support
5. Timeline

The framework is consistent; the content is profile-aware.

#### District case contents

- **Overview:** multidisciplinary readiness, next action, at most two judgment calls, team contributions.
- **Case Materials:** shared general records plus discipline-specific ownership indicators.
- **Evaluations:** Psychology, Speech, and OT contributions assigned to that case.
- **Documentation Support:** district tools relevant to the student.
- **Timeline:** meaningful shared case milestones.

#### Standalone case contents

- **Overview:** current product’s evaluation readiness, next action, one professional judgment item.
- **Case Materials:** this case’s records, protocols, notes, forms, interviews, and work samples.
- **Evaluations:** only the current licensed product’s evaluation.
- **Documentation Support:** Parent Summary, Meeting Brief, Information Request.
- **Timeline:** meaningful product/case milestones.

Do not show a multidisciplinary team view, cross-discipline cards, shared-team language, IEP, MDR, or eligibility tools inside standalone cases.

### 5.4 Workspace switcher

The prototype includes a workspace switcher to demonstrate four commercial shells:

- Union County Schools / Evaluation Platform
- PsychReport
- Speech Studio
- OT Studio

The real product should show only workspaces the account owns or can access. The switcher is a prototype demonstration device, not evidence that every buyer receives every product.

---

## 6. Current visual design language

### 6.1 Overall presentation

- Calm, editorial, warm, and professional.
- Dark navy left navigation rail.
- Light gray/off-white application background.
- White content cards with subtle borders and soft shadows.
- Deep blue primary actions.
- Discipline accents:
  - Psychology: indigo
  - Speech: teal
  - OT: warm clay
  - Documentation/supportive completed state: green
  - MDR/deadline state: restrained rose
- Serif display/document type paired with a clean sans-serif UI type.
- Current prototype uses a Newsreader-like serif and DM Sans-like interface font.

Avoid:

- Dense data tables on home screens
- Audit-report aesthetics
- Dozens of badges
- Tiny gray status copy
- Score bars anchored at zero
- Architecture diagrams or reasoning terminology in ordinary workflows
- Repeating the same progress state in the header, outline, cards, and buttons

### 6.2 Typography and readability

Earlier prototypes used text as small as 7–10 px. This was rejected.

Minimum implementation targets:

- Core interface/navigation: approximately 13–14 px
- Supporting UI copy: approximately 11–12 px
- Eyebrows/labels: approximately 10 px with letter spacing
- Main document body: approximately 15–16 px with generous line height
- Case/report headings: 24–32 px depending on hierarchy
- Never use 7–9 px for essential status, navigation, assistant, evidence, or form text.

All essential text must remain readable at 100% browser zoom on a standard laptop.

### 6.3 Density

- Cap the Overview at roughly one screen where possible.
- Show the top one or two action-relevant items, then “View all” if needed.
- Use one primary action per surface.
- Put secondary actions behind text buttons or overflow menus.
- Do not reintroduce the former four visible queues (evidence gaps, judgment calls, workflow tasks, critical QA) as dashboard cards. Those classifications may remain in the data model.

---

## 7. Detailed screen specification

## 7.1 District Home

### Purpose

Tell James what needs attention today without turning the page into a caseload audit.

### Required layout

1. Warm greeting:
   - “Good morning, James.”
   - One concise readiness sentence.
2. Primary action:
   - “New evaluation”
3. Focus card:
   - Avery Williams
   - Initial evaluation
   - Due June 6
   - Psychology, Speech, and OT underway
   - One score needs verification
   - Primary action: “Open case”
4. Drop-All magic-moment card:
   - “Avery’s case is ready.”
   - 8 records organized
   - 3 assessments identified
   - 2 interviews summarized
   - One score needs verification
   - Primary action: “Start the report”
5. Compact active-work list:
   - Avery Williams — evaluation in progress
   - Jordan Lee — MDR due in 6 school days

Do not place IEP/MDR in a permanent peer-product grid. Jordan’s MDR rises because it is active and deadline-sensitive.

## 7.2 Standalone Product Home

Each standalone home uses the same layout rhythm with product-specific language.

### Required elements

1. Warm greeting:
   - “Good morning, James.”
   - “What do you need to get done?”
2. Product magic moment:
   - PsychReport: upload records, protocols, interviews, and notes → organized psychological evaluation draft.
   - Speech: upload protocols, language samples, notes, and prior reports → speech-language draft.
   - OT: upload scores, observations, work samples, and dictated notes → functional OT draft.
3. Primary action:
   - Start an evaluation
4. Drop-All upload zone:
   - PDF, DOCX, images, audio, or notes
5. Recent cases/clients list.
6. Clicking a case/client opens the full case-level workspace, not the report writer directly.

## 7.3 Case Header

### District example

- Avatar: AW
- Avery Williams
- Initial Evaluation · Due June 6
- Grade 4 · Union Elementary
- Three assigned evaluators

### Standalone examples

- PsychReport: Avery Williams · Grade 4 · Union Elementary · Initial evaluation
- Speech: Maya Chen · Private client · Initial evaluation
- OT: Noah Bennett · Private client · Initial evaluation

Under the header, always show:

> Overview · Case Materials · Evaluations · Documentation Support · Timeline

## 7.4 Case Overview

### Shared structure

- One readiness sentence
- One next best action
- Evaluation progress
- One professional judgment card
- One brief reassurance about organized/reused context

### District copy/behavior

- “The record is mostly complete.”
- “Three discipline reports are moving forward. One verified score will unblock the psychological draft.”
- Team progress rows for Psychology, Speech, and OT.
- “Needs your judgment”: confirm the phonological-processing interpretation.
- “Shared once”: background, demographics, attendance, and teacher history are available to assigned evaluators.

### Standalone copy/behavior

- “The record is mostly complete.”
- “The evaluation draft is ready to continue. One professional confirmation remains.”
- Show only the profile’s evaluation.
- Psych judgment: phonological-processing interpretation.
- Speech judgment: language-sample context.
- OT judgment: whether keyboarding was available during the writing sample.
- “Organized once”: background, records, notes, and interview material remain available throughout the case.

## 7.5 Case Materials

### Purpose

Make ingestion feel useful, not administrative.

### Required elements

- Header: “Everything organized in one place”
- Primary action: “Add materials”
- Compact summary:
  - 8 records organized
  - 3 assessments
  - 2 interviews
- File list with plain-language status.

### District behavior

- General records may be labeled Shared.
- Discipline-specific records retain ownership/access indicators.

### Standalone behavior

- Do not use shared-team language.
- Show product-relevant materials:
  - PsychReport: cumulative record, teacher interview, WIAT-4 score sheet, intervention record.
  - Speech: background records, language sample, CELF-5 score sheet, teacher interview.
  - OT: background records, classroom observation, Beery VMI score sheet, writing sample.

## 7.6 Evaluations

### District

Show three discipline cards when assigned:

- Psychological Evaluation — James Delva — Writing
- Speech-Language Evaluation — Maya Brooks, CCC-SLP — Draft ready
- Occupational Therapy Evaluation — Andrea Cole, OTR/L — Needs input

Demonstrate actual integration with a quiet notice:

> Avery’s school-entry date was corrected in Case Materials and is now current in Psychology and Speech. Approved report language was not silently changed.

### Standalone

Show only the current product’s evaluation card. The section should read like a complete evaluation workspace, not a filtered district view.

Include a quiet context notice:

> Reviewed background, observations, and scores are available in the writer without re-entering them.

Primary action: “Continue writing.”

## 7.7 Documentation Support

### District contents

#### IEP Drafting

- Reuses approved present levels and findings.
- Produces reviewable proposals.
- Does not decide goals, services, placement, SDI, or accommodations.

#### Eligibility Preparation

- Organizes evidence by criteria.
- Surfaces unanswered team questions and exclusionary factors.
- Preserves evaluator conclusions.
- Does not generate a verdict, category ranking, defensibility score, placement, or service determination.

#### Meeting Brief

- Concise, parent-ready summary of approved findings and questions.

#### MDR Documentation

- Incident-driven and deadline-sensitive.
- Organizes evidence for two questions:
  1. Was the conduct caused by, or did it have a direct and substantial relationship to, the disability?
  2. Was the conduct the direct result of failure to implement the IEP?
- Supports incident records, disability/evaluation records, IEP/BIP, service-delivery logs, implementation records, and staff statements.
- Shows the 10-school-day clock.
- Never generates the manifestation determination.
- Appears inside the relevant case and rises to district Home/global Documentation Support only while active.

### Standalone contents

#### Parent Summary

Create a reviewable family-facing explanation grounded in approved evaluation content.

#### Meeting Brief

Bring key findings, strengths, questions, and recommendations into one concise brief.

#### Information Request

Draft a focused request for the one informant response or record needed to complete the evaluation.

## 7.8 Timeline

Only show meaningful milestones. Do not log every AI action.

District examples:

- Psychological score verification requested
- Speech draft prepared from reviewed materials
- School-entry date corrected in shared background
- Teacher interview summarized
- Evaluation opened

Standalone examples:

- Draft section prepared for review
- Assessment results organized
- Background information approved
- Interview summarized
- Evaluation opened

## 7.9 Report Writer

### Layout

1. Product/report header
2. Compact report outline on the left
3. Document/paper canvas in the center
4. Persistent assistant rail on the right
5. Bottom actions for source access, accountability, and section review

### Report outline

Show section names and simple states such as Reviewed, Writing now, Draft ready, Waiting. Do not repeat report progress elsewhere on the same screen.

### Document canvas

- Serif report text
- Natural professional prose
- Subtle superscript source markers
- No visible claim types, evidence ceilings, provenance statuses, or internal reasoning machinery
- No zero-based score bars

### Smart interruption

Demonstrate one contextual interruption, preferably through the assistant or a quiet inline card:

> The teacher described reading-fluency concerns, but no fluency measure appears in the case materials. Continue with current evidence?

Offer one clear response path. Do not turn every missing field into an interruption.

### AI revision proposal

Demonstrate one strong revision interaction:

- Show current text and proposed text.
- Actions: “Keep current version” and “Apply revision.”
- Applying creates a visible accepted revision state.
- Approved content is protected.
- If new evidence affects approved text, mark it stale/impact-review needed; do not regenerate automatically.
- Prior-version comparison must remain accessible.

### Score verification

Before scores appear in a signed report:

- Show extracted assessment name, subtest, and score.
- Require the clinician to check: “I verified these scores against the source record.”
- Disable confirmation until checked.
- Mark verification visibly after completion.

### Sources

- Subtle “linked sources” action or superscript marker.
- Open a “Why this is here” / Supporting Evidence drawer.
- Show only the source details needed to understand the selected statement.
- Avoid evidence dashboards.

### Review action

One primary action: “Mark reviewed.”

## 7.10 Templates and Export

The report is written naturally first, then rendered into the target template.

Required completion state:

> Union County Initial Evaluation — everything required by the template is mapped.

Primary action: “Export report.”

The full mapper is behind “View mapping.” It should support:

- Template upload
- Field/section mapping
- Missing-required-field detection
- Saved mappings
- DOCX-quality rendering
- Final export approval

Do not make the template itself the main writing interface.

## 7.11 Assessment Library

Each standalone product has a product-specific library.

### PsychReport examples

- WISC-V
- WIAT-4
- KTEA-3
- BASC-3
- Conners 4
- Vineland-3
- ABAS-3
- ASRS
- CARS-2
- DAS-II
- KABC-II NU
- WJ IV COG

### Speech examples

- CELF-5
- CASL-2
- GFTA-3
- PLS-5
- OWLS-II
- CTOPP-2
- TOLD-I:5
- TOPL-2

### OT examples

- BOT-2
- Beery VMI
- Sensory Profile 2
- SFA
- M-FUN
- PDMS-3
- Evaluation Tool of Children’s Handwriting

### Publisher boundary

Libraries may store:

- Test metadata
- Constructs
- Score structures
- Publisher-approved descriptors
- Clinician-entered or uploaded results

Libraries must never reproduce:

- Test items
- Protocols
- Proprietary norm tables
- Manual content
- Copyrighted administration materials

## 7.12 Sped QA

Current screen:

- Header: “Independent second reader”
- Title: “Sped QA”
- Description: formal packet review stays separate from evaluation writing
- Primary action: “Review a packet”
- Upload surface for a completed report or packet
- Plain-language scope: district requirements, internal consistency, documentation gaps, remediation

Do not move QA queues or formal audit controls back into the report writer.

---

## 8. Assistant specification

The assistant must be prominent and persistent, not a corner chat bubble.

### Home

Conversational starting point:

> What do you need to get done?

It can route to:

- Start a case/client
- Organize uploads
- Continue the highest-priority draft
- Find a recent evaluation
- Retrieve a case document

### Case workspace

It is grounded in the active case and tab:

> Working in: Avery Williams · Overview

It can:

- Identify what needs attention
- Find a reviewed record
- Prepare the next section
- Prepare a meeting brief
- Explain why a statement appears

### Writer

It is grounded in the active document and reviewed materials:

> Working in: Academic Achievement  
> Can use: Avery’s reviewed case materials

It supports:

- Drafting
- Revision
- Parent-friendly rewrites
- Evidence explanation
- Case search
- Next-section preparation
- Selected-text assistance

### State-changing behavior

Every state-changing response ends with an explicit action:

- Preview change
- Apply revision
- Add to draft
- Keep current version

Nothing is added to the report without review.

### Responsive behavior

- Wide writing screen: right rail open by default.
- Other wide screens: assistant consistently available; opening by default is appropriate on Home, ingestion, case overview, and writing surfaces. It may be collapsed on low-value administrative screens.
- Collapsed state: visible vertical Assistant handle; conversation preserved.
- Narrow/mobile: prominent bottom sheet.

Chat must not displace the report as the primary working surface.

---

## 9. Evidence, reasoning, and audit architecture

The reasoning infrastructure remains important but mostly invisible.

### Keep internally

- Case model
- Source/evidence/claim links
- Evidence validity metadata
- Interpretive scope/ceiling
- Version history
- Approval history
- Consistency checks
- Audit history

### Show only when relevant

- Superscript source marker
- “Why this is here”
- Supporting Evidence drawer
- Stale/impact-review marker when new evidence affects approved text
- Score verification
- One action-relevant consistency notice

### Do not show by default

- Evidence dashboards
- Claim types
- Source ceilings
- Provenance status tables
- Defensibility scores
- Eligibility likelihood/ranking
- Four audit queues
- Separate Evidence, Synthesis, Eligibility, or QA writer tabs

The psychologist should experience:

> This AI understands school psychology.

Not:

> This AI has a sophisticated evidence ontology.

---

## 10. Human decision boundaries

The system may organize, summarize, draft, and propose. It must not make professional or team determinations.

Never generate:

- Eligibility verdicts
- Eligibility-category rankings
- Defensibility scores or grades
- Manifestation determinations
- Placement decisions
- Service determinations
- SDI determinations
- Final goals
- Final accommodations
- Final clinical attestation

PsychReport specifically must not generate, store, insert, or export adverse-impact or SDI language as ordinary report content. Any future eligibility artifact must remain separately authorized and gated.

The system must preserve accurate authorship, approval, and change history because any relevant professional system may be discoverable.

---

## 11. Data isolation and access

### Architectural rule

Records never cross organizations or private-practice profiles implicitly.

Cross-boundary access occurs only through:

- Explicit case assignment
- Invitation
- Authorized transfer

Record:

- Purpose
- Permissions
- Provenance
- Revocation

Within a district, normal role-based team assignment is sufficient. Users should not manually share each artifact.

The same human may have separate district and private-practice profiles. Their caseloads must not bleed into one another.

Prototype data must remain synthetic. Current owner-only access must not be changed without explicit authorization.

---

## 12. Accessibility and responsive requirements

Required:

- Keyboard navigation for all interactive controls
- Visible focus states
- Semantic button, navigation, heading, dialog, and form structure
- Accessible names for icon-only controls
- Sufficient contrast
- Status must not rely on color alone
- Screen-reader-friendly errors and confirmations
- Text scaling without overlap or loss of function
- Reduced-motion support
- Touch-friendly targets
- Mobile assistant as bottom sheet
- Case tabs horizontally scroll when necessary on narrow screens
- Report outline collapses to the active section on narrow screens

Essential supporting text must not be rendered as faint microcopy.

---

## 13. Synthetic prototype fixture

Use synthetic data only.

### Primary district case

- Student: Avery Williams
- Grade: 4
- School: Union Elementary
- Evaluation: Initial evaluation
- Due: June 6
- Assigned disciplines: Psychology, Speech, OT
- Psychological evaluator: James Delva
- SLP: Maya Brooks, CCC-SLP
- OT: Andrea Cole, OTR/L
- Materials:
  - 8 records organized
  - 3 assessments identified
  - 2 interviews summarized
  - One score needs verification
- Psychological sample scores:
  - WIAT-4 Word Reading: 71
  - WIAT-4 Pseudoword Decoding: 69
  - WIAT-4 Reading Comprehension: 76
- Judgment item: interpretation of phonological-processing evidence
- Cross-discipline reuse demonstration: corrected school-entry date updates current shared context without silently changing approved prose

### MDR fixture

- Student: Jordan Lee
- MDR day status: 6 school days remaining
- Missing item: one implementation record
- System organizes records; team makes determination

### Standalone Speech fixture

- Client: Maya Chen
- Evaluation: Speech-language evaluation
- Status: Draft ready
- Clarification: language-sample context

### Standalone OT fixture

- Client: Noah Bennett
- Evaluation: Occupational therapy evaluation
- Status: Draft ready
- Clarification: whether keyboarding was available during writing sample

---

## 14. Removed or demoted elements

Do not restore these without a new decision:

- IEP and MDR as peer product cards
- Five-product landing grid
- Repeated explanations of shared architecture
- District/standalone plan badge in the valuable top-right header
- Settings in primary navigation
- Templates in the district daily rail
- Assessment-library content on Home
- Four queue cards
- Evidence dashboard
- Separate Evidence/Synthesis/Eligibility/QA writer tabs
- Source ceiling badges
- Claim-type badges
- Provenance-status tables
- Consistency internals unless action-relevant
- Repeated progress indicators
- Zero-based score bars
- Permanently visible MDR card when no MDR is active
- Disabled coming-soon navigation

---

## 15. Deferred to later versions

Do not silently add these to v6:

### v7 first feature: invitation flow

A standalone PsychReport user shares Avery’s case with an SLP who is not on the platform. The SLP lands in a working Speech product with authorized shared background already available.

This flow must explicitly test:

- Invitation/acquisition
- Permission scope
- Data ownership
- Profile wall
- Revocation
- Standalone-to-platform conversion

Other deferred areas:

- Full district administration
- SSO
- SIS integrations
- Voice/SMS workflows
- Multilingual workflows
- Autonomous interviewing
- Assessment-battery automation
- Parent-facing conversational AI

---

## 16. Recommended implementation structure

Do not hard-code district as the only case shell. Use configuration-driven surfaces.

Suggested conceptual model:

```ts
type WorkspaceKind = "district" | "psych" | "speech" | "ot";

type CaseTab =
  | "overview"
  | "materials"
  | "evaluations"
  | "documentation"
  | "timeline";

interface WorkspaceCapabilities {
  product: WorkspaceKind;
  vocabulary: "student" | "client";
  licensedEvaluations: Array<"psych" | "speech" | "ot">;
  multidisciplinary: boolean;
  documentationTools: Array<
    | "parent-summary"
    | "meeting-brief"
    | "information-request"
    | "iep-drafting"
    | "mdr-documentation"
    | "eligibility-preparation"
  >;
  spedQa: boolean;
}
```

The case shell renders the same tab framework across workspaces; capabilities determine content.

### Important distinction

- Global standalone navigation is product-first.
- Global district navigation is case-first.
- Once a case is opened, every profile uses the shared case-tab framework.

Do not encode “case tabs exist” as a district-only condition.

---

## 17. Interaction/state requirements

The clickable prototype should support, at minimum:

- Switch among District, PsychReport, Speech, and OT demo workspaces
- Navigate all global rail items
- Open a case/client from every profile
- Navigate all five case tabs in every profile
- Open the appropriate evaluation writer
- Expand/collapse assistant while preserving its conversation
- Open Documentation Support tools
- Open the Supporting Evidence drawer
- Preview and apply/reject one AI revision
- Show a stale/impact-review marker
- Verify extracted scores with required checkbox
- Mark a section reviewed
- Open template mapping details
- Trigger export-ready confirmation
- Display MDR deadline item only as active work

All visible navigation items must be functional. Avoid dead tabs or decorative buttons presented as working controls.

---

## 18. Acceptance checklist

### Product and architecture

- [ ] PsychReport, Speech, and OT each feel complete and independently purchasable.
- [ ] Standalone products do not imply that a district subscription is required.
- [ ] District integration visibly removes repeated work across at least two disciplines.
- [ ] IEP, MDR, and Eligibility Preparation are Documentation Support tools, not evaluation products.
- [ ] Sped QA remains separate from writing.

### Navigation

- [ ] District rail uses Home, Cases, Documentation Support, Sped QA.
- [ ] Standalone rail uses Home, Cases/Clients, Assessment Library, Templates.
- [ ] Opening a case in every profile reveals Overview, Case Materials, Evaluations, Documentation Support, Timeline.
- [ ] Standalone case contents remain product-specific.
- [ ] District case contents can show assigned disciplines and district tools.

### Streamlining

- [ ] Each screen has one visually dominant action.
- [ ] No progress state is restated multiple times on the same surface.
- [ ] Overview remains lightweight.
- [ ] Audit/evidence detail is progressively disclosed.
- [ ] Smart interruptions are rare and clinically meaningful.

### Assistant

- [ ] Assistant is prominent and contextual.
- [ ] Report remains the main work surface.
- [ ] State changes require explicit Preview/Apply/Add actions.
- [ ] Approved content is never silently changed.
- [ ] Mobile assistant behaves as a bottom sheet.

### Accountability and evidence

- [ ] Scores require explicit source verification.
- [ ] Export requires final approval.
- [ ] Supporting evidence is available through subtle source markers/drawer.
- [ ] New evidence can mark approved text stale without replacing it.
- [ ] No eligibility verdict or manifestation determination is generated.

### Accessibility and visual quality

- [ ] Essential UI text is not microcopy.
- [ ] Main report text is approximately 15–16 px at normal zoom.
- [ ] Navigation and controls are comfortably readable.
- [ ] Keyboard/focus/contrast/screen-reader requirements are met.
- [ ] Statuses use text or icons in addition to color.
- [ ] Responsive layouts preserve all functions.

### Content and legal boundaries

- [ ] Synthetic data only in demos.
- [ ] Tenant/profile isolation is enforced.
- [ ] Assessment library does not reproduce protected publisher content.
- [ ] Eligibility, placement, service, SDI, goal, accommodation, and manifestation decisions remain human/team decisions.

---

## 19. Final build instruction to Claude Code

Build from the architecture and behavior in this document, not from the visual surface alone.

Preserve the current calm visual language, increased typography, prominent assistant, document-centered writer, and progressive evidence disclosure. Correctly implement the shared case-workspace framework across District, PsychReport, Speech, and OT. Keep district-only coordination and special-education documentation out of standalone profiles.

When uncertain, prioritize the choice that:

1. Removes more work for the clinician.
2. Requires fewer steps.
3. Preserves explicit professional control.
4. Keeps the interface simpler than the underlying system.

