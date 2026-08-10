# Defect — three Source kinds are accepted and silently discarded

**Filed:** 2026-08-09 · **Status:** OPEN · **Scope:** `[PsychReport]`
**Filed separately at JD's instruction** so it does not get absorbed into the
report-architecture work, where a silent-input bug would stop being visible as
a bug.

---

## The defect

`apps/psychreport/lib/report-plan.ts` gates every section by Source *kind*.
The union of `sourceKinds` across all six sections is:

```
referral_form · interview · observation · score_set · rating_scale
```

`apps/psychreport/lib/source-policy.ts` `LABELS` already names three more:

```
prior_report  → "Prior evaluation"
records       → "Records"
work_sample   → "Work sample"
```

**No section admits any of the three.** A Source of one of those kinds can be
created, finalized, locked, checksummed, policed, and resolved into the case
context — and then reaches no section of the report. It does not appear. It
does not error. Nothing tells the clinician it was ignored.

## Why this is the checksum defect's shape, not a missing feature

The system **accepts the input and quietly does nothing with it**. That is the
distinguishing property. A missing feature declines the input; this accepts it,
stores it, renders it in Case Materials, applies an interpretation policy to
it, and then drops it at the section boundary without a word.

Every layer behaves plausibly in isolation:

- `policyFor` has no case for these kinds, so `fallbackPolicy` returns
  `DESCRIBE_ONLY` with `professionalReviewRequired: true` — correct
  fail-safe behavior, and it makes the Source look handled;
- `buildGenerationInputs` includes it in `inputs.sources` — it is present;
- `eligibleSources` filters it out of every section — it is gone;
- `gateSection` reports `emptyReason` only when a section has *no* eligible
  source, so a case with a records Source and a teacher form produces no
  signal at all.

The clinician's model is "I added the prior evaluation to the case." The
system's behavior is "the prior evaluation is in Case Materials and in no
report section." Nothing bridges those.

## Reproduction

Add a Source with `kind: "records"` to any case, finalized and locked. Then:

```ts
const inputs = buildGenerationInputs(ctx, verifications);
inputs.sources.map((s) => s.source.kind);        // includes "records"
REPORT_PLAN.flatMap((p) => p.sourceKinds);        // does not include "records"
eligibleSources(inputs, planFor("interpretation")!); // records absent, silently
```

## Blast radius

- **Prior evaluations** are among the most consequential documents in a
  reevaluation and are invisible to every section.
- **Records** (attendance, health, discipline, prior IEP) likewise.
- **Work samples** likewise.
- The `@suite/document-extraction` ingestion path exists to read exactly these
  documents. Anything it extracts today lands in a kind no section consumes.

## What a fix must decide (not decided here)

1. Which sections should admit which of the three kinds — a report-plan
   question, and the reason JD ruled this must not be fixed inside that work.
2. Whether an unconsumed Source kind should be a **loud** condition
   independent of the plan: a case carrying a Source that no section can use
   is a state the clinician should see, not a silence. That is the part that
   generalizes beyond these three kinds — the next kind added will have the
   same problem unless the *silence* is fixed rather than the *list*.
3. Whether `SectionPlan.sourceKinds` is the right mechanism at all, given it
   makes "no section wants this" indistinguishable from "this case has none."

**Recommended shape of the real fix:** make the unconsumed case loud
(a check that every current Source kind is admitted by at least one section,
surfaced to the clinician), rather than only extending the lists. Extending
the lists fixes three kinds; making the silence loud fixes the class. This is a
recommendation, not a decision — JD rules on scope.

## Related

- **D-141** — a safeguard is code that can reject output. This is the inverse
  failure: input that nothing rejects and nothing consumes.
- **D-138** — the checksum defect-shape regression. Same family: plausible
  behavior at every layer, wrong behavior overall, no signal.
- `docs/defects/` — this file establishes the directory. Defects that are not
  someone's current task belong here rather than in a code comment.
