-- 0001_init.sql — Referral Intelligence Engine, Phase 1 schema.
-- Derived from @suite/case-model entities (D-006). Design constraints:
--   D-003: single-psych tenancy; organization_id nullable, unused in MVP
--   D-004: retention/deletion fields on every data-bearing table
--   D-007: sources hold raw payload refs; evidence/claims tables exist from
--          day one even though Phase 1 doesn't populate them (pipeline shape)
--   D-013: sources bind to exact bank id + version
-- All student references are pseudonymous (student_ref, display_initials).

create table psychologists (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text not null,
  organization_id uuid,                       -- D-003: district-ready, unused
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table cases (
  id uuid primary key default gen_random_uuid(),
  psychologist_id uuid not null references psychologists(id),
  organization_id uuid,                       -- D-003
  state text not null check (state in ('SC','NC')),
  eval_type text not null check (eval_type in ('initial','reevaluation')),
  referral_date date not null,
  status text not null default 'referral'
    check (status in ('referral','data_collection','assessment','report','qa','meeting','complete')),
  student_ref text not null,                  -- pseudonymous
  display_initials text not null check (char_length(display_initials) <= 5),
  grade text not null,
  age_years_months text,
  priority_flag boolean not null default false,
  auto_purge_days integer,                    -- D-004
  created_at timestamptz not null default now(),
  deleted_at timestamptz                      -- D-004
);
create index idx_cases_psych on cases(psychologist_id) where deleted_at is null;

create table informants (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id),
  role text not null check (role in
    ('teacher','sped_teacher','interventionist','parent_guardian','student',
     'related_service','administrator','psychologist','other')),
  relationship text,
  months_known_student integer,
  preferred_language text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table invitations (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id),
  informant_id uuid references informants(id),
  respondent_role text not null,
  bank_id text not null,                      -- which questionnaire this serves
  bank_version text not null,                 -- pinned at creation (D-013)
  token_hash text not null unique,            -- raw token never stored
  expires_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending','opened','completed','revoked')),
  max_uses integer not null default 1,
  uses integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_invitations_case on invitations(case_id) where deleted_at is null;

-- Autosaved draft answers, one row per (invitation, response key).
-- Response keys follow the engine contract: 'TCH-RDG-001' or 'TCH-BEH-G01::avoidance'.
create table draft_responses (
  invitation_id uuid not null references invitations(id),
  response_key text not null,
  answer jsonb not null,                      -- string or string[]
  updated_at timestamptz not null default now(),
  primary key (invitation_id, response_key)
);

create table sources (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id),
  informant_id uuid references informants(id),
  kind text not null check (kind in
    ('referral_form','rating_scale','interview','observation','score_set',
     'prior_report','records','work_sample','other')),
  collected_on date not null,
  instrument text,
  bank_id text,
  bank_version text,
  payload jsonb,                              -- raw locked submission (D-007 Layer 1)
  locked boolean not null default false,
  checksum text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_sources_case on sources(case_id) where deleted_at is null;

-- Phase 2 consumers; created now so the pipeline shape exists from day one.
create table evidence (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id),
  source_id uuid not null references sources(id),
  response_ids jsonb not null default '[]',
  construct_tags jsonb not null default '[]', -- [{id, status}]
  topography text check (topography in
    ('noncompliance','avoidance','aggression','withdrawal','disruption')),
  hypothesized_function text check (hypothesized_function in
    ('escape','attention','tangible','sensory')),
  polarity text not null check (polarity in ('concern','strength','neutral')),
  severity text check (severity in ('mild','moderate','marked')),
  statement text not null,
  verbatim text,
  score jsonb,
  extraction_method text not null check (extraction_method in ('llm','rule','manual','score_import')),
  generation jsonb,                           -- D-008 provenance
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint evidence_needs_tag_or_topography
    check (jsonb_array_length(construct_tags) > 0 or topography is not null),
  constraint llm_needs_provenance
    check (extraction_method <> 'llm' or generation is not null)
);
create index idx_evidence_case on evidence(case_id) where deleted_at is null;

create table claims (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id),
  output_section text not null,
  claim_text text not null,
  claim_type text not null check (claim_type in
    ('reported_fact','respondent_opinion','cross_source_synthesis',
     'system_inference','missing_information','recommended_follow_up')),
  evidence_ids jsonb not null default '[]',
  status text not null default 'draft'
    check (status in ('draft','edited','approved','excluded')),
  generation jsonb,
  approved_by uuid references psychologists(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint evidentiary_claims_need_evidence check (
    claim_type not in ('reported_fact','respondent_opinion','cross_source_synthesis')
    or jsonb_array_length(evidence_ids) > 0
  ),
  constraint approved_needs_approver check (
    status <> 'approved' or (approved_by is not null and approved_at is not null)
  )
);

create table audit_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id),
  actor text not null,                        -- psychologist id or 'respondent:<invitation_id>'
  event_type text not null,
  metadata jsonb not null default '{}',       -- never copies narrative content
  created_at timestamptz not null default now()
);
create index idx_audit_case on audit_events(case_id);

-- Row Level Security: enabled now, policies written for Supabase auth.
-- (auth.uid() is Supabase-specific; policies are created in 0002 on the real
-- instance. Enabling RLS here means tables default to deny until policies exist.)
alter table cases enable row level security;
alter table informants enable row level security;
alter table invitations enable row level security;
alter table draft_responses enable row level security;
alter table sources enable row level security;
alter table evidence enable row level security;
alter table claims enable row level security;
alter table audit_events enable row level security;
