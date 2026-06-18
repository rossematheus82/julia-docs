-- ============================================================
-- 0004 - Hardening de seguranca para workspaces e convites
-- ============================================================

create policy "workspace_creator_insert" on workspaces
  for insert with check (created_by = auth.uid());

drop policy if exists "join_workspace" on workspace_members;

create policy "workspace_owner_membership_insert" on workspace_members
  for insert with check (
    user_id = auth.uid()
    and role = 'owner'
    and exists (
      select 1
      from workspaces
      where workspaces.id = workspace_members.workspace_id
        and workspaces.created_by = auth.uid()
    )
  );

create or replace function join_workspace_by_invite(invite text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_workspace_id uuid;
begin
  select id
    into target_workspace_id
  from workspaces
  where invite_code = upper(trim(invite))
  limit 1;

  if target_workspace_id is null then
    raise exception 'invalid_invite_code';
  end if;

  insert into workspace_members (workspace_id, user_id, role)
  values (target_workspace_id, auth.uid(), 'member')
  on conflict (workspace_id, user_id) do nothing;

  return target_workspace_id;
end;
$$;

revoke all on function join_workspace_by_invite(text) from public;
grant execute on function join_workspace_by_invite(text) to authenticated;

create or replace function create_workspace_with_owner(workspace_name text, invite text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace_id uuid;
begin
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

revoke all on function create_workspace_with_owner(text, text) from public;
grant execute on function create_workspace_with_owner(text, text) to authenticated;
