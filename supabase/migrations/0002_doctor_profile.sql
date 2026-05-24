-- ============================================================
-- 0002 — Perfil do médico vinculado à conta (item 1)
-- Cada usuário tem UM e somente UM perfil de médico (o seu próprio).
-- ============================================================

-- 1. Novas colunas em doctors
alter table doctors add column if not exists owner_user_id uuid references auth.users(id) on delete set null;
alter table doctors add column if not exists cpf text;

comment on column doctors.owner_user_id is 'Conta dona deste perfil de médico. Cada usuário tem 1 perfil próprio (unique).';

-- 2. Backfill: migração suave para usuários já cadastrados
--    Para cada usuário que já criou pelo menos um médico, vincular o MAIS ANTIGO como seu perfil.
--    Demais médicos antigos ficam como "históricos" sem owner (não impedem novas LMEs do usuário).
with first_doctor_per_user as (
  select distinct on (created_by_user_id) id, created_by_user_id
  from doctors
  where owner_user_id is null
  order by created_by_user_id, created_at asc
)
update doctors d
set owner_user_id = fd.created_by_user_id
from first_doctor_per_user fd
where d.id = fd.id;

-- 3. Garante 1 médico por usuário POR workspace (suporta multi-ambulatório).
--    Ao entrar/criar um workspace adicional, o médico preenche seu perfil naquele workspace
--    (geralmente com dados pré-preenchidos do primeiro perfil).
create unique index if not exists doctors_owner_per_workspace_unique
  on doctors(owner_user_id, workspace_id) where owner_user_id is not null;

-- 4. Helper RLS: permite que o próprio dono atualize/leia o registro mesmo se mudar de workspace
--    (a policy original workspace_doctors já cobre leitura via workspace; este é um reforço explícito).
create policy "own_doctor_select" on doctors
  for select using (owner_user_id = auth.uid());

create policy "own_doctor_update" on doctors
  for update using (owner_user_id = auth.uid());
