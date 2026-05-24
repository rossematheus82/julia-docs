import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveWorkspace } from '@/lib/active-workspace'
import { Sidebar } from '@/components/sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const active = await getActiveWorkspace(supabase, user.id)
  if (!active) redirect('/onboarding')

  // Lista de todos os workspaces do usuário (para o switcher na sidebar)
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace:workspaces(id, name)')
    .eq('user_id', user.id)

  type Membership = { workspace: { id: string; name: string } | null }
  const workspaces = ((memberships ?? []) as unknown as Membership[])
    .map(m => m.workspace)
    .filter((w): w is { id: string; name: string } => !!w)

  const activeWorkspace = workspaces.find(w => w.id === active.workspaceId) ?? workspaces[0]
  if (!activeWorkspace) redirect('/onboarding')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        activeWorkspace={activeWorkspace}
        workspaces={workspaces}
        userEmail={user.email ?? ''}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
