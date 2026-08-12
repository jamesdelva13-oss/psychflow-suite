# Runbook — applying migration 0009 (report sections)

**For:** JD, Supabase dashboard → SQL Editor
**Target:** the dev instance, project ref **`eiavypowoxpucchduomh`**
**File:** `migrations/0009_report_sections.sql` (540 lines, 34 objects)
**Prepared:** 2026-08-10. Verified against real Postgres 18 by
`npm run verify:migration` — 51 checks, 0 failures — but never yet run against
Supabase.

---

## 0. Before you paste anything

**Confirm the project.** The dashboard header must read project ref
`eiavypowoxpucchduomh`. Everything below creates tables; run it on the wrong
project and you have created them on the wrong project. There is no destructive
statement in this migration, but there is also no undo button in the dashboard.

**Confirm the ground is clean.** Run this first, on its own:

```sql
select table_name
  from information_schema.tables
 where table_schema = 'public'
   and table_name in ('report_sections','report_section_generations','report_section_reviews');
```

**Expected: zero rows.** If any row comes back, stop — 0009 has been applied
before, or partially applied. Go to §4.

**Confirm the dependency exists.** 0009 has one foreign-key parent:

```sql
select count(*) from public.cases;
```

If this errors, you are on the wrong project or an earlier migration is
missing.

---

## 1. Apply it — inside an explicit transaction

**This is the whole answer to "what if it fails partway."** Postgres will roll
the entire migration back if any statement fails, so partial application cannot
happen. Do not skip the wrapper.

In the SQL Editor, paste **in this order, as one query**:

1. `BEGIN;`
2. the entire contents of `migrations/0009_report_sections.sql`
3. `COMMIT;`

Nothing in 0009 is non-transactional (no `CREATE INDEX CONCURRENTLY`, no
`VACUUM`), so the wrapper is safe for every statement in the file.

**If it errors:** you will see one error and *nothing will have been created*.
Copy the error, fix the cause, and run the whole thing again from `BEGIN;`.
There is no cleanup step, because there is nothing to clean up. Verify that
with the §0 clean-ground query — it should still return zero rows.

**If you forget the wrapper and it fails partway**, go to §4.

---

## 2. Verify — six queries, expected answers stated

Run these after `COMMIT;` returns. Each states what a correct result looks
like, so you are checking a value rather than eyeballing output.

**2.1 — Tables and views exist (expect 5 rows: 3 tables, 2 views)**

```sql
select table_name, table_type
  from information_schema.tables
 where table_schema = 'public'
   and table_name like 'report_section%'
 order by table_name;
```

Expect `report_section_generations` BASE TABLE · `report_section_reviews` BASE
TABLE · `report_sections` BASE TABLE · `report_sections_current` VIEW ·
`report_sections_latest` VIEW.

**2.2 — The gate columns are NOT NULL (expect 6 rows, all `NO`)**

This is the constraint the whole design rests on: a generation cannot exist
without a verdict.

```sql
select column_name, is_nullable
  from information_schema.columns
 where table_name = 'report_section_generations'
   and column_name in ('gate_mode','gate_spec','gate_outcome','would_enforce','adjudicator','adjudication')
 order by column_name;
```

Any `YES` means the migration text was altered between here and the editor.

**2.3 — The CHECK constraints landed (expect 8 rows)**

```sql
select conname
  from pg_constraint
 where conrelid in ('report_sections'::regclass, 'report_section_generations'::regclass)
   and contype = 'c'
   and conname like 'gen_%' or conname like 'report_sections_%'
 order by conname;
```

Expect: `gen_outcome_matches_mode`, `gen_rejection_reason`, `gen_retry_shape`,
`gen_shadow_counterfactual`, `gen_shadow_never_retries`,
`report_sections_blocks_shape`, `report_sections_one_generated_prose`, plus the
column-level enum checks.

**2.4 — Triggers are armed (expect 4 rows)**

```sql
select tgname, tgrelid::regclass as on_table
  from pg_trigger
 where not tgisinternal
   and tgrelid in ('report_sections'::regclass,
                   'report_section_generations'::regclass,
                   'report_section_reviews'::regclass)
 order by on_table, tgname;
```

Expect `trg_gen_immutable`, `trg_report_section_reviews_append_only`,
`trg_report_sections_freeze`, `trg_report_sections_generated_text`.

**2.5 — RLS is on and policies exist (expect 3 tables `t`, 7 policies)**

