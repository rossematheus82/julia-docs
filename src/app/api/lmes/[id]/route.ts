import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveWorkspace } from '@/lib/active-workspace'
import { auditLog } from '@/lib/security/audit'
import { logError } from '@/lib/security/logger'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const active = await getActiveWorkspace(supabase, user.id)
  if (!active) return NextResponse.json({ error: 'Sem workspace' }, { status: 403 })
  const memberData = { workspace_id: active.workspaceId }

  const { id } = await params

  const { data: lme } = await supabase
    .from('lmes')
    .select('id, created_by_user_id')
    .eq('id', id)
    .eq('workspace_id', memberData.workspace_id)
    .single()

  if (!lme) return NextResponse.json({ error: 'LME não encontrada' }, { status: 404 })

  // Apenas o criador pode excluir — preserva LMEs emitidas por outros médicos
  if (lme.created_by_user_id !== user.id) {
    return NextResponse.json(
      { error: 'Apenas o médico que criou esta LME pode excluí-la.' },
      { status: 403 },
    )
  }

  // Bloqueia exclusão se houver renovações vinculadas (preserva histórico)
  const { count: renovacoes } = await supabase
    .from('lmes')
    .select('id', { count: 'exact', head: true })
    .eq('parent_lme_id', id)
    .eq('workspace_id', memberData.workspace_id)

  if ((renovacoes ?? 0) > 0) {
    return NextResponse.json(
      { error: `Esta LME tem ${renovacoes} renovação(ões) vinculada(s). Exclua-as antes.` },
      { status: 400 },
    )
  }

  const { error } = await supabase
    .from('lmes')
    .delete()
    .eq('id', id)
    .eq('workspace_id', memberData.workspace_id)

  if (error) {
    logError('[lmes/delete]', error, { lmeId: id, workspaceId: memberData.workspace_id })
    return NextResponse.json({ error: 'Erro ao excluir LME' }, { status: 500 })
  }

  await auditLog(supabase, {
    workspaceId: memberData.workspace_id,
    userId: user.id,
    action: 'lme_delete',
    resourceType: 'lme',
    resourceId: id,
  })

  return NextResponse.json({ ok: true })
}
