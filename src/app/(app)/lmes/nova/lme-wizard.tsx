'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { validateLme } from './validate'
import { Step1Disease } from './steps/step1-disease'
import { Step2RequestType } from './steps/step2-request-type'
import { Step3Patient } from './steps/step3-patient'
import { Step4DoctorFacility } from './steps/step4-doctor-facility'
import { Step5Prontuario } from './steps/step5-prontuario'
import { Step6Review } from './steps/step6-review'
import type { Disease, RequestType, Json } from '@/lib/supabase/types'

export interface PatientItem { id: string; full_name: string; birth_date?: string | null; cpf?: string | null; cns?: string | null; is_incapable?: boolean | null; responsible_name?: string | null; weight_kg?: number | null; height_cm?: number | null }
export interface DoctorItem { id: string; full_name: string; crm: string; crm_uf: string; specialty?: string | null }
export interface FacilityItem { id: string; name: string; cnes?: string | null; city?: string | null; state?: string | null }

export interface WizardData {
  disease: Disease | null
  request_type: RequestType | null
  patient_id: string | null
  doctor_id: string | null
  facility_id: string | null
  cid10: string
  lme_data: Record<string, unknown>
  specific_form_data: Record<string, unknown>
  prescription_data: Record<string, unknown>
  aiUsed: boolean
}

const STEPS = [
  { label: 'Doença', short: '1' },
  { label: 'Tipo', short: '2' },
  { label: 'Paciente', short: '3' },
  { label: 'Médico/Local', short: '4' },
  { label: 'Dados', short: '5' },
  { label: 'Revisão', short: '6' },
]

interface Props {
  patients: PatientItem[]
  doctors: DoctorItem[]
  facilities: FacilityItem[]
  workspaceId: string
  userId: string
  canManageFacilities: boolean
  defaultPatientId?: string
}

export function LmeWizard({ patients, doctors, facilities, workspaceId, userId, canManageFacilities, defaultPatientId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const initialPatientId = defaultPatientId && patients.some(patient => patient.id === defaultPatientId)
    ? defaultPatientId
    : null

  const [data, setData] = useState<WizardData>({
    disease: null,
    request_type: null,
    patient_id: initialPatientId,
    // Médico do usuário logado é fixo (auto-selecionado) — não dá pra escolher outro
    doctor_id: doctors[0]?.id ?? null,
    facility_id: null,
    cid10: '',
    lme_data: {},
    specific_form_data: {},
    prescription_data: {},
    aiUsed: false,
  })

  const update = useCallback((patch: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...patch }))
  }, [])

  function canAdvance(): boolean {
    if (step === 0) return !!data.disease
    if (step === 1) return !!data.request_type && !!data.cid10
    if (step === 2) return !!data.patient_id
    if (step === 3) return !!data.doctor_id && !!data.facility_id
    if (step === 4) return typeof data.lme_data.tratamento_previo === 'boolean'
    return true
  }

  function advance() {
    if (!canAdvance()) return
    // O CID NÃO é pré-selecionado de propósito — o médico escolhe explicitamente
    // (evita emitir com o CID errado por esquecer de trocar o padrão).
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  function back() {
    setStep(s => Math.max(s - 1, 0))
  }

  async function submit() {
    // Coleta TODOS os erros de uma vez (não para no primeiro)
    const issues = validateLme(data)
    if (issues.length > 0) {
      // Toast com lista do que falta + navega pro primeiro passo com erro
      const lista = issues.slice(0, 6).map(i => `• ${i.mensagem}`).join('\n')
      const extra = issues.length > 6 ? `\n…e mais ${issues.length - 6}` : ''
      toast.error(`Faltam ${issues.length} campo(s):\n${lista}${extra}`, { duration: 8000 })
      setStep(issues[0].step)
      return
    }

    setSaving(true)
    try {
      const patient = patients.find(p => p.id === data.patient_id)
      const doctor = doctors.find(d => d.id === data.doctor_id)
      const facility = facilities.find(f => f.id === data.facility_id)

      const { data: lme, error } = await supabase.from('lmes').insert({
        workspace_id: workspaceId,
        patient_id: data.patient_id!,
        doctor_id: data.doctor_id!,
        facility_id: data.facility_id!,
        created_by_user_id: userId,
        last_edited_by_user_id: null,
        disease: data.disease!,
        request_type: data.request_type!,
        cid10: data.cid10,
        status: 'emitida' as const,
        lme_data: data.lme_data as unknown as Json,
        specific_form_data: data.specific_form_data as unknown as Json,
        prescription_data: data.prescription_data as unknown as Json,
        patient_snapshot: patient ?? {},
        doctor_snapshot: doctor ?? {},
        facility_snapshot: facility ?? {},
        lme_pdf_url: null,
        specific_form_pdf_url: null,
        prescription_pdf_url: null,
        parent_lme_id: null,
        next_renewal_date: null,
      }).select('id').single()

      if (error) throw error
      toast.success('LME criada com sucesso!')
      router.push(`/lmes/${lme.id}`)
    } catch (err: unknown) {
      // Erros do Supabase (PostgrestError) trazem message/details/hint/code — vamos exibir tudo
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = err as any
      const partes = [e?.message, e?.details, e?.hint].filter(Boolean)
      const code = e?.code ? ` (code: ${e.code})` : ''
      const msg = partes.length > 0 ? partes.join(' — ') + code : 'Erro ao criar LME'
      toast.error(msg, { duration: 10000 })
    } finally {
      setSaving(false)
    }
  }

  const stepProps = { data, update, patients, doctors, facilities }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Progresso */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Nova LME</h1>
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 transition-colors ${
                i < step ? 'bg-blue-600 text-white' : i === step ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {i < step ? <Check className="h-4 w-4" /> : s.short}
              </div>
              <div className="hidden sm:block ml-1 mr-2 text-xs text-gray-500">{s.label}</div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Conteúdo do step */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 min-h-64">
        {step === 0 && <Step1Disease {...stepProps} />}
        {step === 1 && <Step2RequestType {...stepProps} />}
        {step === 2 && <Step3Patient {...stepProps} />}
        {step === 3 && <Step4DoctorFacility {...stepProps} canManageFacilities={canManageFacilities} />}
        {step === 4 && <Step5Prontuario data={data} update={update} patients={patients} />}
        {step === 5 && <Step6Review {...stepProps} patients={patients} doctors={doctors} facilities={facilities} />}
      </div>

      {/* Navegação */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={back} disabled={step === 0}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={advance} disabled={!canAdvance()}>
            Próximo <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={submit} disabled={saving || !canAdvance()}>
            {saving ? 'Salvando...' : 'Criar LME'}
          </Button>
        )}
      </div>
    </div>
  )
}
