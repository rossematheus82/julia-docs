'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Activity, Ban, CheckCircle2, Download, Loader2, RotateCcw, Search, Stethoscope, UsersRound } from 'lucide-react'
import { toast } from 'sonner'
import { formatarData, formatarDataHora } from '@/lib/utils/date'
import { mascararCns, mascararCpf } from '@/lib/utils/privacy'

export interface AdminUserRow {
  id: string
  email: string
  createdAt: string | null
  lastSignInAt: string | null
  role: 'basic' | 'platform_admin'
  status: 'active' | 'banned'
  workspacesCount: number
  hasDoctorProfile: boolean
}

export interface AdminWorkspaceRow {
  id: string
  name: string
  inviteCode: string
  createdAt: string | null
}

export interface AdminPatientRow {
  id: string
  workspaceId: string
  workspaceName: string
  fullName: string
  cpf: string | null
  cns: string | null
  birthDate: string | null
  phone: string | null
  createdAt: string | null
  updatedAt: string | null
  deletedAt: string | null
  deletedByUserId: string | null
}

export interface AdminAuditRow {
  id: number
  workspaceId: string | null
  workspaceName: string
  userId: string | null
  userEmail: string
  action: string
  resourceType: string | null
  resourceId: string | null
  createdAt: string | null
}

interface Props {
  users: AdminUserRow[]
  currentUserId: string
  workspaces: AdminWorkspaceRow[]
  patients: AdminPatientRow[]
  auditLogs: AdminAuditRow[]
}

