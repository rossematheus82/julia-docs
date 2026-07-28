# julia-docs — Contexto do projeto

## O que é

Sistema web para geração e gestão de **LMEs** (Laudos de Solicitação, Avaliação e Autorização de Medicamentos) do CEAF (Componente Especializado da Assistência Farmacêutica) da SES-MG. Permite criar, editar e gerar PDFs de processos completos para médicos.

**Stack:** Next.js 14 (App Router) · TypeScript · Supabase (auth + DB) · pdf-lib · shadcn/ui · Tailwind · pnpm

## ⚠️ Convenção — sempre atualizar as Novidades

**Toda mudança relevante para o usuário** (nova funcionalidade, melhoria visível ou correção de bug perceptível) **DEVE** ganhar uma entrada no changelog em `src/lib/changelog.ts`, exibido na página `/novidades`. Adicione o item **no topo** da lista (mais recente primeiro), agrupando por data, com o `tipo` correto (`'novo'` | `'melhoria'` | `'correcao'`) e texto curto e claro em português. Não precisa registrar mudanças internas/invisíveis (refactors, ajustes de build).

## Status / Deploy (2026-05-30)

- **Repo:** [github.com/rossematheus82/julia-docs](https://github.com/rossematheus82/julia-docs)
- **Produção:** Vercel (deploy automático a cada push em `main`)
- **Migrations aplicadas no Supabase:**
  - `0002_doctor_profile.sql` — perfil de médico atrelado ao usuário (`doctors.owner_user_id`, `doctors.cpf`, índice único por workspace, RLS `own_doctor_*`)
  - `0003_lme_status_emitida.sql` — inclui `'emitida'` na check constraint de `lmes.status`
  - `0007_platform_admin_workspace_creation.sql` — restringe criação de ambulatórios a administradores da plataforma e cria RPC `create_workspace_as_admin`.
  - `0008_platform_users_admin_dashboard.sql` — adiciona `platform_users`, papéis/status globais (`basic`, `platform_admin`, `active`, `banned`) e suporte ao painel administrativo.
  - `0017_facility_cnpj.sql` — adiciona `health_facilities.cnpj` (usado no cabeçalho da receita, junto com endereço e CNES). **Precisa ser aplicada antes de salvar estabelecimentos.**
- **Ajustes recentes (2026-05-28 a 30):**
  - DPOC: "em uso de medicamento" virou SIM/NÃO explícito (radio, tri-estado — não força NÃO quando não respondido); caixas "Especificar" de poluentes ambientais/ocupacionais agora aparecem inline sob o item marcado.
  - Cadastro de paciente: campos obrigatórios reforçados (ver seção própria); **CNS voltou a ser opcional** (basta CPF) após ajuste 2026-05-29.
  - Dados do paciente fluem do cadastro **atual** para o PDF (a rota busca o registro completo, não o snapshot); peso/altura pré-preenchem no wizard.
  - CID-10 passou a ser **editável** na tela de editar (mesmo com LME emitida) e na renovação.
  - **Responsivo mobile:** sidebar vira drawer com hambúrguer abaixo de `md` (768px), barra superior fixa no mobile (`pt-14`), grids de 2/3 colunas dos formulários empilham (`grid-cols-1 sm:grid-cols-2`), tabela de exames HAP rola horizontalmente. Layout passou de flex+`w-64` para sidebar `fixed` + `md:pl-64` no `<main>`.
  - **Dashboard em horário de Brasília:** Vercel roda em UTC — cabeçalho e queries de renovação/mês usam `Intl.DateTimeFormat('America/Sao_Paulo')`. Outras páginas que exibem datas (detalhes de LME, timeline) ainda usam o fuso do servidor — corrigir se aparecer reclamação.
  - **HAP — "Detalhar" do risco (seção 9):** `Text15` (caixa livre logo abaixo da linha tracejada) era duplicata equivocada de `outras_observacoes`; agora recebe `risco_detalhe` (cap 700 chars). `outras_observacoes` segue apenas em `Text34` (p3).
- **Ajustes recentes (2026-06-30):**
  - **Primeiro acesso com convite:** cadastro em `/login` exige código de convite de um ambulatório existente. O usuário entra direto no ambulatório pelo convite, sem precisar criar ou selecionar ambulatório no primeiro acesso.
  - **Criação de ambulatório restrita:** usuários básicos não veem nem conseguem criar ambulatório. Apenas contas administradoras da plataforma podem criar novos ambulatórios.
  - **Painel administrativo básico:** rota direta e não divulgada em `/controle-interno-julia-docs-7f3c9a`, protegida por permissão de admin. Lista usuários, permite banir/reativar contas não administradoras e mostra pacientes com filtro por ambulatório e busca por nome/CPF/CNS/telefone.
  - **Admin sem atalho na sidebar:** o link do painel administrativo foi removido da dashboard/sidebar. A rota segue acessível apenas por URL direta para contas autorizadas.
  - **Acesso suspenso:** usuário com `platform_users.status='banned'` é redirecionado para `/acesso-suspenso`. A página só abre para sessão autenticada suspensa; deslogados vão para `/login` e usuários ativos voltam ao `/dashboard`. A tela possui botão **Sair da conta**.
  - **Manual mobile:** manual de uso atualizado em `docs/manual-usuario-julia-docs-mobile.pdf`, com prints reais e orientação voltada a usuários comuns do ambulatório Júlia.

## Modelo de usuários e workspaces

- **Workspace = ambulatório.** Um usuário pode pertencer a vários (tabela `workspace_members`), com workspace ativo persistido em cookie `active_workspace_id` (helper `getActiveWorkspace()`).
- **Médico = 1 por usuário por workspace**, identificado por `doctors.owner_user_id` (índice único `doctors_owner_per_workspace_unique`). LME só pode ser emitida com o perfil de médico do usuário logado.
- **Pacientes / estabelecimentos** são compartilhados dentro do workspace (não por médico).
- **Trocador de workspace** na sidebar; hub em `/configuracoes/workspace` (renomear, sair, listar membros, código de convite).
- **Convite obrigatório no cadastro:** novos usuários devem informar um código de convite válido no cadastro. A API `/api/auth/signup-with-invite` cria a conta e vincula o usuário ao ambulatório convidante.
- **Criação de ambulatório:** usuários básicos apenas entram em ambulatórios existentes via convite. Criação fica restrita a administradores globais via `isPlatformAdminEmail()`/`is_platform_admin()`.
- **Administradores globais iniciais:** `drmatheusrosse@gmail.com` e `rossematheus@gmail.com` são tratados como admins da plataforma, com permissão para criar ambulatórios e acessar o painel administrativo.
- **Status global do usuário:** `platform_users.status='banned'` suspende o acesso à plataforma. O middleware bloqueia rotas autenticadas e direciona para `/acesso-suspenso`.

## Administração da plataforma

- **Rota do painel:** `/controle-interno-julia-docs-7f3c9a`. Não há link visível na sidebar; acessar por URL direta.
- **Proteção:** a página usa Supabase server client para identificar o usuário atual e service role apenas no server para consultar dados administrativos. Quem não é admin recebe `notFound()`.
- **Usuários:** o painel lista contas do Auth, papel global, status, quantidade de ambulatórios, perfil médico preenchido, data de criação e último login.
- **Banimento/reativação:** API `/api/controle-interno-julia-docs-7f3c9a/users/status` altera `platform_users.status`. Não permite banir a própria conta nem e-mails admin hardcoded.
- **Pacientes por ambulatório:** o painel lista até 1000 pacientes, com filtro por ambulatório e busca textual por nome, CPF, CNS, telefone ou nome do ambulatório.

## Permissões por LME (criador vs. demais)

A LME tem `created_by_user_id`. Quem **não** é o criador, ao abrir `/lmes/[id]`:
- vê um aviso âmbar nomeando o médico que emitiu;
- não vê **Editar** nem **Excluir** (bloqueados também server-side em `editar/page.tsx` e na rota `DELETE /api/lmes/[id]`);
- botão de PDF muda de "Gerar processo completo" para **"Baixar processo original"** (snapshots preservam o médico original);
- ganha CTA **"Renovar / repetir em meu nome"** que abre `/lmes/[id]/renovar`.

Em `/api/pdf/generate` (`type='all'`), o auto-update de `status='emitida'` + `next_renewal_date` só acontece se o requester é o criador — outros médicos não alteram o estado da LME alheia.

## Cadastro de paciente

Schema único `PatientSchema` (`src/lib/schemas/patient.ts`, zod 4) usado em `/pacientes/novo` e `/pacientes/[id]/editar`.

- **Obrigatórios:** nome completo, nome da mãe, CPF, CNS, data de nascimento, sexo, raça/cor, peso, altura, telefone, endereço. Responsável legal é obrigatório quando `is_incapable=true` (validado via `superRefine`).
- **Opcionais (únicas exceções):** nome social, etnia (detalhe, só p/ indígena) e e-mail.
- Os dois formulários exibem `*` e mensagem de erro por campo.

**Fluxo cadastro → LME:** em `/api/pdf/generate`, os dados do paciente vêm do **registro atual** (a rota faz `select` completo e sobrepõe o `patient_snapshot` com os campos não-vazios) — garante peso, altura, nome da mãe, telefone etc. no PDF, inclusive em LMEs antigas. No wizard, peso/altura **pré-preenchem** no `LmeFormEditor` (props `patientWeight`/`patientHeight`).
> A LME do SES-MG **não tem** campos para sexo nem endereço; a data de nascimento alimenta a *idade* no formulário específico e a prescrição/requerimento.

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
2. **Editar campos** — `LmeFormEditor` permite preencher/ajustar `lme_data` e `specific_form_data`. Quando `request_type='renovacao'` o formulário específico é ocultado (renovação = só LME + receita). Inclui **seletor de CID-10** (corrigir processo que voltou por erro de CID) — acessível pelo criador mesmo com a LME já `emitida`. Ao salvar, o `cid10` é gravado na coluna **e** dentro de `lme_data` (a rota de PDF prioriza `lme_data.cid10`), e o diagnóstico derivado é atualizado.
3. **Renovar** (`/lmes/[id]/renovar`) — médico fixado no usuário logado (sem seletor). O usuário escolhe o escopo: **"Apenas a LME (medicamentos)"** ou **"LME + formulário específico"**, e pode **confirmar/corrigir o CID-10**. Editor inline com dados pré-preenchidos da LME original; ao confirmar, a nova LME é criada já como `emitida` com `parent_lme_id` apontando pra original.
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
# IA — apenas provedores gratuitos (Claude/OpenAI removidos)
AI_PROVIDER=groq        # 'groq' (padrão) ou 'gemini'
GROQ_API_KEY=           # provedor padrão
GEMINI_API_KEY=         # usado quando AI_PROVIDER=gemini (aceita GOOGLE_API_KEY também)
# Feedback (botão flutuante Sugestões/Reportar erro -> e-mail via Resend)
RESEND_API_KEY=         # sem ela, o envio de feedback retorna 501
FEEDBACK_TO=            # destino (padrão: drmatheusrosse@gmail.com)
FEEDBACK_FROM=          # remetente (padrão: onboarding@resend.dev)
```

## Comandos úteis

```bash
pnpm dev        # Inicia em http://localhost:3000
pnpm build
pnpm lint
```
