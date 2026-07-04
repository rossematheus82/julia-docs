import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { isPlatformAdminEmail } from '@/lib/platform-admin'
import { UUID_RE, readJsonBody } from '@/lib/api/security'
import { auditLog } from '@/lib/security/audit'

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: platformUser } = await admin
    .from('platform_users')
    .select('role, status')
    .eq('user_id', user.id)
    .maybeSingle()

  const isAdmin = isPlatformAdminEmail(user.email)
    || (platformUser?.role === 'platform_admin' && platformUser?.status === 'active')
  if (!isAdmin) return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })

  const parsed = await readJsonBody<{ patientId?: unknown }>(request, 8 * 1024)
  if ('response' in parsed) return parsed.response

  const { patientId } = parsed.data
  if (typeof patientId !== 'string' || !UUID_RE.test(patientId)) {
    return NextResponse.json({ error: 'patientId invalido' }, { status: 400 })
  }

  const { data: patient } = await admin
    .from('patients')
    .select('id, workspace_id, deleted_at')
    .eq('id', patientId)
    .maybeSingle()

  if (!patient) {
    return NextResponse.json({ error: 'Paciente nao encontrado' }, { status: 404 })
  }
  if (!patient.deleted_at) {
    return NextResponse.json({ ok: true })
  }

  const { error } = await admin
    .from('patients')
    .update({
      deleted_at: null,
      deleted_by_user_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', patientId)

  if (error) {
    return NextResponse.json({ error: 'Erro ao restaurar paciente' }, { status: 500 })
  }

  await auditLog(admin, {
    workspaceId: patient.workspace_id,
    userId: user.id,
    action: 'patient_restore',
    resourceType: 'patient',
    resourceId: patient.id,
  })

  return NextResponse.json({ ok: true })
}
