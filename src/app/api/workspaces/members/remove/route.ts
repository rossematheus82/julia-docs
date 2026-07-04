import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { readJsonBody, UUID_RE } from '@/lib/api/security'
import { auditLog } from '@/lib/security/audit'
import { logError } from '@/lib/security/logger'

/**
 * Remove um membro do ambulatório (owner/admin). NÃO apaga pacientes, LMEs nem o
 * perfil de médico do removido — esses dados são do workspace e ficam preservados;
 * o usuário apenas perde o acesso.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const parsed = await readJsonBody<{ memberId?: unknown }>(req, 8 * 1024)
  if ('response' in parsed) return parsed.response
  const { memberId } = parsed.data
  if (!memberId) return NextResponse.json({ error: 'memberId obrigatório' }, { status: 400 })

  if (typeof memberId !== 'string' || !UUID_RE.test(memberId)) {
    return NextResponse.json({ error: 'memberId invalido' }, { status: 400 })
  }

  // Membro alvo
  const { data: target } = await supabase
    .from('workspace_members')
    .select('id, role, user_id, workspace_id')
    .eq('id', memberId)
    .maybeSingle()
  if (!target) return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })

  if (target.user_id === user.id) {
    return NextResponse.json({ error: 'Use "Sair" para remover você mesmo.' }, { status: 400 })
  }
  if (target.role === 'owner') {
    return NextResponse.json({ error: 'O proprietário não pode ser removido.' }, { status: 400 })
  }

  // Requester precisa ser owner/admin do MESMO workspace
  const { data: requester } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', target.workspace_id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!requester || !['owner', 'admin'].includes(requester.role)) {
    return NextResponse.json({ error: 'Sem permissão para remover membros.' }, { status: 403 })
  }

  if (requester.role === 'admin' && target.role !== 'member') {
    return NextResponse.json({ error: 'Administradores so podem remover membros comuns.' }, { status: 403 })
  }

  const { error } = await supabase.from('workspace_members').delete().eq('id', target.id)
  if (error) {
    logError('[workspaces/members/remove]', error, { memberId: target.id, workspaceId: target.workspace_id })
    return NextResponse.json({ error: 'Erro ao remover membro' }, { status: 500 })
  }

  await auditLog(supabase, {
    workspaceId: target.workspace_id,
    userId: user.id,
    action: 'workspace_member_remove',
    resourceType: 'workspace_member',
    resourceId: target.id,
    metadata: { removed_user_id: target.user_id },
  })

  return NextResponse.json({ ok: true })
}
