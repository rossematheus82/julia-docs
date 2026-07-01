-- 0008 - Usuarios globais da plataforma para dashboard administrativo basico

create table if not exists platform_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'basic' check (role in ('basic', 'platform_admin')),
  status text not null default 'active' check (status in ('active', 'banned')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);

alter table platform_users enable row level security;

create or replace function is_platform_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'drmatheusrosse@gmail.com',
      'rossematheus@gmail.com'
    )
    or exists (
      select 1
      from platform_users
      where user_id = auth.uid()
        and role = 'platform_admin'
        and status = 'active'
    )
$$;

create policy "platform_users_self_select" on platform_users
  for select using (user_id = auth.uid() or is_platform_admin());

create policy "platform_users_admin_update" on platform_users
  for update using (is_platform_admin())
  with check (is_platform_admin());

create policy "platform_users_admin_insert" on platform_users
  for insert with check (is_platform_admin());

insert into platform_users (user_id, email, role, status)
select id, email, 'platform_admin', 'active'
from auth.users
where lower(email) in ('drmatheusrosse@gmail.com', 'rossematheus@gmail.com')
on conflict (user_id) do update
set role = 'platform_admin',
    status = 'active',
    email = excluded.email,
    updated_at = now();
