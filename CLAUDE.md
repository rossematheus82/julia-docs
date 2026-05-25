# julia-docs — Contexto do projeto

## O que é

Sistema web para geração e gestão de **LMEs** (Laudos de Solicitação, Avaliação e Autorização de Medicamentos) do CEAF (Componente Especializado da Assistência Farmacêutica) da SES-MG. Permite criar, editar e gerar PDFs de processos completos para médicos.

**Stack:** Next.js 14 (App Router) · TypeScript · Supabase (auth + DB) · pdf-lib · shadcn/ui · Tailwind · pnpm

## Status / Deploy (2026-05-24)

- **Repo:** [github.com/rossematheus82/julia-docs](https://github.com/rossematheus82/julia-docs)
- **Produção:** Vercel (deploy automático a cada push em `main`)
- **Migrations aplicadas no Supabase:**
  - `0002_doctor_profile.sql` — perfil de médico atrelado ao usuário (`doctors.owner_user_id`, `doctors.cpf`, índice único por workspace, RLS `own_doctor_*`)
  - `0003_lme_status_emitida.sql` — inclui `'emitida'` na check constraint de `lmes.status`

## Modelo de usuários e workspaces

- **Workspace = ambulatório.** Um usuário pode pertencer a vários (tabela `workspace_members`), com workspace ativo persistido em cookie `active_workspace_id` (helper `getActiveWorkspace()`).
- **Médico = 1 por usuário por workspace**, identificado por `doctors.owner_user_id` (índice único `doctors_owner_per_workspace_unique`). LME só pode ser emitida com o perfil de médico do usuário logado.
- **Pacientes / estabelecimentos** são compartilhados dentro do workspace (não por médico).
- **Trocador de workspace** na sidebar; hub em `/configuracoes/workspace` (renomear, sair, listar membros, código de convite).

## Permissões por LME (criador vs. demais)

A LME tem `created_by_user_id`. Quem **não** é o criador, ao abrir `/lmes/[id]`:
- vê um aviso âmbar nomeando o médico que emitiu;
- não vê **Editar** nem **Excluir** (bloqueados também server-side em `editar/page.tsx` e na rota `DELETE /api/lmes/[id]`);
- botão de PDF muda de "Gerar processo completo" para **"Baixar processo original"** (snapshots preservam o médico original);
- ganha CTA **"Renovar / repetir em meu nome"** que abre `/lmes/[id]/renovar`.

Em `/api/pdf/generate` (`type='all'`), o auto-update de `status='emitida'` + `next_renewal_date` só acontece se o requester é o criador — outros médicos não alteram o estado da LME alheia.

## Doenças suportadas

| Código | Nome | CIDs principais |
|--------|------|----------------|
| `asma` | Asma Brônquica | J45.0, J45.1, J45.8 |
| `dpoc` | DPOC | J44.0, J44.1, J44.8 |
| `dpi-fp` | DPI Fibrosante Progressiva | J84.1, J84.8, J84.9 |
| `hap` | Hipertensão Arterial Pulmonar | I27.0, I27.2, I27.8 |

## Fluxo principal

1. **Wizard (nova LME)** — 6 passos: doença → tipo → paciente → médico/estabelecimento → prontuário (IA opcional) → revisão. Validação centralizada em `nova/validate.ts` coleta **todos** os erros faltantes de uma vez e leva pro step com problema. A LME é salva já com `status='emitida'` — não passa mais por rascunho.
   - Step 2 (tipo) reduzido a 2 opções: **"Processo Completo"** (`inicial`) e **"LME + Receita"** (`renovacao`). O valor `reavaliacao` ainda existe no enum do DB por compatibilidade.
   - Step 5: editor visível por padrão; IA fica como assistente opcional colapsável (extração do prontuário faz *merge*, nunca sobrescreve campos preenchidos manualmente).
2. **Editar campos** — `LmeFormEditor` permite preencher/ajustar `lme_data` e `specific_form_data`. Quando `request_type='renovacao'` o formulário específico é ocultado (renovação = só LME + receita).
3. **Renovar** (`/lmes/[id]/renovar`) — médico fixado no usuário logado (sem seletor). O usuário escolhe o escopo: **"Apenas a LME (medicamentos)"** ou **"LME + formulário específico"**. Editor inline com dados pré-preenchidos da LME original; ao confirmar, a nova LME é criada já como `emitida` com `parent_lme_id` apontando pra original.
4. **Gerar PDFs** — API `/api/pdf/generate` aceita `type: 'lme' | 'specific_form' | 'all'`. O tipo `'all'` gera o processo completo (LME + form esp. + prescrição + requerimento + termo de adesão).
5. **Timeline do paciente** (`/pacientes/[id]`) — histórico vertical de LMEs do paciente com bolinha verde na mais recente, lista de medicamentos por LME e botões **Baixar** / **Renovar** inline.

## Arquivos-chave

```
src/
├── app/
│   ├── (app)/lmes/
│   │   ├── nova/               # Wizard de criação
│   │   │   ├── lme-wizard.tsx  # Controller do wizard
│   │   │   └── steps/          # Step1..Step6
│   │   └── [id]/
│   │       ├── page.tsx        # Detalhe da LME
│   │       ├── editar/         # Edição de campos
│   │       └── renovar/        # Renovação
│   └── api/
│       ├── pdf/generate/route.ts   # Geração de PDFs
│       └── ai/extract/route.ts     # Extração via IA
├── components/lme/
│   └── lme-form-editor.tsx     # Editor de campos (seções por doença)
├── lib/
│   ├── schemas/                # Zod schemas (asma, dpoc, dpi-fp, hap, lme-common)
│   ├── pdf/
│   │   ├── fill-specific.ts    # Dispatcher: carrega PDF template + aplica mappings
│   │   ├── fill-prescription.ts
│   │   ├── fill-requerimento.ts
│   │   ├── fill-termo-adesao.ts
│   │   ├── merge-processo.ts   # Une todos os PDFs em um processo
│   │   └── mappings/           # Campo-por-campo para cada doença
│   │       ├── hap.ts          # buildHapMappings()
│   │       ├── asma.ts
│   │       ├── dpoc.ts
│   │       ├── dpi-fp.ts
│   │       └── lme.ts
│   ├── ai/
│   │   ├── index.ts            # Rota para o provider ativo
│   │   ├── claude-provider.ts
│   │   ├── groq-provider.ts
│   │   └── openai-provider.ts
│   ├── supabase/
│   │   ├── client.ts / server.ts
│   │   └── types.ts            # Tipos gerados do Supabase
│   └── medicamentos.ts         # Catálogo de medicamentos por doença
templates-ses/                  # PDFs template do SES-MG (AcroForms)
├── hap/    HIPERTENSAO-ARTERIAL-PULMONAR-HAP-bc3-3 - form eps.pdf
├── asma/
├── dpoc/
├── dpi-fp/
└── lme/
```

## Banco de dados (Supabase)

Tabela principal: **`lmes`**
- `disease`: `'asma' | 'dpoc' | 'dpi-fp' | 'hap'`
- `request_type`: `'inicial' | 'renovacao' | 'reavaliacao'` *(UI usa só os 2 primeiros; `reavaliacao` mantido por compat)*
- `status`: `'rascunho' | 'enviada' | 'em_analise' | 'deferida' | 'devolvida' | 'indeferida' | 'emitida'` *(na prática só `emitida`; `rascunho` é legado e filtrado das listagens)*
- `workspace_id` (FK obrigatória) + `created_by_user_id`
- `lme_data`: JSONB — campos comuns do formulário LME (anamnese, medicamentos, peso, etc.)
- `specific_form_data`: JSONB — campos do formulário específico da doença
- `patient_snapshot / doctor_snapshot / facility_snapshot`: cópia dos dados no momento da criação (preserva identidade do médico original mesmo se ele editar perfil depois)
- `lme_pdf_url / specific_form_pdf_url / prescription_pdf_url`: URLs dos PDFs gerados
- `parent_lme_id`: referência à LME anterior (renovação)
- `next_renewal_date`: data de próxima renovação (auto = hoje + 180 dias quando o criador gera o processo completo)

Outras tabelas relevantes: `workspaces`, `workspace_members`, `patients`, `doctors`, `health_facilities` — todas escopadas por `workspace_id` via RLS.

## HAP — estrutura de dados

O `specific_form_data` para HAP segue o schema `HapFormSchema` (`src/lib/schemas/hap.ts`):
- **Seção 4**: `grupo_hp` (I-V), cofatores booleanos (`doenca_coracao_esquerdo`, `doenca_pulmonar_cronica`, `embolia_pulmonar`)
- **Seção 6**: cateterismo (`cateterismo_data`, `papm`, `poap_pdfve`, `rvp_wood`)
- **Seção 7**: `etiologia_tipo` + `etiologia_associada` (objeto com booleanos) + `teste_no_resultado`
- **Seção 8**: `medicamentos_hap` (objeto com booleanos + `_posologia`)
- **Seção 9**: `risco` (baixo/intermediario/alto) + `risco_detalhe`
- **Seção 10**: `classe_funcional` (I-IV)
- **Seção 11**: `situacoes` (objeto com 5 booleanos — **TODOS obrigatórios** para gerar PDF)
- **Seção 12**: `exames` (objeto com 9 exames, cada um com `data` e `resultado`)

## Geração de PDF (HAP)

O PDF é preenchido via `buildHapMappings()` em `src/lib/pdf/mappings/hap.ts`:
- **text**: campos de texto simples (nome, datas separadas em dia/mês/ano, medidas, posologias, resultados de exames)
- **checkboxes**: etiologia associada (Button41-46) + medicamentos HAP (Button47-50)
- **radios**: grupo HP (Button51), cofatores SIM/NÃO (Button52-54), vasorreatividade (Button58), risco (Button60), classe funcional (Button61), situações SIM/NÃO (Button62-66)

Datas são separadas em campos individuais (dia, mês, ano) usando `splitIso()`.

## Variáveis de ambiente necessárias

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=      # ou GROQ_API_KEY / OPENAI_API_KEY
```

## Comandos úteis

```bash
pnpm dev        # Inicia em http://localhost:3000
pnpm build
pnpm lint
```
