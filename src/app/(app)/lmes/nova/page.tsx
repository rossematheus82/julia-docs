import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getActiveWorkspace } from '@/lib/active-workspace'
import { LmeWizard } from './lme-wizard'

export default async function NovaLmePage({
  searchParams,
}: {
  searchParams: Promise<{ paciente?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const active = await getActiveWorkspace(supabase, user.id)
  if (!active) redirect('/onboarding')

  const { paciente } = await searchParams

  const [
    { data: patients },
    { data: myDoctor },
    { data: facilities },
  ] = await Promise.all([
    supabase.from('patients').select('id, full_name, birth_date, cpf, cns, sex, weight_kg, height_cm, mother_name, address, social_name, is_incapable, responsible_name')
      .eq('workspace_id', active.workspaceId).order('full_name'),
    // Apenas o médico do usuário logado (perfil próprio neste workspace)
    supabase.from('doctors').select('id, full_name, crm, crm_uf, specialty, cns')
      .eq('workspace_id', active.workspaceId)
      .eq('owner_user_id', user.id)
      .maybeSingle(),
    supabase.from('health_facilities').select('id, name, cnes, address, city, state')
      .eq('workspace_id', active.workspaceId).eq('is_active', true).order('name'),
  ])

  if (!myDoctor) redirect('/perfil-medico/novo')

  return (
    <LmeWizard
      patients={patients ?? []}
      doctors={[myDoctor]}
      facilities={facilities ?? []}
      workspaceId={active.workspaceId}
      userId={user.id}
      defaultPatientId={paciente}
    />
  )
}
