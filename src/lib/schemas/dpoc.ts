import { z } from 'zod'

export const DpocFormSchema = z.object({
  nome_civil: z.string().min(1, 'Nome civil obrigatório'),
  nome_social: z.string().optional(),
  idade: z.string().min(1, 'Idade obrigatória'),

  // 2. Classificação de gravidade
  gravidade_grupo: z.enum(['A', 'B', 'E']).optional(),

  // 3.1 História clínica - características
  historia: z.object({
    tabagista: z.boolean().default(false),
    macos_ano: z.string().optional(),
    exposicao_poluentes_ambientais: z.boolean().default(false),
    poluentes_ambientais_especificacao: z.string().optional(),
    exposicao_poluentes_ocupacionais: z.boolean().default(false),
    poluentes_ocupacionais_especificacao: z.string().optional(),
    dispneia_controlada: z.boolean().default(false),
    dispneia_persistente: z.boolean().default(false),
    respiracao_ofegante: z.boolean().default(false),
    pressao_toracica: z.boolean().default(false),
    tosse_cronica: z.boolean().default(false),
    expectoracao: z.boolean().default(false),
    sibilancia: z.boolean().default(false),
    deficiencia_alfa1: z.boolean().default(false),
    historia_familiar: z.boolean().default(false),
    fatores_infancia: z.boolean().default(false),
    outros: z.boolean().default(false),
    outros_especificacao: z.string().optional(),
  }),

  // 3.2 Exacerbações
  exacerbacoes_12m: z.boolean().default(false),
  exacerbacoes_moderadas_qtd: z.string().optional(),
  exacerbacoes_graves_qtd: z.string().optional(),

  // 3.3 Outros diagnósticos
  outros_diagnosticos: z.object({
    asma: z.boolean().default(false),
    tuberculose: z.boolean().default(false),
    hiv: z.boolean().default(false),
    infeccoes_broncopulmonares: z.boolean().default(false),
    bronquiectasias: z.boolean().default(false),
    bronquiolite_obliterante: z.boolean().default(false),
    icc: z.boolean().default(false),
  }),

  // 4. Tratamentos atuais (tri-estado: SIM / NÃO / não respondido)
  em_uso_medicamento: z.boolean().optional(),
  tratamentos_atuais: z.string().optional(),

  // 5. Outras observações
  outras_observacoes: z.string().optional(),

  data_preenchimento: z.string().optional(),
})

export type DpocFormData = z.infer<typeof DpocFormSchema>
