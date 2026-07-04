import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { readJsonBody } from '@/lib/api/security'
import { auditLog } from '@/lib/security/audit'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  const parsed = await readJsonBody<{ inviteCode?: unknown }>(req, 8 * 1024)
  if ('response' in parsed) return parsed.response

  const inviteCode = typeof parsed.data.inviteCode === 'string'
    ? parsed.data.inviteCode.trim().toUpperCase()
    : ''
  if (!inviteCode) {
    return NextResponse.json({ error: 'Codigo de convite obrigatorio' }, { status: 400 })
  }

  const { data: workspaceId, error } = await supabase
    .rpc('join_workspace_by_invite', { invite: inviteCode })

  if (error || !workspaceId) {
    return NextResponse.json({ error: 'Codigo de convite invalido ou nao encontrado.' }, { status: 400 })
  }

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('id', workspaceId)
    .maybeSingle()

  await auditLog(supabase, {
    workspaceId,
    userId: user.id,
    action: 'workspace_join',
    resourceType: 'workspace',
    resourceId: workspaceId,
    metadata: {
      source: 'invite_code',
    },
  })

  return NextResponse.json({
    ok: true,
    workspaceId,
    workspaceName: workspace?.name ?? null,
  })
}
