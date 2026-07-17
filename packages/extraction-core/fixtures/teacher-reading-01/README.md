# Fixture: teacher-reading-01

The first golden-set extraction fixture. A **synthetic** 3rd-grade teacher
submission (student M.R. — not a real case), authored to exercise a single
domain: **word-level reading difficulty**.

- `source.json` — the submission (case + informant context, pinned bank, and the
  response map). It is a **valid, complete** teacher-intake v1.2.0 submission
  (passes `validateSubmission`; locks to a checksummed `Source`).
- `expected-evidence.json` — **you author this** (the hand-annotated "correct"
  extraction). Copy `expected-evidence.template.json` and fill it in.

## Clinical story
Word-level reading trouble (phonological awareness, decoding, fluency) with
**intact oral/listening comprehension** and a real strength (speaking vocabulary,
science/building). Tier-2 phonics intervention (~20 weeks) with limited response.
Attendance fine; no vision/hearing signs; no marked change; math/other areas on
grade level. Emerging reading avoidance / "bad reader" self-concept.

## Extraction scope (locked — clinical review)
Extraction builds the **evidentiary substrate for a psychologist's summary**, and
a summary states meaningful **negatives and strengths**, not just complaints.

- **Any answer carrying information a psychologist would put in a summary becomes
  Evidence**, tagged by `polarity`: `concern` / `strength` / `neutral`. This
  explicitly includes cleared exclusionary factors *and* "this area is fine"
  answers (behavior, social, motor, etc.).
- **Only truly contentless answers become nothing** — informant/administrative
  fields and unanswered optional items.