export function AdminUsersClient({ users, currentUserId, workspaces, patients, auditLogs }: Props) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [restoringPatientId, setRestoringPatientId] = useState<string | null>(null)
  const [exportingPatientId, setExportingPatientId] = useState<string | null>(null)
  const [workspaceFilter, setWorkspaceFilter] = useState('all')
  const [patientStatusFilter, setPatientStatusFilter] = useState('active')
  const [patientSearch, setPatientSearch] = useState('')
  const [auditWorkspaceFilter, setAuditWorkspaceFilter] = useState('all')
  const [auditUserFilter, setAuditUserFilter] = useState('all')
  const [auditActionFilter, setAuditActionFilter] = useState('all')
  const [auditStartDate, setAuditStartDate] = useState('')
  const [auditEndDate, setAuditEndDate] = useState('')
  const [auditSearch, setAuditSearch] = useState('')

  const filteredPatients = useMemo(() => {
    const term = patientSearch.trim().toLowerCase()

    return patients.filter(patient => {
      const matchesWorkspace = workspaceFilter === 'all' || patient.workspaceId === workspaceFilter
      if (!matchesWorkspace) return false
      const matchesStatus =
        patientStatusFilter === 'all' ||
        (patientStatusFilter === 'active' && !patient.deletedAt) ||
        (patientStatusFilter === 'deleted' && Boolean(patient.deletedAt))
      if (!matchesStatus) return false
      if (!term) return true

      const haystack = [
        patient.fullName,
        patient.cpf,
        patient.cns,
        patient.phone,
        patient.workspaceName,
      ].filter(Boolean).join(' ').toLowerCase()

      return haystack.includes(term)
    })
  }, [patients, patientSearch, patientStatusFilter, workspaceFilter])

  const auditUsers = useMemo(() => {
    const byId = new Map<string, string>()
    for (const log of auditLogs) {
      if (log.userId) byId.set(log.userId, log.userEmail)
    }
    return Array.from(byId, ([id, email]) => ({ id, email })).sort((a, b) => a.email.localeCompare(b.email))
  }, [auditLogs])

  const auditActions = useMemo(() => {
    return Array.from(new Set(auditLogs.map(log => log.action))).sort()
  }, [auditLogs])

  const filteredAuditLogs = useMemo(() => {
    const term = auditSearch.trim().toLowerCase()
    const start = auditStartDate ? new Date(`${auditStartDate}T00:00:00`).getTime() : null
    const end = auditEndDate ? new Date(`${auditEndDate}T23:59:59.999`).getTime() : null

    return auditLogs.filter(log => {
      if (auditWorkspaceFilter === 'platform' && log.workspaceId !== null) return false
      if (auditWorkspaceFilter !== 'all' && auditWorkspaceFilter !== 'platform' && log.workspaceId !== auditWorkspaceFilter) return false
      if (auditUserFilter !== 'all' && log.userId !== auditUserFilter) return false
      if (auditActionFilter !== 'all' && log.action !== auditActionFilter) return false

      if (log.createdAt) {
        const createdAt = new Date(log.createdAt).getTime()
        if (start !== null && createdAt < start) return false
        if (end !== null && createdAt > end) return false
      } else if (start !== null || end !== null) {
        return false
      }

      if (!term) return true
      const haystack = [
        log.userEmail,
        log.workspaceName,
        log.action,
        formatAction(log.action),
        log.resourceType,
        formatResourceType(log.resourceType),
        log.resourceId,
      ].filter(Boolean).join(' ').toLowerCase()

      return haystack.includes(term)
    })
  }, [auditActionFilter, auditEndDate, auditLogs, auditSearch, auditStartDate, auditUserFilter, auditWorkspaceFilter])

  function clearAuditFilters() {
    setAuditWorkspaceFilter('all')
    setAuditUserFilter('all')
    setAuditActionFilter('all')
    setAuditStartDate('')
    setAuditEndDate('')
    setAuditSearch('')
  }

  async function setStatus(user: AdminUserRow, status: 'active' | 'banned') {
    const label = status === 'banned' ? 'banir' : 'reativar'
    if (status === 'banned' && !confirm(`Banir ${user.email}?`)) return

    setLoadingId(user.id)
    const res = await fetch('/api/controle-interno-julia-docs-7f3c9a/users/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, status }),
    })
    const body = await res.json().catch(() => ({}))
    setLoadingId(null)

    if (!res.ok) {
      toast.error(body.error ?? `Erro ao ${label} usuario`)
      return
    }

    toast.success(status === 'banned' ? 'Usuario banido.' : 'Usuario reativado.')
    router.refresh()
  }

  async function restorePatient(patient: AdminPatientRow) {
    if (!patient.deletedAt) return
    if (!confirm(`Restaurar ${patient.fullName}?`)) return

    setRestoringPatientId(patient.id)
    const res = await fetch('/api/controle-interno-julia-docs-7f3c9a/patients/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: patient.id }),
    })
    const body = await res.json().catch(() => ({}))
    setRestoringPatientId(null)

    if (!res.ok) {
      toast.error(body.error ?? 'Erro ao restaurar paciente')
      return
    }

    toast.success('Paciente restaurado.')
    router.refresh()
  }

  async function exportPatient(patient: AdminPatientRow) {
    if (!confirm(`Exportar dados administrativos de ${patient.fullName}?`)) return

    setExportingPatientId(patient.id)
    const res = await fetch('/api/controle-interno-julia-docs-7f3c9a/patients/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: patient.id }),
    })
    setExportingPatientId(null)

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body.error ?? 'Erro ao exportar paciente')
      return
    }

    const blob = await res.blob()
    const contentDisposition = res.headers.get('Content-Disposition') ?? ''
    const match = contentDisposition.match(/filename="([^"]+)"/)
    const fileName = match?.[1] ?? `paciente-${patient.id}.json`
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success('Exportacao gerada.')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <section className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Perfil</th>
              <th className="px-4 py-3 font-medium">Ambulatorios</th>
              <th className="px-4 py-3 font-medium">Criado em</th>
              <th className="px-4 py-3 font-medium">Ultimo login</th>
              <th className="px-4 py-3 text-right font-medium">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(user => {
              const isSelf = user.id === currentUserId
              const loading = loadingId === user.id
              return (
                <tr key={user.id} className="hover:bg-gray-50/70">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{user.email}</div>
                    <div className="font-mono text-[11px] text-gray-400">{user.id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Badge className={user.status === 'banned' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                        {user.status === 'banned' ? 'Banido' : 'Ativo'}
                      </Badge>
                      {user.role === 'platform_admin' && (
                        <Badge variant="outline">Admin</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {user.hasDoctorProfile ? 'Medico preenchido' : 'Pendente'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.workspacesCount}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(user.lastSignInAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {user.status === 'banned' ? (
                      <Button size="sm" variant="outline" className="gap-1.5" disabled={loading} onClick={() => setStatus(user, 'active')}>
                        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Reativar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
                        disabled={loading || isSelf || user.role === 'platform_admin'}
                        onClick={() => setStatus(user, 'banned')}
                      >
                        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                        Banir
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-600 text-white">
                <UsersRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Pacientes por ambulatorio</h2>
                <p className="text-sm text-gray-500">
                  {filteredPatients.length} de {patients.length} paciente(s) exibido(s)
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-[minmax(190px,240px)_minmax(160px,200px)_minmax(220px,280px)]">
              <Select value={workspaceFilter} onValueChange={setWorkspaceFilter}>
                <SelectTrigger aria-label="Filtrar por ambulatorio">
                  <SelectValue placeholder="Ambulatorio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os ambulatorios</SelectItem>
                  {workspaces.map(workspace => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={patientStatusFilter} onValueChange={setPatientStatusFilter}>
                <SelectTrigger aria-label="Filtrar por status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="deleted">Excluidos</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
                <Input
                  value={patientSearch}
                  onChange={event => setPatientSearch(event.target.value)}
                  placeholder="Buscar nome, CPF ou CNS"
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-sm">
            <thead className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Paciente</th>
                <th className="px-4 py-3 font-medium">Ambulatorio</th>
                <th className="px-4 py-3 font-medium">CPF</th>
                <th className="px-4 py-3 font-medium">CNS</th>
                <th className="px-4 py-3 font-medium">Nascimento</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Atualizado em</th>
                <th className="px-4 py-3 text-right font-medium">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPatients.map(patient => {
                const restoring = restoringPatientId === patient.id
                const exporting = exportingPatientId === patient.id
                return (
                  <tr key={patient.id} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{patient.fullName}</div>
                      <div className="font-mono text-[11px] text-gray-400">{patient.id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Stethoscope className="h-4 w-4 text-cyan-600" />
                        {patient.workspaceName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{patient.cpf ? mascararCpf(patient.cpf) : '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{patient.cns ? mascararCns(patient.cns) : '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(patient.birthDate)}</td>
                    <td className="px-4 py-3 text-gray-600">{patient.phone ?? '-'}</td>
                    <td className="px-4 py-3">
                      {patient.deletedAt ? (
                        <Badge className="bg-amber-100 text-amber-700">Excluido</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700">Ativo</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(patient.updatedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="gap-1.5" disabled={exporting} onClick={() => exportPatient(patient)}>
                          {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                          Exportar
                        </Button>
                        {patient.deletedAt && (
                          <Button size="sm" variant="outline" className="gap-1.5" disabled={restoring} onClick={() => restorePatient(patient)}>
                            {restoring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                            Restaurar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500">
                    Nenhum paciente encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700 text-white">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Auditoria recente</h2>
                <p className="text-sm text-gray-500">
                  {filteredAuditLogs.length} de {auditLogs.length} evento(s) exibido(s)
                </p>
              </div>
            </div>

            <div className="grid gap-2 lg:grid-cols-[minmax(180px,1fr)_minmax(190px,1fr)_minmax(170px,1fr)_140px_140px_minmax(220px,1fr)_auto]">
              <Select value={auditWorkspaceFilter} onValueChange={setAuditWorkspaceFilter}>
                <SelectTrigger aria-label="Filtrar auditoria por ambulatorio">
                  <SelectValue placeholder="Ambulatorio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os ambulatorios</SelectItem>
                  <SelectItem value="platform">Plataforma</SelectItem>
                  {workspaces.map(workspace => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={auditUserFilter} onValueChange={setAuditUserFilter}>
                <SelectTrigger aria-label="Filtrar auditoria por usuario">
                  <SelectValue placeholder="Usuario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os usuarios</SelectItem>
                  {auditUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={auditActionFilter} onValueChange={setAuditActionFilter}>
                <SelectTrigger aria-label="Filtrar auditoria por acao">
                  <SelectValue placeholder="Acao" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as acoes</SelectItem>
                  {auditActions.map(action => (
                    <SelectItem key={action} value={action}>
                      {formatAction(action)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={auditStartDate}
                onChange={event => setAuditStartDate(event.target.value)}
                aria-label="Data inicial da auditoria"
              />
              <Input
                type="date"
                value={auditEndDate}
                onChange={event => setAuditEndDate(event.target.value)}
                aria-label="Data final da auditoria"
              />

              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
                <Input
                  value={auditSearch}
                  onChange={event => setAuditSearch(event.target.value)}
                  placeholder="Buscar recurso ou acao"
                  className="pl-8"
                />
              </div>

              <Button variant="outline" onClick={clearAuditFilters}>
                Limpar
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Ambulatorio</th>
                <th className="px-4 py-3 font-medium">Acao</th>
                <th className="px-4 py-3 font-medium">Recurso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAuditLogs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50/70">
                  <td className="px-4 py-3 text-gray-600">{formatDate(log.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="max-w-[260px] truncate text-gray-900" title={log.userEmail}>{log.userEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{log.workspaceName}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{formatAction(log.action)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{formatResourceType(log.resourceType)}</div>
                    {log.resourceId && <div className="font-mono text-[11px] text-gray-400">{log.resourceId}</div>}
                  </td>
                </tr>
              ))}

              {filteredAuditLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                    Nenhum evento de auditoria encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return value.includes('T') ? formatarDataHora(value) : formatarData(value)
}

function formatAction(action: string) {
  const labels: Record<string, string> = {
    ai_extract: 'IA extracao',
    ai_improve: 'IA melhoria',
    patient_delete: 'Paciente excluido',
    patient_export: 'Paciente exportado',
    patient_restore: 'Paciente restaurado',
    patients_insert: 'Paciente criado',
    patients_update: 'Paciente editado',
    patients_delete: 'Paciente excluido',
    lme_delete: 'LME excluida',
    lme_status_update: 'Status da LME alterado',
    lmes_insert: 'LME criada',
    lmes_update: 'LME editada',
    lmes_delete: 'LME excluida',
    pdf_generate: 'PDF gerado',
    workspace_join: 'Entrada em ambulatorio',
    workspace_switch: 'Troca de ambulatorio',
    workspace_leave: 'Saida de ambulatorio',
    workspace_member_remove: 'Membro removido',
    workspace_member_role_update: 'Permissao de membro alterada',
    feedback_send: 'Feedback enviado',
  }
  return labels[action] ?? action
}

function formatResourceType(value: string | null) {
  const labels: Record<string, string> = {
    patient: 'Paciente',
    patients: 'Paciente',
    lme: 'LME',
    lmes: 'LME',
    doctors: 'Medico',
    health_facilities: 'Estabelecimento',
    workspace_members: 'Membro',
    workspaces: 'Ambulatorio',
  }
  if (!value) return '-'
  return labels[value] ?? value
}
