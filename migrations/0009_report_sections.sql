-- 0009_report_sections.sql — drafted report content (VS-3)
--
-- STATUS: authored, NOT yet applied. DDL is applied by JD via the dashboard.
-- Apply to the dev instance before the writer UI ships; verify with the VS-1
-- integration suite afterwards.
--
-- ---------------------------------------------------------------------------
-- Shape
-- ---------------------------------------------------------------------------
--
-- TWO tables, because a section version and a model generation are different
-- objects with different lifetimes:
--
--   report_section_generations  One row per DRAFTING ATTEMPT. Insert-only.
--                               Carries the text that attempt produced, what
--                               produced it, what it was given, and what the
--                               gate said. Every gate column is NOT NULL.
--
--   report_sections             One row per version of the section AS
--                               PRESENTED. Nothing is ever updated in place: a
--                               revision inserts a new row pointing at the one
--                               it supersedes, so "prior version is preserved"
--                               (directive Stage H) is a property of the schema
--                               rather than of the code that writes it — the
--                               same derived-not-mutated shape migration 0007
--                               gave Sources.
--
-- THE MACHINE-GENERATED DISCRIMINATOR IS STRUCTURAL, NOT A FLAG. A section row
-- is machine-written if and only if it references a generation. There is no
-- `origin` column an insert path could set to route around the gate
-- requirement: the verdict columns are NOT NULL on the generation table, so a
-- generation reference IMPLIES a verdict exists. Human-written rows carry
-- no machine columns at all, because those columns are not on their table.
-- (An earlier draft used an `origin text` flag. That was the D-141 defect in
-- schema form — a control that the writer could simply decline to trip.)
--
-- A rejected attempt NEVER gets a report_sections row: it was refused before
-- the clinician saw it. It persists in full on the generation table, because
-- "never silently delete language" (D-140) includes the language the gate
-- threw out.
--
-- Generation provenance records the model that ACTUALLY served the text (a
-- refusal fallback can substitute one), never the model requested.
--
-- ---------------------------------------------------------------------------
-- A SECTION IS AN ORDERED ARRAY OF BLOCKS, NOT A STRING
-- ---------------------------------------------------------------------------
--
-- A psychoeducational report section is prose AND rendered content — a score
-- table beside the narrative that describes it. The parameter block §6 P1
-- already assumes this: "Prose must not duplicate numerical information a
-- table already communicates adequately." The prose rule was shipping against
-- a table the product never rendered, so the numbers reached nobody.
--
-- `report_sections.blocks` is that composition. Two kinds today:
--
--   {"kind":"prose","text":"…"}                     generated or clinician-written
--   {"kind":"table","table":"…","columns":[…],"rows":[…]}   rendered, deterministic
--
-- WHY NOW, AND ONLY NOW. This migration is unapplied. Adding blocks after it
-- ships means a data migration over live report content; adding them here
-- costs nothing. The `table` kind is defined and validated even though no code
-- emits one yet — that is the entire point of deciding it before the DDL runs.
--
-- WHAT THE SPLIT BUYS THE FIDELITY GATE. A generation produces exactly ONE
-- prose block; the gate judges that block. A rendered table has no generation
-- and cannot fabricate — it is a deterministic projection of verified score
-- rows. Moving numbers out of prose therefore shrinks the surface the
-- adjudicator has to police rather than enlarging it.
--
-- Generations stay `content text`. One generation is one prose output. The
-- composition lives on the section, where the clinician's version chain is.

---------------------------------------------------------------------------
-- Generations
---------------------------------------------------------------------------

