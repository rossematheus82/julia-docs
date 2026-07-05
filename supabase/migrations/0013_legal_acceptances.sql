-- 0013 - Registra aceite versionado de termos e politica de privacidade

create table if not exists legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_version text not null,
  privacy_version text not null,
  accepted_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  source text not null default 'signup',
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists legal_acceptances_user_accepted_idx
  on legal_acceptances(user_id, accepted_at desc);

alter table legal_acceptances enable row level security;

drop policy if exists "legal_acceptances_self_select" on legal_acceptances;
drop policy if exists "legal_acceptances_admin_select" on legal_acceptances;
drop policy if exists "legal_acceptances_self_insert" on legal_acceptances;

create policy "legal_acceptances_self_select" on legal_acceptances
  for select using (user_id = auth.uid() or is_platform_admin());

create policy "legal_acceptances_self_insert" on legal_acceptances
  for insert with check (user_id = auth.uid() or is_platform_admin());
