-- 0008_d137_enforcement_boundary.sql — authorization enforced at the
-- database mutation boundary with database-authoritative time (D-137).
--
-- ADDITIVE ONLY, same posture as 0007: the app already refuses these writes
-- at preflight (mayActOnCase in @suite/case-model), so this trigger blocks
-- nothing the app legitimately does — it turns the app-layer convention into
-- a database guarantee that holds even if the preflight is stale, skipped,
-- or evaluated against a skewed local clock.
--
-- Scope: profile-attributed audit_events inserts (actor 'profile:<uuid>',
-- the D-131 contributor form). Legacy actor forms — '<psychologist auth-id>'
-- and 'respondent:<invitationId>' — pass through untouched; the actor
-- vocabulary stays additive (VS-0 map §4 item 4).
--
-- Semantics mirror the canonical definition EXACTLY (mayActOnCase: an
-- assignment on this case, started, not ended — any role), plus profile
-- liveness (deleted_at is null). Deliberately no role narrowing here:
-- reviewer activity is attributable activity; role-based CONTENT gating is
-- mayContributeContent's job at the app layer and would make the database
-- rule diverge from the canonical one (D-137 requires mirror, not stricter).
--
-- Concurrency (the D-137 serialization requirement): the authorization
-- query takes FOR UPDATE OF the assignment rows. A concurrent revocation
-- (UPDATE ... SET ended_at) and an attributed write therefore serialize on
-- the row lock: whichever wins, the loser waits and then sees the winner's
-- committed state (READ COMMITTED re-evaluates the predicate on the locked
-- row's latest version). There is no interval in which a contributor is
-- simultaneously revoked and authorized.

create or replace function db_now() returns timestamptz
language sql stable as $$ select now() $$;

grant execute on function db_now() to service_role, authenticated;

create or replace function audit_events_profile_actor_check() returns trigger
language plpgsql as $$
declare
  v_profile_id uuid;
begin
  if new.actor is null or new.actor not like 'profile:%' then
    return new; -- legacy actor forms: out of scope, unchanged
  end if;

  begin
    v_profile_id := substring(new.actor from 9)::uuid; -- len('profile:') = 8
  exception when invalid_text_representation then
    raise exception 'malformed profile actor %', new.actor
      using errcode = '42501';
  end;

  -- FOR UPDATE OF a: serialize against concurrent assignment revocation.
  perform 1
    from case_assignments a
    join professional_profiles p on p.id = a.profile_id
    where a.case_id = new.case_id
      and a.profile_id = v_profile_id
      and p.deleted_at is null
      and a.started_at <= now()
      and (a.ended_at is null or a.ended_at > now())
    for update of a;

  if not found then
    raise exception 'no_active_assignment for % on case %', new.actor, new.case_id
      using errcode = '42501';
  end if;

  return new;
end $$;

drop trigger if exists trg_audit_events_profile_actor on audit_events;
create trigger trg_audit_events_profile_actor
  before insert on audit_events
  for each row execute function audit_events_profile_actor_check();
