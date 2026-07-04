-- 0009 - Restricao de exclusao de pacientes e LMEs por RLS
-- Mantem leitura/edicao compartilhada por ambulatorio, mas limita DELETE.

drop policy if exists "workspace_patients" on patients;

create policy "workspace_patients_select" on patients
  for select using (workspace_id in (select user_workspace_ids()));

create policy "workspace_patients_insert" on patients
  for insert with check (
    workspace_id in (select user_workspace_ids())
    and created_by_user_id = auth.uid()
  );

create policy "workspace_patients_update" on patients
  for update using (workspace_id in (select user_workspace_ids()))
  with check (workspace_id in (select user_workspace_ids()));

create policy "workspace_patients_delete" on patients
  for delete using (
    workspace_id in (select user_workspace_ids())
    and (
      created_by_user_id = auth.uid()
      or is_platform_admin()
      or exists (
        select 1
        from workspace_members wm
        where wm.workspace_id = patients.workspace_id
          and wm.user_id = auth.uid()
          and wm.role in ('owner', 'admin')
      )
    )
  );

drop policy if exists "workspace_lmes" on lmes;

create policy "workspace_lmes_select" on lmes
  for select using (workspace_id in (select user_workspace_ids()));

create policy "workspace_lmes_insert" on lmes
  for insert with check (
    workspace_id in (select user_workspace_ids())
    and created_by_user_id = auth.uid()
  );

create policy "workspace_lmes_update" on lmes
  for update using (workspace_id in (select user_workspace_ids()))
  with check (workspace_id in (select user_workspace_ids()));

create policy "workspace_lmes_delete" on lmes
  for delete using (
    workspace_id in (select user_workspace_ids())
    and created_by_user_id = auth.uid()
  );
