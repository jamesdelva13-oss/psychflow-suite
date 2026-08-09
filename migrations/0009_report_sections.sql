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
-- AMENDED 2026-08-09 for the session-fidelity gate (D-140, D-141;
-- governance/session-fidelity-adjudicator-v1.md §7). Four things the
-- original draft could not record, each of which is needed to answer
-- "was this sentence supported by what the writer was actually given":
--
--   1. WHICH RULES WROTE IT — prompt and spec versions, not only the model.
--      A section read a year from now must be readable against the rules in
--      force when it was written.
--   2. WHAT WAS SUPPLIED — a SNAPSHOT, not a source-id list. Sources
--      supersede (0007) and sections are scoped to a subset of them, so
--      reconstructing the writer's view later from ids plus current rows is
--      unreliable: it shows today's version, filtered by today's plan,
--      against today's verification state.
--   3. WHAT THE GATE SAID — adjudicator model, prompt version, structured
--      verdict, rejection reason. Constraint `report_sections_gate_ran`
--      below makes this schema-enforced: THE DATABASE WILL NOT STORE A
--      MACHINE-GENERATED SECTION THAT NO GATE JUDGED. That is the D-141
--      principle applied to persistence — a safeguard is something that can
--      reject, and this one rejects an unjudged insert.
--   4. WHAT HAPPENED NEXT — the rejected draft (kept, never deleted), the
--      single permitted retry, clinician edits, and approval history.
--
-- STATUS: authored, NOT yet applied. DDL is applied by JD via the dashboard.
-- Apply to the dev instance before the writer UI ships; verify with the VS-1
-- integration suite afterwards.

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

  -- Where this text came from. 'generated' rows carry full generation and
  -- adjudication provenance (enforced below); the clinician's own writing
  -- and edits carry none, and must not be made to look as if they do.
  origin text not null default 'generated'
    check (origin in ('generated','clinician_edited','clinician_authored')),

  -- proposed: machine-written, awaiting the clinician (renders inside an
  -- AIProposal frame). accepted: the clinician has taken it. rejected: the
  -- session-fidelity gate refused this draft — the row is KEPT, because
  -- "never silently delete language" (D-140) includes the language the gate
  -- threw out. Approved content is never silently changed — a change inserts
  -- a new version.
  status text not null default 'proposed'
    check (status in ('proposed','accepted','dismissed','rejected')),

  -- Version chain. supersedes_id points at the row this one replaces;
  -- "superseded" is DERIVED (a newer row points here), never stored.
  version int not null default 1,
  supersedes_id uuid references report_sections(id),

  -- Sources this section drew on, as source ids (DESIGN-SYSTEM §5.6
  -- footer, and the substrate for "Why this is here"). The authoritative
  -- record of what the writer saw is evidence_snapshot below; this stays
  -- for indexing and for the footer.
  source_ids jsonb not null default '[]',

  -- {requestedModel, servingModel, effort, stopReason, inputTokens,
  --  outputTokens, at}. Null for clinician-authored content.
  generated_by jsonb,

  -- The rule set that produced this text: which drafting prompt set, and
  -- which effective-rules document it was assembled under.
  prompt_version text,
  spec_version text,

  -- THE SUPPLIED EVIDENCE SET, AS A SNAPSHOT (see note 2 above).
  -- apps/psychreport/lib/evidence-snapshot.ts:
  --   {at, sectionKey, mode,
  --    sources: [{sourceId, kind, label, version, checksum, collectedOn,
  --               ceiling, reviewBeforeIntegration, policy}],
  --    sourceLimits,        -- verbatim SOURCE LIMITS block as sent
  --    caseData,            -- verbatim CASE DATA block as sent
  --    sessionEvidence,     -- what the gate judged against
  --    scoreVerifications}  -- verification state in force (it sets ceilings)
  evidence_snapshot jsonb not null default '{}',

  ---------------------------------------------------------------------------
  -- Session-fidelity gate (D-140)
  ---------------------------------------------------------------------------

  -- Which gate ran, by spec version (e.g. 'session-fidelity-adjudicator-v1').
  fidelity_gate text,

  -- passed            cleared on the first draft
  -- passed_after_retry cleared on the single permitted regeneration
  -- needs_review      did not clear after the retry, OR the gate itself was
  --                   unusable (error, refusal, unparseable, ungrounded
  --                   quote) — fail closed. Surfaced to the clinician.
  -- rejected          this row is the draft the gate refused; a retry row
  --                   points at it.
  fidelity_outcome text
    check (fidelity_outcome in ('passed','passed_after_retry','needs_review','rejected')),

  -- {requestedModel, servingModel, promptVersion, specVersion, effort,
  --  inputTokens, outputTokens, at}
  adjudicator jsonb,

  -- The structured verdict, as returned and validated:
  -- {verdict, pass, unsupportedStatements[], reason}
  adjudication jsonb,

  -- Human-readable reason this draft was refused, or why the section needs
  -- review. Null when the section passed.
  rejection_reason text,

  ---------------------------------------------------------------------------
  -- Retry record
  ---------------------------------------------------------------------------

  -- 1 = first draft, 2 = the single permitted regeneration. The bound is a
  -- CHECK, not a convention: "exactly one retry" cannot be exceeded by a
  -- future code path, only by a migration.
  attempt int not null default 1 check (attempt between 1 and 2),

  -- The rejected draft this attempt replaces. Distinct from supersedes_id,
  -- which is the clinician's revision chain — a gate rejection is not a
  -- clinician act and must not read as one in the history.
  rejected_draft_id uuid references report_sections(id),

  created_at timestamptz not null default now(),
  created_by uuid,
  accepted_at timestamptz,
  accepted_by uuid,
  deleted_at timestamptz,

  ---------------------------------------------------------------------------
  -- Provenance integrity
  ---------------------------------------------------------------------------

  -- Machine-written text carries the record of what wrote it.
  constraint report_sections_generation_provenance check (
    origin <> 'generated'
    or (generated_by is not null and prompt_version is not null and spec_version is not null)
  ),

  -- THE GATE RAN. A machine-generated section cannot be stored without a
  -- gate verdict — no code path, no migration-less workaround, no "we'll
  -- wire it later" (which is exactly how D-099 happened).
  constraint report_sections_gate_ran check (
    origin <> 'generated'
    or (fidelity_gate is not null and fidelity_outcome is not null
        and adjudicator is not null and adjudication is not null)
  ),

  -- A refused draft says why, and a passing section does not pretend to.
  constraint report_sections_rejection_reason check (
    (fidelity_outcome in ('rejected','needs_review')) = (rejection_reason is not null)
  ),

  -- The retry, and only the retry, points at a rejected draft.
  constraint report_sections_retry_shape check (
    (attempt = 2) = (rejected_draft_id is not null)
  ),

  -- Clinician writing carries no machine provenance at all.
  constraint report_sections_human_origin check (
    origin = 'generated'
    or (generated_by is null and adjudication is null and adjudicator is null)
  )
);

