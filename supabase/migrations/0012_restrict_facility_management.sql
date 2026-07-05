-- 0012 - Restringe cadastro e edicao de estabelecimentos a admins do ambulatorio

drop policy if exists "workspace_facilities" on health_facilities;
drop policy if exists "workspace_facilities_select" on health_facilities;
drop policy if exists "workspace_facilities_insert_admin" on health_facilities;
drop policy if exists "workspace_facilities_update_admin" on health_facilities;
drop policy if exists "workspace_facilities_delete_admin" on health_facilities;

create policy "workspace_facilities_select" on health_facilities
  for select using (workspace_id in (select user_workspace_ids()));

create policy "workspace_facilities_insert_admin" on health_facilities
  for insert with check (
    is_platform_admin()
    or exists (
      select 1
      from workspace_members wm
      where wm.workspace_id = health_facilities.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  );

create policy "workspace_facilities_update_admin" on health_facilities
  for update using (
    is_platform_admin()
    or exists (
      select 1
      from workspace_members wm
      where wm.workspace_id = health_facilities.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  )
  with check (
    is_platform_admin()
    or exists (
      select 1
      from workspace_members wm
      where wm.workspace_id = health_facilities.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  );

create policy "workspace_facilities_delete_admin" on health_facilities
  for delete using (
    is_platform_admin()
    or exists (
      select 1
      from workspace_members wm
      where wm.workspace_id = health_facilities.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  );
