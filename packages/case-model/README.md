# @suite/case-model

Canonical case data model, construct taxonomy, and question bank contracts
for the school psychology suite. Every product imports this package; no
schema is invented per-feature (decisions.md D-006).

## Contents
- `src/entities.ts` — Case, Informant, Source, Evidence, Claim (Zod schemas
  with decision-enforcing refinements: minimal PII, retention fields,
  evidence-linked claims, generation provenance, topography layering)
- `src/taxonomy.schema.ts` + `src/taxonomy.v0-3.json` — construct taxonomy
  v0.3 as versioned data with structural integrity validation
- `src/crosswalk.schema.ts` + `src/crosswalk.stub.json` — instrument →
  construct mappings (starter set; authoring continues)
- `src/question-bank.schema.ts` — contract for all intake question banks
- `content/teacher-form.v1.json` — Teacher Intake Bank v1.0.0 (published;
  immutable per D-013)

## Validate everything
```
npm install
npm test
```
23 checks: taxonomy integrity, crosswalk referential integrity, question
bank ↔ taxonomy agreement, and entity schema behavior including required
rejections (an unsupported reported_fact claim must fail to parse — the
schema itself enforces D-007).

## Rules of the road
- Construct IDs and question IDs are permanent. Additions over mutations;
  deprecation over deletion (D-011).
- Published question bank versions are immutable (D-013).
- Taxonomy changes bump the taxonomy version and ship as a new data file
  alongside the old one.
