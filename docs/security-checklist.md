# Security Checklist

Estado controlado pelo repositório:

- RLS habilitada nas tabelas sensíveis.
- Policies isolam dados por `workspace_id`.
- Convites de workspace usam RPC/API segura.
- Service role key só deve existir em código server-side.
- `.env*.local` está fora do Git.
- Payloads de APIs sensíveis têm limite de tamanho.
- Logs server-side usam redaction para CPF, CNS e CID.
- Audit log automático registra mudanças em pacientes, LMEs, médicos, estabelecimentos, workspaces e membros.
- Auditoria explícita registra geração de PDF, exportação de paciente, entrada por convite, troca de ambulatório, remoção de membro, alteração de papel, restauração de paciente e mudança de status da LME.
- Sessão autenticada tem timeout por inatividade.
- Cadastro novo exige ciência sobre privacidade e uso de dados.
- Aceite de Termos e Política de Privacidade é versionado, registra data/hora, IP, navegador, origem e contexto de ambulatório quando aplicável.
- Cada novo aceite salva snapshot JSON do texto aceito em `legal_acceptances.terms_snapshot` e `legal_acceptances.privacy_snapshot`.
- CPF e CNS aparecem mascarados em listas e seleções, com dados completos apenas onde necessário.
- Exclusão de paciente usa arquivamento lógico (`deleted_at`) e preserva histórico/auditoria.
- Painel administrativo permite filtrar auditoria, exportar auditoria filtrada em CSV, suspender usuários, restaurar pacientes arquivados e exportar dados administrativos do paciente em JSON.
- Papéis por ambulatório usam `owner`, `admin` e `member`; proprietários podem promover/rebaixar admins do ambulatório.
- Contas administrativas principais exigem MFA/TOTP para acessar o painel administrativo e APIs administrativas: `drmatheusrosse@gmail.com` e `rossematheus@gmail.com`.
- Bucket `lme-pdfs` é privado.
- PDFs são gerados sob demanda em memória e baixados pelo navegador; o fluxo atual não salva PDF em storage.
- Geração de PDF registra auditoria com tipo de documento, arquivo gerado, paciente, doença, tipo de solicitação, IP e navegador.
- Respostas de PDF usam `Cache-Control: no-store`, `Pragma: no-cache`, `Expires: 0` e `X-Content-Type-Options: nosniff`.
- Política de retenção inicial registrada em `data_retention_policies`.

Configurações externas para marcar manualmente:

- GitHub Secret Scanning ativado.
- GitHub Push Protection ativado.
- MFA obrigatório nas contas GitHub, Supabase e Vercel.
- Supabase Auth MFA/TOTP habilitado para permitir a verificação das contas administrativas dentro da plataforma.
- Secrets reais apenas na Vercel/Supabase, nunca no GitHub.
- Supabase Backup/PITR configurado no painel do projeto quando o plano permitir; enquanto isso, fazer backup manual antes de migrations sensíveis.
- Job agendado para `select prune_audit_logs(3650);` conforme política aprovada.

Política inicial de retenção:

- `audit_logs`: 10 anos, sem conteúdo clínico.
- `patients` e `lmes`: manter enquanto houver relação assistencial ou obrigação legal aplicável.
- Pacientes arquivados: ocultos dos fluxos normais, preservados para histórico e auditoria.
- PDFs exportados: preferir geração sob demanda sem storage; quando armazenados no futuro, bucket privado, URLs temporárias e retenção definida.

Regra de log:

Não registrar nome, CPF, CNS, CID, justificativa, prontuário, endereço, telefone, e-mail ou texto clínico. Logs devem conter apenas IDs técnicos, tipo de ação e metadados operacionais mínimos.
