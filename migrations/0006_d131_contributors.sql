-- 0006_d131_contributors.sql — canonical organization/profile/role/assignment
-- model (decisions.md D-131, landed with the D-046 consolidation).
--
-- ADDITIVE ONLY. RIE behavior does not change: the existing psychologists
-- table and its D-003 single-psych tenancy stay exactly as they are, and no
-- existing table gains a column. These tables let a case carry multiple
-- professional contributors across disciplines WITHOUT changing case identity
-- or Source/Evidence semantics; authorization for multidisciplinary access is
-- answered by case_assignments and nowhere else. Psychology is the first
-- discipline through the pipe; nothing here is consumed by the current app.
--
-- Attribution note: profiles bridge to the authenticated identity via
-- auth_user_id (RIE's psychologists.id IS auth.uid()). Actor attribution in
-- audit/activity remains by stable id and survives an assignment ending —
-- ending an assignment removes authorization, never history.

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table professional_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),  -- null = solo practice
  auth_user_id uuid,                                  -- bridge to auth.uid()
  discipline text not null check (discipline in
    ('school_psychology','speech_language','occupational_therapy',
     'physical_therapy','special_education','social_work','school_counseling',
     'nursing','other')),
  display_name text not null,
  credentials text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_profiles_auth on professional_profiles(auth_user_id)
  where deleted_at is null;

create table case_assignments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id),
  profile_id uuid not null references professional_profiles(id),
  role text not null check (role in ('lead_evaluator','contributor','reviewer')),
  started_at timestamptz not null default now(),
  ended_at timestamptz check (ended_at is null or ended_at >= started_at),
  created_at timestamptz not null default now()
);
create index idx_assignments_case on case_assignments(case_id);
create index idx_assignments_profile on case_assignments(profile_id);

-- RLS: deny-by-default, same posture as 0002. The current single-psych app
-- reaches its data through the existing psychologist-owned policies; these
-- tables are visible only to the profile's own auth identity (profiles) or
-- via case ownership (assignments). Multi-party org policies arrive with the
-- district tier, as their own migration, after their own decision.

alter table organizations enable row level security;

alter table professional_profiles enable row level security;
drop policy if exists profiles_self_select on professional_profiles;
create policy profiles_self_select on professional_profiles
  for select to authenticated
  using (auth_user_id = auth.uid());

alter table case_assignments enable row level security;
drop policy if exists assignments_by_case on case_assignments;
create policy assignments_by_case on case_assignments
  for all to authenticated
  using (case_id in (select id from cases where psychologist_id = auth.uid()))
  with check (case_id in (select id from cases where psychologist_id = auth.uid()));
