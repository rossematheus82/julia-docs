-- ============================================================
-- 0003 — Permite status 'emitida' na tabela lmes
-- A app já usava 'emitida' (após gerar PDF), mas a check constraint
-- original não o incluía → INSERT/UPDATE falhava silenciosamente.
-- ============================================================

alter table lmes drop constraint if exists lmes_status_check;

alter table lmes add constraint lmes_status_check
  check (status in ('rascunho','enviada','em_analise','deferida','devolvida','indeferida','emitida'));
