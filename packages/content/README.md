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
