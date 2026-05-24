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

const DISEASE_SCHEMAS: Record<string, z.ZodSchema> = {
  asma: AsmaFormSchema,
  dpoc: DpocFormSchema,
  'dpi-fp': DpiFpFormSchema,
  hap: HapFormSchema,
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const active = await getActiveWorkspace(supabase, user.id)
  const memberData = active ? { workspace_id: active.workspaceId } : null

  const body = await request.json()
  const { prontuario, disease, requestType, anonymize = true } = body

  if (!prontuario || !disease || !requestType) {
    return NextResponse.json({ error: 'Parâmetros obrigatórios: prontuario, disease, requestType' }, { status: 400 })
  }

  const processedText = anonymize ? anonymizeProntuario(prontuario) : prontuario

  try {
    const specificSchema = DISEASE_SCHEMAS[disease]
    if (!specificSchema) {
      return NextResponse.json({ error: `Doença não suportada: ${disease}` }, { status: 400 })
    }

    const [lmeResult, specificResult] = await Promise.all([
      aiProvider.extractFields({
        prontuario: processedText,
        schema: LmeCommonSchema,
        diseaseContext: disease,
        requestType,
        anonymize,
      }),
      aiProvider.extractFields({
        prontuario: processedText,
        schema: specificSchema,
        diseaseContext: disease,
        requestType,
        anonymize,
      }),
    ])

    await supabase.from('audit_logs').insert({
      workspace_id: memberData?.workspace_id ?? null,
      user_id: user.id,
      action: 'ai_extract',
      resource_type: 'lme',
      resource_id: null,
      ip_address: null,
      user_agent: null,
      metadata: { disease, requestType, anonymized: anonymize },
    })

    return NextResponse.json({
      lme: lmeResult,
      specific: specificResult,
      anonymized: anonymize,
    })
  } catch (error) {
    console.error('AI extraction error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao processar com IA' },
      { status: 500 }
    )
  }
}
