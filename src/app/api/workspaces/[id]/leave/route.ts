import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ACTIVE_WORKSPACE_COOKIE } from '@/lib/active-workspace'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id: workspaceId } = await params

  // Verifica que o usuário é membro
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('id, role')
    .eq('user_id', user.id)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!membership) return NextResponse.json({ error: 'Você não é membro deste ambulatório' }, { status: 404 })

  // Owner não pode sair (precisaria transferir ownership antes — fora do escopo)
  if (membership.role === 'owner') {
    return NextResponse.json({ error: 'Proprietário não pode sair do próprio ambulatório.' }, { status: 400 })
  }

  // Remove a membership
  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('id', membership.id)
  if (error) {
    console.error('[workspaces/leave]', error)
    return NextResponse.json({ error: 'Erro ao sair do ambulatório' }, { status: 500 })
  }

  // Se era o ambulatório ativo, limpa o cookie (middleware vai escolher outro)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ACTIVE_WORKSPACE_COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
