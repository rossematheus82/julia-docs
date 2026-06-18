# Security Checkpoint - 2026-06-18

## Implementado no repositorio

- Hardening global no middleware: headers de seguranca, bloqueio de origem para metodos mutaveis em `/api` e cookie `active_workspace_id` com `httpOnly`.
- Helpers de API para limite de payload, JSON invalido e mensagens de erro curtas.
- RLS em tabelas sensiveis e hardening dos fluxos de workspace por RPC:
  - `create_workspace_with_owner`
  - `join_workspace_by_invite`
- Auditoria server-side em rotas sensiveis:
  - extracao/melhoria com IA
  - extracao de paciente
  - geracao de PDF
  - envio de feedback
  - exclusao de paciente
  - exclusao de LME
  - troca/saida de workspace
  - remocao de membro
- Auditoria automatica no banco via triggers para:
  - `patients`
  - `lmes`
  - `doctors`
  - `health_facilities`
  - `workspace_members`
  - `workspaces`
- Logger central com redaction de CPF, CNS, CID e chaves/campos sensiveis.
- Remocao de logs crus server-side; `console.error` fica centralizado em `src/lib/security/logger.ts`.
- Nome de paciente removido do filename dos PDFs gerados.
- Bucket privado `lme-pdfs` definido por migracao.
- Politica inicial de retencao registrada em `data_retention_policies`.
- Funcao `prune_audit_logs(3650)` criada para limpeza de logs antigos.
- Smoke test RLS criado em `scripts/rls-smoke-test.mjs` e exposto como `pnpm test:rls`.

## Validacoes locais

- `pnpm exec tsc --noEmit`: passou.
- `pnpm lint`: passou com avisos antigos de `<img>`.
- `pnpm build`: passou.

## Pendencias operacionais

- Aplicar migracoes Supabase `0004_security_hardening.sql` e `0005_audit_retention_storage.sql`.
- Rodar `pnpm test:rls` contra o projeto Supabase real usando variaveis de ambiente corretas.
- Confirmar no painel da Vercel que secrets reais estao configurados e que `SUPABASE_SERVICE_ROLE_KEY` nao esta exposta como `NEXT_PUBLIC_*`.
- Confirmar GitHub Secret Scanning e Push Protection.
- Confirmar MFA nas contas GitHub, Supabase e Vercel.
- Confirmar Backup/PITR no Supabase.
- Agendar a chamada periodica de `select prune_audit_logs(3650);`.

## Nota de deploy

Deploy de codigo na Vercel nao aplica migracoes Supabase automaticamente. A versao publicada so deve ser considerada totalmente operacional depois que as migracoes `0004` e `0005` estiverem aplicadas no banco de producao.
