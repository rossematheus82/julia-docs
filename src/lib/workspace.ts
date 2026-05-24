import { createClient } from './supabase/server'
import type { Workspace, WorkspaceMember } from './supabase/types'

export interface WorkspaceContext {
  workspace: Workspace
  member: WorkspaceMember
}

export async function getWorkspaceContext(): Promise<WorkspaceContext | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: member } = await supabase
    .from('workspace_members')
    .select('*, workspace:workspaces(*)')
    .eq('user_id', user.id)
    .single()

  if (!member) return null

  return {
    workspace: (member as unknown as { workspace: Workspace }).workspace,
    member,
  }
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-'
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
