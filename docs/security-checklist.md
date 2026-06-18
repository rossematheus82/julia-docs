# Security Checklist

Estado controlado pelo repositório:

- RLS habilitada nas tabelas sensíveis.
- Policies isolam dados por `workspace_id`.
- Convites de workspace usam RPCs seguras.
- Service role key só deve existir em código server-side.
- `.env*.local` está fora do Git.
- Payloads de APIs sensíveis têm limite de tamanho.
- Logs server-side usam redaction para CPF, CNS e CID.
- Audit log automático registra mudanças em pacientes, LMEs, médicos, estabelecimentos, workspaces e membros.
- Bucket `lme-pdfs` é privado.
- Política de retenção inicial registrada em `data_retention_policies`.

Configurações externas para marcar manualmente:

- GitHub Secret Scanning ativado.
- GitHub Push Protection ativado.
- MFA obrigatório nas contas GitHub, Supabase e Vercel.
- Secrets reais apenas na Vercel/Supabase, nunca no GitHub.
- Supabase Backup/PITR configurado no painel do projeto.
- Job agendado para `select prune_audit_logs(3650);` conforme política aprovada.

Política inicial de retenção:

- `audit_logs`: 10 anos, sem conteúdo clínico.
- `patients` e `lmes`: manter enquanto houver relação assistencial ou obrigação legal aplicável.
- PDFs exportados: preferir geração sob demanda; quando armazenados, bucket privado e retenção de 180 dias.

Regra de log:

Não registrar nome, CPF, CNS, CID, justificativa, prontuário, endereço, telefone, e-mail ou texto clínico. Logs devem conter apenas IDs técnicos, tipo de ação e metadados operacionais mínimos.
