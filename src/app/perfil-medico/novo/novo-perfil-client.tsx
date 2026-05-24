'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Stethoscope } from 'lucide-react'

const Schema = z.object({
  full_name: z.string().trim().min(3, 'Informe o nome completo'),
  crm:       z.string().trim().regex(/^\d{3,6}$/, 'CRM inválido (3 a 6 dígitos numéricos)'),
  crm_uf:    z.string().trim().regex(/^[A-Za-z]{2}$/, 'UF inválida (ex: MG)').toUpperCase(),
  cns:       z.string().trim().regex(/^\d{15}$/, 'CNS deve ter 15 dígitos'),
  cpf:       z.string().trim().regex(/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido (11 dígitos)'),
  specialty: z.string().trim().min(2, 'Informe a especialidade'),
})
type FormData = z.infer<typeof Schema>

interface Props {
  workspaceId: string
  userId: string
  /** Quando preenchido, pré-popula os campos copiando de outro perfil do médico (multi-workspace). */
  prefill?: Partial<FormData>
}

export function NovoPerfilMedicoClient({ workspaceId, userId, prefill }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: {
      full_name: prefill?.full_name ?? '',
      crm:       prefill?.crm ?? '',
      crm_uf:    prefill?.crm_uf ?? 'MG',
      cns:       prefill?.cns ?? '',
      cpf:       prefill?.cpf ?? '',
      specialty: prefill?.specialty ?? 'Pneumologia',
    },
  })
  const v = watch()

  async function onSubmit(data: FormData) {
    setLoading(true)
    const { error } = await supabase.from('doctors').insert({
      workspace_id: workspaceId,
      created_by_user_id: userId,
      owner_user_id: userId,
      full_name: data.full_name,
      crm: data.crm,
      crm_uf: data.crm_uf,
      cns: data.cns,
      cpf: data.cpf.replace(/\D/g, ''),
      specialty: data.specialty,
      phone: null,
      email: null,
      signature_image_url: null,
      is_active: true,
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    toast.success('Perfil criado!')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto bg-blue-100 text-blue-700 h-12 w-12 rounded-full flex items-center justify-center">
            <Stethoscope className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Complete seu perfil médico</h1>
          <p className="text-sm text-gray-500">Esses dados serão usados em toda LME que você gerar.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <Field label="Nome completo *" error={errors.full_name?.message}>
            <Input {...register('full_name')} value={v.full_name ?? ''} placeholder="Dr. Nome Sobrenome" />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Field label="CRM *" error={errors.crm?.message}>
                <Input {...register('crm')} value={v.crm ?? ''} placeholder="99658" inputMode="numeric" />
              </Field>
            </div>
            <Field label="UF *" error={errors.crm_uf?.message}>
              <Input {...register('crm_uf')} value={v.crm_uf ?? ''} placeholder="MG" maxLength={2} className="uppercase" />
            </Field>
          </div>

          <Field label="CNS *" error={errors.cns?.message}>
            <Input {...register('cns')} value={v.cns ?? ''} placeholder="123456789012345" inputMode="numeric" maxLength={15} />
          </Field>

          <Field label="CPF *" error={errors.cpf?.message}>
            <Input {...register('cpf')} value={v.cpf ?? ''} placeholder="12345678900" inputMode="numeric" />
          </Field>

          <Field label="Especialidade *" error={errors.specialty?.message}>
            <Input {...register('specialty')} value={v.specialty ?? ''} placeholder="Pneumologia" />
          </Field>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar e continuar'}
          </Button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
