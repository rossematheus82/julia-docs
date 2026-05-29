'use client'

import { useState } from 'react'
import type { WizardData, PatientItem } from '../lme-wizard'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { LmeFormEditor } from '@/components/lme/lme-form-editor'
import { Sparkles, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ExtractionResult {
  lme?: { data: Record<string, unknown>; warnings?: string[] }
  specific?: { data: Record<string, unknown>; warnings?: string[] }
}

interface Props {
  data: WizardData
  update: (patch: Partial<WizardData>) => void
  patients?: PatientItem[]
}

export function Step5Prontuario({ data, update, patients }: Props) {
  const patient = patients?.find(p => p.id === data.patient_id)
  const patientBirthDate = patient?.birth_date ?? null
  const patientIncapable = patient?.is_incapable ?? false
  const patientResponsibleName = patient?.responsible_name ?? null
  const patientWeight = patient?.weight_kg != null ? String(patient.weight_kg) : null
  const patientHeight = patient?.height_cm != null ? String(patient.height_cm) : null

  const [showAi, setShowAi] = useState(false)
  const [prontuario, setProntuario] = useState('')
  const [anonymize, setAnonymize] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ExtractionResult | null>(null)

  async function runExtraction() {
    if (!prontuario.trim()) { toast.error('Cole o texto do prontuário antes de extrair'); return }
    if (!data.disease) return
    setLoading(true)
    try {
      const res = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disease: data.disease, requestType: data.request_type, prontuario, anonymize }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? 'Erro na extração') }
      const json = await res.json() as ExtractionResult
      setResult(json)
      // Faz merge — não sobrescreve o que o médico já preencheu manualmente
      update({
        lme_data: { ...(json.lme?.data ?? {}), ...data.lme_data },
        specific_form_data: { ...(json.specific?.data ?? {}), ...data.specific_form_data },
        aiUsed: true,
      })
      toast.success('IA preencheu os campos! Revise antes de avançar.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao extrair dados')
    } finally {
      setLoading(false)
    }
  }

  const warnings = [...(result?.lme?.warnings ?? []), ...(result?.specific?.warnings ?? [])]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Dados da LME</h2>
        <p className="text-sm text-gray-500">Preencha os campos abaixo. Se quiser, use a IA pra extrair de um prontuário.</p>
      </div>

      {/* Assistente IA — colapsável, opcional */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAi(v => !v)}
          className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-800">Assistente IA — extrair do prontuário</span>
            <span className="text-xs text-gray-500">(opcional)</span>
          </div>
          {showAi ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </button>

        {showAi && (
          <div className="p-4 space-y-3 bg-white border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Anonimizar antes de enviar (substitui nome/CPF/CNS/tel)</span>
              <Switch checked={anonymize} onCheckedChange={setAnonymize} />
            </div>

            <div>
              <Label className="text-xs">Texto do prontuário</Label>
              <Textarea
                className="mt-1 min-h-32 font-mono text-xs"
                placeholder="Cole aqui o prontuário, evolução clínica, exames ou relatório médico..."
                value={prontuario}
                onChange={e => setProntuario(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">{prontuario.length} caracteres</p>
            </div>

            <Button onClick={runExtraction} disabled={loading || !prontuario.trim()} size="sm" className="gap-2 w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? 'Extraindo...' : 'Preencher campos com IA'}
            </Button>

            {result && (
              <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800 flex items-start gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  {Object.keys(result.lme?.data ?? {}).length} campos comuns + {Object.keys(result.specific?.data ?? {}).length} específicos preenchidos. Revise abaixo.
                </span>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                <div className="flex items-center gap-1 font-medium mb-0.5">
                  <AlertCircle className="h-3 w-3" /> Avisos da IA
                </div>
                <ul className="space-y-0.5 pl-3 list-disc">
                  {warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Formulário — SEMPRE visível */}
      <LmeFormEditor
        lmeData={data.lme_data}
        specificData={data.specific_form_data}
        disease={data.disease}
        requestType={data.request_type}
        aiUsed={data.aiUsed}
        cid10={data.cid10}
        patientBirthDate={patientBirthDate}
        patientIncapable={patientIncapable}
        patientResponsibleName={patientResponsibleName}
        patientWeight={patientWeight}
        patientHeight={patientHeight}
        onLmeDataChange={lme_data => update({ lme_data })}
        onSpecificDataChange={specific_form_data => update({ specific_form_data })}
      />
    </div>
  )
}
