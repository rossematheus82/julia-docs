import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/supabase/types'
import { logError } from './logger'

type AuditAction =
  | 'ai_extract'
  | 'ai_improve'
  | 'patient_delete'
  | 'patient_export'
  | 'patient_restore'
  | 'patient_view'
  | 'lme_delete'
  | 'lme_status_update'
  | 'lme_view'
  | 'pdf_generate'
  | 'legal_acceptance'
  | 'workspace_join'
  | 'workspace_switch'
  | 'workspace_leave'
  | 'workspace_member_remove'
  | 'workspace_member_role_update'
  | 'feedback_send'

interface AuditEvent {
  workspaceId: string | null
  userId: string
  action: AuditAction
  resourceType?: string
  resourceId?: string | null
  metadata?: Record<string, Json | undefined>
  ipAddress?: string | null
  userAgent?: string | null
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
    ip_address: event.ipAddress ?? null,
    user_agent: event.userAgent ?? null,
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
