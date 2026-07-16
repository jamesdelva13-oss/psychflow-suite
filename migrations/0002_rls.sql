-- 0002_rls.sql — Referral Intelligence Engine, Phase 1 RLS policies.
-- Runs after 0001_init.sql on the Supabase instance (auth schema present).
--
-- Model (D-003 single-psych tenancy):
--   * The psychologist authenticates via Supabase Auth. Their auth.uid()
--     IS their psychologists.id (provisioned at first login by the server
--     using the service role — see apps/intake ensurePsychologist).
--   * Every data table is scoped to that psychologist, directly (psychologists,
--     cases) or via the case join (everything else).
--   * Respondents have NO Supabase identity. They never touch tables directly:
--     invitation + draft + submission access happens ONLY through server routes
--     using the service_role key, which bypasses RLS. So there are deliberately
--     NO `anon` policies here — anon/respondent = default deny at the DB.
--   * service_role bypasses RLS entirely (Supabase built-in); no policy needed.
--
-- Re-runnable: each policy is dropped-if-exists before creation.

-- psychologists: RLS was not enabled in 0001; enable and self-scope it here so
-- the anon/authenticated keys cannot read other practitioners' rows. Inserts
-- are done server-side with the service role at first login.
alter table psychologists enable row level security;

drop policy if exists psychologists_self_select on psychologists;
create policy psychologists_self_select on psychologists
  for select to authenticated
  using (id = auth.uid());

drop policy if exists psychologists_self_update on psychologists;
create policy psychologists_self_update on psychologists
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- cases: owned directly by the authenticated psychologist.
drop policy if exists cases_owner_all on cases;
create policy cases_owner_all on cases
  for all to authenticated
  using (psychologist_id = auth.uid())
  with check (psychologist_id = auth.uid());

-- Helper predicate reused below: a case_id that belongs to the caller.
--   case_id in (select id from cases where psychologist_id = auth.uid())

drop policy if exists informants_by_case on informants;
create policy informants_by_case on informants
  for all to authenticated
  using (case_id in (select id from cases where psychologist_id = auth.uid()))
  with check (case_id in (select id from cases where psychologist_id = auth.uid()));

drop policy if exists invitations_by_case on invitations;
create policy invitations_by_case on invitations
  for all to authenticated
  using (case_id in (select id from cases where psychologist_id = auth.uid()))
  with check (case_id in (select id from cases where psychologist_id = auth.uid()));

-- draft_responses: no case_id column — reach the owner through the invitation.
drop policy if exists draft_responses_by_case on draft_responses;
create policy draft_responses_by_case on draft_responses
  for all to authenticated
  using (invitation_id in (
    select i.id from invitations i
    join cases c on c.id = i.case_id
    where c.psychologist_id = auth.uid()))
  with check (invitation_id in (
    select i.id from invitations i
    join cases c on c.id = i.case_id
    where c.psychologist_id = auth.uid()));

drop policy if exists sources_by_case on sources;
create policy sources_by_case on sources
  for all to authenticated
  using (case_id in (select id from cases where psychologist_id = auth.uid()))
  with check (case_id in (select id from cases where psychologist_id = auth.uid()));

drop policy if exists evidence_by_case on evidence;
create policy evidence_by_case on evidence
  for all to authenticated
  using (case_id in (select id from cases where psychologist_id = auth.uid()))
  with check (case_id in (select id from cases where psychologist_id = auth.uid()));

drop policy if exists claims_by_case on claims;
create policy claims_by_case on claims
  for all to authenticated
  using (case_id in (select id from cases where psychologist_id = auth.uid()))
  with check (case_id in (select id from cases where psychologist_id = auth.uid()));

-- audit_events: readable by the owning psychologist; writes happen server-side
-- (service role) so no with-check path is needed for the authenticated role,
-- but scope reads to the caller's cases. Rows with null case_id (system events)
-- are intentionally invisible to practitioners.
drop policy if exists audit_events_by_case on audit_events;
create policy audit_events_by_case on audit_events
  for select to authenticated
  using (case_id in (select id from cases where psychologist_id = auth.uid()));
