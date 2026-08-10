# What the canonical fixture needs to exercise a full report

**Status:** LIST ONLY. Nothing built. JD rules before anything is seeded.
**Date:** 2026-08-09 · **Scope:** `[PsychReport]`

---

## Why the current fixture cannot support report-structure work

Avery v1 was built for gate testing and is good at it: one clear referral
concern, one instrument, one unconfirmed score, a real bank submission, an
authentic checksum. **17 of the bank's 69 questions answered; nine of thirteen
modules blank; one informant; one instrument; no observation; no records.**

That is adequate to ask *does the fidelity gate work* and inadequate to ask
*is this a report a psychologist would sign*. A case with no parent input, no
records, no observation, no cognitive data, and a single informant cannot
produce a document you can evaluate for market fitness — most of what a real
report contains has no data to come from, so every absence looks like a product
failure whether or not it is one.

**Avery v1 is not replaced.** It stays as the gate fixture, and its narrowness
is the point there — it is the case with no session evidence, which is what
makes it the right test of D-140. What follows is a *second* fixture.

---

## 1. Additional informants

| | Why the report needs it |
|---|---|
| **Parent/guardian intake** | Developmental and health history has no other source. Also the only route to a home-setting perspective, without which cross-informant discrepancy — the thing INTEGRATED_INTERPRETATION exists to handle — cannot be exercised at all. |
| **Second teacher** (e.g. content-area) | Within-setting agreement and disagreement; currently one teacher means every classroom claim is single-source. |
| **Student interview / self-report** | Grade 4 is old enough. Nothing in the current case represents the student's own account. |

**Design requirement:** the parent and teacher accounts must **disagree
somewhere**, in a defensible way. A fixture where every informant agrees cannot
exercise discrepancy classification, the CONFIDENCE stem ladder, or the "never
average informants" rule.

## 2. Assessment data

| | Notes |
|---|---|
| **Cognitive measure** (WISC-V) | The single largest gap. No ability data means no ability/achievement pattern, no processing-strength discussion, and no composite/subtest split to exercise P2's "one level coarser" rule. `library/wisc-v.draft.md` exists but is unverified draft content. |
| **Full WIAT-4**, not three reading subtests | Written expression and math, so the report has cross-domain content and the interpretation must select rather than restate. |
| **Rating scales — two informants** | BASC-3 or Conners, parent and teacher. `rating_scale` is already an admitted section kind with no data behind it. The INTEGRATED_INTERPRETATION prompt has a whole RATING SCALES block that has never run against real data. |
| **A second unconfirmed score, in a different instrument** | Verification currently has one instance in one measure. Two makes the release-and-lift behavior generalize. |
| **At least one genuinely invalid or questionable index** | Nothing in the current fixture exercises DO_NOT_INTERPRET or a compromised composite (D-096/D-108). Every ceiling except the top two is currently untested against real data. |

## 3. Observation

- **Examiner testing-session observation** — the evidence type D-140 was
  written for, and which no case currently carries. Until it exists, every
  session assertion in every section fails the gate correctly and the
  *supported* path is never exercised on real generation.
- **Classroom observation** — with ABC-style or interval data, so the
  Observations section has something to describe and the §2.1 encounter
  boundary is exercised on live prose rather than only in the corpus.

**Note:** this depends on the clinician testing-observation evidence type,
which JD has ruled a separate upcoming task. Capture's teacher/school semantics
must not be bent to fill it.

## 4. Records

- **Prior evaluation** (a reevaluation context, or a private evaluation to
  reconcile)
- **Health/vision/hearing screening records**
- **Attendance record**
- **Prior IEP or 504 plan**, if the case is a reevaluation
- **Intervention documentation** — the MTSS/Tier 2 record the teacher
  references but which exists nowhere as a Source
- **Work samples**

**Blocked:** `records`, `prior_report`, and `work_sample` are Source kinds no
section admits — see `docs/defects/unreachable-source-kinds.md`. Seeding them
today would produce Sources that are silently discarded. **Fix the defect
before seeding these**, or the fixture will appear to work while proving
nothing.

## 5. Case fields the header needs

DOB / age at testing · school · district · examiner name and credential ·
dates of testing · parent/guardian names · primary language · grade placement.

Several are minimal-PII decisions under D-006, not schema tasks. DOB in
particular needs a ruling before it is seeded, since the whole architecture
stores age rather than birth date elsewhere.

## 6. What a second fixture should deliberately contain

Beyond volume, the cases that make a fixture *useful* rather than merely large:

- **A real cross-informant discrepancy** — school-specific concern the parent
  does not corroborate. Exercises the discrepancy taxonomy and the "does not
  establish" stem.
- **A source whose scope is genuinely unestablished**, so
  COMPARE_WITHIN_SOURCE and DESCRIBE_ONLY appear for a reason other than
  missing construct tags.
- **One superseded Source** — a corrected score report replacing an earlier
  one. Migration 0007's supersession chain and the evidence-snapshot argument
  have never been exercised end to end on a real case.
- **A referral question that the data partially answers**, so
  "Insufficient information was available to determine…" is reached honestly
  rather than never.

---

## 7. Sequencing note

The unreachable-kinds defect (§4) gates the records half. The
testing-observation evidence type gates §3. Everything else is seedable once
the §5 PII ruling lands.

**Recommendation:** do not attempt one large fixture in one pass. The parts
gated on other work will hold the ungated parts hostage. Cognitive data, full
WIAT-4, rating scales, and the parent intake are independent of both blockers
and would already lift the fixture from "cannot evaluate a report" to "can."
