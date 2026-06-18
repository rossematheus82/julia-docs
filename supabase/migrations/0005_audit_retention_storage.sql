-- ============================================================
-- 0005 - Audit log automatico, bucket privado e retencao
-- ============================================================

create table if not exists data_retention_policies (
  id text primary key,
  description text not null,
  retention_days integer,
  legal_basis text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table data_retention_policies enable row level security;

create policy "members_see_retention_policies" on data_retention_policies
  for select using (auth.role() = 'authenticated');

insert into data_retention_policies (id, description, retention_days, legal_basis)
values
  ('audit_logs', 'Logs de auditoria sem dados clinicos ou identificadores diretos.', 3650, 'Seguranca, rastreabilidade e cumprimento regulatorio.'),
  ('patients_lmes', 'Cadastros de pacientes, LMEs e snapshots associados.', null, 'Prontuario/documentacao assistencial: reter enquanto houver relacao assistencial ou obrigacao legal aplicavel.'),
  ('pdf_exports', 'PDFs gerados devem ser temporarios quando possivel; se armazenados, usar bucket privado e URL assinada.', 180, 'Minimizacao de dados e necessidade operacional.')
on conflict (id) do update
set description = excluded.description,
    retention_days = excluded.retention_days,
    legal_basis = excluded.legal_basis,
    updated_at = now();

create or replace function audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_workspace_id uuid;
  target_resource_id uuid;
begin
  if tg_table_name = 'workspaces' then
    if tg_op = 'DELETE' then
      target_workspace_id := old.id;
      target_resource_id := old.id;
    else
      target_workspace_id := new.id;
      target_resource_id := new.id;
    end if;
  elsif tg_table_name = 'workspace_members' then
    if tg_op = 'DELETE' then
      target_workspace_id := old.workspace_id;
      target_resource_id := old.id;
    else
      target_workspace_id := new.workspace_id;
      target_resource_id := new.id;
    end if;
  else
    if tg_op = 'DELETE' then
      target_workspace_id := old.workspace_id;
      target_resource_id := old.id;
    else
      target_workspace_id := new.workspace_id;
      target_resource_id := new.id;
    end if;
  end if;

  insert into audit_logs (
    workspace_id,
    user_id,
    action,
    resource_type,
    resource_id,
    metadata
  )
  values (
    target_workspace_id,
    auth.uid(),
    lower(tg_table_name || '_' || tg_op),
    tg_table_name,
    target_resource_id,
    jsonb_build_object('source', 'db_trigger')
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists audit_patients_changes on patients;
create trigger audit_patients_changes
  after insert or update or delete on patients
  for each row execute function audit_row_change();

drop trigger if exists audit_lmes_changes on lmes;
create trigger audit_lmes_changes
  after insert or update or delete on lmes
  for each row execute function audit_row_change();

drop trigger if exists audit_doctors_changes on doctors;
create trigger audit_doctors_changes
  after insert or update or delete on doctors
  for each row execute function audit_row_change();

drop trigger if exists audit_facilities_changes on health_facilities;
create trigger audit_facilities_changes
  after insert or update or delete on health_facilities
  for each row execute function audit_row_change();

drop trigger if exists audit_workspace_members_changes on workspace_members;
create trigger audit_workspace_members_changes
  after insert or update or delete on workspace_members
  for each row execute function audit_row_change();

drop trigger if exists audit_workspaces_changes on workspaces;
create trigger audit_workspaces_changes
  after insert or update or delete on workspaces
  for each row execute function audit_row_change();

create or replace function prune_audit_logs(retention_days integer default 3650)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from audit_logs
  where created_at < now() - make_interval(days => retention_days);

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function prune_audit_logs(integer) from public;

insert into storage.buckets (id, name, public)
values ('lme-pdfs', 'lme-pdfs', false)
on conflict (id) do update set public = false;
