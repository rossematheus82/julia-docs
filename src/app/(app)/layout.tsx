import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveWorkspace } from '@/lib/active-workspace'
import { Sidebar } from '@/components/sidebar'
import { FeedbackWidget } from '@/components/feedback-widget'
import { SessionTimeout } from '@/components/session-timeout'
import { LegalAcceptanceGate } from '@/components/legal-acceptance-gate'
import { LEGAL_PRIVACY_VERSION, LEGAL_TERMS_VERSION } from '@/lib/legal-content'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const active = await getActiveWorkspace(supabase, user.id)
  if (!active) redirect('/onboarding')

  // Lista de todos os workspaces do usuário (para o switcher na sidebar)
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('role, workspace:workspaces(id, name)')
    .eq('user_id', user.id)

  type Membership = { role: string; workspace: { id: string; name: string } | null }
  const workspaces = ((memberships ?? []) as unknown as Membership[])
    .map(m => m.workspace ? { ...m.workspace, role: m.role as 'owner' | 'admin' | 'member' } : null)
    .filter((w): w is { id: string; name: string; role: 'owner' | 'admin' | 'member' } => !!w)

  const activeWorkspace = workspaces.find(w => w.id === active.workspaceId) ?? workspaces[0]
  if (!activeWorkspace) redirect('/onboarding')

  const { data: latestAcceptance } = await supabase
    .from('legal_acceptances')
    .select('terms_version, privacy_version')
    .eq('user_id', user.id)
    .order('accepted_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const requiresLegalAcceptance =
    latestAcceptance?.terms_version !== LEGAL_TERMS_VERSION ||
    latestAcceptance?.privacy_version !== LEGAL_PRIVACY_VERSION

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        activeWorkspace={activeWorkspace}
        workspaces={workspaces}
        userEmail={user.email ?? ''}
      />
      {/* pt-14 reserva espaço pra barra superior fixa no mobile; md:pl-64 abre espaço pra sidebar fixa no desktop */}
      <main className="md:pl-64 pt-14 md:pt-0 min-h-screen">
        {children}
      </main>
      <FeedbackWidget />
      <SessionTimeout />
      <LegalAcceptanceGate required={requiresLegalAcceptance} />
    </div>
  )
}
