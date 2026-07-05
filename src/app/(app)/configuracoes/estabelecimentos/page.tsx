import { createClient } from '@/lib/supabase/server'
import { getActiveWorkspace } from '@/lib/active-workspace'
import { redirect } from 'next/navigation'
import { EstabelecimentosClient } from './estabelecimentos-client'

export default async function EstabelecimentosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const active = await getActiveWorkspace(supabase, user.id)
  if (!active) redirect('/onboarding')
  if (active.role !== 'owner' && active.role !== 'admin') redirect('/dashboard')

  const memberData = { workspace_id: active.workspaceId }

  const { data: facilities } = await supabase
    .from('health_facilities')
    .select('*')
    .eq('workspace_id', memberData.workspace_id)
    .order('name', { ascending: true })

  return (
    <EstabelecimentosClient
      facilities={facilities ?? []}
      workspaceId={memberData.workspace_id}
    />
  )
}
