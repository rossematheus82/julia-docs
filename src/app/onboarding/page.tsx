'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Building2, Lock, Users } from 'lucide-react'
import { isPlatformAdminEmail } from '@/lib/platform-admin'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-'
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('join')
  const [canCreateWorkspace, setCanCreateWorkspace] = useState(false)
  const [workspaceName, setWorkspaceName] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const allowed = isPlatformAdminEmail(data.user?.email)
      setCanCreateWorkspace(allowed)
      if (allowed) setTab('create')
    })
  }, [supabase.auth])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!workspaceName.trim()) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    if (!isPlatformAdminEmail(user.email)) {
      toast.error('Apenas administradores da plataforma podem criar ambulatórios.')
      setLoading(false)
      return
    }

    const code = generateCode()
    const { data: workspaceId, error: createErr } = await supabase
      .rpc('create_workspace_with_owner', { workspace_name: workspaceName.trim(), invite: code })

    if (createErr || !workspaceId) {
      toast.error('Erro ao criar ambulatorio: ' + (createErr?.message ?? 'tente novamente'))
      setLoading(false)
      return
    }

    await fetch('/api/workspaces/switch', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId }),
    })

    toast.success(`Ambulatorio "${workspaceName}" criado! Codigo de convite: ${code}`)
    router.push('/perfil-medico/novo')
    router.refresh()
  }
  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    const code = inviteCode.trim().toUpperCase()
    if (!code) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: workspaceId, error: joinErr } = await supabase
      .rpc('join_workspace_by_invite', { invite: code })

    if (joinErr || !workspaceId) {
      toast.error('Codigo de convite invalido ou nao encontrado.')
      setLoading(false)
      return
    }

    await fetch('/api/workspaces/switch', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId }),
    })

    toast.success('Ambulatorio selecionado.')
    router.push('/perfil-medico/novo')
    router.refresh()
  }
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Bem-vindo ao Julia Docs</h1>
          <p className="text-gray-500">Configure seu ambulatório para começar a usar a plataforma</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className={`grid w-full ${canCreateWorkspace ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {canCreateWorkspace && (
            <TabsTrigger value="create" className="gap-2">
              <Building2 className="h-4 w-4" /> Criar ambulatório
            </TabsTrigger>
            )}
            <TabsTrigger value="join" className="gap-2">
              <Users className="h-4 w-4" /> Entrar em um existente
            </TabsTrigger>
          </TabsList>

          {canCreateWorkspace && (
          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Criar novo ambulatório</CardTitle>
                <CardDescription>
                  Você se tornará o administrador e poderá convidar colegas depois
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-1">
                    <Label>Nome do ambulatório</Label>
                    <Input
                      placeholder="Ex: Ambulatório de Pneumologia HC-UFMG"
                      value={workspaceName}
                      onChange={e => setWorkspaceName(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Criando...' : 'Criar ambulatório'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          )}

          <TabsContent value="join">
            <Card>
              <CardHeader>
                <CardTitle>Entrar em ambulatório existente</CardTitle>
                <CardDescription>
                  Peça o código de convite para o administrador do seu ambulatório
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleJoin} className="space-y-4">
                  <div className="space-y-1">
                    <Label>Código de convite</Label>
                    <Input
                      placeholder="Ex: PNEU-A4B2"
                      value={inviteCode}
                      onChange={e => setInviteCode(e.target.value)}
                      className="uppercase tracking-widest font-mono"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar no ambulatório'}
                  </Button>
                </form>
                {!canCreateWorkspace && (
                  <div className="mt-4 flex items-start gap-2 rounded-lg bg-gray-50 border border-gray-200 p-3 text-xs text-gray-500">
                    <Lock className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <p>Novos ambulatorios so podem ser criados por administradores da plataforma.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
