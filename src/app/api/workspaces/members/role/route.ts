import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { readJsonBody, UUID_RE } from '@/lib/api/security'
import { auditLog } from '@/lib/security/audit'
import { logError } from '@/lib/security/logger'
import { isPlatformAdminEmail } from '@/lib/platform-admin'

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  const parsed = await readJsonBody<{ memberId?: unknown; role?: unknown }>(req, 8 * 1024)
  if ('response' in parsed) return parsed.response

  const { memberId, role } = parsed.data
  if (typeof memberId !== 'string' || !UUID_RE.test(memberId)) {
    return NextResponse.json({ error: 'memberId invalido' }, { status: 400 })
  }
  if (role !== 'admin' && role !== 'member') {
    return NextResponse.json({ error: 'role invalido' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: target } = await admin
    .from('workspace_members')
    .select('id, role, user_id, workspace_id')
    .eq('id', memberId)
    .maybeSingle()

  if (!target) return NextResponse.json({ error: 'Membro nao encontrado' }, { status: 404 })
  if (target.role === 'owner') {
    return NextResponse.json({ error: 'O proprietario nao pode ter o papel alterado.' }, { status: 400 })
  }
  if (target.user_id === user.id) {
    return NextResponse.json({ error: 'Voce nao pode alterar seu proprio papel.' }, { status: 400 })
  }
  if (target.role === role) {
    return NextResponse.json({ ok: true })
  }

  const [{ data: requester }, { data: platformUser }] = await Promise.all([
    admin
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', target.workspace_id)
      .eq('user_id', user.id)
      .maybeSingle(),
    admin
      .from('platform_users')
      .select('role, status')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const isPlatformAdmin = isPlatformAdminEmail(user.email)
    || (platformUser?.role === 'platform_admin' && platformUser?.status === 'active')
  if (requester?.role !== 'owner' && !isPlatformAdmin) {
    return NextResponse.json({ error: 'Apenas o proprietario do ambulatorio pode alterar administradores.' }, { status: 403 })
  }

  const { error } = await admin
    .from('workspace_members')
    .update({ role })
    .eq('id', target.id)

  if (error) {
    logError('[workspaces/members/role]', error, { memberId: target.id, workspaceId: target.workspace_id })
    return NextResponse.json({ error: 'Erro ao alterar papel do membro' }, { status: 500 })
  }

  await auditLog(admin, {
    workspaceId: target.workspace_id,
    userId: user.id,
    action: 'workspace_member_role_update',
    resourceType: 'workspace_member',
    resourceId: target.id,
    metadata: {
      target_user_id: target.user_id,
      previous_role: target.role,
      new_role: role,
    },
  })

  return NextResponse.json({ ok: true })
}
