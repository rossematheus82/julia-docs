import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getActiveWorkspace } from '@/lib/active-workspace'
import { RenovarClient } from './renovar-client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Stethoscope } from 'lucide-react'

export default async function RenovarLmePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const active = await getActiveWorkspace(supabase, user.id)
  if (!active) redirect('/onboarding')

  const { id } = await params

  const { data: lme } = await supabase
    .from('lmes')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', active.workspaceId)
    .eq('status', 'emitida')
    .single()

  if (!lme) notFound()

  const [{ data: myDoctor }, { data: facilities }, { data: patient }] = await Promise.all([
    // Apenas o perfil do médico logado — quem renova é sempre o próprio usuário
    supabase.from('doctors').select('id, full_name, crm, crm_uf, specialty, cns')
      .eq('workspace_id', active.workspaceId)
      .eq('owner_user_id', user.id)
      .maybeSingle(),
    supabase.from('health_facilities').select('id, name, cnes, address, city, state')
      .eq('workspace_id', active.workspaceId).eq('is_active', true).order('name'),
    supabase.from('patients').select('weight_kg, height_cm, birth_date, is_incapable, responsible_name, deleted_at')
      .eq('id', lme.patient_id)
      .single(),
  ])

  // Sem perfil de médico neste ambulatório → mostra mensagem inline (em vez de redirect silencioso)
  if (!myDoctor) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/lmes/${id}`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Renovar LME</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="h-4 w-4" /> Cadastre seu perfil de médico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700">
              Para renovar uma LME neste ambulatório você precisa ter um perfil de médico cadastrado em seu nome.
              A renovação será emitida com o seu CRM — por isso o sistema não permite usar o perfil de outro médico.
            </p>
            <Link href="/perfil-medico/novo">
              <Button>Cadastrar meu perfil de médico</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (patient?.deleted_at) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/lmes/${id}`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Renovar LME</h1>
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">Paciente excluido</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">
              Este paciente foi removido da lista ativa. O historico permanece preservado, mas nao e possivel emitir uma nova LME para um paciente excluido.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!facilities || facilities.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/lmes/${id}`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Renovar LME</h1>
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">Nenhum estabelecimento cadastrado</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700">Cadastre ao menos um estabelecimento antes de renovar.</p>
            <Link href="/configuracoes/estabelecimentos">
              <Button>Cadastrar estabelecimento</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <RenovarClient
      lme={lme}
      doctor={myDoctor}
      facilities={facilities}
      workspaceId={active.workspaceId}
      userId={user.id}
      patientWeight={patient?.weight_kg != null ? String(patient.weight_kg) : null}
      patientHeight={patient?.height_cm != null ? String(patient.height_cm) : null}
      patientBirthDate={patient?.birth_date ?? null}
      patientIncapable={patient?.is_incapable ?? false}
      patientResponsibleName={patient?.responsible_name ?? null}
    />
  )
}
