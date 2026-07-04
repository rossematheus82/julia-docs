import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getActiveWorkspace } from '@/lib/active-workspace'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Plus, FileText, Edit, Phone, Mail, MapPin, User } from 'lucide-react'
import { DeletePatientButton } from './delete-patient-button'
import { TimelineActions } from './timeline-actions'
import { lmeCode } from '@/lib/lme-code'
import { calcularIdade, formatarData } from '@/lib/utils/date'
import { isPlatformAdminEmail } from '@/lib/platform-admin'

const DISEASE_LABELS: Record<string, string> = {
  asma: 'Asma', dpoc: 'DPOC', 'dpi-fp': 'DPI-FP', hap: 'HAP',
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  inicial: 'Processo Completo', renovacao: 'LME + Receita',
  reavaliacao: 'Processo Completo',
}

export default async function PacienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const active = await getActiveWorkspace(supabase, user.id)
  if (!active) redirect('/onboarding')
  const memberData = { workspace_id: active.workspaceId }

  const { id } = await params

  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', memberData.workspace_id)
    .is('deleted_at', null)
    .single()

  if (!patient) notFound()

  type LmeRow = {
    id: string; disease: string; request_type: string; status: string
    created_at: string; next_renewal_date: string | null
    lme_data: Record<string, unknown> | null
    doctor: { full_name: string; crm: string; crm_uf: string } | null
  }
  const { data: lmes } = await supabase
    .from('lmes')
    .select('id, disease, request_type, status, created_at, next_renewal_date, lme_data, doctor:doctors(full_name, crm, crm_uf)')
    .eq('patient_id', id)
    .neq('status', 'rascunho') // ignora LMEs em rascunho (legado)
    .order('created_at', { ascending: false }) as { data: LmeRow[] | null }

  const age = calcularIdade(patient.birth_date)
  const canDeletePatient =
    patient.created_by_user_id === user.id ||
    active.role === 'owner' ||
    active.role === 'admin' ||
    isPlatformAdminEmail(user.email)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/pacientes">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{patient.full_name}</h1>
            {patient.social_name && (
              <p className="text-sm text-gray-500">Nome social: {patient.social_name}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {canDeletePatient && (
            <DeletePatientButton patientId={id} patientName={patient.full_name} lmeCount={lmes?.length ?? 0} />
          )}
          <Link href={`/pacientes/${id}/editar`}>
            <Button variant="outline" className="gap-2"><Edit className="h-4 w-4" /> Editar</Button>
          </Link>
          <Link href={`/lmes/nova?paciente=${id}`}>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Nova LME</Button>
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Dados do paciente */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" /> Dados pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {age !== null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Idade</span>
                  <span className="font-medium">{age} anos</span>
                </div>
              )}
              {patient.birth_date && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Nascimento</span>
                  <span className="font-medium">{formatarData(patient.birth_date)}</span>
                </div>
              )}
              {patient.sex && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Sexo</span>
                  <span className="font-medium">{patient.sex === 'M' ? 'Masculino' : patient.sex === 'F' ? 'Feminino' : 'Outro'}</span>
                </div>
              )}
              {patient.race_ethnicity && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Raça/Etnia</span>
                  <span className="font-medium">{patient.race_ethnicity}</span>
                </div>
              )}
              {patient.cpf && (
                <div className="flex justify-between">
                  <span className="text-gray-500">CPF</span>
                  <span className="font-medium">{patient.cpf}</span>
                </div>
              )}
              {patient.cns && (
                <div className="flex justify-between">
                  <span className="text-gray-500">CNS</span>
                  <span className="font-medium">{patient.cns}</span>
                </div>
              )}
              {patient.mother_name && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Mãe</span>
                  <span className="font-medium text-right">{patient.mother_name}</span>
                </div>
              )}
              {patient.is_incapable && patient.responsible_name && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Responsável</span>
                  <span className="font-medium text-right">{patient.responsible_name}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {(patient.weight_kg || patient.height_cm) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Dados clínicos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {patient.weight_kg && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Peso</span>
                    <span className="font-medium">{patient.weight_kg} kg</span>
                  </div>
                )}
                {patient.height_cm && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Altura</span>
                    <span className="font-medium">{patient.height_cm} cm</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {(patient.phone || patient.email || patient.address) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {patient.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    <span>{patient.phone}</span>
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    <span className="truncate">{patient.email}</span>
                  </div>
                )}
                {patient.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                    <span>{patient.address}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Timeline de LMEs */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Histórico de LMEs ({lmes?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(lmes?.length ?? 0) === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Nenhuma LME cadastrada para este paciente.</p>
                  <Link href={`/lmes/nova?paciente=${id}`}>
                    <Button size="sm" className="mt-3">Criar primeira LME</Button>
                  </Link>
                </div>
              ) : (
                <div className="relative pl-5 space-y-4">
                  {/* Linha vertical da timeline */}
                  <div className="absolute left-2 top-2 bottom-2 w-px bg-gray-200" aria-hidden />
                  {lmes?.map((lme, idx) => {
                    const doctor = lme.doctor
                    const isMostRecent = idx === 0
                    type Med = { nome?: string; apresentacao?: string }
                    const meds: Med[] = Array.isArray((lme.lme_data as { medicamentos?: Med[] } | null)?.medicamentos)
                      ? (lme.lme_data as { medicamentos: Med[] }).medicamentos
                      : []
                    const tipoLabel = REQUEST_TYPE_LABELS[lme.request_type] ?? lme.request_type
                    return (
                      <div key={lme.id} className="relative">
                        {/* Bolinha da timeline */}
                        <div className={`absolute -left-3.5 top-2 w-3 h-3 rounded-full border-2 ${isMostRecent ? 'bg-green-500 border-green-100' : 'bg-gray-300 border-gray-100'}`} aria-hidden />
                        <Link href={`/lmes/${lme.id}`}>
                          <div className="p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-500 font-medium tabular-nums">
                                {formatarData(lme.created_at)}
                              </span>
                              <span className="text-[10px] font-mono font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                {lmeCode({ id: lme.id, disease: lme.disease, createdAt: lme.created_at })}
                              </span>
                              <span className="text-sm font-semibold text-gray-900">
                                {tipoLabel}
                              </span>
                              <span className="text-sm text-gray-700">·</span>
                              <span className="text-sm text-gray-700">{DISEASE_LABELS[lme.disease]}</span>
                            </div>
                            <p className="text-xs text-gray-500">
                              Dr. {doctor?.full_name}
                              {doctor?.crm && ` — CRM ${doctor.crm}/${doctor.crm_uf}`}
                            </p>
                            {meds.length > 0 && (
                              <p className="text-xs text-gray-700 mt-1">
                                {meds.map(m => [m.nome, m.apresentacao].filter(Boolean).join(' ')).filter(Boolean).join(' · ')}
                              </p>
                            )}
                            {isMostRecent && lme.next_renewal_date && (
                              <p className="text-xs text-orange-600 mt-1">
                                Renovar até {formatarData(lme.next_renewal_date)}
                              </p>
                            )}
                            <TimelineActions lmeId={lme.id} disease={lme.disease} showRenew />
                          </div>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
