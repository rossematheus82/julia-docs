import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getActiveWorkspace } from '@/lib/active-workspace'
import { PerfilMedicoClient } from './perfil-medico-client'

export default async function PerfilMedicoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const active = await getActiveWorkspace(supabase, user.id)
  if (!active) redirect('/onboarding')

  const { data: doctor } = await supabase
    .from('doctors')
    .select('*')
    .eq('owner_user_id', user.id)
    .eq('workspace_id', active.workspaceId)
    .maybeSingle()

  if (!doctor) redirect('/perfil-medico/novo')

  return <PerfilMedicoClient doctor={doctor} />
}