create table report_section_generations (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id),
  section_key text not null,
  mode text not null check (mode in
    ('SOURCE_FAITHFUL','DIRECT_OBSERVATION','DESCRIPTIVE_RESULTS',
     'INTEGRATED_INTERPRETATION','RECOMMENDATION')),

  -- The prose this attempt produced, verbatim. Immutable.
  content text not null,

  -- 1 = first draft, 2 = the single permitted regeneration. The bound is a
  -- CHECK, not a convention: "exactly one retry" cannot be exceeded by a
  -- future code path, only by a migration.
  attempt int not null default 1 check (attempt between 1 and 2),

  -- The rejected attempt this one replaces. Distinct from
  -- report_sections.supersedes_id, which is the clinician's revision chain —
  -- a gate rejection is not a clinician act and must not read as one.
  supersedes_generation_id uuid references report_section_generations(id),

  -- {requestedModel, servingModel, effort, stopReason, inputTokens,
  --  outputTokens, at}. The model that actually served the text.
  generated_by jsonb not null,

  -- The rule set that produced this text: which drafting prompt set, and
  -- which effective-rules document it was assembled under. A section read a
  -- year from now must be readable against the rules in force when it was
  -- written, not the rules in force when it is read.
  prompt_version text not null,
  spec_version text not null,

  -- THE SUPPLIED EVIDENCE SET, AS A SNAPSHOT — not a source-id list.
  -- Sources supersede (0007) and sections are scoped to a subset of them, so
  -- reconstructing the writer's view later from ids plus current rows would
  -- show today's version, filtered by today's plan, against today's
  -- verification state. apps/psychreport/lib/evidence-snapshot.ts:
  --   {at, sectionKey, mode,
  --    sources: [{sourceId, kind, label, version, checksum, collectedOn,
  --               ceiling, reviewBeforeIntegration, policy}],
  --    sourceLimits,        -- verbatim SOURCE LIMITS block as sent
  --    caseData,            -- verbatim CASE DATA block as sent
  --    sessionEvidence,     -- what the gate judged against
  --    scoreVerifications}  -- verification state in force (it sets ceilings)
  evidence_snapshot jsonb not null,

  -- Source ids drawn on (DESIGN-SYSTEM §5.6 footer, and the substrate for
  -- "Why this is here"). The authoritative record is evidence_snapshot; this
  -- is for indexing and the footer.
  source_ids jsonb not null default '[]',

  -------------------------------------------------------------------------
  -- Session-fidelity gate (D-140). Every column NOT NULL: this is what
  -- makes "a generation reference implies a verdict" structural.
  -------------------------------------------------------------------------

  -- DEPLOYMENT MODE IN FORCE FOR THIS GENERATION. Persisted so a past verdict
  -- stays interpretable after the mode changes. A shadow rejection and an
  -- enforced rejection must never be indistinguishable later — hence both
  -- this column and distinct outcome values, cross-constrained below.
  gate_mode text not null check (gate_mode in ('shadow','enforce')),

  -- Which gate ran, by spec version (e.g. 'session-fidelity-adjudicator-v1').
  gate_spec text not null,

  -- passed              cleared on this attempt
  -- passed_after_retry  cleared on the single permitted regeneration
  -- rejected            the gate refused this attempt; a retry supersedes it.
  --                     Never surfaced — no report_sections row points here.
  -- needs_review        did not clear after the retry, OR the gate was
  --                     unusable (error, refusal, unparseable, ungrounded
  --                     quote) — fail closed. Surfaced to the clinician.
  -- shadow_would_reject shadow: gate named unsupported statements; proceeded
  -- shadow_would_flag   shadow: gate was unusable; proceeded
  gate_outcome text not null check (gate_outcome in
    ('passed','passed_after_retry','rejected','needs_review',
     'shadow_would_reject','shadow_would_flag')),

  -- What `enforce` would have produced for this same verdict. Equal to
  -- gate_outcome under enforce; the counterfactual under shadow. This is the
  -- column a shadow pilot reads to answer "how often would this have
  -- blocked" without re-running anything.
  would_enforce text not null check (would_enforce in
    ('passed','passed_after_retry','rejected','needs_review')),

  -- {requestedModel, servingModel, promptVersion, specVersion, effort,
  --  inputTokens, outputTokens, at}
  adjudicator jsonb not null,

  -- The structured verdict, as returned and validated:
  -- {verdict, pass, unsupportedStatements[], reason}
  adjudication jsonb not null,

  -- Why this attempt was refused or flagged. Null only when it passed.
  rejection_reason text,

  created_at timestamptz not null default now(),
  created_by uuid,

  -------------------------------------------------------------------------
  -- Integrity
  -------------------------------------------------------------------------

  -- The retry, and only the retry, supersedes an earlier attempt.
  constraint gen_retry_shape check (
    (attempt = 2) = (supersedes_generation_id is not null)
  ),

  -- Outcomes belong to their mode. Shadow cannot produce an enforcement
  -- outcome and enforce cannot produce a shadow one, so no later reader can
  -- confuse a recorded shadow rejection for a block that actually happened.
  constraint gen_outcome_matches_mode check (
    case gate_mode
      when 'shadow'  then gate_outcome in ('passed','shadow_would_reject','shadow_would_flag')
      when 'enforce' then gate_outcome in ('passed','passed_after_retry','rejected','needs_review')
    end
  ),

  -- Shadow never regenerates: regeneration changes the output, which is
  -- enforcement. A shadow attempt 2 would mean the mode was not honored.
  constraint gen_shadow_never_retries check (
    gate_mode = 'enforce' or attempt = 1
  ),

  -- Shadow does not know what a retry would have done, so it may not claim
  -- the retry would have cleared.
  constraint gen_shadow_counterfactual check (
    gate_mode = 'enforce' or would_enforce in ('passed','needs_review')
  ),

  -- A refused or flagged attempt says why; a cleared one does not pretend to.
  -- `passed_after_retry` is a CLEARED attempt: the rejection that preceded it
  -- carries its own reason on its own row, and duplicating it here would make
  -- a passing generation look outstanding.
  constraint gen_rejection_reason check (
    (gate_outcome in ('passed','passed_after_retry')) = (rejection_reason is null)
  )
);

