import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getActiveWorkspace } from '@/lib/active-workspace'
import { NovoPerfilMedicoClient } from './novo-perfil-client'

export default async function NovoPerfilMedicoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const active = await getActiveWorkspace(supabase, user.id)
  if (!active) redirect('/onboarding')

  // Já tem perfil neste workspace? Vai direto pra tela de edição.
  const { data: existing } = await supabase
    .from('doctors')
    .select('id')
    .eq('owner_user_id', user.id)
    .eq('workspace_id', active.workspaceId)
    .maybeSingle()
  if (existing) redirect('/perfil-medico')

  // Pré-preenche com o perfil de OUTRO workspace, se houver — facilita criar perfil em ambulatório novo
  const { data: another } = await supabase
    .from('doctors')
    .select('full_name, crm, crm_uf, cns, cpf, specialty')
    .eq('owner_user_id', user.id)
    .limit(1)
    .maybeSingle()

  // Converte null para undefined nos campos opcionais (RHF prefere undefined)
  const prefill = another ? {
    full_name: another.full_name ?? undefined,
    crm: another.crm ?? undefined,
    crm_uf: another.crm_uf ?? undefined,
    cns: another.cns ?? undefined,
    cpf: another.cpf ?? undefined,
    specialty: another.specialty ?? undefined,
  } : undefined

  return (
    <NovoPerfilMedicoClient
      workspaceId={active.workspaceId}
      userId={user.id}
      prefill={prefill}
    />
  )
}
