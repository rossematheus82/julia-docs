-- 0014 - Guarda snapshot do texto aceito em Termos e Privacidade

alter table legal_acceptances
  add column if not exists terms_snapshot jsonb,
  add column if not exists privacy_snapshot jsonb;
