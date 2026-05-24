import { z } from 'zod'

export const PatientExtractionSchema = z.object({
  full_name: z.string().nullable(),
  social_name: z.string().nullable(),
  mother_name: z.string().nullable(),
  birth_date: z.string().nullable(),
  cpf: z.string().nullable(),
  cns: z.string().nullable(),
  sex: z.enum(['M', 'F', 'O']).nullable(),
  race_ethnicity: z.enum(['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena']).nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  weight_kg: z.number().nullable(),
  height_cm: z.number().nullable(),
  is_incapable: z.boolean(),
  responsible_name: z.string().nullable(),
})

export type PatientExtractionData = z.infer<typeof PatientExtractionSchema>
