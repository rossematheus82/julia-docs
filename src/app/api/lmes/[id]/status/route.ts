import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveWorkspace } from '@/lib/active-workspace'
import { readJsonBody, UUID_RE } from '@/lib/api/security'
import { auditLog } from '@/lib/security/audit'
import { logError } from '@/lib/security/logger'
import { adicionarDiasIsoBrasilia } from '@/lib/utils/date'
import type { LmeStatus } from '@/lib/supabase/types'

const ALLOWED_STATUSES = new Set<LmeStatus>([
  'rascunho',
  'enviada',
  'em_analise',
  'deferida',
  'devolvida',
  'indeferida',
  'emitida',
])

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  const active = await getActiveWorkspace(supabase, user.id)
  if (!active) return NextResponse.json({ error: 'Sem workspace' }, { status: 403 })

  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'lmeId invalido' }, { status: 400 })

  const parsed = await readJsonBody<{ status?: unknown }>(req, 8 * 1024)
  if ('response' in parsed) return parsed.response

  const status = parsed.data.status
  if (typeof status !== 'string' || !ALLOWED_STATUSES.has(status as LmeStatus)) {
    return NextResponse.json({ error: 'status invalido' }, { status: 400 })
  }

  const { data: lme } = await supabase
    .from('lmes')
    .select('id, status')
    .eq('id', id)
    .eq('workspace_id', active.workspaceId)
    .maybeSingle()

  if (!lme) return NextResponse.json({ error: 'LME nao encontrada' }, { status: 404 })
  if (lme.status === status) return NextResponse.json({ ok: true })

  const updateData: { status: LmeStatus; next_renewal_date?: string } = { status: status as LmeStatus }
  if (status === 'deferida') {
    updateData.next_renewal_date = adicionarDiasIsoBrasilia(180)
  }

  const { error } = await supabase
    .from('lmes')
    .update(updateData)
    .eq('id', id)
    .eq('workspace_id', active.workspaceId)

  if (error) {
    logError('[lmes/status]', error, { lmeId: id, workspaceId: active.workspaceId })
    return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 })
  }

  await auditLog(supabase, {
    workspaceId: active.workspaceId,
    userId: user.id,
    action: 'lme_status_update',
    resourceType: 'lme',
    resourceId: id,
    metadata: {
      previous_status: lme.status,
      new_status: status,
      source: 'manual_status_action',
    },
  })

  return NextResponse.json({ ok: true })
}
