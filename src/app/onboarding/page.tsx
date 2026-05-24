'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Building2, Users } from 'lucide-react'

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
  const [workspaceName, setWorkspaceName] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!workspaceName.trim()) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const code = generateCode()
    const { data: ws, error: wsErr } = await supabase
      .from('workspaces')
      .insert({ name: workspaceName.trim(), invite_code: code, created_by: user.id })
      .select()
      .single()

    if (wsErr || !ws) {
      toast.error('Erro ao criar ambulatório: ' + wsErr?.message)
      setLoading(false)
      return
    }

    const { error: memberErr } = await supabase
      .from('workspace_members')
      .insert({ workspace_id: ws.id, user_id: user.id, role: 'owner' })

    if (memberErr) {
      toast.error('Erro ao configurar acesso: ' + memberErr.message)
      setLoading(false)
      return
    }

    // Marca esse workspace como ativo para o usuário
    await fetch('/api/workspaces/switch', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId: ws.id }),
    })

    toast.success(`Ambulatório "${workspaceName}" criado! Código de convite: ${code}`)
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

    const { data: ws, error: wsErr } = await supabase
      .from('workspaces')
      .select('id, name')
      .eq('invite_code', code)
      .single()

    if (wsErr || !ws) {
      toast.error('Código de convite inválido ou não encontrado.')
      setLoading(false)
      return
    }

    const { error: memberErr } = await supabase
      .from('workspace_members')
      .insert({ workspace_id: ws.id, user_id: user.id, role: 'member' })

    if (memberErr) {
      if (memberErr.code === '23505') {
        toast.info('Você já é membro deste ambulatório.')
      } else {
        toast.error('Erro ao entrar: ' + memberErr.message)
        setLoading(false)
        return
      }
    } else {
      toast.success(`Bem-vindo ao ambulatório "${ws.name}"!`)
    }

    // Marca como workspace ativo
    await fetch('/api/workspaces/switch', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId: ws.id }),
    })

    // Vai pra perfil-medico/novo se ainda não tiver perfil neste workspace; middleware redireciona se preciso
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

        <Tabs defaultValue="create">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" className="gap-2">
              <Building2 className="h-4 w-4" /> Criar ambulatório
            </TabsTrigger>
            <TabsTrigger value="join" className="gap-2">
              <Users className="h-4 w-4" /> Entrar em um existente
            </TabsTrigger>
          </TabsList>

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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
