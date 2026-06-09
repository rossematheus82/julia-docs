import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const FEEDBACK_TO = process.env.FEEDBACK_TO ?? 'drmatheusrosse@gmail.com'
const FEEDBACK_FROM = process.env.FEEDBACK_FROM ?? 'Julia Docs <onboarding@resend.dev>'

const TIPO_LABELS: Record<string, string> = {
  sugestao: 'Sugestão',
  erro: 'Reportar erro',
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json()
  const tipo: string = body.tipo === 'erro' ? 'erro' : 'sugestao'
  const mensagem: string = typeof body.mensagem === 'string' ? body.mensagem.trim() : ''
  const contato: string = typeof body.contato === 'string' ? body.contato.trim() : ''

  if (!mensagem) return NextResponse.json({ error: 'Escreva sua mensagem.' }, { status: 400 })
  if (mensagem.length > 4000) return NextResponse.json({ error: 'Mensagem muito longa.' }, { status: 400 })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[feedback] RESEND_API_KEY não configurada')
    return NextResponse.json({ error: 'Envio de feedback ainda não configurado. Avise o responsável.' }, { status: 501 })
  }

  // reply_to PRECISA ser e-mail válido (o Resend rejeita telefone/texto livre).
  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  const replyTo = isEmail(contato) ? contato : (user.email && isEmail(user.email) ? user.email : undefined)

  const label = TIPO_LABELS[tipo]
  const quando = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  const html = `
    <h2>${label} — Julia Docs</h2>
    <p><strong>De:</strong> ${user.email ?? '(sem e-mail)'}</p>
    ${contato ? `<p><strong>Contato informado:</strong> ${contato}</p>` : ''}
    <p><strong>Quando:</strong> ${quando}</p>
    <hr />
    <p style="white-space:pre-wrap">${mensagem.replace(/</g, '&lt;')}</p>
  `

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FEEDBACK_FROM,
        to: [FEEDBACK_TO],
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject: `[Julia Docs] ${label} de ${user.email ?? 'usuário'}`,
        html,
      }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error('[feedback] Resend erro', res.status, detail)
      return NextResponse.json({ error: 'Não foi possível enviar agora. Tente novamente.' }, { status: 502 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[feedback]', err)
    return NextResponse.json({ error: 'Erro ao enviar feedback.' }, { status: 500 })
  }
}
