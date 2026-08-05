-- 0005_capture_rls_tighten.sql — close the cross-case write hole the RLS
-- integration tests caught: 0004's policy checked only ownership of the
-- capture session row, not ownership of the case it attaches to. A caller
-- could therefore attach their own capture session to another account's
-- case id. Tighten to require BOTH.

drop policy if exists capture_owner_all on capture_sessions;
create policy capture_owner_all on capture_sessions
  for all to authenticated
  using (
    psychologist_id = auth.uid()
    and case_id in (select id from cases where psychologist_id = auth.uid())
  )
  with check (
    psychologist_id = auth.uid()
    and case_id in (select id from cases where psychologist_id = auth.uid())
  );

notify pgrst, 'reload schema';
