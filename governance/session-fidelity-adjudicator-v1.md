# Session-fidelity adjudicator — spec v1

**Spec version:** `session-fidelity-adjudicator-v1`
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
