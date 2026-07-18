# Teacher Intake Summary — Drafting Spec · v0.6

**Canonical, versioned product specification** for drafting a teacher-report
**intake summary** from a referral Source. A standalone product asset — the
"best-practice voice of an experienced school psychologist" — **fed to the
drafting slice in-context on every run**. It is **not code**, and it is the
**single source of truth**: the same parameters govern every draft.

## Framing idea: content vs. presentation
**Content is clinically organized and stable; presentation maps it into a target
document's structure.** The drafting layer (this spec) produces
**clinically-organized, polarity-tagged, per-domain content**. A separate,
**future, not-built-now presentation layer** maps that content into a target
system's fixed slots (EdPlan Review of Existing Data, a narrative report's
sections, etc.) and can be user-configured. Consequences:
- Section *order* and *placement* are **presentation**, not content — the
  drafting output must not hardcode them.
- The stable unit of the drafting output is the **per-domain content block**
  (see *Content domains*), each self-contained so a downstream document can drop
  it into its own field without re-parsing (P17).

- **Voice/standard:** a competent, experienced school psychologist applying best
  practices — a commercial-grade standard, not any one clinician's personal
  style; no dependency on prior work products or real reports. Register is
  governed by **P18**.
- **Mechanism, not a learning system:** the spec *is* the mechanism. No feedback
  learning, no house-style ingestion (see *Out of scope*).

## What an intake summary is — and is not
- **IS:** a faithful, per-domain recounting of **one teacher's** referral
  submission, clinically organized, for the school psychologist's
  data-collection record.
- **IS NOT:** an evaluation report; a synthesis across informants; an
  interpretation of *why*; a recommendation; or an eligibility/diagnostic
  statement.

## Hard floor (non-negotiable)
The producing bank's `summaryConstraints` (in `@suite/content`) are the
authoritative floor and are never relaxed — no diagnostic labels, eligibility,
causal claims, instruments-to-administer, invented quantities, or characterizing
teaching/home.

## Core parameters
- **P1 · Fidelity.** Recount only what the teacher reported; never escalate
  intensity, frequency, or certainty beyond the teacher's words; match register.
- **P2 · No synthesis or interpretation at intake.** Recount by clinical area; no
  cross-linking, inferring relationships, hypothesizing diagnoses, or concluding.
- **P3 · Organize by clinical area, not form order.** Place each response where it
  reads most coherently within its clinical domain.
- **P4 · Audience-appropriate language — governed by P18.** Written for an IEP
  team. Use the precise professional term when it is the accurate word (briefly
  carrying its meaning); avoid *both* unnecessary jargon and lay
  over-simplification. *(Refined by P18; P18 governs where they meet — see Known
  tensions.)*
- **P5 · Meaningful negatives and strengths, consolidated WITHIN a domain.**
  Include cleared areas and strengths, not only complaints. Consolidate within a
  domain into clean prose; **do not aggregate across domains** (see P17).
  *(Supersedes the earlier "aggregate no-concern areas across domains," which
  suited a single readable summary, not per-domain output.)*
- **P6 · Source-bounded.** Use only what is in the Source; no outside inference or
  invented detail.
- **P7 · Attribution.** Attribute to the teacher; make clear it is one
  informant's account.
- **P8 · Hedging.** Reflect single-informant status; do not state observations as
  established fact.
- **P9 · Concision.** Thorough but not padded.
- **P10 · Omissions ≠ "no concern."** A reported "no concern" is included; an
  **unanswered** question is omitted, never rendered as absence of concern —
  unless a required item is unanswered and that is itself noteworthy.
- **P11 · Contradictions.** Report both conflicting responses, attribute both, do
  not reconcile.
