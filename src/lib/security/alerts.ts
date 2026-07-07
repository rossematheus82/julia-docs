import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/supabase/types'
import { logError } from './logger'

type SecurityAlertSeverity = 'low' | 'medium' | 'high'

interface SecurityAlertEvent {
  severity: SecurityAlertSeverity
  type: string
  title: string
  description: string
  workspaceId?: string | null
  userId?: string | null
  resourceType?: string | null
  resourceId?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  metadata?: Record<string, Json | undefined>
  sendEmail?: boolean
}

const ALERT_TO = process.env.SECURITY_ALERT_TO ?? process.env.FEEDBACK_TO ?? 'drmatheusrosse@gmail.com'
const ALERT_FROM = process.env.SECURITY_ALERT_FROM ?? process.env.FEEDBACK_FROM ?? 'Julia Docs <onboarding@resend.dev>'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function shouldEmail(event: SecurityAlertEvent) {
  return event.sendEmail !== false && (event.severity === 'high' || event.severity === 'medium')
}

async function sendSecurityAlertEmail(event: SecurityAlertEvent) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !shouldEmail(event)) return false

  const when = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  const html = `
    <h2>Alerta de seguranca - Julia Docs</h2>
    <p><strong>Severidade:</strong> ${escapeHtml(event.severity)}</p>
    <p><strong>Tipo:</strong> ${escapeHtml(event.type)}</p>
    <p><strong>Quando:</strong> ${escapeHtml(when)}</p>
    <p><strong>Titulo:</strong> ${escapeHtml(event.title)}</p>
    <p><strong>Descricao:</strong> ${escapeHtml(event.description)}</p>
    <hr />
    <p><strong>Usuario:</strong> ${escapeHtml(event.userId ?? '-')}</p>
    <p><strong>Ambulatorio:</strong> ${escapeHtml(event.workspaceId ?? '-')}</p>
    <p><strong>Recurso:</strong> ${escapeHtml(event.resourceType ?? '-')} ${escapeHtml(event.resourceId ?? '')}</p>
    <p><strong>IP:</strong> ${escapeHtml(event.ipAddress ?? '-')}</p>
  `

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: ALERT_FROM,
        to: [ALERT_TO],
        subject: `[Julia Docs] Alerta de seguranca: ${event.title}`,
        html,
      }),
    })
    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      logError('[security-alert-email] Resend error', detail, { status: response.status, type: event.type })
      return false
    }
    return true
  } catch (error) {
    logError('[security-alert-email]', error, { type: event.type })
    return false
  }
}

export async function createSecurityAlert(
  supabase: SupabaseClient<Database>,
  event: SecurityAlertEvent,
) {
  const emailed = await sendSecurityAlertEmail(event)
  const { error } = await supabase.from('security_alerts').insert({
    severity: event.severity,
    type: event.type,
    title: event.title,
    description: event.description,
    workspace_id: event.workspaceId ?? null,
    user_id: event.userId ?? null,
    resource_type: event.resourceType ?? null,
    resource_id: event.resourceId ?? null,
    ip_address: event.ipAddress ?? null,
    user_agent: event.userAgent ?? null,
    metadata: event.metadata ?? {},
    emailed_at: emailed ? new Date().toISOString() : null,
  })

  if (error) {
    logError('[security-alert]', error, {
      type: event.type,
      severity: event.severity,
      userId: event.userId,
      workspaceId: event.workspaceId,
    })
  }
}