create index idx_gen_case_section
  on report_section_generations(case_id, section_key, created_at);

-- One retry per rejected attempt. The CHECK above bounds a single row's
-- attempt number; this bounds the chain, so "exactly one regeneration" cannot
-- be reached by inserting a second attempt-2 row against the same draft.
create unique index uq_gen_one_retry
  on report_section_generations(supersedes_generation_id)
  where supersedes_generation_id is not null;

-- Measurement surface for a shadow pilot: what would have been blocked.
create index idx_gen_would_enforce
  on report_section_generations(case_id, would_enforce)
  where gate_mode = 'shadow';

-- Insert-only. A verdict that can be edited after the fact is not a record of
-- what the gate said, and a generation that can be deleted is not provenance.
create or replace function report_section_generations_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'report_section_generations is insert-only' using errcode = '23514';
end;
$$;

drop trigger if exists trg_gen_immutable on report_section_generations;
create trigger trg_gen_immutable
  before update or delete on report_section_generations
  for each row execute function report_section_generations_immutable();

---------------------------------------------------------------------------
-- Sections as presented
---------------------------------------------------------------------------

-- Block validity, as a CHECK rather than an application convention. An
-- unrecognized kind, a prose block with no text, or a table block with no rows
-- is refused at insert.
create or replace function report_sections_blocks_valid(blocks jsonb)
returns boolean language sql immutable as $$
  select jsonb_typeof(blocks) = 'array'
     and jsonb_array_length(blocks) > 0
     and not exists (
       select 1
         from jsonb_array_elements(blocks) b
        where jsonb_typeof(b) <> 'object'
           or b->>'kind' is null
           or b->>'kind' not in ('prose','table')
           or (b->>'kind' = 'prose' and coalesce(b->>'text', '') = '')
           or (b->>'kind' = 'table'
               and (b->'rows' is null or jsonb_typeof(b->'rows') <> 'array'))
     );
$$;

-- The prose a section presents, in order. Exports, search, and the
-- generated-text check all read through this rather than reaching into the
-- array shape themselves.
create or replace function report_section_prose(blocks jsonb)
returns text language sql immutable as $$
  select string_agg(b->>'text', E'\n\n' order by ord)
    from jsonb_array_elements(blocks) with ordinality as t(b, ord)
   where b->>'kind' = 'prose';
$$;

-- How many prose blocks a section carries. A generated section must carry
-- exactly one, because one generation is one prose output.
create or replace function report_section_prose_count(blocks jsonb)
returns int language sql immutable as $$
  select count(*)::int
    from jsonb_array_elements(blocks) b
   where b->>'kind' = 'prose';
$$;

