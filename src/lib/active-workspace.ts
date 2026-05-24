import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

export const ACTIVE_WORKSPACE_COOKIE = 'active_workspace_id'

/** Estrutura única usada por todas as páginas: identifica o workspace ativo do usuário. */
export interface ActiveWorkspace {
  workspaceId: string
  role: 'owner' | 'admin' | 'member'
  /** true se o usuário tem mais de um workspace (útil para mostrar o switcher) */
  hasMultiple: boolean
}

/**
 * Resolve o workspace ativo a partir do cookie. Se inválido (cookie aponta para um
 * workspace do qual o usuário não é membro, ou está vazio), faz fallback pro primeiro
 * workspace do usuário. Retorna `null` se o usuário não é membro de nenhum.
 *
 * Usar em server components / route handlers (lê cookies do request).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getActiveWorkspace(supabase: SupabaseClient<any, any, any>, userId: string): Promise<ActiveWorkspace | null> {
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', userId)

  if (!memberships || memberships.length === 0) return null

  const cookieStore = await cookies()
  const cookieValue = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value
  const fromCookie = cookieValue ? memberships.find(m => m.workspace_id === cookieValue) : undefined
  const chosen = fromCookie ?? memberships[0]

  return {
    workspaceId: chosen.workspace_id,
    role: chosen.role as ActiveWorkspace['role'],
    hasMultiple: memberships.length > 1,
  }
}
