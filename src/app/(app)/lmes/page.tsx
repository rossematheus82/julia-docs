import { createClient } from '@/lib/supabase/server'
import { getActiveWorkspace } from '@/lib/active-workspace'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { LmeStatus, Disease } from '@/lib/supabase/types'
import { differenceInDays, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, FileText } from 'lucide-react'
import { LmesSearch } from '@/components/lmes-search'
import { lmeCode } from '@/lib/lme-code'

const DISEASE_LABELS: Record<string, string> = {
  asma: 'Asma', dpoc: 'DPOC', 'dpi-fp': 'DPI-FP', hap: 'HAP',
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  inicial: 'Processo Completo', renovacao: 'LME + Receita',
  reavaliacao: 'Processo Completo',
}

function RenewalBadge({ dateStr }: { dateStr: string | null }) {
  if (!dateStr) return null
  const days = differenceInDays(parseISO(dateStr), new Date())
  const color = days < 30 ? 'bg-red-100 text-red-700' : days < 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
  const dot = days < 30 ? '🔴' : days < 60 ? '🟡' : '🟢'
  return (
    <Badge className={`ml-3 flex-shrink-0 text-xs ${color}`}>
      {dot} Renovar em {days}d
    </Badge>
  )
}

export default async function LmesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; disease?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const active = await getActiveWorkspace(supabase, user.id)
  if (!active) redirect('/onboarding')
  const memberData = { workspace_id: active.workspaceId }

  const params = await searchParams
  const q = params.q?.trim() ?? ''
  const statusFilter = params.status ?? ''
  const diseaseFilter = params.disease ?? ''

  let query = supabase
    .from('lmes')
    .select('id, disease, request_type, status, created_at, next_renewal_date, patient:patients(id, full_name), doctor:doctors(full_name)')
    .eq('workspace_id', memberData.workspace_id)
    // LMEs em rascunho são legado (não criamos mais) — não aparecem na listagem
    .neq('status', 'rascunho')
    .order('created_at', { ascending: false })

  if (statusFilter) query = query.eq('status', statusFilter as LmeStatus)
  if (diseaseFilter) query = query.eq('disease', diseaseFilter as Disease)

  type LmeRow = {
    id: string; disease: string; request_type: string; status: string
    created_at: string; next_renewal_date: string | null
    patient: { id: string; full_name: string } | null
    doctor: { full_name: string } | null
  }
  const { data: lmes } = await query.limit(100) as { data: LmeRow[] | null }

  const filtered = q
    ? lmes?.filter(l => l.patient?.full_name?.toLowerCase().includes(q.toLowerCase()))
    : lmes

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">LMEs</h1>
          <p className="text-gray-500 text-sm">{filtered?.length ?? 0} LME(s) encontrada(s)</p>
        </div>
        <Link href="/lmes/nova">
          <Button className="gap-2"><Plus className="h-4 w-4" /> Nova LME</Button>
        </Link>
      </div>

      <LmesSearch defaultQ={q} defaultStatus={statusFilter} defaultDisease={diseaseFilter} />

      <div className="space-y-2">
        {(filtered?.length ?? 0) === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>{q || statusFilter || diseaseFilter ? 'Nenhuma LME encontrada com esses filtros.' : 'Nenhuma LME cadastrada ainda.'}</p>
            {!q && !statusFilter && !diseaseFilter && (
              <Link href="/lmes/nova"><Button className="mt-3" size="sm">Criar primeira LME</Button></Link>
            )}
          </div>
        )}
        {filtered?.map(lme => {
          const patient = lme.patient
          const doctor = lme.doctor
          const isEmitida = lme.status === 'emitida'
          return (
            <Link key={lme.id} href={`/lmes/${lme.id}`}>
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">{patient?.full_name}</p>
                      <span className="text-[10px] font-mono font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                        {lmeCode({ id: lme.id, disease: lme.disease, createdAt: lme.created_at })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {DISEASE_LABELS[lme.disease]} · {REQUEST_TYPE_LABELS[lme.request_type]}
                      {doctor?.full_name ? ` · Dr. ${doctor.full_name}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  {isEmitida
                    ? lme.next_renewal_date
                      ? <RenewalBadge dateStr={lme.next_renewal_date} />
                      : <Badge className="text-xs bg-blue-100 text-blue-700">Emitida</Badge>
                    : <Badge className="text-xs bg-gray-100 text-gray-600">Rascunho</Badge>
                  }
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
