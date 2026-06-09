import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiProvider } from '@/lib/ai/index'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await request.json()
  const text: string = typeof body.text === 'string' ? body.text.trim() : ''
  const maxLength: number = Number(body.maxLength) || 0
  const context: string | undefined = typeof body.context === 'string' ? body.context : undefined

  if (!text) return NextResponse.json({ error: 'Texto vazio.' }, { status: 400 })
  if (!maxLength) return NextResponse.json({ error: 'maxLength obrigatório.' }, { status: 400 })
  if (!aiProvider.improveText) {
    return NextResponse.json({ error: 'Melhoria com IA indisponível no provedor configurado.' }, { status: 501 })
  }

  try {
    const improved = await aiProvider.improveText({ text, maxLength, context })
    return NextResponse.json({ text: improved })
  } catch (error) {
    console.error('AI improve error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao melhorar com IA' },
      { status: 500 },
    )
  }
}