create table report_sections (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id),

  -- Which section of the report, and the mode it was written in.
  -- section_key matches apps/psychreport/lib/report-plan.ts REPORT_PLAN.
  section_key text not null,
  mode text not null check (mode in
    ('SOURCE_FAITHFUL','DIRECT_OBSERVATION','DESCRIPTIVE_RESULTS',
     'INTEGRATED_INTERPRETATION','RECOMMENDATION')),

  -- Ordered composition. See the header note. Validated by
  -- `report_sections_blocks_valid` below, not by convention.
  blocks jsonb not null,

  -- THE DISCRIMINATOR. Non-null → this version is machine-written, and the
  -- referenced row necessarily carries a gate verdict (all gate columns are
  -- NOT NULL there). Null → the clinician wrote or edited this text, and
  -- there is no machine provenance to fabricate.
  generation_id uuid references report_section_generations(id),

  -- proposed: machine-written, awaiting the clinician (renders inside an
  -- AIProposal frame). accepted: the clinician has taken it. Approved content
  -- is never silently changed — a change inserts a new version.
  status text not null default 'proposed'
    check (status in ('proposed','accepted','dismissed')),

  -- Version chain. supersedes_id points at the row this one replaces;
  -- "superseded" is DERIVED (a newer row points here), never stored.
  version int not null default 1,
  supersedes_id uuid references report_sections(id),

  created_at timestamptz not null default now(),
  created_by uuid,
  accepted_at timestamptz,
  accepted_by uuid,
  deleted_at timestamptz,

  constraint report_sections_blocks_shape
    check (report_sections_blocks_valid(blocks)),

  -- One generation is one prose output. A generated section presenting two
  -- prose blocks would mean prose the gate never judged.
  constraint report_sections_one_generated_prose
    check (generation_id is null or report_section_prose_count(blocks) = 1)
);

create index idx_report_sections_case
  on report_sections(case_id) where deleted_at is null;
create index idx_report_sections_current
  on report_sections(case_id, section_key) where deleted_at is null;

-- One version may be superseded by at most one successor, so the chain stays
-- linear and "latest" is well defined.
create unique index uq_report_sections_one_successor
  on report_sections(supersedes_id) where supersedes_id is not null;

-- A generated section version presents EXACTLY the text that was adjudicated.
-- Without this, a clinician edit could reuse the generation id with different
-- prose and the adjudicated text would be lost — the edit must instead insert
-- a human row (generation_id null) that supersedes the generated one, which
-- leaves the adjudicated text intact and distinct on the frozen prior row.
create or replace function report_sections_generated_text_matches()
returns trigger language plpgsql as $$
declare
  gen_content text;
  gen_case uuid;
  gen_key text;
begin
  if new.generation_id is null then
    return new;
  end if;
  select content, case_id, section_key
    into gen_content, gen_case, gen_key
    from report_section_generations where id = new.generation_id;
  if gen_content is null then
    raise exception 'report_section % references a missing generation', new.id
      using errcode = '23503';
  end if;
  -- The section's PROSE must be the adjudicated text, character for
  -- character. Rendered blocks sit around it and are not the model's output,
  -- so they are deliberately outside this comparison — a table cannot
  -- fabricate and has no generation to match.
  if report_section_prose(new.blocks) is distinct from gen_content then
    raise exception 'report_section % prose differs from its adjudicated generation; a clinician edit must insert a human version instead', new.id
      using errcode = '23514';
  end if;
  if new.case_id is distinct from gen_case or new.section_key is distinct from gen_key then
    raise exception 'report_section % references a generation from another case or section', new.id
      using errcode = '23514';
  end if;
  -- A refused attempt was never shown to anyone; it must not acquire a
  -- presented version after the fact.
  if exists (select 1 from report_section_generations g
             where g.id = new.generation_id and g.gate_outcome = 'rejected') then
    raise exception 'report_section % references a gate-rejected generation', new.id
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_report_sections_generated_text on report_sections;
create trigger trg_report_sections_generated_text
  before insert or update on report_sections
  for each row execute function report_sections_generated_text_matches();

-- A superseded section is immutable, exactly as a superseded Source is: once
-- another row points at it, its content and status are frozen. This is what
-- keeps a clinician edit from erasing the adjudicated text it replaced.
create or replace function report_sections_freeze_superseded()
returns trigger language plpgsql as $$
begin
  if exists (select 1 from report_sections s
             where s.supersedes_id = old.id and s.deleted_at is null) then
    if new.blocks is distinct from old.blocks
       or new.mode is distinct from old.mode
       or new.generation_id is distinct from old.generation_id
       or new.status is distinct from old.status then
      raise exception 'report_section % is superseded and immutable', old.id
        using errcode = '23514';
    end if;
  end if;

  -- The link to what produced the text never moves on any row.
  if new.generation_id is distinct from old.generation_id then
    raise exception 'report_section % generation link is immutable', old.id
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_report_sections_freeze on report_sections;
create trigger trg_report_sections_freeze
  before update on report_sections
  for each row execute function report_sections_freeze_superseded();

