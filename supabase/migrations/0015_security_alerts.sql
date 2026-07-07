-- 0015 - Alertas de seguranca para eventos sensiveis e comportamentos suspeitos

create table if not exists security_alerts (
  id bigserial primary key,
  severity text not null check (severity in ('low', 'medium', 'high')),
  type text not null,
  title text not null,
  description text not null,
  workspace_id uuid references workspaces(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  resource_type text,
  resource_id text,
  ip_address text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists security_alerts_created_idx
  on security_alerts(created_at desc);

create index if not exists security_alerts_user_created_idx
  on security_alerts(user_id, created_at desc);

create index if not exists security_alerts_workspace_created_idx
  on security_alerts(workspace_id, created_at desc);

alter table security_alerts enable row level security;

drop policy if exists "security_alerts_platform_admin_select" on security_alerts;
drop policy if exists "security_alerts_platform_admin_insert" on security_alerts;

create policy "security_alerts_platform_admin_select" on security_alerts
  for select using (is_platform_admin());

create policy "security_alerts_platform_admin_insert" on security_alerts
  for insert with check (is_platform_admin());
