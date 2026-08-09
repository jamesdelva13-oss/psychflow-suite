-- 0009_report_sections.sql — drafted report content (VS-3)
--
-- One row per version of one section. Nothing is ever updated in place:
-- a revision inserts a new row pointing at the one it supersedes, so
-- "prior version is preserved" (directive Stage H) is a property of the
-- schema rather than of the code that writes it — the same derived-not-
-- mutated shape migration 0007 gave Sources.
--
-- Generation provenance records the model that ACTUALLY served the text
-- (a refusal fallback can substitute one), never the model requested.
--
-- STATUS: authored, NOT yet applied. Apply to the dev instance before the
-- writer UI ships; verify with the VS-1 integration suite afterwards.

create table report_sections (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id),

  -- Which section of the report, and the mode it was written in.
  -- section_key matches apps/psychreport/lib/report-plan.ts REPORT_PLAN.
  section_key text not null,
  mode text not null check (mode in
    ('SOURCE_FAITHFUL','DIRECT_OBSERVATION','DESCRIPTIVE_RESULTS',
     'INTEGRATED_INTERPRETATION','RECOMMENDATION')),

  content text not null,

  -- proposed: machine-written, awaiting the clinician (renders inside an
  -- AIProposal frame). accepted: the clinician has taken it. Approved
  -- content is never silently changed — a change inserts a new version.
  status text not null default 'proposed'
    check (status in ('proposed','accepted','dismissed')),

  -- Version chain. supersedes_id points at the row this one replaces;
  -- "superseded" is DERIVED (a newer row points here), never stored.
  version int not null default 1,
  supersedes_id uuid references report_sections(id),

  -- Sources this section drew on, as source ids (DESIGN-SYSTEM §5.6
  -- footer, and the substrate for "Why this is here").
  source_ids jsonb not null default '[]',

  -- {requestedModel, servingModel, effort, stopReason, inputTokens,
  --  outputTokens, at}. Null for clinician-authored content.
  generated_by jsonb,

  created_at timestamptz not null default now(),
  created_by uuid,
  accepted_at timestamptz,
  accepted_by uuid,
  deleted_at timestamptz
);

create index idx_report_sections_case
  on report_sections(case_id) where deleted_at is null;
create index idx_report_sections_current
  on report_sections(case_id, section_key) where deleted_at is null;

-- A superseded section is immutable, exactly as a superseded Source is:
-- once another row points at it, its content and status are frozen.
create or replace function report_sections_freeze_superseded()
returns trigger language plpgsql as $$
begin
  if exists (select 1 from report_sections s
             where s.supersedes_id = old.id and s.deleted_at is null) then
    if new.content is distinct from old.content
       or new.mode is distinct from old.mode
       or new.source_ids is distinct from old.source_ids then
      raise exception 'report_section % is superseded and immutable', old.id
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_report_sections_freeze on report_sections;
create trigger trg_report_sections_freeze
  before update on report_sections
  for each row execute function report_sections_freeze_superseded();

-- RLS: readable and writable only within the caller's own cases, matching
-- the posture every other case-scoped table uses.
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
