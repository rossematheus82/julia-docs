'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PatientSchema, type PatientFormInput } from '@/lib/schemas/patient'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { DateInput } from '@/components/ui/date-input'

export default function EditarPacientePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const { register, handleSubmit, watch, setValue, reset, control, formState: { errors } } = useForm<PatientFormInput>({
    resolver: zodResolver(PatientSchema),
    defaultValues: { is_incapable: false },
  })

  // Watch all values to keep Base UI inputs controlled after reset()
  const v = watch()
  const isIncapable = v.is_incapable ?? false

  useEffect(() => {
    async function load() {
      const { data: patient } = await supabase.from('patients').select('*').eq('id', id).single()
      if (!patient) { router.push('/pacientes'); return }
      reset({
        full_name: patient.full_name,
        social_name: patient.social_name ?? '',
        mother_name: patient.mother_name ?? '',
        cpf: patient.cpf ?? '',
        cns: patient.cns ?? '',
        birth_date: patient.birth_date ?? '',
        sex: (patient.sex ?? undefined) as 'M' | 'F' | 'O' | undefined,
        race_ethnicity: (patient.race_ethnicity ?? undefined) as 'Branca' | 'Preta' | 'Parda' | 'Amarela' | 'Indígena' | undefined,
        ethnicity_detail: patient.ethnicity_detail ?? '',
        weight_kg: patient.weight_kg?.toString() ?? '',
        height_cm: patient.height_cm?.toString() ?? '',
        phone: patient.phone ?? '',
        email: patient.email ?? '',
        address: patient.address ?? '',
        is_incapable: patient.is_incapable ?? false,
        responsible_name: patient.responsible_name ?? '',
      })
      setFetching(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function onSubmit(data: PatientFormInput) {
    setLoading(true)
    try {
      const { error } = await supabase.from('patients').update({
        full_name: data.full_name,
        social_name: data.social_name || null,
        mother_name: data.mother_name || null,
        cpf: data.cpf || null,
        cns: data.cns || null,
        birth_date: data.birth_date || null,
        sex: data.sex || null,
        race_ethnicity: data.race_ethnicity || null,
        ethnicity_detail: data.ethnicity_detail || null,
        weight_kg: data.weight_kg ? parseFloat(data.weight_kg) : null,
        height_cm: data.height_cm ? parseInt(data.height_cm) : null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        is_incapable: data.is_incapable,
        responsible_name: data.is_incapable ? (data.responsible_name || null) : null,
      }).eq('id', id)

      if (error) throw error
      toast.success('Paciente atualizado!')
      router.push(`/pacientes/${id}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="p-6 text-gray-400">Carregando...</div>

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/pacientes/${id}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar paciente</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Identificação</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label>Nome completo *</Label>
              <Input {...register('full_name')} value={v.full_name ?? ''} className="mt-1" />
              {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
            </div>
            <div>
              <Label>Nome social</Label>
              <Input {...register('social_name')} value={v.social_name ?? ''} className="mt-1" />
            </div>
            <div>
              <Label>Nome da mãe *</Label>
              <Input {...register('mother_name')} value={v.mother_name ?? ''} className="mt-1" />
              {errors.mother_name && <p className="text-xs text-red-500 mt-1">{errors.mother_name.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>CPF *</Label>
              <Input {...register('cpf')} value={v.cpf ?? ''} className="mt-1" placeholder="000.000.000-00" />
              {errors.cpf && <p className="text-xs text-red-500 mt-1">{errors.cpf.message}</p>}
            </div>
            <div>
              <Label>CNS *</Label>
              <Input {...register('cns')} value={v.cns ?? ''} className="mt-1" />
              {errors.cns && <p className="text-xs text-red-500 mt-1">{errors.cns.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Data de nascimento *</Label>
              <DateInput value={v.birth_date ?? ''} onChange={val => setValue('birth_date', val)} className="mt-1" />
              {errors.birth_date && <p className="text-xs text-red-500 mt-1">{errors.birth_date.message}</p>}
            </div>
            <div>
              <Label>Sexo *</Label>
              <Controller
                control={control}
                name="sex"
                render={({ field }) => (
                  <Select value={field.value ?? undefined} onValueChange={val => field.onChange(val as 'M' | 'F' | 'O')}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Feminino</SelectItem>
                      <SelectItem value="O">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.sex && <p className="text-xs text-red-500 mt-1">{errors.sex.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Raça/Cor *</Label>
              <Controller
                control={control}
                name="race_ethnicity"
                render={({ field }) => (
                  <Select value={field.value ?? undefined} onValueChange={val => field.onChange(val as 'Branca' | 'Preta' | 'Parda' | 'Amarela' | 'Indígena')}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Branca">Branca</SelectItem>
                      <SelectItem value="Preta">Preta</SelectItem>
                      <SelectItem value="Parda">Parda</SelectItem>
                      <SelectItem value="Amarela">Amarela</SelectItem>
                      <SelectItem value="Indígena">Indígena</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.race_ethnicity && <p className="text-xs text-red-500 mt-1">{errors.race_ethnicity.message}</p>}
            </div>
            <div>
              <Label>Etnia (se indígena)</Label>
              <Input {...register('ethnicity_detail')} value={v.ethnicity_detail ?? ''} className="mt-1" />
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Dados clínicos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Peso (kg) *</Label>
              <Input {...register('weight_kg')} value={v.weight_kg ?? ''} type="number" step="0.1" className="mt-1" />
              {errors.weight_kg && <p className="text-xs text-red-500 mt-1">{errors.weight_kg.message}</p>}
            </div>
            <div>
              <Label>Altura (cm) *</Label>
              <Input {...register('height_cm')} value={v.height_cm ?? ''} type="number" className="mt-1" />
              {errors.height_cm && <p className="text-xs text-red-500 mt-1">{errors.height_cm.message}</p>}
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Contato e endereço</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Telefone *</Label>
              <Input {...register('phone')} value={v.phone ?? ''} className="mt-1" />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <Label>E-mail</Label>
              <Input {...register('email')} value={v.email ?? ''} type="email" className="mt-1" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
          </div>
          <div>
            <Label>Endereço completo *</Label>
            <Input {...register('address')} value={v.address ?? ''} className="mt-1" />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Capacidade civil</h2>
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_incapable"
              checked={isIncapable}
              onCheckedChange={val => setValue('is_incapable', Boolean(val))}
            />
            <Label htmlFor="is_incapable" className="cursor-pointer">Paciente é incapaz civilmente</Label>
          </div>
          {isIncapable && (
            <div>
              <Label>Nome do responsável legal *</Label>
              <Input {...register('responsible_name')} value={v.responsible_name ?? ''} className="mt-1" />
              {errors.responsible_name && <p className="text-xs text-red-500 mt-1">{errors.responsible_name.message}</p>}
            </div>
          )}
        </section>

        <div className="flex justify-end gap-3">
          <Link href={`/pacientes/${id}`}>
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={loading} className="gap-2">
            <Save className="h-4 w-4" />
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </form>
    </div>
  )
}