```sql
select c.relname, c.relrowsecurity, count(p.polname) as policies
  from pg_class c
  left join pg_policy p on p.polrelid = c.oid
 where c.relname in ('report_sections','report_section_generations','report_section_reviews')
 group by 1,2 order by 1;
```

`relrowsecurity` must be `t` on all three. **If any is `f`, stop and tell me** —
that is the one failure mode here that silently exposes data across accounts.

**2.6 — The views are security_invoker (expect 2 rows, both containing `security_invoker=true`)**

```sql
select c.relname, c.reloptions
  from pg_class c
 where c.relname in ('report_sections_latest','report_sections_current');
```

If `reloptions` is null, the views will bypass RLS and read every
psychologist's sections. Same instruction: stop and tell me.

---

## 3. Smoke test — prove the constraints actually bite

Verification queries prove the objects *exist*. This proves they *work*.
Paste as one query; it rolls itself back, so it leaves nothing behind.

```sql
BEGIN;

-- A clinician-authored section with no generation inserts cleanly.
insert into report_sections (case_id, section_key, mode, blocks, generation_id, status)
select id, 'background', 'SOURCE_FAITHFUL',
       '[{"kind":"prose","text":"Runbook smoke test."}]'::jsonb, null, 'proposed'
  from cases limit 1;

-- An unrecognized block kind must be REFUSED.
do $$
begin
  begin
    insert into report_sections (case_id, section_key, mode, blocks)
    select id, 'background', 'SOURCE_FAITHFUL', '[{"kind":"sidebar","text":"x"}]'::jsonb
      from cases limit 1;
    raise exception 'SMOKE TEST FAILED: an unrecognized block kind was ACCEPTED';
  exception when check_violation then
    raise notice 'ok - unrecognized block kind refused';
  end;
end $$;

-- A generation without a verdict must be REFUSED.
do $$
begin
  begin
    insert into report_section_generations
      (case_id, section_key, mode, content, generated_by, prompt_version, spec_version,
       evidence_snapshot, gate_mode, gate_spec, would_enforce, adjudicator, adjudication)
    select id,'assessment-results','DESCRIPTIVE_RESULTS','x','{}','p','s','{}','enforce','g','passed','{}','{}'
      from cases limit 1;
    raise exception 'SMOKE TEST FAILED: a generation without gate_outcome was ACCEPTED';
  exception when not_null_violation then
    raise notice 'ok - generation without a verdict refused';
  end;
end $$;

ROLLBACK;
```

**Expected:** two `ok - …` notices and no error. Any `SMOKE TEST FAILED` means
a constraint did not land — capture the message and stop.

---

## 4. If it was applied without the transaction and failed partway

Only relevant if you skipped §1's `BEGIN;`. Objects are created in file order,
so a mid-file failure leaves the earlier ones behind. Drop everything and start
over — nothing has data in it yet, so this is safe:

```sql
BEGIN;
drop view if exists report_sections_current;
drop view if exists report_sections_latest;
drop table if exists report_section_reviews cascade;
drop table if exists report_sections cascade;
drop table if exists report_section_generations cascade;
drop function if exists report_sections_blocks_valid(jsonb);
drop function if exists report_section_prose(jsonb);
drop function if exists report_section_prose_count(jsonb);
drop function if exists report_sections_freeze_superseded();
drop function if exists report_sections_generated_text_matches();
drop function if exists report_section_generations_immutable();
drop function if exists report_section_reviews_append_only();
COMMIT;
```

Then confirm with §0's clean-ground query and apply again **with** the
transaction wrapper.

**Do not run this once real drafts exist.** It is a first-apply recovery
script, not a rollback for a live table.

---

## 5. After it lands

**Tell me it applied**, and I will:

- run the VS-1 integration suite against the instance;
- reload the writer at `/cases/<avery>/report` — it currently renders "the
  writer is not available on this instance yet", and that state should
  disappear;
- draft one section end to end and confirm the generation row, the block array,
  the rendered score table, and the gate verdict all persist as designed.

Nothing in the app writes to these tables until you do that first draft, so
there is no window where a half-configured writer can corrupt anything.

---

## 6. What this does not cover

- **No data migration**, because there is no data. First apply only.
- **Rollback after real use** is not addressed here; once drafts exist, a
  rollback is a data question and needs its own plan.
- **The `cases` FK** assumes migrations 0001–0008 are applied. They are, on
  this instance.
