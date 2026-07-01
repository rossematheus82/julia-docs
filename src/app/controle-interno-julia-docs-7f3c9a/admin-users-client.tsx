'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Ban, CheckCircle2, Loader2 } from 'lucide-react'
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

interface Props {
  users: AdminUserRow[]
  currentUserId: string
}

export function AdminUsersClient({ users, currentUserId }: Props) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

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
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
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
    </div>
  )
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('pt-BR')
}
