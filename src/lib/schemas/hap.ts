import { z } from 'zod'

export const ExameHapSchema = z.object({
  data: z.string().optional(),
  resultado: z.string().optional(),
})

export const HapFormSchema = z.object({
  nome_civil: z.string().min(1, 'Nome civil obrigatório'),
  nome_social: z.string().optional(),
  data_nascimento: z.string().optional(),

  // 3. CID-10
  cid10: z.string().optional(),

  // 4. Grupo HP e informações
  grupo_hp: z.enum(['I', 'II', 'III', 'IV', 'V']).optional(),
  doenca_coracao_esquerdo: z.boolean().default(false),
  doenca_pulmonar_cronica: z.boolean().default(false),
  embolia_pulmonar: z.boolean().default(false),

  // 5. Características clínicas
  caracteristicas_clinicas: z.string().optional(),

  // 6. Cateterismo cardíaco direito
  cateterismo_data: z.string().optional(),
  papm: z.string().optional(),
  poap_pdfve: z.string().optional(),
  rvp_wood: z.string().optional(),

  // 7. Etiologia
  etiologia_tipo: z.enum(['idiopatica_hereditaria_drogas', 'associada']).optional(),
  teste_no_resultado: z.enum(['positivo', 'negativo']).optional(),
  teste_no_justificativa_nao_realizacao: z.string().optional(),
  etiologia_associada: z.object({
    colagenoses: z.boolean().default(false),
    hipertensao_portopulmonar: z.boolean().default(false),
    esquistossomose: z.boolean().default(false),
    hiv: z.boolean().default(false),
    cardiopatia_congenita: z.boolean().default(false),
    veno_oclusiva: z.boolean().default(false),
  }),

  // 8. Medicamentos solicitados (com posologia)
  medicamentos_hap: z.object({
    ambrisentana: z.boolean().default(false),
    ambrisentana_posologia: z.string().optional(),
    bosentana: z.boolean().default(false),
    bosentana_posologia: z.string().optional(),
    sildenafil: z.boolean().default(false),
    sildenafil_posologia: z.string().optional(),
    iloprosta: z.boolean().default(false),
    iloprosta_posologia: z.string().optional(),
  }),

  // 9. Risco estratificado
  risco: z.enum(['baixo', 'intermediario', 'alto']).optional(),
  risco_detalhe: z.string().optional(),

  // 10. Classe funcional NYHA/WHO-FC
  classe_funcional: z.enum(['I', 'II', 'III', 'IV']).optional(),

  // 11. Situações específicas
  situacoes: z.object({
    doenca_hepatica_grave: z.boolean().default(false),
    suspeita_venoclusiva: z.boolean().default(false),
    hap_idiopatica_75anos: z.boolean().default(false),
    hap_estavel_monoterapia: z.boolean().default(false),
    vasorreatividade_positiva: z.boolean().default(false),
  }),

  // 12. Exames complementares
  exames: z.object({
    ecocardiograma: ExameHapSchema,
    eletrocardiograma: ExameHapSchema,
    espirometria: ExameHapSchema,
    tc6m: ExameHapSchema,
    polissonografia: ExameHapSchema,
    angiotc_cintilografia: ExameHapSchema,
    usg_abdominal: ExameHapSchema,
    gasometria: ExameHapSchema,
    rx_torax: ExameHapSchema,
  }),

  // 13. Outras observações
  outras_observacoes: z.string().optional(),

  data_preenchimento: z.string().optional(),
})

export type HapFormData = z.infer<typeof HapFormSchema>
