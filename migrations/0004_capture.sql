-- 0004_capture.sql — Capture: clinician notetaking + summarization (D-125).
-- A capture session is clinician-authored working state; on finalize it locks
-- into a sources row (kind interview/observation/other) with checksum, exactly
-- like a respondent submission. Model summaries live in summary_proposal and
-- NEVER travel into the Source unless the clinician confirms them (D-081
-- verification pattern; data-posture §7).

create table capture_sessions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id),
  psychologist_id uuid not null references psychologists(id),
  informant_id uuid references informants(id),
  kind text not null check (kind in ('interview','observation','call','other')),
  setting text,
  occurred_on date not null default current_date,
  notes text not null default '',
  status text not null default 'open'
    check (status in ('open','proposal_ready','finalized')),
  summary_proposal jsonb,                     -- {text, generation:{...}} — proposal only
  summary_final text,                         -- clinician-confirmed/authored
  source_id uuid references sources(id),      -- set on finalize
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,                     -- D-004
  constraint finalized_needs_source check (status <> 'finalized' or source_id is not null)
);
create index idx_capture_case on capture_sessions(case_id) where deleted_at is null;

-- RLS: owned directly by the authenticated psychologist (0002 model).
alter table capture_sessions enable row level security;

drop policy if exists capture_owner_all on capture_sessions;
create policy capture_owner_all on capture_sessions
  for all to authenticated
  using (psychologist_id = auth.uid())
  with check (psychologist_id = auth.uid());
