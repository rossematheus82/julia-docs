import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getActiveWorkspace } from '@/lib/active-workspace'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { differenceInDays, parseISO as parseISO2 } from 'date-fns'
import { ArrowLeft, FileText, Download, User, Stethoscope, Building2, Calendar, PencilLine, Info } from 'lucide-react'
import { LmePdfButtons } from './lme-pdf-buttons'
import { DeleteLmeButton } from './delete-lme-button'

const STATUS_COLORS: Record<string, string> = {
  rascunho: 'bg-gray-100 text-gray-700',
  emitida: 'bg-green-100 text-green-700',
}

const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho', emitida: 'Emitida',
}

const DISEASE_LABELS: Record<string, string> = {
  asma: 'Asma', dpoc: 'DPOC', 'dpi-fp': 'DPI-FP', hap: 'HAP',
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  inicial: 'Processo Completo', renovacao: 'LME + Receita',
  reavaliacao: 'Processo Completo',
}

export default async function LmeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const active = await getActiveWorkspace(supabase, user.id)
  if (!active) redirect('/onboarding')
  const memberData = { workspace_id: active.workspaceId }

  const { id } = await params

  const { data: lme } = await supabase
    .from('lmes')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', memberData.workspace_id)
    .single()

  if (!lme) notFound()

  const isCreator = lme.created_by_user_id === user.id

  type PatSnap = { full_name?: string; cpf?: string; cns?: string; birth_date?: string }
  type DocSnap = { full_name?: string; crm?: string; crm_uf?: string; specialty?: string }
  type FacSnap = { name?: string; cnes?: string; city?: string; state?: string }
  const patient  = (lme.patient_snapshot  ?? {}) as PatSnap
  const doctor   = (lme.doctor_snapshot   ?? {}) as DocSnap
  const facility = (lme.facility_snapshot ?? {}) as FacSnap

  const HAP_SITUACOES_KEYS = ['doenca_hepatica_grave', 'suspeita_venoclusiva', 'hap_idiopatica_75anos', 'hap_estavel_monoterapia', 'vasorreatividade_positiva']
  const sfData = (lme.specific_form_data ?? {}) as Record<string, unknown>
  const situacoesData = (sfData.situacoes ?? {}) as Record<string, unknown>
  const situacoesOk = lme.disease !== 'hap'
    ? undefined
    : HAP_SITUACOES_KEYS.every(k => situacoesData[k] != null)

  const renewalDays = lme.next_renewal_date
    ? differenceInDays(parseISO2(lme.next_renewal_date), new Date())
    : null
  const renewalDot = renewalDays == null ? null
    : renewalDays < 30 ? '🔴' : renewalDays < 60 ? '🟡' : '🟢'

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/lmes">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                LME — {DISEASE_LABELS[lme.disease]}
              </h1>
              <Badge className={`text-sm ${STATUS_COLORS[lme.status]}`}>
                {STATUS_LABELS[lme.status]}
              </Badge>
            </div>
            <p className="text-gray-500 text-sm">
              {REQUEST_TYPE_LABELS[lme.request_type]} · Criada em {format(parseISO(lme.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
        {isCreator && (
          <Link href={`/lmes/${id}/editar`}>
            <Button variant="outline" className="gap-2">
              <PencilLine className="h-4 w-4" /> Preencher / Editar campos
            </Button>
          </Link>
        )}
      </div>

      {!isCreator && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-900">
              Esta LME foi emitida por Dr. {doctor?.full_name ?? '—'}{doctor?.crm ? ` (CRM ${doctor.crm}${doctor?.crm_uf ? `/${doctor.crm_uf}` : ''})` : ''}.
            </p>
            <p className="text-amber-800 mt-1">
              Você pode <strong>baixar</strong> o documento original (preserva os dados do médico que emitiu), mas não pode editá-lo nem gerá-lo novamente em seu nome.
              Para emitir uma LME em seu nome, use <strong>Renovar / repetir em meu nome</strong>.
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-4">
          {/* Paciente */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" /> Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Nome</span>
                <Link href={`/pacientes/${lme.patient_id}`} className="font-medium text-blue-600 hover:underline">
                  {patient?.full_name}
                </Link>
              </div>
              {patient?.cpf && (
                <div className="flex justify-between">
                  <span className="text-gray-500">CPF</span>
                  <span className="font-medium">{patient.cpf}</span>
                </div>
              )}
              {patient?.cns && (
                <div className="flex justify-between">
                  <span className="text-gray-500">CNS</span>
                  <span className="font-medium">{patient.cns}</span>
                </div>
              )}
              {patient?.birth_date && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Nascimento</span>
                  <span className="font-medium">{format(parseISO(patient.birth_date), 'dd/MM/yyyy')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Médico */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Stethoscope className="h-4 w-4" /> Médico responsável
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Nome</span>
                <span className="font-medium">Dr. {doctor?.full_name}</span>
              </div>
              {doctor?.crm && (
                <div className="flex justify-between">
                  <span className="text-gray-500">CRM</span>
                  <span className="font-medium">{doctor.crm}/{doctor.crm_uf}</span>
                </div>
              )}
              {doctor?.specialty && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Especialidade</span>
                  <span className="font-medium">{doctor.specialty}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estabelecimento */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Estabelecimento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Nome</span>
                <span className="font-medium">{facility?.name}</span>
              </div>
              {facility?.cnes && (
                <div className="flex justify-between">
                  <span className="text-gray-500">CNES</span>
                  <span className="font-medium">{facility.cnes}</span>
                </div>
              )}
              {facility?.city && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Cidade</span>
                  <span className="font-medium">{facility.city}{facility.state ? `/${facility.state}` : ''}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CID-10 e dados da LME */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Dados da solicitação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">CID-10</span>
                <span className="font-medium">{lme.cid10}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Doença</span>
                <span className="font-medium">{DISEASE_LABELS[lme.disease]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tipo de solicitação</span>
                <span className="font-medium">{REQUEST_TYPE_LABELS[lme.request_type]}</span>
              </div>
              {lme.next_renewal_date && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Data de renovação</span>
                  <span className="font-medium text-orange-600">
                    {format(parseISO(lme.next_renewal_date), 'dd/MM/yyyy')}
                  </span>
                </div>
              )}
              {lme.parent_lme_id && (
                <div className="flex justify-between">
                  <span className="text-gray-500">LME anterior</span>
                  <Link href={`/lmes/${lme.parent_lme_id}`} className="text-blue-600 hover:underline text-xs">
                    #{lme.parent_lme_id.slice(0, 8)}
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-4">
          {/* Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Status da LME</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Status</span>
                <Badge className={STATUS_COLORS[lme.status] ?? 'bg-gray-100 text-gray-700'}>
                  {STATUS_LABELS[lme.status] ?? lme.status}
                </Badge>
              </div>
              {lme.next_renewal_date && renewalDays != null && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Renovar em</span>
                    <span className="font-medium">{format(parseISO(lme.next_renewal_date), 'dd/MM/yyyy')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Prazo</span>
                    <span className={`font-semibold text-sm ${renewalDays < 30 ? 'text-red-600' : renewalDays < 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {renewalDot} {renewalDays}d restantes
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* PDFs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="h-4 w-4" /> Documentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LmePdfButtons
                lmeId={id}
                disease={lme.disease}
                hasLmeData={!!lme.lme_data && Object.keys(lme.lme_data as object).length > 0}
                hasSpecificFormData={!!lme.specific_form_data && Object.keys(lme.specific_form_data as object).length > 0}
                lmePdfUrl={lme.lme_pdf_url}
                specificFormPdfUrl={lme.specific_form_pdf_url}
                prescriptionPdfUrl={lme.prescription_pdf_url}
                situacoesOk={situacoesOk}
                isCreator={isCreator}
              />
            </CardContent>
          </Card>

          {/* Histórico */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Histórico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Criada</span>
                <span>{format(parseISO(lme.created_at), 'dd/MM/yyyy HH:mm')}</span>
              </div>
              <div className="flex justify-between">
                <span>Atualizada</span>
                <span>{format(parseISO(lme.updated_at), 'dd/MM/yyyy HH:mm')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Excluir LME (confirmação no botão) — apenas o criador pode excluir */}
          {isCreator && (
            <div className="pt-2">
              <DeleteLmeButton lmeId={id} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
