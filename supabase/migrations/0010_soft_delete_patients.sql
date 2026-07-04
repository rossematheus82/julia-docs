-- 0010 - Exclusao logica de pacientes
-- Pacientes "excluidos" somem dos fluxos normais, mas permanecem para auditoria e historico.

alter table patients
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by_user_id uuid references auth.users(id);

create index if not exists patients_active_workspace_name_idx
  on patients(workspace_id, full_name)
  where deleted_at is null;

create index if not exists patients_deleted_workspace_idx
  on patients(workspace_id, deleted_at)
  where deleted_at is not null;

drop policy if exists "workspace_patients_delete" on patients;
drop policy if exists "workspace_patients_no_physical_delete" on patients;

create policy "workspace_patients_no_physical_delete" on patients
  for delete using (false);

create or replace function prevent_unauthorized_patient_soft_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.deleted_at is null and new.deleted_at is not null then
    if not (
      old.created_by_user_id = auth.uid()
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

    if new.deleted_by_user_id is distinct from auth.uid() then
      raise exception 'patient_soft_delete_actor_invalid';
    end if;
  end if;

  if old.deleted_at is not null and new.deleted_at is null then
    if not (
      is_platform_admin()
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

drop trigger if exists prevent_unauthorized_patient_soft_delete_trigger on patients;
create trigger prevent_unauthorized_patient_soft_delete_trigger
  before update of deleted_at, deleted_by_user_id on patients
  for each row execute function prevent_unauthorized_patient_soft_delete();
