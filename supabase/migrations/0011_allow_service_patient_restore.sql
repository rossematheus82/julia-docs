-- 0011 - Permite restauracao administrativa de pacientes arquivados via rota segura

create or replace function prevent_unauthorized_patient_soft_delete()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  is_service_role boolean := coalesce(auth.role(), '') = 'service_role';
begin
  if old.deleted_at is null and new.deleted_at is not null then
    if not (
      is_service_role
      or old.created_by_user_id = auth.uid()
      or is_platform_admin()
      or exists (
        select 1
        from workspace_members wm
        where wm.workspace_id = old.workspace_id
          and wm.user_id = auth.uid()
          and wm.role in ('owner', 'admin')
      )
    ) then
      raise exception 'patient_soft_delete_not_allowed';
    end if;

    if not is_service_role and new.deleted_by_user_id is distinct from auth.uid() then
      raise exception 'patient_soft_delete_actor_invalid';
    end if;
  end if;

  if old.deleted_at is not null and new.deleted_at is null then
    if not (
      is_service_role
      or is_platform_admin()
      or exists (
        select 1
        from workspace_members wm
        where wm.workspace_id = old.workspace_id
          and wm.user_id = auth.uid()
          and wm.role in ('owner', 'admin')
      )
    ) then
      raise exception 'patient_restore_not_allowed';
    end if;
  end if;

  return new;
end;
$$;