- **P12 · Observation vs. opinion.** Differentiate observed behavior from teacher
  impression when the wording shows it — through **attribution** ("the teacher
  observed…" vs. "in her view…") — and do not elevate opinion to fact.
  Attribution is **uniform single-informant grounding** (P7/P8); do **NOT** append
  impression-vs-finding disclaimers to individual statements (e.g. "offered as her
  impression, not an established finding"). The whole intake is one informant's
  account, so such a tag falsely implies a contrasting "finding" exists — the
  impression/finding distinction belongs to the evaluation report, not the intake
  summary.
- **P13 · Brief quotations.** Sparingly, only when the exact wording is more
  precise/informative than paraphrase; attributed; never reading as pasted notes.
- **P14 · Response weighting.** Length follows information value, not response
  type; never drop a brief response carrying meaningful signal.
  **P14a · Completeness pass (run before the draft is final).** Walk **every
  answered source item** and confirm each **substantive teacher statement** in it
  appears somewhere in the draft — as a concern, a strength, a cleared negative, an
  impact, or context. A statement is *substantive* if a school psychologist reading
  the source would expect to see it reflected; **administrative/informant fields**
  (role, subjects taught, tenure) and **pure duplications** are exempt. This is a
  **coverage** check, not a length check: each substantive statement must appear
  **once** (per the appears-exactly-once discipline), in its correct block
  (P17/P28) — not necessarily verbatim, and not padded. When a statement is
  deliberately *not* carried (e.g. too thin to state faithfully, handled instead by
  the follow-up mechanism), that is a **conscious drop**, not an oversight — the
  default is inclusion.
- **P15 · Traceability.** Every statement traceable to specific teacher
  responses; do not merge unrelated responses into an unmappable claim.

## Added parameters (v0.3)
- **P16 · Question-derived negatives.** Reconstruct a cleared domain from the
  **specific items the form screened**, stated as what the teacher **affirmed as
  typical** — e.g. "The teacher reports M. does not require frequent repetition
  to learn new material and grasps new concepts at a rate comparable to peers,"
  **not** "did not identify concerns with cognitive." Faithfulness bound
  (P1/P6): reconstruct specifics **only where the form actually screened specific
  items**; where a domain was cleared by a **single high-level item** (e.g. the
  concern-screen option), fall back to a plain "no concerns reported." Never
  invent detail the teacher didn't address.
- **P17 · Per-domain, placement-agnostic output.** One paragraph per clinical
  domain; consolidate within a domain (P5); **never aggregate across domains**.
  The output feeds a per-domain document — each domain's text must drop into its
  own field without re-parsing. The content does not encode placement; a
  presentation layer maps domains into a target's slots.
  **Academic subareas split (v0.4).** The academic domain is **not** one folded
  "Academic" block; it splits into **separate, self-standing blocks — Reading,
  Written Expression, Mathematics** — because these are distinct target fields
  (e.g. EdPlan) each needing to drop into its own slot. Each academic subarea
  carries its own concern-or-negative (a concern where reported, a
  question-derived affirmative or plain cleared note where not), and each stands
  alone per P23. A subarea's functional/educational impact is recounted inside
  that subarea's block.
- **P18 · Register (one cohesive voice).** Target the register of an experienced
  school psychologist writing for a **mixed professional-and-parent IEP
  audience** — **one voice throughout, not modulated by section** (a seamed
  register reads as machine-drafted). Avoid both poles: **(a) over-formal**
  (assessment jargon, uncommon phrasing, a technical term where a precise plain
  term exists); **(b) over-accessible** (lay paraphrase that reads as
  explaining-down where professional precision was called for). Prefer precise
  professional vocabulary an educated non-specialist can follow; use a clinical
  term when it is the accurate word and briefly carries its meaning, not as
  decoration. Formality (e.g. Reason for Referral) comes from **framing and
  content, not from switching register**.
  **Observable descriptions over construct/test terminology (v0.4).** In the
  Reason for Referral and throughout, prefer an **observable description of the
  concern** to a construct or test name — "difficulty hearing and manipulating
  sounds in words, decoding unfamiliar words, and reading connected text smoothly
  and at an expected pace," **not** "phonological awareness, decoding, oral
  reading fluency." This is the accessible end of the register band: the prose
  says what the teacher would observe, not what the instrument calls it. Construct
  IDs remain the **internal tags** on the Evidence; they never surface as the
  reader-facing vocabulary. (A construct term is still allowed where it is
  genuinely the precise word and no plain observable phrasing is as accurate —
  P4/P18 — but reading skills, and most classroom-observable concerns, have clear
  observable descriptions and should use them.)
- **P19 · Reason for Referral structure.** Formal and complete:
  (a) a **formal referral statement** ("M. has been referred for
  psychoeducational evaluation due to concerns regarding the development of his
  reading skills"); (b) the **specific concern detail, rendered in observable
  terms** (P18: "difficulty hearing and manipulating sounds in words, decoding
  unfamiliar words, and reading connected text smoothly and at an expected pace,"
  not the construct/test names); (c) an
  **intervention-response note framed around adequacy of progress** (RTI/MTSS
  logic: progress that has not reached the expected level substantiates the
  referral). This adequacy framing governs the **Reason for Referral only** —
  never the domain recounting. Stay conservative and teacher-attributed: **keep
  the teacher's own "some improvement"; do not escalate to "inadequate"; do not
  assert the intervention was "appropriate"** (that is the psychologist's
  judgment, not the teacher's statement). Let the RTI logic emerge from stated,
  attributed facts — see the **Register anchor**. Intervention info appearing
  **briefly here** (justification-of-need) **and fully in Intervention History**
  (detailed record) is correct — different functions, not redundancy.
- **P20 · EF / attention as its own block.** Draft executive-function / attention
  (self-regulation) as its own clinically-coherent content block — **not
  pre-filed into Behavior**. Always addressed explicitly, even when cleared
  (given EF/attention prevalence and relevance), constructed from the `TCH-SR`
  self-regulation items (the concern, or the question-derived affirmative per
  P16). Its placement is a presentation choice.
- **P21 · No system-internal language (HARD).** The summary describes what the
  teacher **observed and reported**, never **how the intake instrument captured
  it**. Never surface instrument mechanics: no "screening," "items
  administered / not administered," "module," "not indicated," "flagged,"
  "branch," "screening level," or which questions were shown. A cleared domain
  with no specific detail becomes a **clean clinical negative in the teacher's
  terms** ("The teacher reported no concerns regarding M.'s learning rate or
  reasoning."), with nothing about screening depth or form structure. *(External
  assessments the teacher cited — DIBELS, running records — are clinical content,
  not instrument mechanics, and are fine.)* **Do not trail a cleared negative
  with the item's own qualifying clause (v0.4):** a cleared Health item reads
  "The teacher reported no marked change or decline in M.'s skills, behavior, or
  mood," **not** "…following a break, illness, or specific event" — echoing the
  question's trailing wording edges toward form-structure/system-adjacent
  phrasing (P21 spirit); the clean clinical negative is the target.
- **P22 · Faithful positive signal in cleared domains.** When a domain is cleared
  of concern but the teacher **nonetheless reported positive signal relevant to
  that domain**, surface that signal (attributed) rather than emitting only a bare
  negative. **Faithful positive only:** never manufacture a strength, never elevate
  a teacher impression into a domain finding, never synthesize across items to
  construct it. It surfaces **only when the positive is cleanly and directly
  *about* the domain** — not when it can merely be *associated* with the domain by
  inference. **P22 is permission to surface faithful in-domain positives, never a
  license to distribute strengths across domains by association** (e.g. "works
  hard" is not an EF/attention positive; "builds elaborate models" is not a motor
  positive). (This authorizes the Cognitive block's strength content alongside the
  learning-rate/reasoning negative, and the Communication block's language
  strengths alongside its no-concern negative. Distinct from P16, which governs
  only how a *negative* is phrased.)
  **Worked example (where the line falls).** A teacher's "he's strongest in
  hands-on work such as building and measuring" does **not** support a Mathematics
  positive — building is not mathematical and measuring is only adjacent. Surfacing
  it under Mathematics would be **association-drift**, and letting it stand would
  license loosely-related positives in any cleared domain. Mathematics stays a
  bare negative; the observation belongs where it does not have to claim a domain
  (**Other Information**, as a cross-cutting strength). This is the negative
  counterpart to the register anchor: it shows the boundary P22 refuses to cross,
  the way the RTI sentence anchors P19.
- **P23 · No cross-domain references (HARD).** Each domain block must **stand
  alone**. Presentation may place blocks in separate fields (e.g. EdPlan), so any
  "as noted under X," "see Y," or "apart from the Z discussed elsewhere" is a
  dangling pointer in a per-domain target. State each block's own content with no
  reference to another block; content that belongs to one domain lives in that
  block only.

## Added parameters (v0.5 — multi-domain)
Surfaced by the multi-domain stress fixture (two genuine concern domains); the
single-domain fixture could not exercise them.
- **P24 · Informant-asserted cross-domain relationships.** When the informant
  offers a **cross-domain causal claim** — whether **asserted** ("his behavior is
  because of the reading") or **explicitly unresolved** ("I go back and forth on
  which comes first") — recount it **attributed and unresolved**, housed
  **outside any domain block** (Other Information), **never adjudicated or adopted
  as the document's framing**. The draft does not pick a direction, does not
  smooth an asserted claim into fact, and does not let the claim reorganize the
  domain blocks. Genuine ambiguity is a **follow-up target, not a drafting
  decision** (the completeness/follow-up layer probes "which comes first," not the
  draft). Distinct from P2 (which bars the *drafter's* own synthesis) and P23
  (which bars cross-references *between domain blocks*): P24 governs the
  *informant's* cross-domain statement and confines it to the non-domain block.
- **P25 · Multi-concern referral with asymmetric intervention data.** The formal
  referral statement **names each concern domain**. The RTI / adequacy-of-progress
  close (P19c) is made **only for concerns that carry progress-monitoring data**,
  and is **never manufactured** for a concern without it — an intervention lacking
  formal data is described (what was tried, by whom, how long) without an adequacy
  claim. Silence on adequacy where there is no data is correct, not an omission.
- **P26 · Multi-concern ordering.** When more than one concern domain is present:
  if the informant **signaled a primary concern**, follow **her ordering**. Only
  where **no primacy was signaled** do you order by **evidentiary weight**
  (objective data, intervention duration). **Never imply primacy the informant did
  not state** — evidentiary weight is a tiebreaker for presentation order, not a
  clinical ranking of the concerns.
- **P27 · Self-concept / affective signal secondary to a domain concern.** A
  self-concept or affective remark reported alongside a specific difficulty (e.g.
  "he's started saying he's 'not smart'") is carried as a **non-escalating mention
  in the Internalizing block that keeps that block's negative intact**, and — **when
  the remark is tied to a single domain** — is *also* recounted as **impact within
  that home domain**. The mention must **not** manufacture an internalizing
  concern, must **not** over-read a single remark, and must **not** be phrased as
  an independent internalizing observation; its purpose is to keep the signal
  visible to a reader who sees **only** the Social-Emotional field (which P23
  otherwise leaves blind).
  **(1) Attribution scope.** Attribute the remark **exactly as far as the source
  supports** — never narrow it to a single domain the informant did not name, and
  never broaden it to domains she did not name. Where the informant ties it to a
  specific difficulty, tie it there; where she does not, report it **without domain
  attribution** ("she noted that D. has begun saying he is 'not smart,' which she
  finds concerning").
  **(2) Appears-twice is conditional.** The two-block placement (in-domain impact
  **plus** Internalizing mirror) applies **only when the remark is tied to one
  domain**. When it is tied to **multiple concerns or none specifically**, it
  appears **once** — domain-neutral, in the Internalizing block — because there is
  no faithful single academic home to mirror from. This single-domain form is the
  sole sanctioned exception to appears-once (below).
  **(3) Preferred phrasing.** Open the kept negative with **"did not identify
  broader social-emotional or internalizing concerns …"** so it reconciles
  gracefully with the non-escalating self-concept mention that follows, rather than
  a flat negative abutting a concern-adjacent remark.

**Appears-exactly-once discipline.** Each substantive signal (a concern, a
strength, a cleared negative, an impact) lives in **exactly one** block, so a
per-domain target never shows the same content twice across its fields. The sole
sanctioned exception is **P27 in its single-domain form** (a self-concept remark
tied to one domain, mirrored non-escalating into Internalizing); a domain-neutral
self-concept remark appears once and triggers no exception. This is recorded
precisely so it is not read as permission to duplicate elsewhere.

## Added parameters (v0.6)
- **P28 · Concern-specific observations live in the concern's own block.** An
  observation *about* a specific reported difficulty — a misattribution ("others
  read his slow starts as laziness"), a functional impact, a qualifying context —
  belongs in that concern's domain block, not in Other Information. **Other
  Information is only for genuinely cross-cutting content with no single home** (a
  cross-domain strength, an informant's cross-domain musing per P24, attendance,
  closing goals). Test: if the remark names or describes one concern, it files
  under that concern; if removing any one domain would make it homeless, it's
  cross-cutting.

## Register anchor (worked example)
A concrete anchor for **P18** (target voice) and **P19c** (the RTI close). Every
clause is teacher-attributed and data-anchored, so the RTI logic emerges from
stated facts rather than psychologist judgment — this is the band to match:

> "According to the teacher, the data show a slow upward trend; however, M.'s
> performance remains below the aim line, and the teacher reports that progress
> has not yet reached the expected level despite ongoing intervention."

## Content domains (stable clinical organization)
The per-domain content blocks the drafting layer emits (a block may be a concern,
a question-derived affirmative, or a plain cleared note; omit only when the form
carries no signal AND the domain isn't one that must always be addressed):

Reason for Referral · Existing Data / Assessment History · Intervention History ·
Reading · Written Expression · Mathematics · Executive Function / Attention ·
Behavior · Social-Emotional / Internalizing · Communication ·
Cognitive (learning & thinking) · Adaptive · Motor / Sensory · Health & Medical ·
Vision & Hearing · Other Information.

The academic subareas — **Reading, Written Expression, Mathematics** — are
separate per-domain blocks (P17), not a single Academic block, so each drops into
its own target field.

The **functional / educational impact** of a domain-specific difficulty (e.g.
reading avoidance secondary to a reading problem) is recounted **within that
domain** (here, Reading) as reported impact — there is no separate Educational
Impact domain. **Impact phrasing stays source-faithful (v0.4):** paraphrase the
teacher's own register rather than a tidier synonym when the synonym narrows her
meaning — e.g. the teacher's "can't get through … without one-on-one help"
becomes "cannot get through independent reading or content-area text without
one-to-one assistance," **not** "cannot complete" ("get through" is her word and
is slightly broader than "complete"; P1 fidelity).

**Strengths surface in-domain only.** A faithful positive lives in its clinical
block (P22); there is **no standalone Strengths block** in this per-domain / RED
content structure — a separate Strengths section would contradict
strengths-in-domain, not merely duplicate it. Each strength is polarity-tagged in
the content, so a presentation renderer can still aggregate them for a narrative
target (see *Presentation*). Any strength without a cleanly-owning clinical domain
is rehomed to its most faithful block, not dropped.

## Presentation (future — NOT built now)
A presentation layer maps the per-domain content into a target document's fixed
slots, user-configurable. Example target — the **EdPlan Review of Existing Data**
domain order: Reason for Referral → Assessment History → Intervention History →
Behavior → Cognitive → Academic (Reading / Written Expression / Mathematics) →
Communication → Adaptive → Fine/Gross Motor → Health & Medical → Vision &
Hearing → Other Information (with EF/attention and social-emotional mapped per
user preference). A target that carries a single combined Academic field is a
presentation choice — the content stays split (P17) and the renderer may
concatenate the academic subarea blocks. **Do not build configurable display
now** — only keep the drafting output placement-agnostic so this mapping is
possible later.

**Aggregated Strengths section** — a presentation option, not content. For a
narrative-report target, a renderer may collect the polarity-tagged in-domain
positives into a single Strengths section. Because strengths live in-domain in
the content (no standalone Strengths block), this aggregation is a presentation
choice available to narrative targets and is *not* part of the per-domain / RED
structure.

## Known tensions (for adjudication)
- **P4 ↔ P18.** P4's original "avoid technical terms / plain language" is
  superseded by P18: use the precise professional term when it is the accurate
  word. P18 governs.
- **P16 ↔ P20.** P20 wants EF/attention constructed from the `TCH-SR` items, but
  P16 reconstructs specifics only where those items were actually screened. When
  the self-regulation module did not load (EF cleared only by the high-level
  concern screen), there are no `TCH-SR` answers, so EF falls back to a plain "no
  concerns reported" per P16 — still emitted as its own explicit block per P20.

## How this spec is applied
Fed in-context to the drafting slice each run; the harness pins the spec
**version**. Dev loop: generate submission → draft with this spec in-context → JD
reviews → each recurring edit becomes a parameter here → cross-check a second
model on the same fixture; divergence flags an underspecified parameter.

## Out of scope (roadmap — deferred)
Feedback-learning / work-sample ingestion (FERPA + governance). Configurable
presentation layer (structure allowed for; not implemented).

## Versioning
Parameters carry stable IDs (`P1`…`P28`); edits bump the version and append to the
changelog. Drafts record the spec version they ran under.

## Changelog
- **v0.6** — cross-system harvest on teacher-attention-02 (parallel second-model
  draft). **P28** added: concern-specific observations file in the concern's own
  block, Other Information only for genuinely cross-cutting content (the
  effort/laziness remark, which is about the attention difficulty, moves out of
  Other Information into EF/Attention). **P27 refined** in three ways: (1)
  attribution scope — a self-concept remark is attributed exactly as far as the
  source supports, never narrowed or broadened to domains the informant did not
  name (here "not smart" is reported domain-neutral); (2) the appears-twice
  placement is **conditional** — it applies only when the remark is tied to one
  domain; tied to multiple/none, it appears once (domain-neutral) in Internalizing;
  (3) preferred phrasing "did not identify **broader** social-emotional or
  internalizing concerns …" to reconcile the kept negative with the mention.
  Appears-exactly-once discipline updated to the single-domain conditional.
  **P14a completeness pass** added: a faithful-but-lossy drafting tendency was
  observed twice on this fixture (a dropped 15-minute work-completion impact and a
  dropped "subjects that lean on independent reading" grades clause), so P14 now
  carries an operational coverage check — walk every answered source item, confirm
  each substantive teacher statement appears once in its correct block, with
  conscious drops (thin content routed to follow-up) distinguished from oversight.
- **v0.5** — multi-domain stress fixture (teacher-attention-02: reading +
  attention/EF concerns). P2 held under pressure (the two co-occurring concerns
  stayed unconnected; the informant's own unresolved musing quarantined). Four new
  parameters: **P24** informant-asserted cross-domain relationships (asserted or
  unresolved) recounted attributed/unresolved outside any domain block, never
  adopted as framing; **P25** multi-concern referral names each domain, RTI/adequacy
  close only for concerns with progress-monitoring data; **P26** multi-concern
  ordering follows the informant's stated primacy, else evidentiary weight, never
  imputing primacy; **P27** self-concept/affective signal secondary to a domain
  concern is recounted as in-domain impact **and** mirrored non-escalating into the
  Internalizing block (bounded, recorded exception to the appears-exactly-once
  discipline, justified by per-domain fields being read in isolation). Added the
  explicit **appears-exactly-once discipline** with P27 as its sole exception.
- **v0.4** — register/ChatGPT comparison harvest (same fixture, same v0.3 spec).
  Three adopted wins: **(1)** P18 register guidance now prefers **observable
  descriptions of the concern over construct/test terminology** ("difficulty
  hearing and manipulating sounds in words, decoding unfamiliar words, reading
  connected text smoothly and at pace," not "phonological awareness, decoding,
  oral reading fluency") — in Reason for Referral (P19b) and throughout; construct
  IDs stay as internal Evidence tags only. **(2)** P17 now **splits academic
  subareas into separate self-standing blocks — Reading, Written Expression,
  Mathematics** (distinct EdPlan fields), each with its own concern-or-negative;
  Content domains + Presentation example updated to match. **(3)** Functional-impact
  phrasing stays **source-faithful** — the teacher's "get through" is kept over the
  narrower "complete" (P1). Two v0.3 renderings kept as better: **Health & Medical**
  cleared negative stays clean ("no marked change or decline in skills, behavior,
  or mood") without the item's trailing "following a break, illness, or specific
  event" qualifier (P21 spirit, now recorded on P21). No new parameter IDs
  (P1–P23 unchanged); changes refine P17, P18, P19, P21, and the Content-domains /
  Presentation sections.
- **v0.3** — framing idea (content vs. presentation) added; P16 question-derived
  negatives, P17 per-domain placement-agnostic output, P18 register (one voice),
  P19 Reason-for-Referral structure, P20 EF/attention own block; P4 refined under
  P18, P5 rescoped to within-domain; section order moved to *Presentation*.
  Corrected (same version): **P21 no system-internal language (HARD)** added;
  P19 RTI framing scoped to Reason for Referral only (keep "some improvement";
  don't escalate to "inadequate"; don't assert "appropriate"); **Register anchor**
  worked example added; educational impact recounted within its domain (no
  separate Educational Impact domain). P12 clarified: attribution is uniform
  single-informant grounding; no impression-vs-finding disclaimers on individual
  statements. Strength content may appear both in its clinical domain and in
  Strengths (strengths-in-domain accepted for this target). **P22** added:
  faithful positive signal surfaced in cleared domains (not a bare negative),
  faithful-only. **P22 refined**: surfaces only when cleanly/directly *about* the
  domain, never by association (EF/Motor kept as bare negatives). **P23** added:
  no cross-domain references — each block stands alone (Social-Emotional cross-ref
  removed). **Standalone Strengths block dropped** — strengths surface in-domain
  only; orphan strengths rehomed ("enjoys being read to" → Communication,
  "consistent effort" → Other Information), none dropped; aggregated Strengths
  recorded as a presentation-layer option.
- **v0.2** — section order re-based on EdPlan RED domain structure.
- **v0.1** — initial canonical set (P1–P15) + section order + hard floor.
