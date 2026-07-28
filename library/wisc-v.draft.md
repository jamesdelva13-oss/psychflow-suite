# WISC-V — instrument-description library  ·  **DRAFT / UNVERIFIED**

> **STATUS: DRAFT — NOT VERIFIED. Do not use in any real report.** (D-109)
>
> Per **D-109**, all content here must be authored and verified by JD against the
> primary WISC-V test manual before it may enter a report. Model-drafted text —
> however fluent, and even where Claude and ChatGPT agree — is **format-stable, not
> content-certified**; both draw on overlapping training data and can be
> confidently wrong the same way. Two tracked states: **(a) content-complete with
> citation placeholders** (drafting), **(b) verified** (after a manual-open pass).
> This file is state (a) at best, and **most content slots below are still empty**
> — see the scaffold note.
>
> **Scaffold note (2026-07-25):** this file was generated as the **D-107 schema
> scaffold only.** The WISC-V candidate definitions and task examples drafted in
> the originating PsychReport/ChatGPT thread were **not available in the Cowork
> session that built this file**, so the content slots are **placeholders, not the
> reconstructed drafts.** Paste the thread's draft text into the marked slots (or
> point Cowork at the file that holds it) to reach state (a). Nothing here may be
> treated as reconstructed content until that happens.

Schema: **D-107** (final instrument-library entry schema) · caveats: **D-108** ·
verification discipline: **D-109**.

---

## Schema legend (D-107)

**Index entry** — five slots:
1. `core_definition` (library-static, cited, always rendered) **+** `secondary_descriptor` (optional interpretive-adjacent framing; rendered only when configured; structured even when empty)
2. `generic_task_example` (library-static, cited, generically phrased — never case-specific)
3. `student_performance` (model-generated under DESCRIPTIVE_RESULTS; not stored here)
4. `functional_connection` (model-generated under INTEGRATED_INTERPRETATION; rendered in integration, not the instrument section — **pointer only** here)
5. `variability_context` / caveat (rule-inserted from the D-108 caveat sub-library on determination; never scatter-triggered, never generated)

**Composite entry** — slots 1, 3, 4, 5 **+** `composition` (constituent indexes/subtests); **no slot 2**.

**Per-slot metadata (every slot):** `provenance` (`library-static` | `model-generated` | `rule-inserted`) · `source {instrument, edition, location}` · `version` (this library's entry revision) · `edition` (test-manual edition sourced) — version and edition are **distinct fields**.

---

## Index: VCI — Verbal Comprehension Index

- **slot1.core_definition:** _[DRAFT — paste verified definition; source: WISC-V manual, ed., §/p.]_
- **slot1.secondary_descriptor:** _[optional — empty until configured]_
- **slot2.generic_task_example:** _[DRAFT — "Tasks measuring verbal comprehension ask a child to…"; cite]_
- **slot4.functional_connection:** _pointer → generated in INTEGRATED_INTERPRETATION_
- **slot5.caveat:** _rule-inserted from D-108 on determination_
- **metadata:** provenance=library-static · source={WISC-V, ed?, loc?} · version=0.0-draft · edition=_[unset]_

## Index: VSI — Visual Spatial Index
- **slot1.core_definition:** _[DRAFT — paste verified]_
- **slot1.secondary_descriptor:** _[optional]_
- **slot2.generic_task_example:** _[DRAFT]_
- **slot4 / slot5:** _pointer / D-108_
- **metadata:** provenance=library-static · source={WISC-V, ed?, loc?} · version=0.0-draft · edition=_[unset]_

## Index: FRI — Fluid Reasoning Index
- **slot1.core_definition:** _[DRAFT — paste verified]_
- **slot1.secondary_descriptor:** _[optional — e.g. "independent of acquired knowledge" (VERIFY before use)]_
- **slot2.generic_task_example:** _[DRAFT]_
- **slot4 / slot5:** _pointer / D-108_
- **metadata:** provenance=library-static · source={WISC-V, ed?, loc?} · version=0.0-draft · edition=_[unset]_

## Index: WMI — Working Memory Index
- **slot1.core_definition:** _[DRAFT — paste verified]_
- **slot1.secondary_descriptor:** _[optional]_
- **slot2.generic_task_example:** _[DRAFT]_
- **slot4 / slot5:** _pointer / D-108_
- **metadata:** provenance=library-static · source={WISC-V, ed?, loc?} · version=0.0-draft · edition=_[unset]_

## Index: PSI — Processing Speed Index
- **slot1.core_definition:** _[DRAFT — paste verified]_
- **slot1.secondary_descriptor:** _[optional]_
- **slot2.generic_task_example:** _[DRAFT]_
- **slot4 / slot5:** _pointer / D-108_
- **metadata:** provenance=library-static · source={WISC-V, ed?, loc?} · version=0.0-draft · edition=_[unset]_

---

## Composite: FSIQ — Full Scale IQ
- **composition:** VCI, VSI, FRI, WMI, PSI  _(per D-107; confirm exact contributing-subtest set against the manual)_
- **slot1.core_definition:** _[DRAFT — paste verified]_
- **slot1.secondary_descriptor:** _[optional]_
- **slot4.functional_connection:** _pointer → integration_
- **slot5.caveat:** _FSIQ/composite variability caveat — rule-inserted from D-108 on determination (never from raw scatter, D-104)_
- **metadata:** provenance=library-static · source={WISC-V, ed?, loc?} · version=0.0-draft · edition=_[unset]_

---

*This is a scaffold. Content slots marked `[DRAFT …]` are empty placeholders until
the originating draft text is pasted in and, separately, until each is verified
against the WISC-V manual (D-109). No slot may render in a real report while any of
its content or its `edition` field is unset.*
