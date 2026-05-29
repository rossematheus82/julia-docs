'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, RefreshCw, Calendar, User, Stethoscope, Building2, FileText, FilePlus2 } from 'lucide-react'
import Link from 'next/link'
import { format, parseISO, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import type { Lme, Disease, RequestType, Json } from '@/lib/supabase/types'
import { LmeFormEditor } from '@/components/lme/lme-form-editor'
import { getCidsByDoenca } from '@/lib/cid10'
import { cn } from '@/lib/utils'

const DISEASE_LABELS: Record<string, string> = {
  asma: 'Asma', dpoc: 'DPOC', 'dpi-fp': 'DPI-FP', hap: 'HAP',
}

type RenovarMode = 'lme_only' | 'lme_plus_specific'

interface Props {
  lme: Lme
  doctor: { id: string; full_name: string; crm: string; crm_uf: string; specialty?: string | null; cns?: string | null }
  facilities: { id: string; name: string; cnes?: string | null }[]
  workspaceId: string
  userId: string
  patientWeight: string | null
  patientHeight: string | null
  patientBirthDate: string | null
  patientIncapable: boolean | null
  patientResponsibleName: string | null
}

export function RenovarClient({
  lme, doctor, facilities, workspaceId, userId,
  patientWeight, patientHeight, patientBirthDate, patientIncapable, patientResponsibleName,
}: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [mode, setMode] = useState<RenovarMode | null>(null)
  const [facilityId, setFacilityId] = useState(lme.facility_id)
  const [currentCid10, setCurrentCid10] = useState<string>(lme.cid10 ?? '')
  const cids = getCidsByDoenca(lme.disease as Disease)
  const [lmeData, setLmeData] = useState<Record<string, unknown>>(
    (lme.lme_data ?? {}) as Record<string, unknown>,
  )
  const [specificFormData, setSpecificFormData] = useState<Record<string, unknown>>(
    (lme.specific_form_data ?? {}) as Record<string, unknown>,
  )
  const [loading, setLoading] = useState(false)

  const patient = (lme.patient_snapshot ?? {}) as { full_name?: string; cpf?: string }
  const nextRenewal = addDays(new Date(), 180)

  // Quando "renovar só LME", trate como request_type='renovacao' (esconde formulário específico).
  // Quando "renovar processo completo", trate como 'inicial' (mostra formulário específico).
  const effectiveRequestType: RequestType = mode === 'lme_plus_specific' ? 'inicial' : 'renovacao'

  async function confirm() {
    if (!mode) {
      toast.error('Escolha o escopo da renovação primeiro.')
      return
    }
    if (!facilityId) {
      toast.error('Selecione o estabelecimento.')
      return
    }
    setLoading(true)
    try {
      const facility = facilities.find(f => f.id === facilityId)

      const { data: newLme, error } = await supabase.from('lmes').insert({
        workspace_id: workspaceId,
        patient_id: lme.patient_id,
        doctor_id: doctor.id,
        facility_id: facilityId,
        created_by_user_id: userId,
        last_edited_by_user_id: null,
        disease: lme.disease,
        request_type: effectiveRequestType,
        cid10: currentCid10,
        status: 'emitida' as const,
        lme_data: { ...lmeData, cid10: currentCid10 } as unknown as Json,
        specific_form_data: (mode === 'lme_plus_specific' ? specificFormData : (lme.specific_form_data ?? {})) as unknown as Json,
        prescription_data: lme.prescription_data ?? {},
        patient_snapshot: lme.patient_snapshot,
        doctor_snapshot: doctor,
        facility_snapshot: facility ?? lme.facility_snapshot,
        lme_pdf_url: null,
        specific_form_pdf_url: null,
        prescription_pdf_url: null,
        parent_lme_id: lme.id,
        next_renewal_date: null,
      }).select('id').single()

      if (error) throw error
      toast.success('Renovação criada em seu nome!')
      router.push(`/lmes/${newLme.id}`)
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = err as any
      const partes = [e?.message, e?.details, e?.hint].filter(Boolean)
      const code = e?.code ? ` (code: ${e.code})` : ''
      toast.error(partes.length > 0 ? partes.join(' — ') + code : 'Erro ao criar renovação', { duration: 8000 })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/lmes/${lme.id}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Renovar LME</h1>
          <p className="text-gray-500 text-sm">
            {DISEASE_LABELS[lme.disease]} — nova LME em seu nome (Dr. {doctor.full_name})
          </p>
        </div>
      </div>

      {/* Escolha do escopo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">O que você quer renovar?</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode('lme_only')}
            className={cn(
              'text-left border-2 rounded-lg p-4 transition-colors',
              mode === 'lme_only'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white',
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText className={cn('h-5 w-5', mode === 'lme_only' ? 'text-blue-700' : 'text-gray-500')} />
              <span className="font-semibold text-sm">Apenas a LME (medicamentos)</span>
            </div>
            <p className="text-xs text-gray-600">
              Mantém o formulário específico anterior. Você ajusta posologia, quantidade e dados clínicos do laudo.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setMode('lme_plus_specific')}
            className={cn(
              'text-left border-2 rounded-lg p-4 transition-colors',
              mode === 'lme_plus_specific'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white',
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <FilePlus2 className={cn('h-5 w-5', mode === 'lme_plus_specific' ? 'text-blue-700' : 'text-gray-500')} />
              <span className="font-semibold text-sm">LME + formulário específico</span>
            </div>
            <p className="text-xs text-gray-600">
              Permite refazer/ajustar também o formulário específico da doença ({DISEASE_LABELS[lme.disease]}). Use quando exames ou critérios mudaram.
            </p>
          </button>
        </CardContent>
      </Card>

      {/* Resumo do paciente + médico + estabelecimento */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> Paciente</CardTitle></CardHeader>
          <CardContent>
            <p className="font-medium text-sm">{patient?.full_name}</p>
            {patient?.cpf && <p className="text-xs text-gray-500">CPF: {patient.cpf}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Stethoscope className="h-4 w-4" /> Médico (você)</CardTitle></CardHeader>
          <CardContent>
            <p className="font-medium text-sm">Dr. {doctor.full_name}</p>
            <p className="text-xs text-gray-500">CRM {doctor.crm}/{doctor.crm_uf}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" /> Próx. renovação</CardTitle></CardHeader>
          <CardContent>
            <p className="font-medium text-sm text-orange-600">
              {format(nextRenewal, 'dd/MM/yyyy', { locale: ptBR })}
            </p>
            <p className="text-xs text-gray-500">LME original: {format(parseISO(lme.created_at), 'dd/MM/yyyy')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Estabelecimento */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" /> Estabelecimento</CardTitle></CardHeader>
        <CardContent>
          <Label className="mb-2 block text-xs">Onde você está atendendo</Label>
          <Select value={facilityId} onValueChange={setFacilityId}>
            <SelectTrigger><SelectValue placeholder="Selecione o estabelecimento" /></SelectTrigger>
            <SelectContent>
              {facilities.map(f => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}{f.cnes ? ` — CNES ${f.cnes}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* CID-10 — editável na renovação (corrigir caso o processo tenha voltado por erro no CID) */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> CID-10</CardTitle></CardHeader>
        <CardContent>
          <Label className="mb-2 block text-xs">Confirme ou corrija o CID-10 da renovação</Label>
          <Select value={currentCid10 || undefined} onValueChange={setCurrentCid10}>
            <SelectTrigger><SelectValue placeholder="Selecione o CID-10" /></SelectTrigger>
            <SelectContent>
              {cids.map(cid => (
                <SelectItem key={cid.codigo} value={cid.codigo}>
                  {cid.codigo} — {cid.descricao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Editor inline (só aparece quando o escopo foi escolhido) */}
      {mode && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {mode === 'lme_only' ? 'Ajustar dados da LME' : 'Ajustar LME + formulário específico'}
            </CardTitle>
            <p className="text-xs text-gray-500">
              Os campos vieram pré-preenchidos da LME anterior — edite só o que mudou.
            </p>
          </CardHeader>
          <CardContent>
            <LmeFormEditor
              lmeData={lmeData}
              specificData={specificFormData}
              disease={lme.disease as Disease}
              requestType={effectiveRequestType}
              aiUsed={false}
              onLmeDataChange={setLmeData}
              onSpecificDataChange={setSpecificFormData}
              patientWeight={patientWeight}
              patientHeight={patientHeight}
              patientBirthDate={patientBirthDate}
              patientIncapable={patientIncapable}
              patientResponsibleName={patientResponsibleName}
              cid10={currentCid10}
            />
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 justify-end sticky bottom-4">
        <Link href={`/lmes/${lme.id}`}>
          <Button variant="outline">Cancelar</Button>
        </Link>
        <Button
          onClick={confirm}
          disabled={loading || !mode || !facilityId}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {loading ? 'Criando...' : 'Criar renovação em meu nome'}
        </Button>
      </div>
    </div>
  )
}
