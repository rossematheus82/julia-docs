'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ArrowLeft, Stethoscope } from 'lucide-react'
import type { Doctor } from '@/lib/supabase/types'

const Schema = z.object({
  full_name: z.string().trim().min(3, 'Informe o nome completo'),
  crm:       z.string().trim().regex(/^\d{3,6}$/, 'CRM inválido (3 a 6 dígitos numéricos)'),
  crm_uf:    z.string().trim().regex(/^[A-Za-z]{2}$/, 'UF inválida (ex: MG)').toUpperCase(),
  cns:       z.string().trim().regex(/^\d{15}$/, 'CNS deve ter 15 dígitos'),
  cpf:       z.string().trim().regex(/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido'),
  specialty: z.string().trim().min(2, 'Informe a especialidade'),
})
type FormData = z.infer<typeof Schema>

export function PerfilMedicoClient({ doctor }: { doctor: Doctor }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: {
      full_name: doctor.full_name,
      crm: doctor.crm,
      crm_uf: doctor.crm_uf,
      cns: doctor.cns ?? '',
      cpf: doctor.cpf ?? '',
      specialty: doctor.specialty ?? 'Pneumologia',
    },
  })
  const v = watch()

  async function onSubmit(data: FormData) {
    setLoading(true)
    const { error } = await supabase.from('doctors').update({
      full_name: data.full_name,
      crm: data.crm,
      crm_uf: data.crm_uf,
      cns: data.cns,
      cpf: data.cpf.replace(/\D/g, ''),
      specialty: data.specialty,
    }).eq('id', doctor.id)
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Perfil atualizado.')
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-blue-700" />
          <h1 className="text-xl font-semibold text-gray-900">Meu perfil médico</h1>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Estes dados são usados em toda LME que você gera. CRM e CNS são suas credenciais profissionais — confira antes de assinar.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <Field label="Nome completo *" error={errors.full_name?.message}>
          <Input {...register('full_name')} value={v.full_name ?? ''} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Field label="CRM *" error={errors.crm?.message}>
              <Input {...register('crm')} value={v.crm ?? ''} inputMode="numeric" />
            </Field>
          </div>
          <Field label="UF *" error={errors.crm_uf?.message}>
            <Input {...register('crm_uf')} value={v.crm_uf ?? ''} maxLength={2} className="uppercase" />
          </Field>
        </div>
        <Field label="CNS *" error={errors.cns?.message}>
          <Input {...register('cns')} value={v.cns ?? ''} inputMode="numeric" maxLength={15} />
        </Field>
        <Field label="CPF *" error={errors.cpf?.message}>
          <Input {...register('cpf')} value={v.cpf ?? ''} inputMode="numeric" />
        </Field>
        <Field label="Especialidade *" error={errors.specialty?.message}>
          <Input {...register('specialty')} value={v.specialty ?? ''} />
        </Field>

        <Button type="submit" disabled={loading || !isDirty}>
          {loading ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </form>
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
