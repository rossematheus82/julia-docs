import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { isPlatformAdminEmail, requiresAdminMfa } from '@/lib/platform-admin'
import { UUID_RE, readJsonBody } from '@/lib/api/security'
import { auditLog } from '@/lib/security/audit'
import { hasVerifiedMfaSession } from '@/lib/security/mfa'
import { createSecurityAlert } from '@/lib/security/alerts'

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
  if (requiresAdminMfa(user.email) && !(await hasVerifiedMfaSession(supabase))) {
    await createSecurityAlert(admin, {
      severity: 'high',
      type: 'admin_mfa_missing',
      title: 'Tentativa administrativa sem MFA',
      description: 'Conta administrativa tentou exportar paciente sem MFA validado.',
      userId: user.id,
      resourceType: 'admin_api',
      resourceId: 'patients/export',
      metadata: { email: user.email ?? null },
    })
    return NextResponse.json({ error: 'MFA obrigatorio para esta conta administrativa.' }, { status: 403 })
  }

  const parsed = await readJsonBody<{ patientId?: unknown }>(request, 8 * 1024)
  if ('response' in parsed) return parsed.response

  const { patientId } = parsed.data
  if (typeof patientId !== 'string' || !UUID_RE.test(patientId)) {
    return NextResponse.json({ error: 'patientId invalido' }, { status: 400 })
  }

  const { data: patient } = await admin
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .maybeSingle()

  if (!patient) {
    return NextResponse.json({ error: 'Paciente nao encontrado' }, { status: 404 })
  }

  const [{ data: workspace }, { data: lmes }] = await Promise.all([
    admin
      .from('workspaces')
      .select('id, name, created_at')
      .eq('id', patient.workspace_id)
      .maybeSingle(),
    admin
      .from('lmes')
      .select('*')
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false }),
  ])

  const lmeIds = (lmes ?? []).map(lme => lme.id)
  const auditResourceIds = [patient.id, ...lmeIds]

  const { data: auditLogs } = await admin
    .from('audit_logs')
    .select('*')
    .in('resource_id', auditResourceIds)
    .order('created_at', { ascending: false })
    .limit(1000)

  await auditLog(admin, {
    workspaceId: patient.workspace_id,
    userId: user.id,
    action: 'patient_export',
    resourceType: 'patient',
    resourceId: patient.id,
    metadata: {
      lmes_count: lmes?.length ?? 0,
      audit_logs_count: auditLogs?.length ?? 0,
    },
  })
  await createSecurityAlert(admin, {
    severity: 'high',
    type: 'patient_admin_export',
    title: 'Exportacao administrativa de paciente',
    description: 'Dados administrativos de um paciente foram exportados por conta administrativa.',
    workspaceId: patient.workspace_id,
    userId: user.id,
    resourceType: 'patient',
    resourceId: patient.id,
    metadata: {
      lmes_count: lmes?.length ?? 0,
      audit_logs_count: auditLogs?.length ?? 0,
    },
  })

  const exportedAt = new Date().toISOString()
  const payload = {
    exportado_em: exportedAt,
    exportado_por: {
      user_id: user.id,
      email: user.email ?? null,
    },
    escopo: 'dados_administrativos_do_paciente',
    workspace,
    paciente: patient,
    lmes: lmes ?? [],
    auditoria_relacionada: auditLogs ?? [],
  }

  const fileName = `paciente-${patient.full_name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || patient.id}-${exportedAt.slice(0, 10)}.json`

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store',
    },
  })
}
