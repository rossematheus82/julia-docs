import { notFound, redirect } from 'next/navigation'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { ShieldCheck, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { isPlatformAdminEmail } from '@/lib/platform-admin'
import {
  AdminUsersClient,
  type AdminAuditRow,
  type AdminLegalAcceptanceRow,
  type AdminPatientRow,
  type AdminUserRow,
  type AdminWorkspaceRow,
} from './admin-users-client'

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: currentPlatformUser } = await admin
    .from('platform_users')
    .select('role, status')
    .eq('user_id', user.id)
    .maybeSingle()

  const isAdmin = isPlatformAdminEmail(user.email)
    || (currentPlatformUser?.role === 'platform_admin' && currentPlatformUser?.status === 'active')
  if (!isAdmin) notFound()

  const { data: authUsers, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (usersError) throw usersError

  const userIds = authUsers.users.map(u => u.id)

  const [
    { data: platformRows },
    { data: memberships },
    { data: doctors },
    { data: workspaces },
    { data: patients },
    { data: auditLogs },
    { data: legalAcceptances },
  ] = await Promise.all([
    admin.from('platform_users').select('user_id, email, role, status').in('user_id', userIds),
    admin.from('workspace_members').select('user_id, workspace_id').in('user_id', userIds),
    admin.from('doctors').select('owner_user_id').in('owner_user_id', userIds),
    admin.from('workspaces').select('id, name, invite_code, created_at').order('name'),
    admin
      .from('patients')
      .select('id, workspace_id, full_name, cpf, cns, birth_date, phone, created_at, updated_at, deleted_at, deleted_by_user_id')
      .order('full_name')
      .limit(1000),
    admin
      .from('audit_logs')
      .select('id, workspace_id, user_id, action, resource_type, resource_id, created_at, ip_address, user_agent, metadata')
      .order('created_at', { ascending: false })
      .limit(500),
    admin
      .from('legal_acceptances')
      .select('id, user_id, terms_version, privacy_version, accepted_at, source, ip_address, user_agent, metadata')
      .in('user_id', userIds)
      .order('accepted_at', { ascending: false }),
  ])

  const platformByUser = new Map((platformRows ?? []).map(row => [row.user_id as string, row]))
  const workspaceCountByUser = new Map<string, Set<string>>()
  for (const membership of memberships ?? []) {
    if (!membership.user_id || !membership.workspace_id) continue
    const set = workspaceCountByUser.get(membership.user_id) ?? new Set<string>()
    set.add(membership.workspace_id)
    workspaceCountByUser.set(membership.user_id, set)
  }
  const doctorUsers = new Set((doctors ?? []).map(d => d.owner_user_id).filter(Boolean) as string[])

  const rows: AdminUserRow[] = authUsers.users
    .map(authUser => {
      const platform = platformByUser.get(authUser.id)
      const role: AdminUserRow['role'] = (platform?.role === 'platform_admin' || isPlatformAdminEmail(authUser.email))
        ? 'platform_admin'
        : 'basic'
      const status: AdminUserRow['status'] = platform?.status === 'banned' ? 'banned' : 'active'

      return {
        id: authUser.id,
        email: authUser.email ?? platform?.email ?? '(sem email)',
        createdAt: authUser.created_at ?? null,
        lastSignInAt: authUser.last_sign_in_at ?? null,
        role,
        status,
        workspacesCount: workspaceCountByUser.get(authUser.id)?.size ?? 0,
        hasDoctorProfile: doctorUsers.has(authUser.id),
      }
    })
    .sort((a, b) => a.email.localeCompare(b.email))

  const workspaceRows: AdminWorkspaceRow[] = (workspaces ?? []).map(workspace => ({
    id: workspace.id,
    name: workspace.name,
    inviteCode: workspace.invite_code,
    createdAt: workspace.created_at,
  }))
  const workspaceNameById = new Map(workspaceRows.map(workspace => [workspace.id, workspace.name]))
  const patientRows: AdminPatientRow[] = (patients ?? []).map(patient => ({
    id: patient.id,
    workspaceId: patient.workspace_id,
    workspaceName: workspaceNameById.get(patient.workspace_id) ?? 'Ambulatorio removido',
    fullName: patient.full_name,
    cpf: patient.cpf,
    cns: patient.cns,
    birthDate: patient.birth_date,
    phone: patient.phone,
    createdAt: patient.created_at,
    updatedAt: patient.updated_at,
    deletedAt: patient.deleted_at,
    deletedByUserId: patient.deleted_by_user_id,
  }))
  const emailByUserId = new Map(rows.map(row => [row.id, row.email]))
  const auditRows: AdminAuditRow[] = (auditLogs ?? []).map(log => ({
    id: log.id,
    workspaceId: log.workspace_id,
    workspaceName: log.workspace_id ? workspaceNameById.get(log.workspace_id) ?? 'Ambulatorio removido' : 'Plataforma',
    userId: log.user_id,
    userEmail: log.user_id ? emailByUserId.get(log.user_id) ?? log.user_id : 'Sistema',
    action: log.action,
    resourceType: log.resource_type,
    resourceId: log.resource_id,
    createdAt: log.created_at,
    ipAddress: log.ip_address,
    userAgent: log.user_agent,
    metadata: log.metadata,
  }))
  type LegalAcceptanceQueryRow = {
    id: string
    user_id: string
    terms_version: string
    privacy_version: string
    accepted_at: string
    source: string
    ip_address: string | null
    user_agent: string | null
    metadata: { workspace_id?: string } | null
  }
  const latestAcceptanceByUser = new Map<string, LegalAcceptanceQueryRow>()
  for (const acceptance of legalAcceptances ?? []) {
    if (!acceptance.user_id || latestAcceptanceByUser.has(acceptance.user_id)) continue
    latestAcceptanceByUser.set(acceptance.user_id, acceptance)
  }
  const legalAcceptanceRows: AdminLegalAcceptanceRow[] = rows.map(row => {
    const acceptance = latestAcceptanceByUser.get(row.id)
    return {
      userId: row.id,
      userEmail: row.email,
      acceptedAt: acceptance?.accepted_at ?? null,
      termsVersion: acceptance?.terms_version ?? null,
      privacyVersion: acceptance?.privacy_version ?? null,
      source: acceptance?.source ?? null,
      ipAddress: acceptance?.ip_address ?? null,
      userAgent: acceptance?.user_agent ?? null,
      workspaceId: acceptance?.metadata?.workspace_id ?? null,
      workspaceName: acceptance?.metadata?.workspace_id
        ? workspaceNameById.get(acceptance.metadata.workspace_id) ?? 'Ambulatorio removido'
        : null,
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Júlia Docs</h1>
              <p className="text-sm text-gray-500">Controle basico de usuarios da plataforma</p>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4 text-blue-600" />
              <span><strong>{rows.length}</strong> usuarios cadastrados</span>
            </div>
          </div>
        </div>

        <AdminUsersClient
          users={rows}
          currentUserId={user.id}
          workspaces={workspaceRows}
          patients={patientRows}
          auditLogs={auditRows}
          legalAcceptances={legalAcceptanceRows}
        />
      </main>
    </div>
  )
}
