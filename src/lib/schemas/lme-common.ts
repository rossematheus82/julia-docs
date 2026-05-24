import { z } from 'zod'

export const MedicamentoLmeSchema = z.object({
  nome: z.string().min(1, 'Informe o medicamento'),
  apresentacao: z.string().min(1, 'Informe a apresentação'),
  quantidades: z.object({
    mes1: z.string(),
    mes2: z.string(),
    mes3: z.string(),
    mes4: z.string(),
    mes5: z.string(),
    mes6: z.string(),
  }),
})

export const LmeCommonSchema = z.object({
  // Campos do médico/estabelecimento (preenchidos automaticamente)
  cnes: z.string().min(1, 'CNES obrigatório'),
  estabelecimento_nome: z.string().min(1, 'Nome do estabelecimento obrigatório'),

  // Dados do paciente
  paciente_nome: z.string().min(1, 'Nome do paciente obrigatório'),
  mae_nome: z.string().min(1, 'Nome da mãe obrigatório'),
  peso_kg: z.string().min(1, 'Peso obrigatório'),
  altura_cm: z.string().min(1, 'Altura obrigatória'),

  // Medicamentos (até 6)
  medicamentos: z.array(MedicamentoLmeSchema).min(1, 'Informe ao menos um medicamento').max(6),

  // Diagnóstico
  cid10: z.string().min(1, 'CID-10 obrigatório'),
  diagnostico: z.string().min(1, 'Diagnóstico obrigatório'),
  anamnese: z.string().min(10, 'Anamnese obrigatória (mínimo 10 caracteres)'),

  // Tratamento prévio
  tratamento_previo: z.boolean(),
  tratamento_previo_descricao: z.string().optional(),

  // Atestado de capacidade
  paciente_incapaz: z.boolean(),
  responsavel_nome: z.string().optional(),

  // Médico
  medico_nome: z.string().min(1, 'Nome do médico obrigatório'),
  medico_cns: z.string().min(1, 'CNS do médico obrigatório'),
  data_solicitacao: z.string().min(1, 'Data obrigatória'),

  // Seção inferior (preenchida pelo paciente/responsável)
  preenchido_por: z.enum(['paciente', 'mae', 'responsavel', 'medico', 'outro']),
  outro_nome: z.string().optional(),
  outro_cpf: z.string().optional(),

  raca_etnia: z.enum(['Branca', 'Amarela', 'Preta', 'Indígena', 'Parda']).optional(),
  etnia_detalhe: z.string().optional(),
  telefones: z.string().optional(),
  documento_tipo: z.enum(['CPF', 'CNS']).optional(),
  documento_numero: z.string().optional(),
  email_paciente: z.string().email('Email inválido — verifique o formato (ex: nome@dominio.com)').optional().or(z.literal('')),
})

export type LmeCommonData = z.infer<typeof LmeCommonSchema>
export type MedicamentoLme = z.infer<typeof MedicamentoLmeSchema>
