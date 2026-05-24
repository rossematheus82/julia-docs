import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getActiveWorkspace } from '@/lib/active-workspace'
import { WorkspaceSettingsClient } from './workspace-settings-client'

export default async function WorkspaceSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const active = await getActiveWorkspace(supabase, user.id)
  if (!active) redirect('/onboarding')

  // Todos os ambulatórios do usuário (pra mostrar a lista com switch/sair)
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('role, joined_at, workspace:workspaces(id, name, invite_code)')
    .eq('user_id', user.id)

  type Membership = { role: string; joined_at: string; workspace: { id: string; name: string; invite_code: string } | null }
  const myWorkspaces = ((memberships ?? []) as unknown as Membership[])
    .filter(m => m.workspace)
    .map(m => ({
      id: m.workspace!.id,
      name: m.workspace!.name,
      invite_code: m.workspace!.invite_code,
      role: m.role,
      joined_at: m.joined_at,
    }))

  const activeWs = myWorkspaces.find(w => w.id === active.workspaceId)
  if (!activeWs) redirect('/onboarding')

  // Membros do ambulatório ATIVO (pra mostrar quem participa)
  const { data: members } = await supabase
    .from('workspace_members')
    .select('id, role, user_id, joined_at')
    .eq('workspace_id', activeWs.id)
    .order('joined_at', { ascending: true })

  return (
    <WorkspaceSettingsClient
      activeWorkspace={activeWs}
      myWorkspaces={myWorkspaces}
      members={members ?? []}
      currentUserId={user.id}
    />
  )
}