- **Neutrals are tagged to be aggregable.** Every neutral carries a construct tag
  so the later summary layer can compress many into one natural sentence ("No
  concerns reported regarding writing, math, attention, behavior, language,
  social, daily-living, or motor"). **Extraction preserves everything; the
  summary compresses.**
- **Extraction never corrects a response.** Thin, vague, or incoherent answers are
  handled by the **follow-up mechanism** — the bank's deterministic completeness
  rules now, Phase 4 AI follow-ups later — *not* by extraction. Extraction is
  faithful to what the respondent actually wrote.

## Deterministic tagging rules (locked by JD)
Implemented **verbatim** as documented, legible rules — the shared spec for both
`extractDeterministic` and this fixture's hand-authored golden set. No language
understanding at this layer.

**R1 — Selected concern options → `concern` Evidence.** Each *selected* option
carrying `constructIds` (or `topography`) → one Evidence, `polarity: "concern"`,
`status: "reported"`, `extractionMethod: "rule"`, anchored to `<QID>::<value>`.

| Selected option | Evidence construct |
|---|---|
| `TCH-CORE-008 → reading` | `ACAD.READ` |
| `TCH-RDG-001 → phon_awareness` | `ACAD.READ.PHONOLOGICAL_AWARENESS` |
| `TCH-RDG-001 → decoding` | `ACAD.READ.DECODING` |
| `TCH-RDG-001 → fluency` | `ACAD.READ.FLUENCY` |

**R2 — Severity only from explicit magnitude answers.** Set **only** from answers
that state magnitude explicitly (peer-comparison / frequency scales) — never
inferred from tone or open-text intensity. Peer-comparison mapping: `well_below →
marked`, `somewhat_below → moderate`; `typical`/`above` → no *concern* (see R5/R3
for the positive/neutral cases). Here `TCH-RDG-006 = well_below` → `severity:
"marked"` on the overall `ACAD.READ` concern Evidence (cites `TCH-CORE-008::reading`
+ `TCH-RDG-006`).

**R3 — `neutral` Evidence (cleared / "area is fine"), tagged + aggregable.**
Two sources, both tagged by construct so they aggregate:
- **(a) Cleared exclusionary factors** — explicit negative answers on the factors
  SC SEED / NC require be affirmatively addressed: attendance (`TCH-CORE-006 = no`
  → `CTX.ATTENDANCE`), vision/hearing (`TCH-CORE-012 = no` → `CTX.VISION_HEARING`),
  marked change/health (`TCH-CORE-011 = no` → `CTX.HEALTH_MEDICAL`).
- **(b) "Area reviewed, not a concern"** — every **unselected** option of a
  concern-screening `multi_select` → one neutral Evidence tagged by that option's
  construct. For `TCH-CORE-008` (only `reading` selected) — **11 unselected options
  in teacher v1.2.0**: `writing → ACAD.WRIT`, `math → ACAD.MATH`, `self_regulation →
  EF`, `cognitive → COG`, `behavior → BEH`, `emotional → BEH.INTERNALIZING`,
  `communication → LANG`, `social → BEH.SOCIAL`, `adaptive → ADAPT`, `fine_motor →
  MOTOR_SENS.FINE_MOTOR`, `gross_motor → MOTOR_SENS.GROSS_MOTOR`. (Also any explicit
  "none of these" structured answer, e.g. `TCH-SOC-004 = none`, where present.)

Negatives on non-exclusionary, non-screening **free-text** produce nothing.

**R4 — Interventions roll up to one context Evidence.** All intervention answers
(`TCH-CORE-005`, `TCH-INT-001..005`) → a **single** `CTX.INSTRUCTION_ADEQUACY`
Evidence, `polarity: "neutral"`, citing **all** contributing anchors in
`responseIds` (the instructional-adequacy exclusionary factor, addressed).

**R5 — Structured strengths → `strength` Evidence.** Positive *structured*
responses in the peer/social and impact/closing modules (e.g. `TCH-SOC-002 =
initiates` → `BEH.SOCIAL` strength) → Evidence, `polarity: "strength"`,
`extractionMethod: "rule"`.

**Nothing** — informant/administrative fields (`TCH-CORE-001` role, `TCH-CORE-002`
subjects, `TCH-CORE-003` duration) and unanswered optional items. (`TCH-CORE-010`
onset is timeline *context* about the concern — annotate as context on the reading
concern or omit; not a standalone construct Evidence.)

## Strengths: which bucket for fixture #1 (confirm before annotating)
Strengths belong in the substrate, but partitioned by extraction method:

- **Structured strengths (deterministic, this slice): NONE in fixture #1.** A
  reading-only submission never reveals the `social_comm` module (so no
  `TCH-SOC-*` positives), and the always-shown impact/closing module is **all
  open-text**. → Your deterministic annotation should contain **no `strength`
  Evidence**.
- **Open-text strength (deferred to LLM): `TCH-CORE-007`** ("strengths and
  interests" — oral vocabulary, listening comprehension, science/building), plus
  the strength framing inside `TCH-IMP-002` / `TCH-IMP-005`. **Leave these OUT of
  the deterministic golden set**; they come in the LLM slice, grounded by
  quote-verification.

> Coverage note: fixture #1 therefore does **not** exercise R5 (structured
> strengths). A later fixture that reveals the social module with a positive peer
> answer (`TCH-SOC-002 = initiates`, `TCH-SOC-004 = none`) will.

## Also deferred to the LLM slice (not in this annotation)
- `TCH-RDG-002` / `TCH-RDG-003` — observable decoding/fluency detail (verbatim spans).
- `TCH-IMP-001` — reading **avoidance / motivation** → `CTX.MOTIVATION_ENGAGEMENT`.
- All other open-text.

### Faithfulness (not over- or under-tagging)
- A reported quantity ("half as many words per minute", "88% accuracy") is the
  *respondent's*, preserved as reported by the LLM slice — the deterministic layer
  never invents magnitude (R2).
- "Area is fine" is captured as **neutral** (R3), never upgraded to a concern and
  never dropped.
- Thin/awkward wording is left as-is — the follow-up layer handles gaps, not
  extraction.

## Evidence shape (from `@suite/case-model` `entities.ts`)
```jsonc
{
  "responseIds": ["TCH-RDG-001::decoding"],   // which answer(s) support it
  "constructTags": [{ "id": "ACAD.READ.DECODING", "status": "reported" }],
  "topography": null,                          // set for behavior items only
  "polarity": "concern",                       // concern | strength | neutral
  "severity": null,                            // mild | moderate | marked | null
  "statement": "Difficulty sounding out unfamiliar words (decoding).",
  "extractionMethod": "rule"                   // deterministic → "rule"
}
```
Schema invariants: every Evidence needs ≥1 construct tag **or** a topography
(D-007); `llm` method requires provenance (D-008) — not relevant to this slice.

## After you annotate
`extractDeterministic(source, bank, taxonomy)` will be built to reproduce your
`expected-evidence.json` set exactly (R1–R5), and `scoreExtraction` will report
recall/precision/polarity against it.
