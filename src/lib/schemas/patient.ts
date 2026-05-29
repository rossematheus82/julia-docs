import { z } from 'zod'

// Campos obrigatórios para emitir a LME/processo SES-MG.
// NÃO obrigatórios (únicas exceções): nome social, etnia (detalhe) e e-mail.
export const PatientSchema = z.object({
  full_name: z.string().trim().min(3, 'Nome completo deve ter ao menos 3 caracteres'),
  social_name: z.string().trim().optional(),
  mother_name: z.string().trim().min(1, 'Nome da mãe obrigatório'),
  cpf: z.string().min(1, 'CPF obrigatório').regex(
    /^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
    'CPF inválido — informe 11 dígitos (ex: 000.000.000-00)'
  ),
  // CNS é opcional — basta CPF para identificar o paciente na LME. Se preenchido, valida o formato.
  cns: z.string().regex(
    /^\d{15}$/,
    'CNS inválido — deve ter 15 dígitos numéricos'
  ).optional().or(z.literal('')),
  birth_date: z.string().min(1, 'Data de nascimento obrigatória').regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Data de nascimento inválida'
  ),
  sex: z.enum(['M', 'F', 'O'], { error: 'Sexo obrigatório' }),
  race_ethnicity: z.enum(['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena'], { error: 'Raça/Cor obrigatória' }),
  ethnicity_detail: z.string().trim().optional(),
  weight_kg: z.string().min(1, 'Peso obrigatório').regex(
    /^\d+(\.\d+)?$/,
    'Peso inválido — informe um número (ex: 70 ou 70.5)'
  ),
  height_cm: z.string().min(1, 'Altura obrigatória').regex(
    /^\d+$/,
    'Altura inválida — informe um número inteiro (ex: 170)'
  ),
  phone: z.string().min(1, 'Telefone obrigatório').regex(
    /^\d{10,11}$|^\(\d{2}\)\s?\d{4,5}-?\d{4}$/,
    'Telefone inválido — informe 10 ou 11 dígitos (ex: (31) 99999-9999)'
  ),
  email: z.string().email('Email inválido — verifique o formato (ex: nome@dominio.com)').optional().or(z.literal('')),
  address: z.string().trim().min(1, 'Endereço obrigatório'),
  is_incapable: z.boolean().default(false),
  responsible_name: z.string().trim().optional(),
}).superRefine((data, ctx) => {
  // Quando o paciente é incapaz, o nome do responsável legal é obrigatório.
  if (data.is_incapable && !data.responsible_name?.trim()) {
    ctx.addIssue({
      code: 'custom',
      path: ['responsible_name'],
      message: 'Nome do responsável obrigatório quando o paciente é incapaz',
    })
  }
})

export type PatientFormData = z.infer<typeof PatientSchema>
export type PatientFormInput = z.input<typeof PatientSchema>
