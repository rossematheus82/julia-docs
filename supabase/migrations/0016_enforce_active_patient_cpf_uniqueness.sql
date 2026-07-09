-- 0016 - Reforca bloqueio de CPF duplicado em pacientes ativos
--
-- Antes de criar o indice unico abaixo, limpe duplicidades existentes:
--
-- select
--   workspace_id,
--   regexp_replace(coalesce(cpf, ''), '\D', '', 'g') as normalized_cpf,
--   count(*) as total,
--   array_agg(id order by created_at desc) as patient_ids
-- from patients
-- where deleted_at is null
--   and length(regexp_replace(coalesce(cpf, ''), '\D', '', 'g')) = 11
-- group by workspace_id, regexp_replace(coalesce(cpf, ''), '\D', '', 'g')
-- having count(*) > 1;

create or replace function prevent_duplicate_patient_cpf()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  normalized_cpf text;
begin
  normalized_cpf := regexp_replace(coalesce(new.cpf, ''), '\D', '', 'g');

  if new.deleted_at is null
    and length(normalized_cpf) = 11
    and exists (
      select 1
      from patients
      where workspace_id = new.workspace_id
        and id <> new.id
        and deleted_at is null
        and regexp_replace(coalesce(cpf, ''), '\D', '', 'g') = normalized_cpf
    )
  then
    raise exception 'duplicate_patient_cpf';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_duplicate_patient_cpf_trigger on patients;
create trigger prevent_duplicate_patient_cpf_trigger
  before insert or update of cpf, workspace_id, deleted_at on patients
  for each row execute function prevent_duplicate_patient_cpf();

create unique index if not exists patients_active_cpf_unique
  on patients (
    workspace_id,
    regexp_replace(coalesce(cpf, ''), '\D', '', 'g')
  )
  where deleted_at is null
    and length(regexp_replace(coalesce(cpf, ''), '\D', '', 'g')) = 11;
