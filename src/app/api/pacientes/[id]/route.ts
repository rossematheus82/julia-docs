import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveWorkspace } from '@/lib/active-workspace'
import { auditLog } from '@/lib/security/audit'
import { logError } from '@/lib/security/logger'
import { isPlatformAdminEmail } from '@/lib/platform-admin'

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

  const { data: patient } = await supabase
    .from('patients')
    .select('id, created_by_user_id')
    .eq('id', id)
    .eq('workspace_id', memberData.workspace_id)
    .single()

  if (!patient) return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 })

  const canDelete =
    patient.created_by_user_id === user.id ||
    active.role === 'owner' ||
    active.role === 'admin' ||
    isPlatformAdminEmail(user.email)

  if (!canDelete) {
    return NextResponse.json(
      { error: 'Apenas quem cadastrou o paciente ou um administrador do ambulatório pode excluí-lo.' },
      { status: 403 },
    )
  }

  // Bloqueia exclusão se houver LMEs vinculadas (preserva histórico / evita violar FK)
  const { count } = await supabase
    .from('lmes')
    .select('id', { count: 'exact', head: true })
    .eq('patient_id', id)
    .eq('workspace_id', memberData.workspace_id)

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: `Paciente possui ${count} LME(s) vinculada(s). Exclua-as antes de remover o paciente.` },
      { status: 400 },
    )
  }

  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', id)
    .eq('workspace_id', memberData.workspace_id)

  if (error) {
    logError('[pacientes/delete]', error, { patientId: id, workspaceId: memberData.workspace_id })
    return NextResponse.json({ error: 'Erro ao excluir paciente' }, { status: 500 })
  }

  await auditLog(supabase, {
    workspaceId: memberData.workspace_id,
    userId: user.id,
    action: 'patient_delete',
    resourceType: 'patient',
    resourceId: id,
  })

  return NextResponse.json({ ok: true })
}
