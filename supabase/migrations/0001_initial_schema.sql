-- ============================================================
-- Julia Docs — Schema inicial com modelo de Workspace compartilhado
-- ============================================================

-- Workspaces (ambulatórios)
create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz default now()
);

-- Membros do workspace
create table if not exists workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  joined_at timestamptz default now(),
  unique(workspace_id, user_id)
);

-- Médicos: vinculados ao workspace (podem ser de vários membros)
create table if not exists doctors (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  created_by_user_id uuid not null references auth.users(id),
  full_name text not null,
  crm text not null,
  crm_uf text not null default 'MG',
  cns text,
  specialty text,
  phone text,
  email text,
  signature_image_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Estabelecimentos: compartilhados pelo workspace
create table if not exists health_facilities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  cnes text,
  address text,
  phone text,
  city text,
  state text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Pacientes: compartilhados pelo workspace
create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  created_by_user_id uuid not null references auth.users(id),
  full_name text not null,
  social_name text,
  mother_name text,
  cpf text,
  cns text,
  birth_date date,
  sex text check (sex in ('M', 'F', 'O')),
  race_ethnicity text check (race_ethnicity in ('Branca','Preta','Parda','Amarela','Indígena')),
  ethnicity_detail text,
  weight_kg numeric,
  height_cm numeric,
  phone text,
  email text,
  address text,
  is_incapable boolean default false,
  responsible_name text,
  internal_notes text,
  last_seen_by_user_id uuid references auth.users(id),
  last_seen_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- LMEs: pertencem ao workspace, assinadas por médico específico
create table if not exists lmes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  doctor_id uuid not null references doctors(id),
  facility_id uuid not null references health_facilities(id),
  created_by_user_id uuid not null references auth.users(id),
  last_edited_by_user_id uuid references auth.users(id),
  disease text not null check (disease in ('asma','dpoc','dpi-fp','hap')),
  request_type text not null check (request_type in ('inicial','renovacao','reavaliacao')),
  cid10 text not null,
  status text default 'rascunho' check (status in ('rascunho','enviada','em_analise','deferida','devolvida','indeferida')),
  lme_data jsonb not null default '{}',
  specific_form_data jsonb,
  prescription_data jsonb not null default '{}',
  patient_snapshot jsonb not null default '{}',
  doctor_snapshot jsonb not null default '{}',
  facility_snapshot jsonb not null default '{}',
  lme_pdf_url text,
  specific_form_pdf_url text,
  prescription_pdf_url text,
  parent_lme_id uuid references lmes(id),
  next_renewal_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Log de auditoria (LGPD + transparência do time)
create table if not exists audit_logs (
  id bigserial primary key,
  workspace_id uuid references workspaces(id),
  user_id uuid references auth.users(id),
  action text not null,
  resource_type text,
  resource_id uuid,
  metadata jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz default now()
);

-- Triggers para updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger patients_updated_at before update on patients
  for each row execute function update_updated_at();

create trigger lmes_updated_at before update on lmes
  for each row execute function update_updated_at();

-- Índices
create index if not exists patients_workspace_idx on patients(workspace_id);
create index if not exists patients_cpf_idx on patients(workspace_id, cpf) where cpf is not null;
create index if not exists lmes_workspace_idx on lmes(workspace_id);
create index if not exists lmes_patient_idx on lmes(patient_id);
create index if not exists lmes_renewal_idx on lmes(workspace_id, next_renewal_date) where status = 'deferida';
create index if not exists audit_workspace_idx on audit_logs(workspace_id, created_at desc);

-- ============================================================
-- RLS
-- ============================================================

alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table doctors enable row level security;
alter table health_facilities enable row level security;
alter table patients enable row level security;
alter table lmes enable row level security;
alter table audit_logs enable row level security;

-- Helper: retorna workspace_ids do usuário autenticado
create or replace function user_workspace_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select workspace_id from workspace_members where user_id = auth.uid()
$$;

-- Workspaces
create policy "members_see_workspace" on workspaces
  for select using (id in (select user_workspace_ids()));

create policy "owner_update_workspace" on workspaces
  for update using (
    id in (
      select workspace_id from workspace_members
      where user_id = auth.uid() and role in ('owner','admin')
    )
  );

-- Membros
create policy "see_workspace_members" on workspace_members
  for select using (workspace_id in (select user_workspace_ids()));

create policy "join_workspace" on workspace_members
  for insert with check (user_id = auth.uid());

create policy "remove_workspace_members" on workspace_members
  for delete using (
    workspace_id in (
      select workspace_id from workspace_members
      where user_id = auth.uid() and role in ('owner','admin')
    )
  );

-- Doctors, facilities, patients, lmes: acesso via workspace
create policy "workspace_doctors" on doctors
  for all using (workspace_id in (select user_workspace_ids()));

create policy "workspace_facilities" on health_facilities
  for all using (workspace_id in (select user_workspace_ids()));

create policy "workspace_patients" on patients
  for all using (workspace_id in (select user_workspace_ids()));

create policy "workspace_lmes" on lmes
  for all using (workspace_id in (select user_workspace_ids()));

create policy "workspace_audit_select" on audit_logs
  for select using (workspace_id in (select user_workspace_ids()));

create policy "workspace_audit_insert" on audit_logs
  for insert with check (workspace_id in (select user_workspace_ids()));

-- Função para gerar código de convite aleatório
create or replace function generate_invite_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    if i = 4 then result := result || '-'; end if;
  end loop;
  return result;
end;
$$;
