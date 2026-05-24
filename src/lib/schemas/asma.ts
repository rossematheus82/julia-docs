import { z } from 'zod'

export const TratamentoPrevioAsmaSchema = z.object({
  tipo: z.enum(['ci', 'laba', 'ci_laba', 'saba_ci', 'ocs', 'outros']),
  medicamento: z.string().optional(),
  dose: z.string().optional(),
  tempo_uso: z.string().optional(),
  frequencia: z.string().optional(),
  num_cursos_ano: z.string().optional(),
  especificacao: z.string().optional(),
})

export const AsmaFormSchema = z.object({
  nome_civil: z.string().min(1, 'Nome civil obrigatório'),
  nome_social: z.string().optional(),
  idade: z.string().min(1, 'Idade obrigatória'),

  // 3.1 Diagnóstico - exame físico
  achados_exame_fisico: z.string().optional(),

  // 3.2 Diagnóstico diferencial (checkboxes)
  diag_diferencial: z.object({
    corpo_estranho_inalado: z.boolean().default(false),
    rinossinusite: z.boolean().default(false),
    disfuncao_cordas_vocais: z.boolean().default(false),
    obstrucao_vias_aereas_centrais: z.boolean().default(false),
    hiperventilacao_psicogenica: z.boolean().default(false),
    dpoc: z.boolean().default(false),
    bronquiectasias: z.boolean().default(false),
    refluxo_gastroesofagico: z.boolean().default(false),
    micoses_bronco_pulmonares: z.boolean().default(false),
    tuberculose_pulmonar: z.boolean().default(false),
    bronquite_eosinofilica: z.boolean().default(false),
    deficiencia_alfa1_antitripsina: z.boolean().default(false),
    tromboembolismo_pulmonar: z.boolean().default(false),
    hipertensao_arterial_pulmonar: z.boolean().default(false),
    doencas_pulmonares_intersticiais: z.boolean().default(false),
    insuficiencia_cardiaca: z.boolean().default(false),
    cancer_pulmao: z.boolean().default(false),
    tosse_medicamentos: z.boolean().default(false),
  }),

  // 4. Classificação da gravidade
  gravidade: z.enum(['leve', 'moderada', 'grave']).optional(),

  // 5. Tratamentos prévios
  tratamentos_previos: z.array(TratamentoPrevioAsmaSchema).optional(),

  // 6. Omalizumabe
  omalizumabe: z.object({
    exacerbacao_grave_ultimo_ano: z.boolean().default(false),
    alergia_igE: z.boolean().default(false),
    igE_30_1500: z.boolean().default(false),
    asma_grave_t2_alergica: z.boolean().default(false),
  }).optional(),

  // 7. Mepolizumabe
  mepolizumabe: z.object({
    exacerbacao_grave_ultimo_ano: z.boolean().default(false),
    eosinofilos_300: z.boolean().default(false),
    asma_grave_t2_eosinofilica: z.boolean().default(false),
  }).optional(),

  // 8. Outras observações
  outras_observacoes: z.string().optional(),

  data_preenchimento: z.string().optional(),
})

export type AsmaFormData = z.infer<typeof AsmaFormSchema>
