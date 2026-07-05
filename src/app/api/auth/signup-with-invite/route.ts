import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auditLog } from '@/lib/security/audit'
import { LEGAL_PRIVACY_VERSION, LEGAL_TERMS_VERSION } from '@/lib/legal-content'
import { buildLegalAcceptanceSnapshot } from '@/lib/legal-snapshot'

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

function supabaseAnon() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as {
    email?: string
    password?: string
    inviteCode?: string
    acceptedPrivacy?: boolean
  } | null

  const email = body?.email?.trim().toLowerCase()
  const password = body?.password ?? ''
  const inviteCode = body?.inviteCode?.trim().toUpperCase()
  const acceptedPrivacy = body?.acceptedPrivacy === true

  if (!email || !password || password.length < 6 || !inviteCode) {
    return NextResponse.json({ error: 'Informe email, senha e codigo de convite.' }, { status: 400 })
  }
  if (!acceptedPrivacy) {
    return NextResponse.json({ error: 'Confirme a ciencia sobre privacidade e uso de dados.' }, { status: 400 })
  }

  const admin = supabaseAdmin()

  const { data: workspace, error: workspaceError } = await admin
    .from('workspaces')
    .select('id, name')
    .eq('invite_code', inviteCode)
    .maybeSingle()

  if (workspaceError) {
    return NextResponse.json({ error: 'Erro ao validar codigo de convite.' }, { status: 500 })
  }
  if (!workspace) {
    return NextResponse.json({ error: 'Codigo de convite invalido.' }, { status: 400 })
  }

  const anon = supabaseAnon()
  const { data: signup, error: signupError } = await anon.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${request.nextUrl.origin}/dashboard` },
  })

  const alreadyRegistered = signup.user?.identities?.length === 0
  if (signupError || !signup.user || alreadyRegistered) {
    const message = alreadyRegistered || signupError?.message?.toLowerCase().includes('already')
      ? 'Este email ja possui cadastro. Entre com sua senha e use o codigo de convite se necessario.'
      : signupError?.message ?? 'Erro ao criar conta.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const { error: memberError } = await admin
    .from('workspace_members')
    .insert({
      workspace_id: workspace.id,
      user_id: signup.user.id,
      role: 'member',
    })

  if (memberError && memberError.code !== '23505') {
    await admin.auth.admin.deleteUser(signup.user.id).catch(() => undefined)
    return NextResponse.json({ error: 'Erro ao vincular usuario ao ambulatorio.' }, { status: 500 })
  }

  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
  const userAgent = request.headers.get('user-agent')
  const legalSnapshot = buildLegalAcceptanceSnapshot()

  const { data: acceptance, error: acceptanceError } = await admin
    .from('legal_acceptances')
    .insert({
      user_id: signup.user.id,
      terms_version: LEGAL_TERMS_VERSION,
      privacy_version: LEGAL_PRIVACY_VERSION,
      ip_address: ipAddress,
      user_agent: userAgent,
      source: 'signup_with_invite',
      terms_snapshot: legalSnapshot.terms,
      privacy_snapshot: legalSnapshot.privacy,
      metadata: {
        workspace_id: workspace.id,
        accepted_privacy_checkbox: acceptedPrivacy,
      },
    })
    .select('id')
    .single()

  if (acceptanceError) {
    await admin.auth.admin.deleteUser(signup.user.id).catch(() => undefined)
    return NextResponse.json({ error: 'Erro ao registrar aceite dos termos.' }, { status: 500 })
  }

  await auditLog(admin, {
    workspaceId: workspace.id,
    userId: signup.user.id,
    action: 'legal_acceptance',
    resourceType: 'legal_acceptance',
    resourceId: acceptance.id,
    ipAddress,
    userAgent,
    metadata: {
      terms_version: LEGAL_TERMS_VERSION,
      privacy_version: LEGAL_PRIVACY_VERSION,
      source: 'signup_with_invite',
      has_snapshot: true,
    },
  })

  await auditLog(admin, {
    workspaceId: workspace.id,
    userId: signup.user.id,
    action: 'workspace_join',
    resourceType: 'workspace',
    resourceId: workspace.id,
    metadata: {
      source: 'signup_with_invite',
      email,
    },
    ipAddress,
    userAgent,
  })

  return NextResponse.json({
    ok: true,
    workspaceName: workspace.name,
    needsEmailConfirmation: !signup.session,
  })
}
