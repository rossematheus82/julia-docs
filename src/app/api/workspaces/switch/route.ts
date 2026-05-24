import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ACTIVE_WORKSPACE_COOKIE } from '@/lib/active-workspace'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { workspaceId } = await req.json().catch(() => ({}))
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId é obrigatório' }, { status: 400 })

  const { data: member } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!member) return NextResponse.json({ error: 'Você não é membro deste ambulatório' }, { status: 403 })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
    path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365,
  })
  return res
}