create index idx_report_sections_case
  on report_sections(case_id) where deleted_at is null;
create index idx_report_sections_current
  on report_sections(case_id, section_key) where deleted_at is null;

-- Sections the clinician still has to look at, per D-140 item 4.
create index idx_report_sections_needs_review
  on report_sections(case_id, section_key)
  where deleted_at is null and fidelity_outcome = 'needs_review';

-- One retry per rejected draft. The CHECK above bounds a single row's
-- attempt count; this bounds the chain, so "exactly one regeneration" cannot
-- be reached by inserting a second attempt-2 row against the same draft.
create unique index uq_report_sections_one_retry
  on report_sections(rejected_draft_id) where rejected_draft_id is not null;

---------------------------------------------------------------------------
-- Immutability
---------------------------------------------------------------------------

-- A superseded section is immutable, exactly as a superseded Source is:
-- once another row points at it, its content and status are frozen.
--
-- Amended: the same freeze covers a REJECTED draft (once a retry points at
-- it, and by virtue of its own outcome), and covers the adjudication record
-- on every row. A verdict that can be edited after the fact is not a record
-- of what the gate said.
create or replace function report_sections_freeze_superseded()
returns trigger language plpgsql as $$
declare
  frozen boolean;
begin
  select exists (select 1 from report_sections s
                 where (s.supersedes_id = old.id or s.rejected_draft_id = old.id)
                   and s.deleted_at is null)
      or old.fidelity_outcome = 'rejected'
    into frozen;

  if frozen then
    if new.content is distinct from old.content
       or new.mode is distinct from old.mode
       or new.source_ids is distinct from old.source_ids
       or new.status is distinct from old.status then
      raise exception 'report_section % is frozen (superseded or gate-rejected) and immutable', old.id
        using errcode = '23514';
    end if;
  end if;

  -- The generation and adjudication record never changes on any row, frozen
  -- or not. Only the clinician-facing lifecycle fields move.
  if old.adjudication is not null and (
       new.adjudication is distinct from old.adjudication
    or new.adjudicator is distinct from old.adjudicator
    or new.fidelity_gate is distinct from old.fidelity_gate
    or new.fidelity_outcome is distinct from old.fidelity_outcome
    or new.rejection_reason is distinct from old.rejection_reason
    or new.evidence_snapshot is distinct from old.evidence_snapshot
    or new.generated_by is distinct from old.generated_by
    or new.prompt_version is distinct from old.prompt_version
    or new.spec_version is distinct from old.spec_version
  ) then
    raise exception 'report_section % generation/adjudication record is immutable', old.id
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

-- Append-only in the schema, not by convention.
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
-- RLS
---------------------------------------------------------------------------

-- Readable and writable only within the caller's own cases, matching the
-- posture every other case-scoped table uses.
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