---------------------------------------------------------------------------
-- Derived views. "Current" is a definition, not something a reader has to
-- remember to filter for.
---------------------------------------------------------------------------

-- The latest visible version of each section: what the writer shows. A
-- rejected attempt cannot appear here because it has no report_sections row
-- at all.
-- security_invoker: a view does NOT inherit the base tables' RLS by default
-- (PG15 added the option and it is OFF unless asked for). Without this, these
-- views would read every psychologist's sections.
create or replace view report_sections_latest
  with (security_invoker = true) as
select s.*
  from report_sections s
 where s.deleted_at is null
   and not exists (
     select 1 from report_sections n
      where n.supersedes_id = s.id and n.deleted_at is null
   );

-- THE CURRENT SECTION — the section of record, i.e. what an export would
-- carry. Only an accepted version qualifies. A needs-review generation
-- (including one whose gate was unusable) is surfaced as a proposal and can
-- become the section of record ONLY through an explicit clinician acceptance,
-- which writes an `accepted_over_gate_finding` review row.
create or replace view report_sections_current
  with (security_invoker = true) as
select * from report_sections_latest where status = 'accepted';

---------------------------------------------------------------------------
-- Approval history
---------------------------------------------------------------------------

-- Append-only. The section row carries CURRENT status; this carries the
-- sequence of acts that produced it, including the clinician taking a
-- needs-review section as-is — a decision that must be attributable.
create table report_section_reviews (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references report_sections(id),
  case_id uuid not null references cases(id),
  action text not null check (action in
    ('accepted','dismissed','edited','flagged_needs_review',
     'accepted_over_gate_finding','regeneration_requested')),
  actor uuid,
  note text,
  at timestamptz not null default now()
);

create index idx_report_section_reviews_section
  on report_section_reviews(section_id, at);

create or replace function report_section_reviews_append_only()
returns trigger language plpgsql as $$
begin
  raise exception 'report_section_reviews is append-only' using errcode = '23514';
end;
$$;

drop trigger if exists trg_report_section_reviews_append_only on report_section_reviews;
create trigger trg_report_section_reviews_append_only
  before update or delete on report_section_reviews
  for each row execute function report_section_reviews_append_only();

---------------------------------------------------------------------------
-- RLS — readable and writable only within the caller's own cases, matching
-- the posture every other case-scoped table uses.
---------------------------------------------------------------------------

alter table report_section_generations enable row level security;

drop policy if exists rsg_select on report_section_generations;
create policy rsg_select on report_section_generations
  for select to authenticated
  using (case_id in (select id from cases where psychologist_id = auth.uid()));

drop policy if exists rsg_insert on report_section_generations;
create policy rsg_insert on report_section_generations
  for insert to authenticated
  with check (case_id in (select id from cases where psychologist_id = auth.uid()));

alter table report_sections enable row level security;

drop policy if exists report_sections_select on report_sections;
create policy report_sections_select on report_sections
  for select to authenticated
  using (case_id in (select id from cases where psychologist_id = auth.uid()));

drop policy if exists report_sections_insert on report_sections;
create policy report_sections_insert on report_sections
  for insert to authenticated
  with check (case_id in (select id from cases where psychologist_id = auth.uid()));

drop policy if exists report_sections_update on report_sections;
create policy report_sections_update on report_sections
  for update to authenticated
  using (case_id in (select id from cases where psychologist_id = auth.uid()))
  with check (case_id in (select id from cases where psychologist_id = auth.uid()));

alter table report_section_reviews enable row level security;

drop policy if exists report_section_reviews_select on report_section_reviews;
create policy report_section_reviews_select on report_section_reviews
  for select to authenticated
  using (case_id in (select id from cases where psychologist_id = auth.uid()));

drop policy if exists report_section_reviews_insert on report_section_reviews;
create policy report_section_reviews_insert on report_section_reviews
  for insert to authenticated
  with check (case_id in (select id from cases where psychologist_id = auth.uid()));

-- Both views are security_invoker (declared above), so the base-table
-- policies govern them and a view cannot become an RLS bypass.
grant select on report_sections_latest, report_sections_current to authenticated;
