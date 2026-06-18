import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/supabase/types'
import { logError } from './logger'

type AuditAction =
  | 'ai_extract'
  | 'ai_improve'
  | 'patient_delete'
  | 'lme_delete'
  | 'pdf_generate'
  | 'workspace_switch'
  | 'workspace_leave'
  | 'workspace_member_remove'
  | 'feedback_send'

interface AuditEvent {
  workspaceId: string | null
  userId: string
  action: AuditAction
  resourceType?: string
  resourceId?: string | null
  metadata?: Record<string, Json | undefined>
}

export async function auditLog(
  supabase: SupabaseClient<Database>,
  event: AuditEvent,
) {
  const { error } = await supabase.from('audit_logs').insert({
    workspace_id: event.workspaceId,
    user_id: event.userId,
    action: event.action,
    resource_type: event.resourceType ?? null,
    resource_id: event.resourceId ?? null,
    ip_address: null,
    user_agent: null,
    metadata: event.metadata ?? {},
  })

  if (error) {
    logError('[audit]', error, {
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      workspaceId: event.workspaceId,
    })
  }
}
