# @suite/content

Authored clinical material — the platform's intellectual assets:

- `banks/` — intake question banks (teacher, parent, ...). Published bank
  versions deployed to any respondent are immutable (D-013); pre-publication
  drafts may rev freely.
- `crosswalk/` — instrument → construct mappings.

All files must validate against the schemas in `@suite/case-model`
(`npm test` runs full validation: schema, taxonomy agreement, topography
vocabulary, referential integrity). Content depends on contracts, never
the reverse (D-018). No localization or state-variant machinery exists
until a variant exists.


## conventions/

House conventions (parameter block §11, layer 7) — authored presentation
rules injected per district or per report, never hardcoded in a renderer. A
convention governs *how valid content is expressed*; it cannot change *what
the evidence supports*.

- `score-table.default.v1.json` — the fallback score-table schema: column set
  and order, confidence-interval rendering, and how a score awaiting
  confirmation is marked. Validated by `ScoreTableConvention` in
  `@suite/case-model`.

**No classification bands ship here.** The schema supports a `classification`
column, and it renders only when a convention supplies `bands`. Cut points are
authored clinical content; inventing them would be an unratified clinical
claim made on a practitioner's behalf.
