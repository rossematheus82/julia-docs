import { z } from 'zod'

export const DpiFpFormSchema = z.object({
  nome_civil: z.string().min(1, 'Nome civil obrigatório'),
  nome_social: z.string().optional(),
  idade: z.string().min(1, 'Idade obrigatória'),

  // 2. Classificação
  classificacao: z.enum(['fpi', 'nao_fpi']).optional(),

  // 3.1 Características clínicas
  caracteristicas_clinicas: z.string().optional(),

  // 3.2 Grau de dispneia (MRC)
  mrc: z.enum(['0', '1', '2', '3', '4']).optional(),

  // 3.3 Exacerbações
  exacerbacoes_ultimo_ano: z.boolean().default(false),
  exacerbacoes_qtd: z.string().optional(),

  // 3.4 Para DPI não-FPI
  piora_funcional: z.object({
    declinio_cvf_5: z.boolean().default(false),
    declinio_dlco_10: z.boolean().default(false),
  }),
  progressao_tcar: z.object({
    bronquiectasia_tracao: z.boolean().default(false),
    vidro_fosco_bronquiectasia: z.boolean().default(false),
    reticulacao_fina: z.boolean().default(false),
    reticulacao_grosseira: z.boolean().default(false),
    faveolamento: z.boolean().default(false),
    perda_volume_lobar: z.boolean().default(false),
  }),

  // 4. Tratamentos prévios e atuais
  tratamentos: z.string().optional(),

  // 5. Justificativa para troca de medicamento
  justificativa_troca: z.string().optional(),

  data_preenchimento: z.string().optional(),
})

export type DpiFpFormData = z.infer<typeof DpiFpFormSchema>
