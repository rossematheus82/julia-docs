'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Copy, RefreshCw, Users, Check, Crown, Building2, Plus, LogOut, ArrowRightLeft, UserMinus } from 'lucide-react'
import { toast } from 'sonner'
import { formatarData } from '@/lib/utils/date'

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${segment()}-${segment()}`
}

interface Workspace { id: string; name: string; invite_code: string; role: string; joined_at: string }
interface Member { id: string; role: string; user_id: string; joined_at: string; name?: string | null; crm?: string | null }

interface Props {
  activeWorkspace: Workspace
  myWorkspaces: Workspace[]
  members: Member[]
  currentUserId: string
  canCreateWorkspace: boolean
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietário', admin: 'Administrador', member: 'Membro',
}

export function WorkspaceSettingsClient({ activeWorkspace, myWorkspaces, members, currentUserId, canCreateWorkspace }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [name, setName] = useState(activeWorkspace.name)
  const [inviteCode, setInviteCode] = useState(activeWorkspace.invite_code)
  const [savingName, setSavingName] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [switching, setSwitching] = useState<string | null>(null)
  const [leaving, setLeaving] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  const isOwner = activeWorkspace.role === 'owner'

  async function removeMember(member: Member) {
    const label = member.name ?? `Membro ${member.id.slice(0, 8)}`
    if (!confirm(`Remover ${label} do ambulatório?\n\nOs pacientes e as LMEs criados por ele permanecem no ambulatório — só o acesso dele é revogado.`)) return
    setRemoving(member.id)
    const res = await fetch('/api/workspaces/members/remove', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: member.id }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body.error ?? 'Erro ao remover membro')
      setRemoving(null)
      return
    }
    toast.success(`${label} removido.`)
    router.refresh()
  }

  async function saveName() {
    if (!name.trim() || name === activeWorkspace.name) return
    setSavingName(true)
    const { error } = await supabase.from('workspaces').update({ name: name.trim() }).eq('id', activeWorkspace.id)
    setSavingName(false)
    if (error) { toast.error('Erro ao salvar nome'); return }
    toast.success('Nome atualizado!')
    router.refresh()
  }

  async function regenerateCode() {
    if (!isOwner) return
    setRegenerating(true)
    const newCode = generateInviteCode()
    const { error } = await supabase.from('workspaces').update({ invite_code: newCode }).eq('id', activeWorkspace.id)
    setRegenerating(false)
    if (error) { toast.error('Erro ao gerar novo código'); return }
    setInviteCode(newCode)
    toast.success('Código de convite atualizado!')
  }

  async function copyCode() {
    await navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Código copiado!')
  }

  async function switchTo(workspaceId: string) {
    if (workspaceId === activeWorkspace.id) return
    setSwitching(workspaceId)
    const res = await fetch('/api/workspaces/switch', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body.error ?? 'Erro ao trocar')
      setSwitching(null)
      return
    }
    toast.success('Ambulatório trocado.')
    router.push('/dashboard')
    router.refresh()
  }

  async function leave(workspaceId: string, workspaceName: string) {
    if (!confirm(`Sair de "${workspaceName}"? Você precisará de um novo convite pra entrar de volta.`)) return
    setLeaving(workspaceId)
    const res = await fetch(`/api/workspaces/${workspaceId}/leave`, { method: 'POST' })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body.error ?? 'Erro ao sair')
      setLeaving(null)
      return
    }
    toast.success(`Você saiu de "${workspaceName}".`)
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-gray-400" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ambulatórios</h1>
          <p className="text-gray-500 text-sm">Gerencie seus ambulatórios e troque entre eles</p>
        </div>
      </div>

      {/* Meus ambulatórios — lista completa com switch/sair */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Meus ambulatórios ({myWorkspaces.length})
            </span>
            <Link href="/onboarding">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> {canCreateWorkspace ? 'Criar / entrar em outro' : 'Entrar em outro'}
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {myWorkspaces.map(w => {
            const isActive = w.id === activeWorkspace.id
            return (
              <div
                key={w.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${isActive ? 'border-blue-300 bg-blue-50/50' : 'border-gray-200'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{w.name}</p>
                      {isActive && <Badge className="text-xs bg-blue-100 text-blue-700 border-0">Ativo</Badge>}
                      <Badge variant="outline" className="text-xs">{ROLE_LABELS[w.role] ?? w.role}</Badge>
                    </div>
                    <p className="text-xs text-gray-400">Entrou em {formatarData(w.joined_at)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!isActive && (
                    <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => switchTo(w.id)} disabled={switching === w.id}>
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      {switching === w.id ? 'Trocando...' : 'Usar este'}
                    </Button>
                  )}
                  {w.role !== 'owner' && (
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-red-600 border-red-200 hover:bg-red-50" onClick={() => leave(w.id, w.name)} disabled={leaving === w.id}>
                      <LogOut className="h-3.5 w-3.5" />
                      Sair
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 pt-2">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400 uppercase tracking-wider">Detalhes do ambulatório ativo</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Nome */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nome do ambulatório</Label>
            <div className="flex gap-2 mt-1">
              <Input value={name} onChange={e => setName(e.target.value)} disabled={!isOwner} className="flex-1" />
              {isOwner && (
                <Button onClick={saveName} disabled={savingName || name === activeWorkspace.name} variant="outline">
                  {savingName ? 'Salvando...' : 'Salvar'}
                </Button>
              )}
            </div>
            {!isOwner && <p className="text-xs text-gray-400 mt-1">Só o proprietário pode editar.</p>}
          </div>
        </CardContent>
      </Card>

      {/* Código de convite */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Código de convite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-500">Compartilhe este código para convidar novos médicos para este ambulatório.</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-mono text-lg font-bold text-center tracking-widest text-gray-900">
              {inviteCode}
            </div>
            <Button variant="outline" size="icon" onClick={copyCode}>
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
            {isOwner && (
              <Button variant="outline" size="icon" onClick={regenerateCode} disabled={regenerating}>
                <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
          {isOwner && (
            <p className="text-xs text-gray-400">Gerar um novo código invalida o anterior.</p>
          )}
        </CardContent>
      </Card>

      {/* Membros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Membros ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {members.map(member => {
            const isSelf = member.user_id === currentUserId
            const baseName = member.name ?? (isSelf ? 'Você' : `Membro ${member.id.slice(0, 8)}`)
            const displayName = member.name && isSelf ? `${member.name} (você)` : baseName
            const initial = member.name ? member.name.trim().charAt(0).toUpperCase() : 'M'
            const canRemove = isOwner && member.role !== 'owner' && !isSelf
            return (
              <div key={member.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    {member.role === 'owner' ? (
                      <Crown className="h-3.5 w-3.5 text-blue-600" />
                    ) : (
                      <span className="text-xs font-medium text-blue-600">{initial}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {displayName}
                      {member.crm && <span className="text-xs font-normal text-gray-400 ml-1.5">CRM {member.crm}</span>}
                    </p>
                    <p className="text-xs text-gray-400">
                      Entrou em {formatarData(member.joined_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-xs">
                    {ROLE_LABELS[member.role] ?? member.role}
                  </Badge>
                  {canRemove && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => removeMember(member)}
                      disabled={removing === member.id}
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                      {removing === member.id ? 'Removendo...' : 'Remover'}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
