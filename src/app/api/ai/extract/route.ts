import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveWorkspace } from '@/lib/active-workspace'
import { aiProvider, anonymizeProntuario } from '@/lib/ai/index'
import { LmeCommonSchema } from '@/lib/schemas/lme-common'
import { AsmaFormSchema } from '@/lib/schemas/asma'
import { DpocFormSchema } from '@/lib/schemas/dpoc'
import { DpiFpFormSchema } from '@/lib/schemas/dpi-fp'
import { HapFormSchema } from '@/lib/schemas/hap'
import { z } from 'zod'
import { readJsonBody, safeErrorMessage } from '@/lib/api/security'
import type { Disease, RequestType } from '@/lib/supabase/types'
import { auditLog } from '@/lib/security/audit'
import { logError } from '@/lib/security/logger'

const DISEASE_SCHEMAS: Record<string, z.ZodSchema> = {
  asma: AsmaFormSchema,
  dpoc: DpocFormSchema,
  'dpi-fp': DpiFpFormSchema,
  hap: HapFormSchema,
}
const REQUEST_TYPES: RequestType[] = ['inicial', 'renovacao', 'reavaliacao']

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const active = await getActiveWorkspace(supabase, user.id)
  const memberData = active ? { workspace_id: active.workspaceId } : null

  const parsed = await readJsonBody<{
    prontuario?: unknown
    disease?: unknown
    requestType?: unknown
    anonymize?: unknown
  }>(request, 256 * 1024)
  if ('response' in parsed) return parsed.response
  const body = parsed.data
  const { prontuario, disease, requestType, anonymize = true } = body

  if (!prontuario || !disease || !requestType) {
    return NextResponse.json({ error: 'Parâmetros obrigatórios: prontuario, disease, requestType' }, { status: 400 })
  }

  if (typeof prontuario !== 'string' || prontuario.length > 200_000) {
    return NextResponse.json({ error: 'Prontuario invalido ou muito grande' }, { status: 400 })
  }
  if (typeof disease !== 'string' || typeof requestType !== 'string') {
    return NextResponse.json({ error: 'Parametros invalidos' }, { status: 400 })
  }

  const shouldAnonymize = anonymize !== false
  const processedText = shouldAnonymize ? anonymizeProntuario(prontuario) : prontuario

  try {
    const specificSchema = DISEASE_SCHEMAS[disease]
    if (!specificSchema) {
      return NextResponse.json({ error: `Doença não suportada: ${disease}` }, { status: 400 })
    }

    if (!REQUEST_TYPES.includes(requestType as RequestType)) {
      return NextResponse.json({ error: 'Tipo de solicitacao invalido' }, { status: 400 })
    }
    const diseaseContext = disease as Disease
    const requestContext = requestType as RequestType

    const [lmeResult, specificResult] = await Promise.all([
      aiProvider.extractFields({
        prontuario: processedText,
        schema: LmeCommonSchema,
        diseaseContext,
        requestType: requestContext,
        anonymize: shouldAnonymize,
      }),
      aiProvider.extractFields({
        prontuario: processedText,
        schema: specificSchema,
        diseaseContext,
        requestType: requestContext,
        anonymize: shouldAnonymize,
      }),
    ])

    await auditLog(supabase, {
      workspaceId: memberData?.workspace_id ?? null,
      userId: user.id,
      action: 'ai_extract',
      resourceType: 'lme',
      resourceId: null,
      metadata: { requestType, anonymized: shouldAnonymize },
    })

    return NextResponse.json({
      lme: lmeResult,
      specific: specificResult,
      anonymized: shouldAnonymize,
    })
  } catch (error) {
    logError('[ai/extract]', error, { workspaceId: memberData?.workspace_id ?? null })
    return NextResponse.json(
      { error: safeErrorMessage(error, 'Erro ao processar com IA') },
      { status: 500 }
    )
  }
}
