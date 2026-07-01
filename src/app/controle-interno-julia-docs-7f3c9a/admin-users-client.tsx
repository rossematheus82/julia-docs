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
import { Ban, CheckCircle2, Loader2, Search, Stethoscope, UsersRound } from 'lucide-react'
import { toast } from 'sonner'

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
}

interface Props {
  users: AdminUserRow[]
  currentUserId: string
  workspaces: AdminWorkspaceRow[]
  patients: AdminPatientRow[]
}

export function AdminUsersClient({ users, currentUserId, workspaces, patients }: Props) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [workspaceFilter, setWorkspaceFilter] = useState('all')
  const [patientSearch, setPatientSearch] = useState('')

  const filteredPatients = useMemo(() => {
    const term = patientSearch.trim().toLowerCase()

    return patients.filter(patient => {
      const matchesWorkspace = workspaceFilter === 'all' || patient.workspaceId === workspaceFilter
      if (!matchesWorkspace) return false
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
  }, [patients, patientSearch, workspaceFilter])

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

            <div className="grid gap-2 sm:grid-cols-[minmax(220px,280px)_minmax(220px,280px)]">
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
          <table className="w-full min-w-[920px] text-sm">
            <thead className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Paciente</th>
                <th className="px-4 py-3 font-medium">Ambulatorio</th>
                <th className="px-4 py-3 font-medium">CPF</th>
                <th className="px-4 py-3 font-medium">CNS</th>
                <th className="px-4 py-3 font-medium">Nascimento</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">Atualizado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPatients.map(patient => (
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
                  <td className="px-4 py-3 text-gray-600">{patient.cpf ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{patient.cns ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(patient.birthDate)}</td>
                  <td className="px-4 py-3 text-gray-600">{patient.phone ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(patient.updatedAt)}</td>
                </tr>
              ))}

              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                    Nenhum paciente encontrado para os filtros selecionados.
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
  return new Date(value).toLocaleDateString('pt-BR')
}
