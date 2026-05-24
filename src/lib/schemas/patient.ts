import { z } from 'zod'

export const PatientSchema = z.object({
  full_name: z.string().trim().min(3, 'Nome completo deve ter ao menos 3 caracteres'),
  social_name: z.string().trim().optional(),
  mother_name: z.string().trim().optional(),
  cpf: z.string().regex(
    /^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
    'CPF inválido — informe 11 dígitos (ex: 000.000.000-00)'
  ).optional().or(z.literal('')),
  cns: z.string().regex(
    /^\d{15}$/,
    'CNS inválido — deve ter 15 dígitos numéricos'
  ).optional().or(z.literal('')),
  birth_date: z.string().optional(),
  sex: z.enum(['M', 'F', 'O']).optional(),
  race_ethnicity: z.enum(['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena']).optional(),
  ethnicity_detail: z.string().trim().optional(),
  weight_kg: z.string().regex(
    /^\d+(\.\d+)?$/,
    'Peso inválido — informe um número (ex: 70 ou 70.5)'
  ).optional().or(z.literal('')),
  height_cm: z.string().regex(
    /^\d+$/,
    'Altura inválida — informe um número inteiro (ex: 170)'
  ).optional().or(z.literal('')),
  phone: z.string().regex(
    /^\d{10,11}$|^\(\d{2}\)\s?\d{4,5}-?\d{4}$/,
    'Telefone inválido — informe 10 ou 11 dígitos (ex: (31) 99999-9999)'
  ).optional().or(z.literal('')),
  email: z.string().email('Email inválido — verifique o formato (ex: nome@dominio.com)').optional().or(z.literal('')),
  address: z.string().trim().optional(),
  is_incapable: z.boolean().default(false),
  responsible_name: z.string().trim().optional(),
})

export type PatientFormData = z.infer<typeof PatientSchema>
export type PatientFormInput = z.input<typeof PatientSchema>
