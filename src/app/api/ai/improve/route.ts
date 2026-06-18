import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiProvider } from '@/lib/ai/index'
import { readJsonBody, safeErrorMessage } from '@/lib/api/security'
import { getActiveWorkspace } from '@/lib/active-workspace'
import { auditLog } from '@/lib/security/audit'
import { logError } from '@/lib/security/logger'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const active = await getActiveWorkspace(supabase, user.id)

  const parsed = await readJsonBody<{
    text?: unknown
    maxLength?: unknown
    context?: unknown
  }>(request, 128 * 1024)
  if ('response' in parsed) return parsed.response
  const body = parsed.data
  const text: string = typeof body.text === 'string' ? body.text.trim() : ''
  const maxLength: number = Number(body.maxLength) || 0
  const context: string | undefined = typeof body.context === 'string' ? body.context : undefined

  if (!text) return NextResponse.json({ error: 'Texto vazio.' }, { status: 400 })
  if (!maxLength) return NextResponse.json({ error: 'maxLength obrigatório.' }, { status: 400 })
  if (text.length > 80_000) return NextResponse.json({ error: 'Texto muito grande.' }, { status: 413 })
  if (!Number.isInteger(maxLength) || maxLength < 1 || maxLength > 10_000) {
    return NextResponse.json({ error: 'maxLength invalido.' }, { status: 400 })
  }
  if (!aiProvider.improveText) {
    return NextResponse.json({ error: 'Melhoria com IA indisponível no provedor configurado.' }, { status: 501 })
  }

  try {
    const improved = await aiProvider.improveText({ text, maxLength, context })
    await auditLog(supabase, {
      workspaceId: active?.workspaceId ?? null,
      userId: user.id,
      action: 'ai_improve',
      resourceType: 'lme_text',
      resourceId: null,
      metadata: { maxLength },
    })
    return NextResponse.json({ text: improved })
  } catch (error) {
    logError('[ai/improve]', error, { workspaceId: active?.workspaceId ?? null })
    return NextResponse.json(
      { error: safeErrorMessage(error, 'Erro ao melhorar com IA') },
      { status: 500 },
    )
  }
}
