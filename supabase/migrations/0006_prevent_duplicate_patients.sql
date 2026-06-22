-- ============================================================
-- 0006 - Bloqueia novo cadastro duplicado de paciente por CPF
-- ============================================================

create or replace function prevent_duplicate_patient_cpf()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  normalized_cpf text;
begin
  normalized_cpf := regexp_replace(coalesce(new.cpf, ''), '\D', '', 'g');

  if length(normalized_cpf) = 11 and exists (
    select 1
    from patients
    where workspace_id = new.workspace_id
      and id <> new.id
      and regexp_replace(coalesce(cpf, ''), '\D', '', 'g') = normalized_cpf
  ) then
    raise exception 'duplicate_patient_cpf';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_duplicate_patient_cpf_trigger on patients;
create trigger prevent_duplicate_patient_cpf_trigger
  before insert or update of cpf, workspace_id on patients
  for each row execute function prevent_duplicate_patient_cpf();
