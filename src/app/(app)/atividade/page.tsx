import { createClient } from '@/lib/supabase/server'
import { getActiveWorkspace } from '@/lib/active-workspace'
import { redirect } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Activity, FileText, User, Stethoscope, Building2, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const ACTION_LABELS: Record<string, string> = {
  create: 'criou',
  update: 'atualizou',
  delete: 'removeu',
  view: 'visualizou',
  generate_pdf: 'gerou PDF de',
  ai_extract: 'usou IA em',
}

const ENTITY_LABELS: Record<string, { label: string; icon: LucideIcon }> = {
  lme: { label: 'LME', icon: FileText },
  patient: { label: 'paciente', icon: User },
  doctor: { label: 'médico', icon: Stethoscope },
  health_facility: { label: 'estabelecimento', icon: Building2 },
  workspace: { label: 'ambulatório', icon: Settings },
}

export default async function AtividadePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const active = await getActiveWorkspace(supabase, user.id)
  if (!active) redirect('/onboarding')
  const memberData = { workspace_id: active.workspaceId }

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('workspace_id', memberData.workspace_id)
    .order('created_at', { ascending: false })
    .limit(100)

  const grouped = (logs ?? []).reduce((acc, log) => {
    const day = log.created_at.split('T')[0]
    if (!acc[day]) acc[day] = []
    acc[day].push(log)
    return acc
  }, {} as Record<string, typeof logs>)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="h-6 w-6 text-gray-400" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atividade</h1>
          <p className="text-gray-500 text-sm">Histórico de ações no ambulatório</p>
        </div>
      </div>

      {Object.keys(grouped).length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Activity className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>Nenhuma atividade registrada ainda.</p>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(grouped).map(([day, dayLogs]) => (
          <div key={day}>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              {format(parseISO(day), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
            <div className="space-y-1">
              {(dayLogs ?? []).map((log) => {
                const resourceType = log.resource_type ?? ''
                const entityInfo = ENTITY_LABELS[resourceType] ?? { label: resourceType, icon: Activity }
                const EntityIcon = entityInfo.icon
                const actionLabel = ACTION_LABELS[log.action] ?? log.action
                return (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <EntityIcon className="h-3.5 w-3.5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Usuário</span>{' '}
                        {actionLabel}{' '}
                        <span className="font-medium">{entityInfo.label}</span>
                        {log.resource_id && (
                          <span className="text-gray-400 text-xs ml-1">#{log.resource_id.slice(0, 8)}</span>
                        )}
                      </p>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {JSON.stringify(log.metadata).slice(0, 100)}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {format(parseISO(log.created_at), 'HH:mm')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
