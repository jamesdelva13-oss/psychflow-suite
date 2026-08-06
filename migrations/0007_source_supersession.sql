-- 0007_source_supersession.sql — Source version/supersession semantics
-- (directive §12.2, landed with the D-046 consolidation).
--
-- ADDITIVE ONLY, plus a protective trigger. RIE behavior does not change:
-- sources are inserted already-locked and never updated today, so a trigger
-- that forbids updating locked rows blocks nothing the app does — it turns
-- the existing convention into a database guarantee.
--
-- Model (mirrors @suite/case-model validateSupersession):
--   * A finalized (locked) Source is immutable. Corrections are NEW rows
--     pointing back via supersedes_source_id; version = original + 1.
--   * "Superseded" is DERIVED (a newer row points at you) — no status column
--     to mutate on the old row, so locked rows never need an UPDATE.
--   * Hard deletion for retention (D-004) is a DELETE, which stays allowed.

alter table sources
  add column if not exists version integer not null default 1
    check (version >= 1),
  add column if not exists supersedes_source_id uuid references sources(id);

create index if not exists idx_sources_supersedes
  on sources(supersedes_source_id) where supersedes_source_id is not null;

-- Locked rows are immutable. deleted_at (retention control, D-004) is the
-- one column that may still change; content, provenance, and versioning
-- columns may not.
create or replace function sources_locked_immutable() returns trigger
language plpgsql as $$
begin
  if old.locked then
    if new.case_id       is distinct from old.case_id
      or new.informant_id is distinct from old.informant_id
      or new.kind         is distinct from old.kind
      or new.collected_on is distinct from old.collected_on
      or new.instrument   is distinct from old.instrument
      or new.bank_id      is distinct from old.bank_id
      or new.bank_version is distinct from old.bank_version
      or new.payload      is distinct from old.payload
      or new.locked       is distinct from old.locked
      or new.checksum     is distinct from old.checksum
      or new.version      is distinct from old.version
      or new.supersedes_source_id is distinct from old.supersedes_source_id
      or new.created_at   is distinct from old.created_at
    then
      raise exception 'finalized Source % is immutable; supersede it with a new Source (directive 12.2)', old.id;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_sources_locked_immutable on sources;
create trigger trg_sources_locked_immutable
  before update on sources
  for each row execute function sources_locked_immutable();

-- Supersession integrity: the referenced original must be a locked Source in
-- the SAME case, and the new row's version must be original + 1.
create or replace function sources_supersession_check() returns trigger
language plpgsql as $$
declare orig sources%rowtype;
begin
  if new.supersedes_source_id is not null then
    select * into orig from sources where id = new.supersedes_source_id;
    if not found then
      raise exception 'supersedes_source_id % not found', new.supersedes_source_id;
    end if;
    if not orig.locked then
      raise exception 'only a finalized (locked) Source can be superseded';
    end if;
    if orig.case_id <> new.case_id then
      raise exception 'supersession cannot cross cases';
    end if;
    if new.version <> orig.version + 1 then
      raise exception 'superseding version must be % (got %)', orig.version + 1, new.version;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_sources_supersession on sources;
create trigger trg_sources_supersession
  before insert on sources
  for each row execute function sources_supersession_check();
