-- 0007 - Restringe criacao de ambulatorios a administradores globais da plataforma

create or replace function is_platform_admin()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) in (
    'drmatheusrosse@gmail.com',
    'rossematheus@gmail.com'
  )
$$;

drop policy if exists "workspace_creator_insert" on workspaces;

create policy "platform_admin_workspace_insert" on workspaces
  for insert with check (
    created_by = auth.uid()
    and is_platform_admin()
  );

create or replace function create_workspace_with_owner(workspace_name text, invite text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace_id uuid;
begin
  if not is_platform_admin() then
    raise exception 'platform_admin_required';
  end if;

  if nullif(trim(workspace_name), '') is null then
    raise exception 'workspace_name_required';
  end if;

  insert into workspaces (name, invite_code, created_by)
  values (trim(workspace_name), upper(trim(invite)), auth.uid())
  returning id into new_workspace_id;

  insert into workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, auth.uid(), 'owner');

  return new_workspace_id;
end;
$$;

revoke all on function is_platform_admin() from public;
grant execute on function is_platform_admin() to authenticated;

revoke all on function create_workspace_with_owner(text, text) from public;
grant execute on function create_workspace_with_owner(text, text) to authenticated;
