# Report architecture — scoped proposal v1

**Status:** PROPOSAL. Nothing built. JD rules on scope before anything is built.
**Date:** 2026-08-09 · **Scope:** `[PsychReport]`
**Prompted by:** the 5-report diagnosis of 2026-08-09 — the generated document
is missing identifying information, assessments administered, validity,
developmental and health history, records review, score tables, and eligibility,
and three sections restate the same teacher content.

---

## 0. The finding that reframes the work

Of the seven missing sections, **three are not generation problems at all.**
Identifying information, assessments administered, and score tables are
deterministic renders of data the case already holds. No model, no prompt, no
gate, no fidelity risk.

They are also the three whose absence most makes the output not look like a
psychoeducational report. A reader opening the current draft finds no student
identifiers, no list of what was administered, and no scores — and concludes
the tool is weak, before reading a sentence of prose.

**Cheapest work, largest perceived effect, zero model risk.** That is the
sequencing argument, and it is why this proposal separates *rendered* from
*generated* before anything else.

---

## 1. Which sections are generated, and which are rendered

| Section | Kind | Source of content | Blocked on |
|---|---|---|---|
| Identifying information | **Rendered** | `cases` row · psychologist · Source dates | data-model additions (§1.1) |
| Assessments administered | **Rendered** | Source metadata: instrument · date · form | nothing — buildable today |
| Score tables | **Rendered** | `buildScoreRows()` + house conventions | §2 |
| Validity statement | **Hybrid** | structured: policy + verification state · narrative: session evidence | §1.2 |
| Developmental & health history | Generated (SOURCE_FAITHFUL) | parent intake / health records Source | fixture · unreachable-kinds defect |
| Records review | Generated (SOURCE_FAITHFUL) | `records` / `prior_report` Source | fixture · unreachable-kinds defect |
| Summary of findings | Generated (INTEGRATED_INTERPRETATION) | all sources | **§3 first** — see below |
| ~~Eligibility~~ | **Excluded** | — | ratified team-reserved (D-005 am., D-082) |

### 1.1 What identifying information needs that does not exist

`cases` holds: `state · eval_type · referral_date · status · first_name ·
last_initial · display_initials · grade · student_ref · priority_flag`.

Absent and required for a real header: **date of birth / age at testing ·
school · district · examiner name and credential · dates of testing (currently
only on the score set) · parent/guardian names · primary language · grade
placement vs. age**. Several are minimal-PII decisions (D-006), not just
columns — DOB in particular. **That is a ruling, not a schema task.**

### 1.2 Validity, split honestly

- **Structured half — renderable today.** `validityStatus`,
  `limitationSummary`, `professionalReviewRequired`, and per-score
  verification state are already computed for every Source and currently reach
  the reader only as a prose hedge (spec bucket item 3 of the diagnosis).
- **Narrative half — gated, correctly.** Effort, engagement, cooperation, and
  standardization deviations are testing-session events. D-140 permits them
  only with session evidence, which this case does not have and which the
  clinician-observation evidence type will supply.

**Proposal:** render the structured half now; generate the narrative half only
where session evidence exists; and where it does not, say so explicitly rather
than omitting the section. "Not established" is a finding; silence is not.

### 1.3 Summary of findings — do not add it yet

A separate Summary and the existing "Interpretation and summary" would share a
mode and share sources. Under the current architecture that guarantees they
restate each other, which is precisely the defect in §3. **Adding this section
before §3 is solved would make the document worse, not better.**

---

## 2. The table layer

DESCRIPTIVE_RESULTS already presumes it. The parameter block §6 P1 is explicit:
*"Prose must not duplicate numerical information a table already communicates
adequately"* and *"if a sentence's only content is a scale name plus a score or
classification, it is a table row in disguise."* P2 sets prose one level
coarser than the table.

**The rule is not wrong. Its precondition is missing.** The product suppresses
numbers on the strength of a table it never renders, so the numbers reach
nobody.

### 2.1 What the table is

A deterministic render of `ScoreRow[]` — the same array `buildScoreRows()`
already produces, joined to verification state. No model involvement, so no
fidelity gate and no fabrication surface.

### 2.2 Three constraints that shape it

**Unverified scores appear in the table, marked.** The withholding is from the
*model*, not from the clinician — they must see the extracted value to confirm
it against the protocol. A table that hides Reading Comprehension would defeat
the verification flow and hide the thing the clinician needs to act on. This is
the same principle as the writer-UI verification proposal.

**The schema is a house convention, not a constant.** Parameter block §11 puts
table column schema and order, decimal rules, whether confidence intervals
appear, whether percentiles appear, classification vocabulary, score ordering,
and instrument naming at **layer 7 — injected per district, never hardcoded**.
The table layer must therefore be *configurable by construction*. Hardcoding
"SS / 95% CI / percentile" would violate a ratified layer boundary on day one.

**Export fidelity binds it.** DESIGN-SYSTEM §8 item 7: what the DraftSection
shows is what the `.docx` contains. A table is document content, not UI chrome,
so it must live in the section's own representation and survive to VS-7 export.

### 2.3 The structural consequence, and the timing

