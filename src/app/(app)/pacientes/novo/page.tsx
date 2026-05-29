'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PatientSchema, type PatientFormInput } from '@/lib/schemas/patient'
import type { PatientExtractionData } from '@/lib/schemas/patient-extraction'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Sparkles, Loader2, AlertTriangle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { DateInput } from '@/components/ui/date-input'

type ConfidenceMap = Partial<Record<keyof PatientExtractionData, 'high' | 'low'>>

function ConfidenceDot({ level }: { level: 'high' | 'low' }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ml-1 align-middle ${level === 'high' ? 'bg-green-500' : 'bg-yellow-400'}`}
      title={level === 'high' ? 'Campo preenchido pela IA' : 'Campo extraído com baixa certeza'}
    />
  )
}

const AI_SET_OPTS = { shouldDirty: true, shouldTouch: true, shouldValidate: false } as const

export default function NovoPacientePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [confidence, setConfidence] = useState<ConfidenceMap>({})
  const [duplicateCpf, setDuplicateCpf] = useState<{ id: string; full_name: string } | null>(null)

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<PatientFormInput>({
    resolver: zodResolver(PatientSchema),
    defaultValues: {
      is_incapable: false,
      full_name: '',
      social_name: '',
      mother_name: '',
      cpf: '',
      cns: '',
      birth_date: '',
      ethnicity_detail: '',
      weight_kg: '',
      height_cm: '',
      phone: '',
      email: '',
      address: '',
      responsible_name: '',
    },
  })

  // Watch all values so inputs stay controlled (Base UI Input has internal state;
  // without an explicit value prop, setValue updates are swallowed on next re-render)
  const v = watch()
  const isIncapable = v.is_incapable ?? false

  async function runAiExtraction() {
    if (!aiText.trim()) { toast.error('Cole o texto antes de extrair'); return }
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/extract-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiText }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`)
      }
      const json = await res.json() as { data: PatientExtractionData }
      const d = json.data

      const newConf: ConfidenceMap = {}

      if (d.full_name)        { setValue('full_name',        d.full_name,        AI_SET_OPTS); newConf.full_name        = 'high' }
      if (d.social_name)      { setValue('social_name',      d.social_name,      AI_SET_OPTS); newConf.social_name      = 'high' }
      if (d.mother_name)      { setValue('mother_name',      d.mother_name,      AI_SET_OPTS); newConf.mother_name      = 'high' }
      if (d.cpf)              { setValue('cpf',              d.cpf,              AI_SET_OPTS); newConf.cpf              = 'high' }
      if (d.cns)              { setValue('cns',              d.cns,              AI_SET_OPTS); newConf.cns              = 'high' }
      if (d.phone)            { setValue('phone',            d.phone,            AI_SET_OPTS); newConf.phone            = 'high' }
      if (d.email)            { setValue('email',            d.email,            AI_SET_OPTS); newConf.email            = 'high' }
      if (d.address)          { setValue('address',          d.address,          AI_SET_OPTS); newConf.address          = 'high' }
      if (d.weight_kg)        { setValue('weight_kg',        String(d.weight_kg), AI_SET_OPTS); newConf.weight_kg       = 'high' }
      if (d.height_cm)        { setValue('height_cm',        String(d.height_cm), AI_SET_OPTS); newConf.height_cm       = 'high' }
      if (d.responsible_name) { setValue('responsible_name', d.responsible_name, AI_SET_OPTS); newConf.responsible_name = 'high' }

      if (d.birth_date) {
        const [dd, mm, yyyy] = d.birth_date.split('/')
        if (dd && mm && yyyy) {
          setValue('birth_date', `${yyyy}-${mm}-${dd}`, AI_SET_OPTS)
          newConf.birth_date = 'high'
        }
      }
      if (d.sex)            { setValue('sex',            d.sex,            AI_SET_OPTS); newConf.sex            = 'high' }
      if (d.race_ethnicity) { setValue('race_ethnicity', d.race_ethnicity, AI_SET_OPTS); newConf.race_ethnicity = 'high' }
      if (d.is_incapable)   { setValue('is_incapable',   true,             AI_SET_OPTS) }

      setConfidence(newConf)
      setShowAiModal(false)
      toast.success('Campos preenchidos! Revise antes de salvar.')

      if (d.cpf) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: memberData } = await supabase
            .from('workspace_members').select('workspace_id').eq('user_id', user.id).limit(1).maybeSingle()
          if (memberData) {
            const { data: existing } = await supabase
              .from('patients').select('id, full_name').eq('cpf', d.cpf).eq('workspace_id', memberData.workspace_id).maybeSingle()
            if (existing) setDuplicateCpf(existing)
          }
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao extrair dados')
    } finally {
      setAiLoading(false)
    }
  }

  async function onSubmit(data: PatientFormInput) {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: memberData } = await supabase
        .from('workspace_members').select('workspace_id').eq('user_id', user.id).limit(1).maybeSingle()
      if (!memberData) { router.push('/onboarding'); return }

      const { data: patient, error } = await supabase.from('patients').insert({
        workspace_id: memberData.workspace_id,
        created_by_user_id: user.id,
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
        is_incapable: data.is_incapable ?? false,
        responsible_name: data.is_incapable ? (data.responsible_name || null) : null,
        internal_notes: null,
        last_seen_by_user_id: null,
        last_seen_at: null,
      }).select('id').single()

      if (error) throw error
      toast.success('Paciente cadastrado com sucesso!')
      router.push(`/pacientes/${patient.id}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cadastrar paciente')
    } finally {
      setLoading(false)
    }
  }

  function fieldLabel(label: string, field: keyof PatientExtractionData) {
    const conf = confidence[field]
    return (
      <span className="flex items-center gap-1">
        {label}
        {conf && <ConfidenceDot level={conf} />}
      </span>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/pacientes">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novo paciente</h1>
            <p className="text-gray-500 text-sm">Preencha os dados do paciente</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
          onClick={() => setShowAiModal(true)}
        >
          <Sparkles className="h-4 w-4" />
          Preencher com IA
        </Button>
      </div>

      {duplicateCpf && (
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-300 rounded-lg text-sm">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-yellow-800">Já existe um paciente com este CPF: {duplicateCpf.full_name}</p>
            <p className="text-yellow-700 mt-0.5">Deseja editar o cadastro existente em vez de criar um novo?</p>
          </div>
          <Link href={`/pacientes/${duplicateCpf.id}/editar`}>
            <Button size="sm" variant="outline" className="gap-1 border-yellow-300 text-yellow-700 hover:bg-yellow-100">
              <ExternalLink className="h-3 w-3" /> Editar existente
            </Button>
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Identificação */}
        <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Identificação</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label>{fieldLabel('Nome completo *', 'full_name')}</Label>
              <Input {...register('full_name')} value={v.full_name ?? ''} className="mt-1" />
              {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
            </div>
            <div>
              <Label>{fieldLabel('Nome social', 'social_name')}</Label>
              <Input {...register('social_name')} value={v.social_name ?? ''} className="mt-1" placeholder="Se diferente do nome civil" />
            </div>
            <div>
              <Label>{fieldLabel('Nome da mãe *', 'mother_name')}</Label>
              <Input {...register('mother_name')} value={v.mother_name ?? ''} className="mt-1" />
              {errors.mother_name && <p className="text-xs text-red-500 mt-1">{errors.mother_name.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{fieldLabel('CPF *', 'cpf')}</Label>
              <Input {...register('cpf')} value={v.cpf ?? ''} className="mt-1" placeholder="000.000.000-00" />
              {errors.cpf && <p className="text-xs text-red-500 mt-1">{errors.cpf.message}</p>}
            </div>
            <div>
              <Label>{fieldLabel('CNS (Cartão Nacional de Saúde) *', 'cns')}</Label>
              <Input {...register('cns')} value={v.cns ?? ''} className="mt-1" placeholder="000 0000 0000 0000" />
              {errors.cns && <p className="text-xs text-red-500 mt-1">{errors.cns.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{fieldLabel('Data de nascimento *', 'birth_date')}</Label>
              <DateInput value={v.birth_date ?? ''} onChange={val => setValue('birth_date', val)} className="mt-1" />
              {errors.birth_date && <p className="text-xs text-red-500 mt-1">{errors.birth_date.message}</p>}
            </div>
            <div>
              <Label>{fieldLabel('Sexo *', 'sex')}</Label>
              <Controller
                control={control}
                name="sex"
                render={({ field }) => (
                  <Select value={field.value ?? undefined} onValueChange={val => field.onChange(val as 'M' | 'F' | 'O')}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
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
              <Label>{fieldLabel('Raça/Cor *', 'race_ethnicity')}</Label>
              <Controller
                control={control}
                name="race_ethnicity"
                render={({ field }) => (
                  <Select value={field.value ?? undefined} onValueChange={val => field.onChange(val as 'Branca' | 'Preta' | 'Parda' | 'Amarela' | 'Indígena')}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
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

        {/* Dados clínicos */}
        <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Dados clínicos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{fieldLabel('Peso (kg) *', 'weight_kg')}</Label>
              <Input {...register('weight_kg')} value={v.weight_kg ?? ''} type="number" step="0.1" className="mt-1" placeholder="0.0" />
              {errors.weight_kg && <p className="text-xs text-red-500 mt-1">{errors.weight_kg.message}</p>}
            </div>
            <div>
              <Label>{fieldLabel('Altura (cm) *', 'height_cm')}</Label>
              <Input {...register('height_cm')} value={v.height_cm ?? ''} type="number" className="mt-1" placeholder="0" />
              {errors.height_cm && <p className="text-xs text-red-500 mt-1">{errors.height_cm.message}</p>}
            </div>
          </div>
        </section>

        {/* Contato */}
        <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Contato e endereço</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{fieldLabel('Telefone *', 'phone')}</Label>
              <Input {...register('phone')} value={v.phone ?? ''} className="mt-1" placeholder="(00) 00000-0000" />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <Label>{fieldLabel('E-mail', 'email')}</Label>
              <Input {...register('email')} value={v.email ?? ''} type="email" className="mt-1" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
          </div>
          <div>
            <Label>{fieldLabel('Endereço completo *', 'address')}</Label>
            <Input {...register('address')} value={v.address ?? ''} className="mt-1" placeholder="Rua, número, bairro, cidade - UF" />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
          </div>
        </section>

        {/* Responsável legal */}
        <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Capacidade civil</h2>
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_incapable"
              checked={isIncapable}
              onCheckedChange={val => setValue('is_incapable', Boolean(val))}
            />
            <Label htmlFor="is_incapable" className="cursor-pointer">Paciente é incapaz civilmente (menor ou interdito)</Label>
          </div>
          {isIncapable && (
            <div>
              <Label>{fieldLabel('Nome do responsável legal *', 'responsible_name')}</Label>
              <Input {...register('responsible_name')} value={v.responsible_name ?? ''} className="mt-1" />
              {errors.responsible_name && <p className="text-xs text-red-500 mt-1">{errors.responsible_name.message}</p>}
            </div>
          )}
        </section>

        <div className="flex justify-end gap-3">
          <Link href="/pacientes">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={loading} className="gap-2">
            <Save className="h-4 w-4" />
            {loading ? 'Salvando...' : 'Cadastrar paciente'}
          </Button>
        </div>
      </form>

      {/* Modal IA */}
      <Dialog open={showAiModal} onOpenChange={setShowAiModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              Preencher com IA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Cole o texto da aba &quot;Informações Pessoais&quot; do Tasy ou de outro prontuário eletrônico.
              A IA vai extrair os campos automaticamente.
            </p>
            <Textarea
              className="min-h-52 font-mono text-xs"
              placeholder={`Exemplo:
Paciente: JOÃO DA SILVA SOUZA
Data Nasc.: 15/03/1965    Sexo: M    Cor/Raça: Parda
CPF: 123.456.789-00       CNS: 123456789012345
Mãe: MARIA DA SILVA
Tel.: (31) 99999-8888
End.: Rua das Flores, 123, Bairro Centro, BH/MG
Peso: 78kg    Alt.: 1,72m`}
              value={aiText}
              onChange={e => setAiText(e.target.value)}
              disabled={aiLoading}
            />
            <p className="text-xs text-gray-400">{aiText.length} caracteres</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAiModal(false)} disabled={aiLoading}>
              Cancelar
            </Button>
            <Button onClick={runAiExtraction} disabled={aiLoading || !aiText.trim()} className="gap-2">
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {aiLoading ? 'Extraindo...' : 'Extrair dados'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
