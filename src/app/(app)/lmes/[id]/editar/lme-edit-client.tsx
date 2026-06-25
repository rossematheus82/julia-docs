'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LmeFormEditor } from '@/components/lme/lme-form-editor'
import { ArrowLeft, Save, FileText } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { getCidsByDoenca } from '@/lib/cid10'
import type { Disease, RequestType, Json } from '@/lib/supabase/types'

interface Props {
  lmeId: string
  disease: Disease
  requestType: RequestType
  lmeData: Record<string, unknown>
  specificFormData: Record<string, unknown>
  aiUsed: boolean
  cid10?: string | null
  patientBirthDate?: string | null
  patientIncapable?: boolean | null
  patientResponsibleName?: string | null
}

export function LmeEditClient({ lmeId, disease, requestType, lmeData, specificFormData, aiUsed, cid10, patientBirthDate, patientIncapable, patientResponsibleName }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [currentLmeData, setCurrentLmeData] = useState<Record<string, unknown>>(lmeData)
  const [currentSpecificData, setCurrentSpecificData] = useState<Record<string, unknown>>(specificFormData)
  const [currentCid10, setCurrentCid10] = useState<string>(cid10 ?? '')
  const [saving, setSaving] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  const cids = getCidsByDoenca(disease)

  async function saveDraft() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('lmes')
        .update({
          cid10: currentCid10,
          // mantém o cid10 dentro de lme_data sincronizado (a rota de PDF prioriza raw.cid10)
          lme_data: { ...currentLmeData, cid10: currentCid10 } as unknown as Json,
          specific_form_data: currentSpecificData as unknown as Json,
        })
        .eq('id', lmeId)
      if (error) throw error
      toast.success('Rascunho salvo!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function saveAndGeneratePdf() {
    if (typeof currentLmeData.tratamento_previo !== 'boolean') {
      toast.error('Informe se o paciente realizou ou está em tratamento da doença.')
      return
    }
    setGeneratingPdf(true)
    try {
      const { error } = await supabase
        .from('lmes')
        .update({
          cid10: currentCid10,
          // mantém o cid10 dentro de lme_data sincronizado (a rota de PDF prioriza raw.cid10)
          lme_data: { ...currentLmeData, cid10: currentCid10 } as unknown as Json,
          specific_form_data: currentSpecificData as unknown as Json,
        })
        .eq('id', lmeId)
      if (error) throw error

      const res = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lmeId, type: 'all' }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Erro ao gerar PDF')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Processo_${lmeId.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Processo gerado com sucesso!')
      router.push(`/lmes/${lmeId}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar PDF')
    } finally {
      setGeneratingPdf(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/lmes/${lmeId}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Preencher campos da LME</h1>
          <p className="text-sm text-gray-500">Edite os campos e salve como rascunho ou gere o PDF</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <Label className="text-sm font-medium text-gray-700">CID-10 *</Label>
        <p className="text-xs text-gray-500 mb-2">Pode ser corrigido aqui caso o processo tenha voltado por erro no CID.</p>
        <Select value={currentCid10 || undefined} onValueChange={setCurrentCid10}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o CID-10" /></SelectTrigger>
          <SelectContent>
            {cids.map(cid => (
              <SelectItem key={cid.codigo} value={cid.codigo}>
                {cid.codigo} — {cid.descricao}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <LmeFormEditor
          lmeData={currentLmeData}
          specificData={currentSpecificData}
          disease={disease}
          requestType={requestType}
          aiUsed={aiUsed}
          cid10={currentCid10}
          patientBirthDate={patientBirthDate}
          patientIncapable={patientIncapable}
          patientResponsibleName={patientResponsibleName}
          onLmeDataChange={setCurrentLmeData}
          onSpecificDataChange={setCurrentSpecificData}
        />
      </div>

      <div className="flex justify-between gap-3">
        <Link href={`/lmes/${lmeId}`}>
          <Button variant="outline">Cancelar</Button>
        </Link>
        <div className="flex gap-3">
          <Button variant="outline" onClick={saveDraft} disabled={saving || generatingPdf} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar rascunho'}
          </Button>
          <Button onClick={saveAndGeneratePdf} disabled={saving || generatingPdf} className="gap-2">
            <FileText className="h-4 w-4" />
            {generatingPdf ? 'Gerando PDF...' : 'Salvar e gerar PDF'}
          </Button>
        </div>
      </div>
    </div>
  )
}
