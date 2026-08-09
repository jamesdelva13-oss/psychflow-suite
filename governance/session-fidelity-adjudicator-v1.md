# Session-fidelity adjudicator — spec v1

**Spec version:** `session-fidelity-adjudicator-v1`
**Amended:** 2026-08-09 — deployment modes (§4a) and measured results (§9).
**Governs:** D-140 (the rule), D-141 (why it is code and not a prompt line).
**Implements:** `apps/psychreport/lib/adjudicator.ts`, `lib/session-evidence.ts`,
the gate in `lib/generate.ts`.
**Status:** authored 2026-08-09. Deterministic orchestration tests run every
commit; the live evaluation is periodic and not CI.

---

## 0. Why this exists

The first live generation of VS-3 produced, against the Avery fixture:

> "Across both tasks, Avery read a limited number of items correctly before
> reaching the discontinue criterion."

Nothing in the case data documents item counts, discontinue events, or any
testing-session behavior. The Avery case carries a teacher intake, a clinician
interview summary, and a WIAT-4 score set — an administration record and
numbers, and no session narrative at all.

FIDELITY ("Invent nothing — no history, observations, scores, interventions,
diagnoses, or quotations") and the DESCRIPTIVE_RESULTS mode contract both
prohibited that sentence. Both are prompt text. The sentence was generated
anyway, and nothing in the system could have stopped it from reaching the
clinician. **Per D-141, a prompt line is not a safeguard.** This document
specifies the safeguard.

---

## 1. The rule being enforced (D-140, restated for implementers)

PsychReport may describe testing-session events — administration procedures and
mechanics, prompting, examinee behavior, effort, engagement, rapport, pacing,
and examiner support — only when those events are documented in
clinician-authored or clinician-verified testing-session evidence supplied to
that section's generation.

Three corollaries the implementation must carry:

1. **Scope does not transfer.** Evidence supplied for one session dimension
   does not license assertions about another. A rapport note does not license a
   prompting claim; an administration record does not license a behavior claim.
2. **Paraphrase yes, distortion no.** Generated prose may summarize or naturally
   rephrase documented evidence, but may not materially change documented
   frequency, intensity, duration, certainty, or valence.
3. **Hedging is not a basis.** "May have," "appeared to," "consistent with,"
   and conditional constructions fail identically to direct assertions.
   Qualification reduces certainty; it does not create an evidentiary basis.

**"Clinician-verified" is deliberate.** Dictated notes, imported testing notes,
and confirmed structured administration data all qualify. The condition is
professional verification, not manual typing.

---

## 2. Scope constraint on the adjudicator (normative — the spec, not the prompt)

The adjudicator answers **exactly one question** and must be built, prompted,
evaluated, and changed as a single-question classifier:

> Does the generated prose state or imply an administration event, examinee
> behavior, examiner action, or testing-session condition that is not documented
> in the session evidence supplied to that section?

It **must not** evaluate:

- general report quality — writing, organization, tone, length, register;
- clinical interpretation — whether a conclusion is warranted, whether a
  discrepancy is correctly explained, whether a recommendation follows;
- attribution or sourcing **outside this rule** — whether a teacher-reported
  classroom behavior, a score, a history item, or a record statement is
  supported is somebody else's problem, not this gate's;
- overall fidelity — this is not a general hallucination detector.

**This constraint is normative and lives here, not only in the prompt string.**
A change that widens the adjudicator's question is a change to this spec, and
requires the same review as a change to the rule. The reason is operational,
not stylistic: an adjudicator that drifts into general fidelity judging produces
findings the clinician cannot act on, and a clinician who learns to dismiss the
gate has no gate. Precision on one question is the product requirement.

**Out of scope by construction** (rejected during design, not deferred):
claim-level Evidence binding, character-span coverage validation, claim-type
taxonomies, and sentence-level source attribution of any kind. That
architecture degrades prose quality and exceeds this defect.

---

## 3. What counts as session evidence

Implemented in `lib/session-evidence.ts`. Two structural classes, and the
distinction is a code-level fact rather than a judgment:

| Class | Sources | What it can document |
|---|---|---|
| `NARRATIVE` | `observation`, `session_notes`, `testing_notes` — clinician-authored or clinician-verified session records | Whatever its text says. The adjudicator reads it verbatim. |
| `ADMINISTRATION_FACTS_ONLY` | `score_set` | That named measures were administered on a date in a stated form. **Nothing about how the session went.** |

`interview` (RIE Capture) is **not** session evidence today: `capturePolicy`
fixes its informant to `TEACHER` and its setting to `SCHOOL`, so it documents a
teacher conversation, not the student's evaluation session. When Capture gains a
testing-session setting, its records enter through `SESSION_NARRATIVE_KINDS` and
this table is amended.

Consequence on the Avery fixture as it stands: **there is no session narrative
evidence on the case at all.** Every session assertion in every section
therefore fails the gate. That is the correct answer, and it is the answer that
would have caught the discontinue-criterion sentence.

Only subtests actually released to the writer appear in the administration
record. Scores withheld for verification (§9.4) do not leak into the
adjudicator's view.

---

## 4. Where the gate runs

**Every generated section. No exceptions, no prefilter.**

The directive named Assessment Results, Behavioral/Testing Observations,
Integrated Interpretation, Summary, "and any other section whose mode permits
testing-session content." The implementation runs on **all five modes**, which
is a superset. The reason is the same reason there is no lexical prefilter: a
rule that decides whether the safeguard runs is itself a safeguard, and
"SOURCE_FAITHFUL sections don't contain session content" is a prompt-level
belief of exactly the kind D-141 refuses to trust. A section whose mode forbids
session content and which contains none costs one cheap passing call.

### 4a. Deployment mode — `shadow` | `enforce`

Configuration, not a code path fork. The adjudicator runs identically in both:
same model, same prompt version, same evidence set, same fail-closed
validation. Only what the orchestration does with the verdict differs.

| | `enforce` (default) | `shadow` |
|---|---|---|
| Failing verdict | rejects the draft; one targeted regeneration through the identical gate; then needs-review | recorded; the section proceeds |
| Regeneration | yes, exactly one | **no** — regenerating changes the output, which is enforcement |
| Clinician sees | the notice (§6) | **nothing** |
| Recorded | outcome + verdict | outcome + verdict + the enforce counterfactual |

Resolution fails safe: `PSYCHREPORT_FIDELITY_GATE_MODE` is read once, and
anything that is not exactly `shadow` — a typo, an empty string, an absent
variable — resolves to `enforce`. A misconfiguration can only ever be
stricter than intended, never quieter.

**The mode is persisted on every generation**, alongside distinct outcome
values (`shadow_would_reject`, `shadow_would_flag`) that only shadow may
write and that enforce may never write. A shadow rejection and an enforced
rejection are therefore not merely labelled differently — the schema refuses
to store either one as the other, so a past verdict stays interpretable after
the mode changes.

Shadow exists to measure, not to soften. Enforcement destroys the number a
deployment decision needs, because an enforced run never shows what would
have shipped. `wouldEnforce` is the counterfactual column a pilot reads; it
can only ever be `passed` or `needs_review` under shadow, never
`passed_after_retry` — the retry that was not run might have cleared, and the
record must not claim to know that it would have.

**No lexical prefilter.** A keyword or regex filter deciding whether to invoke
the adjudicator would be a safeguard with a recall figure nobody has measured,
and a missed phrase is indistinguishable from having no check. A prefilter may
be reconsidered post-launch, and only against measured recall on real usage.

---

## 5. The call

- **Separate, server-side, closed-ended.** Not a section of the drafting
  prompt, not a self-check inside the drafting call. The drafting model does
  not adjudicate its own output.
- **Model:** `claude-opus-5`, effort `medium`, streamed.
- **No refusal fallback.** Unlike drafting, the adjudicator does not carry
  `server-side-fallback`: a safeguard must not silently swap the model doing the
  judging. A refusal fails closed.
- **Structured return, via a forced tool call:**
  `{ pass: boolean, unsupportedStatements: string[], reason: string }`.
  `unsupportedStatements` are verbatim spans copied from the section text.
- **Provenance recorded:** adjudicator model, serving model, prompt version,
  spec version, timestamp, tokens.

### 5.1 Fail closed

The section does not pass when any of these hold:

- the call throws (network, auth, rate limit, timeout);
- the model refuses (`stop_reason === "refusal"`);
- no tool call is returned, or its input fails schema validation;
- the result is internally incoherent — `pass: true` with statements listed, or
  `pass: false` with none;
- an `unsupportedStatement` does not appear in the section text after
  whitespace normalization. A quoted statement that is not in the document is a
  fabricated finding; the same grounding guard the QA Engine applies to Layer B
  applies here, and it fails the section rather than the finding.

A failure of the gate mechanism itself (error, refusal, unparseable,
ungrounded) goes **straight to needs-review with no retry**: there is no named
statement to write a targeted instruction around, and burning a generation on a
broken adjudicator is waste, not safety.

---

## 6. One regeneration

On a substantive failure (`pass: false`, well-formed, grounded):

1. **Exactly one** regeneration, as a revision turn: system prompt unchanged,
   original user turn, the rejected draft as the assistant turn, then a
   targeted correction naming each unsupported statement verbatim and the
   adjudicator's reason. The instruction explicitly forecloses hedging as a fix.
2. **The regenerated section clears the identical gate** — same adjudicator,
   same prompt version, same evidence set. The retry is not the remedy; the
   gate is.
3. **Second failure surfaces to the clinician as needing review.** Never loop.
   Never silently delete language. The prose is shown with the unsupported
   statements named, and the clinician decides.

**Rejected and unusable are distinct clinician-facing states**, because they
ask different things of the reader:

- **Rejected** — the draft asserts something the case does not document. The
  statement is named verbatim. This is about the text, and the clinician can
  act on it.
- **Unusable** — the check could not run (error, refusal, unparseable,
  ungrounded quote). No statement is named because none exists. The draft may
  be perfectly good and *nobody has looked at it*. The notice says so.

A sustained adjudicator outage must never read to a clinician as the model
suddenly writing badly. `clinicianGateNotice()` in `lib/generate.ts` and
`gateNoticeFor()` on the writer page are the only two places this is decided,
and both return `null` in shadow mode — "the clinician sees nothing from the
gate in shadow" is a property of the code, not a rule the screen remembers.

The rejected draft is preserved, not discarded (§7).

---

## 7. Persistence

Migration `0009_report_sections.sql` (amended, unapplied — DDL is JD's via the
dashboard). Per generated section version:

- generated section text;
- generation model, prompt version, spec version;
- the supplied evidence set as a **snapshot** — supersession and section
  scoping make later reconstruction unreliable, so the snapshot holds the
  verbatim SOURCE LIMITS block, the verbatim CASE DATA, each source's id /
  version / checksum / resolved ceiling / policy, the session-evidence items,
  and the score verifications in force at generation time;
- adjudicator model and prompt version;
- the structured adjudicator result and the rejection reason;
- the retry record — the rejected draft is its own frozen row, and the retry
  points at it;
- clinician edits (a new version row, `origin = 'clinician_edited'`);
- approval history (`report_section_reviews`, append-only).

---

## 8. Tests

Two kinds, deliberately separate.

### 8.1 Deterministic orchestration — every commit
`apps/psychreport/tests/session-fidelity.test.ts`, adjudicator mocked:

- a failed section is rejected rather than returned;
- exactly one retry is permitted;
- the retry passes through the same gate (same adjudicator, same evidence);
- a second failure surfaces as needs-review rather than looping;
- an adjudicator error fails closed;
- unparseable / incoherent / ungrounded output fails closed;
- a passing section is returned unchanged and un-retried.

### 8.2 Live evaluation — periodic, not CI
`apps/psychreport/tests-eval/session-fidelity.eval.ts`, six cases against the
real model, including the exact Avery sentence against the exact Avery score
set:

1. unsupported assertion (the Avery discontinue-criterion sentence) → fail
2. supported paraphrase → pass
3. distorted paraphrase (frequency/intensity/valence shifted) → fail
4. wrong-scope evidence (rapport documented, prompting invented) → fail
5. innocent non-session language ("teacher ratings appeared consistent") → pass
6. hedged fabrication ("may have reached the discontinue criterion") → fail

Cases 5 and 2 are the ones that matter for §2: they measure whether the
adjudicator has drifted into general fidelity judging. A failure there is a
precision defect and is treated as severe as a miss on case 1.


---

## 9. Measured results — 2026-08-09

Harness: `apps/psychreport/tests-eval/session-fidelity.eval.ts`, n=10 per case
and per condition, adjudicator prompt `session-fidelity-adjudicator-prompt-v1`,
drafting prompt `psychreport-drafting-prompts-v2.2`. 3.1 min, ~65k input /
~31k output tokens.

### 9.1 Adjudicator accuracy (9 cases × 10)

| | |
|---|---|
| **Catch rate** | **100%** (40/40 across 4 should-fail cases) |
| **False-alarm rate** | **0%** (0/50 across 5 clean cases) |
| Unusable | 0% (0/90) |

Every case was 10/10. The clean half deliberately includes a long fully
documented session narrative, and prose using "appeared", "required", and
"ceiling" in non-session senses — the words a lexical prefilter would trip on.

**Caveat that matters: this corpus was written by the same author as the
prompt.** A 0% false-alarm rate on it bounds nothing about real usage. §9.2
shows the real boundary is subtler than the corpus.

### 9.2 Drafting-prompt baseline (2 conditions × 10)

Section: Assessment results (DESCRIPTIVE_RESULTS) on the Avery score set — the
exact configuration that produced the discontinue-criterion sentence.

| Condition | Clean first draft | Gate failed |
|---|---|---|
| rule-present (`v2.2`) | 90% (9/10) | 1 |
| rule-absent (baseline) | 80% (8/10) | 2 |

**Delta: 10 percentage points — one draft. This is not a real measurement.**
At n=10 the difference between 1 and 2 failures is indistinguishable from
noise. The honest reading is that the targeted block was not observed to hurt
and was not shown to help; separating them needs n in the hundreds, which is a
pre-pilot question, not this session's.

What the gate actually caught is more informative than the counts. In neither
arm did the model reproduce anything like the original fabrication. What it
produced instead:

- baseline: *"Word-level reading, whether the word was a real one or an
  invented one, was consistently effortful."* · *"both required deliberate
  effort"*
- rule-present: *"sounded out unfamiliar letter strings"*

**These are the real boundary, and one of them is arguable.** "Sounded out
unfamiliar letter strings" is plainly an observed session behavior asserted
from a score set. "Consistently effortful" is closer to a conventional
results-descriptive phrase, and a clinician might reasonably call it a
description of performance rather than a claim about the session. That
judgment — where results description ends and session assertion begins — is a
clinical call, not an engineering one, and it is the thing to watch in a
shadow pilot.

### 9.3 Retry resolution

**100% (3/3)** gate-failed drafts cleared on the single permitted
regeneration — 1/1 rule-present, 2/2 rule-absent. n=3 is too small to quote as
a rate, but the direction matters: every failure so far was fixed by the retry,
so on this evidence a clinician would rarely see a gate finding at all.

### 9.4 What these numbers do and do not support

They support the adjudicator being precise enough to deploy without training
clinicians to dismiss it. They do not yet support a claim about the drafting
block's contribution, and they do not establish a false-alarm rate on prose
this harness did not author. A shadow pilot answers both, and `wouldEnforce`
is the column it reads.
