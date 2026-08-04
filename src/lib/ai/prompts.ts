import type { Disease, RequestType } from '../supabase/types'
import { LME_TEXT_LIMITS } from '../pdf/text-limits'

const DISEASE_NAMES: Record<Disease, string> = {
  'asma': 'Asma Brônquica',
  'dpoc': 'Doença Pulmonar Obstrutiva Crônica (DPOC)',
  'dpi-fp': 'Doença Pulmonar Intersticial Fibrosante Progressiva (DPI-FP)',
  'hap': 'Hipertensão Arterial Pulmonar (HAP)',
}

const REQUEST_TYPE_NAMES: Record<RequestType, string> = {
  'inicial': 'Solicitação Inicial',
  'renovacao': 'Renovação de Tratamento (a cada 6 meses)',
  'reavaliacao': 'Reavaliação (troca ou inclusão de medicamento)',
}

export function buildExtractionPrompt(
  prontuario: string,
  diseaseContext: Disease,
  requestType: RequestType,
  fieldDescriptions: string
): string {
  return `Você é um assistente especializado em preenchimento de formulários médicos do CEAF (Componente Especializado da Assistência Farmacêutica) da Secretaria de Estado de Saúde de Minas Gerais (SES-MG).

## Contexto
- Doença: ${DISEASE_NAMES[diseaseContext]}
- Tipo de solicitação: ${REQUEST_TYPE_NAMES[requestType]}

## Sua tarefa
Analise o prontuário/evolução médica abaixo e extraia as informações para preencher os campos do formulário LME (Laudo de Solicitação, Avaliação e Autorização de Medicamentos) e do Formulário Específico da doença.

## Regras CRÍTICAS
1. NUNCA invente informações que não estão no prontuário
2. Se uma informação não estiver presente, retorne null para esse campo
3. Para cada campo, retorne também um nível de confiança: "high" (encontrado explicitamente), "medium" (inferido com segurança), "low" (incerto ou ausente)
4. Retorne um array "warnings" com alertas sobre campos importantes que não foram encontrados
5. Extraia datas no formato DD/MM/AAAA
6. Para pesos e alturas, extraia apenas os números
7. NÃO extraia nem sugira CID-10 ou diagnóstico — o CID já é selecionado pelo médico antes desta etapa

## Campos esperados
${fieldDescriptions}

## Prontuário / Evolução Médica
${prontuario}

## Resposta
Retorne APENAS um JSON válido com a estrutura:
{
  "data": { /* campos extraídos */ },
  "confidence": { /* "high"|"medium"|"low" para cada campo */ },
  "warnings": [ /* lista de alertas */ ]
}`
}

export function getLmeFieldDescriptions(): string {
  // Campos de identificação (nome, mãe, telefone, e-mail, raça, responsável) não
  // são pedidos à IA: vêm do cadastro do paciente. O prontuário é anonimizado
  // antes do envio, então a IA só devolveria marcadores no lugar dos nomes.
  return `
- peso_kg: Peso em kg (número)
- altura_cm: Altura em cm (número)
- anamnese: Resumo clínico / anamnese do paciente, com no máximo ${LME_TEXT_LIMITS.anamnese} caracteres
- tratamento_previo: true se já fez tratamento, false se não
- tratamento_previo_descricao: Descrição do tratamento prévio (se houver)
`.trim()
}

export function getAsmaFieldDescriptions(): string {
  return `
- idade: Idade do paciente
- achados_exame_fisico: Achados no exame físico relevantes para asma
- gravidade: "leve" (Etapa I-II), "moderada" (Etapa III), ou "grave" (Etapa IV-V)
- diag_diferencial: objeto com booleanos para cada diagnóstico diferencial presentes
- tratamentos_previos: lista de tratamentos já usados (tipo, medicamento, dose, tempo)
- omalizumabe: objeto com critérios para omalizumabe (se aplicável)
- mepolizumabe: objeto com critérios para mepolizumabe (se aplicável)
- outras_observacoes: outras informações relevantes
`.trim()
}

export function getDpocFieldDescriptions(): string {
  return `
- idade: Idade do paciente
- gravidade_grupo: "A", "B" ou "E" conforme classificação GOLD
- historia: objeto com características clínicas (tabagismo, exposições, sintomas)
- exacerbacoes_12m: true/false se houve exacerbações nos últimos 12 meses
- exacerbacoes_moderadas_qtd: número de exacerbações moderadas
- exacerbacoes_graves_qtd: número de exacerbações graves
- outros_diagnosticos: comorbidades presentes (asma, tuberculose, HIV, etc.)
- em_uso_medicamento: true se já usa medicamento para DPOC
- tratamentos_atuais: descrição dos medicamentos em uso
- outras_observacoes: outras informações relevantes
`.trim()
}

export function getDpiFpFieldDescriptions(): string {
  return `
- idade: Idade do paciente
- classificacao: "fpi" (Fibrose Pulmonar Idiopática J84.1) ou "nao_fpi" (demais CIDs)
- caracteristicas_clinicas: evolução e características clínicas da doença
- mrc: grau de dispneia pela escala MRC (0, 1, 2, 3 ou 4)
- exacerbacoes_ultimo_ano: true/false se houve exacerbações no último ano
- exacerbacoes_qtd: quantidade de exacerbações
- piora_funcional: declínio CVF >5% e/ou DLCO >10% (booleanos)
- progressao_tcar: alterações progressivas na TCAR (booleanos)
- tratamentos: medicamentos prévios e atuais
- justificativa_troca: motivo para troca de medicamento (se reavaliação)
`.trim()
}

export function getHapFieldDescriptions(): string {
  return `
- data_nascimento: Data de nascimento do paciente
- grupo_hp: Grupo de hipertensão pulmonar (I, II, III, IV ou V)
- doenca_coracao_esquerdo: true/false
- doenca_pulmonar_cronica: true/false
- embolia_pulmonar: true/false
- caracteristicas_clinicas: características clínicas e evolução
- cateterismo_data: data do cateterismo
- papm: PAPm do cateterismo (pressão arterial pulmonar média)
- poap_pdfve: POAP ou PDFVE
- rvp_wood: RVP em unidades Wood
- etiologia_tipo: "idiopatica_hereditaria_drogas" ou "associada"
- teste_no_resultado: "positivo" ou "negativo" (para HAP idiopática)
- etiologia_associada: objeto com tipo de HAP associada (booleanos)
- medicamentos_hap: quais medicamentos estão sendo solicitados
- risco: estratificação de risco (baixo, intermediario, alto)
- risco_detalhe: detalhamento do risco
- classe_funcional: classe funcional NYHA/WHO-FC (I, II, III, IV)
- exames: resultados dos exames complementares (data e resultado)
`.trim()
}
