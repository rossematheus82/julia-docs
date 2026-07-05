import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveWorkspace } from '@/lib/active-workspace'
import { LEGAL_PRIVACY_VERSION, LEGAL_TERMS_VERSION } from '@/lib/legal-content'
import { buildLegalAcceptanceSnapshot } from '@/lib/legal-snapshot'
import { auditLog } from '@/lib/security/audit'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })
  }

  const active = await getActiveWorkspace(supabase, user.id)
  if (!active) {
    return NextResponse.json({ error: 'Ambulatorio ativo nao encontrado.' }, { status: 400 })
  }

  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
  const userAgent = request.headers.get('user-agent')
  const legalSnapshot = buildLegalAcceptanceSnapshot()

  const { data: acceptance, error } = await supabase
    .from('legal_acceptances')
    .insert({
      user_id: user.id,
      terms_version: LEGAL_TERMS_VERSION,
      privacy_version: LEGAL_PRIVACY_VERSION,
      ip_address: ipAddress,
      user_agent: userAgent,
      source: 'required_modal',
      terms_snapshot: legalSnapshot.terms,
      privacy_snapshot: legalSnapshot.privacy,
      metadata: {
        workspace_id: active.workspaceId,
        reason: 'terms_or_privacy_updated',
      },
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Erro ao registrar aceite.' }, { status: 500 })
  }

  await auditLog(supabase, {
    workspaceId: active.workspaceId,
    userId: user.id,
    action: 'legal_acceptance',
    resourceType: 'legal_acceptance',
    resourceId: acceptance.id,
    ipAddress,
    userAgent,
    metadata: {
      terms_version: LEGAL_TERMS_VERSION,
      privacy_version: LEGAL_PRIVACY_VERSION,
      source: 'required_modal',
      has_snapshot: true,
    },
  })

  return NextResponse.json({ ok: true })
}