**A section is currently a string.** `report_sections.content text`. A report
with tables needs a section to be a *sequence of blocks* — rendered table,
generated prose, rendered table — not one text field.

Migration **0009 is still unapplied**, which makes this the cheapest moment
this change will ever have. Applying 0009 as-is and adding blocks later means a
data migration on live report content. This is the single highest-leverage
timing decision in the proposal.

Options, in increasing order of commitment:

1. **Keep `content text`, add a sibling `blocks jsonb`.** Prose stays where it
   is; rendered blocks are ordered alongside. Least disruption; two sources of
   truth for "what does this section say."
2. **Replace `content` with an ordered block array.** One representation.
   Prose becomes a block of kind `prose`. Cleaner; touches the gate's
   persistence path (the adjudicator judges prose blocks, not tables — which is
   correct and simplifies §2's fidelity story, since a rendered table cannot
   fabricate).
3. **Defer entirely**, ship 0009 as-is, migrate later. Cheapest today, most
   expensive later, and it means the table layer cannot ship until after a
   data migration.

**Recommendation: option 2, decided before 0009 is applied.** Not built until
JD rules.

---

## 3. How section identity reaches the model

### 3.1 The defect, restated precisely

Reason for Referral and Background produce **byte-identical prompts** — system
and user both. Verified by hashing:

```
reason-for-referral    system=7383eaeee7959405  user=d32f168bf49e13e5
background             system=7383eaeee7959405  user=d32f168bf49e13e5
```

Neither the section title nor its key appears anywhere in either half. The
model is asked one question twice and answers it twice. Interpretation and
Recommendations share a user prompt and differ only by mode contract.

**This is the product asking for duplicate content by construction.** No amount
of prose quality fixes it, and it is the single defect that most makes the
output read as machine-generated.

### 3.2 Four mechanisms, and what each costs

| | Mechanism | Cost | Risk |
|---|---|---|---|
| A | `SectionPlan.purpose`, emitted in the **user** turn | trivial | template-recall (§3.3) |
| B | Per-section block in the **system** prompt | breaks mode-level prompt caching | same, plus cost |
| C | **Data-level** differentiation — sections draw different subsets of the same Source | moderate; needs question→section mapping | brittle if the bank changes |
| D | Cross-section awareness — each section sees what earlier ones said | high | couples sections; breaks independent regeneration; creates ordering dependency |

**Recommendation: A + C. Explicitly not D in this pass.** D is a real
architectural commitment — it makes sections non-independent, which the
regeneration and supersession model currently assumes they are — and it should
not be adopted as a side effect of fixing duplication.

A goes in the user turn specifically so the mode-stable system prompt stays
cacheable.

C is available today on this fixture: the teacher intake carries
referral-shaped answers (`TCH-CORE-008` concern areas, `TCH-CORE-010` when
first noticed) and history-shaped answers (`TCH-CORE-003` how long known,
`TCH-CORE-005` current supports, `TCH-INT-001`/`004` intervention history and
response). They split cleanly; nothing currently splits them.

### 3.3 The risk that mechanism A introduces, and how to write against it

Telling the model *"this is the Reason for Referral section"* invites it to
write what such sections conventionally contain — from template knowledge
rather than from this case's data. That is a fidelity risk the session gate
does not cover, because it is not a session claim.

**Mitigation, and it is a wording rule, not a suggestion:** `purpose` text must
state *which subset of the supplied material this section is accountable for*,
never *what a section of this name usually says*. Concretely —

> **Yes:** "Report only the concerns that prompted this referral and when they
> were first noticed. Do not report intervention history or current supports;
> another section covers those."
>
> **No:** "The reason for referral section explains why the student was
> referred for evaluation."

D-110 applies — the block must earn its tokens.

---

## 4. Dependency order

```
unreachable-kinds defect ─┐
                          ├─→ records review · developmental history
full canonical fixture  ──┘

§3 section identity ──────→ summary of findings   (blocked until §3 lands)

§2.3 block representation ─→ table layer ──→ 0009 applied
                                   ↑
                        DECIDE BEFORE APPLYING 0009

rendered sections (identifying info · assessments administered)
   └─→ buildable today, independent of everything above
       (identifying info needs the §1.1 minimal-PII ruling first)
```

---

## 5. What this proposal does not touch

- The session-fidelity gate. Nothing here changes D-140, D-141, the
  adjudicator's question, its scope tests, or its orchestration. The table
  layer *reduces* the gate's surface, since a rendered table cannot fabricate.
- Eligibility. Excluded, ratified, stays excluded.
- Claim-level binding, spans, or sentence-level attribution. Still rejected.

---

## 6. Rulings requested

1. **§2.3 — block representation, before 0009 is applied.** Options 1/2/3.
   Recommendation: option 2.
2. **§1.1 — minimal-PII scope for identifying information.** DOB in particular
   is a D-006 question, not a schema task.
3. **§3.2 — mechanism A + C, and explicitly not D.**
4. **§1.3 — hold Summary of findings until §3 lands.**
5. **Sequencing:** rendered sections first (cheapest, no model risk, largest
   perceived effect), or section identity first (largest quality effect)?
