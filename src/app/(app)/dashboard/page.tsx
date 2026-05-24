import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getActiveWorkspace } from '@/lib/active-workspace'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Bell, FileText, Users, Clock, RefreshCw } from 'lucide-react'
import { differenceInDays, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const DISEASE_LABELS: Record<string, string> = {
  asma: 'Asma', dpoc: 'DPOC', 'dpi-fp': 'DPI-FP', hap: 'HAP'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const active = await getActiveWorkspace(supabase, user.id)
  if (!active) redirect('/onboarding')
  const workspaceId = active.workspaceId

  type RenewalLme = { id: string; next_renewal_date: string | null; disease: string; patient: { full_name: string } | null; doctor: { full_name: string } | null }

  const today = new Date()
  const in30Days = new Date(today)
  in30Days.setDate(today.getDate() + 30)

  const [
    { data: renewalAlerts },
    { data: monthLmes },
    { count: totalPatients },
    { count: totalLmes },
  ] = await Promise.all([
    supabase
      .from('lmes')
      .select('id, next_renewal_date, patient:patients(full_name), disease, doctor:doctors(full_name)')
      .eq('workspace_id', workspaceId)
      .eq('status', 'emitida')
      .lte('next_renewal_date', in30Days.toISOString().split('T')[0])
      .gte('next_renewal_date', today.toISOString().split('T')[0])
      .order('next_renewal_date', { ascending: true })
      .limit(10),
    // Apenas para contar "LMEs este mês" — não exibimos mais a lista de recentes
    supabase
      .from('lmes')
      .select('id, created_at')
      .eq('workspace_id', workspaceId)
      .gte('created_at', new Date(today.getFullYear(), today.getMonth(), 1).toISOString()),
    supabase.from('patients').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
    supabase.from('lmes').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
  ])

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">{format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
        </div>
        <Link href="/lmes/nova">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Nova LME
          </Button>
        </Link>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total de pacientes', value: totalPatients ?? 0, icon: Users, color: 'text-blue-600' },
          { label: 'Total de LMEs', value: totalLmes ?? 0, icon: FileText, color: 'text-green-600' },
          { label: 'Renovações próximas', value: renewalAlerts?.length ?? 0, icon: Clock, color: 'text-orange-600' },
          { label: 'LMEs este mês', value: monthLmes?.length ?? 0, icon: RefreshCw, color: 'text-purple-600' },
        ].map(m => (
          <Card key={m.label}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{m.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{m.value}</p>
                </div>
                <m.icon className={`h-8 w-8 ${m.color} opacity-20`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alertas de renovação */}
      {(renewalAlerts?.length ?? 0) > 0 && (
        <Card className="border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-orange-700">
              <Bell className="h-4 w-4" />
              Renovações nos próximos 30 dias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(renewalAlerts as unknown as RenewalLme[])?.map(lme => {
              const days = differenceInDays(parseISO(lme.next_renewal_date!), today)
              const patient = lme.patient
              const doctor = lme.doctor
              return (
                <div key={lme.id} className="flex items-center justify-between p-2 rounded-lg bg-orange-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{patient?.full_name}</p>
                    <p className="text-xs text-gray-500">{DISEASE_LABELS[lme.disease]} — Dr. {doctor?.full_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${days <= 7 ? 'text-red-600' : 'text-orange-600'}`}>
                      {days === 0 ? 'Hoje' : `${days}d`}
                    </span>
                    <Link href={`/lmes/${lme.id}/renovar`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs">Renovar</Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
