'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Users, FileText, Plus, Settings,
  LogOut, Building2, ChevronRight, Activity, ChevronsUpDown, Check, Stethoscope, Menu, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/pacientes', icon: Users, label: 'Pacientes' },
  { href: '/lmes', icon: FileText, label: 'LMEs' },
  { href: '/lmes/nova', icon: Plus, label: 'Nova LME', highlight: true },
]

const settingsItems = [
  { href: '/perfil-medico', icon: Stethoscope, label: 'Meu perfil' },
  { href: '/configuracoes/estabelecimentos', icon: Building2, label: 'Estabelecimentos' },
  { href: '/configuracoes/workspace', icon: Settings, label: 'Ambulatório' },
  { href: '/atividade', icon: Activity, label: 'Atividade' },
]

interface Workspace { id: string; name: string }

interface SidebarProps {
  activeWorkspace: Workspace
  workspaces: Workspace[]
  userEmail: string
}

export function Sidebar({ activeWorkspace, workspaces, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const hasMultiple = workspaces.length > 1
  const [open, setOpen] = useState(false)

  // Fecha o drawer ao navegar (no mobile)
  useEffect(() => { setOpen(false) }, [pathname])

  async function switchWorkspace(workspaceId: string) {
    if (workspaceId === activeWorkspace.id) return
    const res = await fetch('/api/workspaces/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Erro' }))
      toast.error(body.error ?? 'Erro ao trocar de ambulatório')
      return
    }
    toast.success('Ambulatório trocado.')
    router.refresh()
    router.push('/dashboard')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
    toast.success('Até logo!')
  }

  return (
    <>
      {/* Barra superior (apenas mobile) com botão de menu */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-white border-b border-gray-200 flex items-center gap-3 px-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="p-1.5 -ml-1.5 rounded-md hover:bg-gray-100"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5 text-gray-700" />
        </button>
        <img src="/logo-icon.svg" alt="Júlia Docs" className="h-7 w-7" />
        <span className="text-base leading-none">
          <span className="font-bold text-blue-900">Júlia</span>
          <span className="font-normal text-blue-900">Docs</span>
        </span>
      </div>

      {/* Backdrop (mobile, quando o drawer está aberto) */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Header com workspace switcher */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <img src="/logo-icon.svg" alt="Julia Docs" className="h-9 w-9 flex-shrink-0" />
            <span className="text-base leading-none">
              <span className="font-bold text-blue-900">Júlia</span>
              <span className="font-normal text-blue-900">Docs</span>
            </span>
            {/* Fechar (apenas mobile) */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="md:hidden ml-auto p-1.5 rounded-md hover:bg-gray-100"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="w-full flex items-center gap-2 rounded-md border border-gray-200 px-2 py-1.5 text-left hover:bg-gray-50">
                <Building2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-700 truncate flex-1" title={activeWorkspace.name}>
                  {activeWorkspace.name}
                </span>
                {hasMultiple && <ChevronsUpDown className="h-3 w-3 text-gray-400 flex-shrink-0" />}
              </button>
            }
          />
          <DropdownMenuContent className="w-56" align="start">
            <div className="px-2 py-1.5 text-xs font-medium text-gray-500">Ambulatórios</div>
            {workspaces.map(w => (
              <DropdownMenuItem
                key={w.id}
                onClick={() => switchWorkspace(w.id)}
              >
                <Check className={cn('h-3.5 w-3.5 mr-2', w.id === activeWorkspace.id ? 'opacity-100' : 'opacity-0')} />
                <span className="truncate">{w.name}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/onboarding?modo=adicionar')}>
              <Plus className="h-3.5 w-3.5 mr-2" />
              <span className="text-sm">Criar ou entrar em outro</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Nav principal */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => (
          <Link key={item.href} href={item.href}>
            <span className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              item.highlight
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : pathname === item.href
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}>
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.highlight && <ChevronRight className="h-3 w-3 ml-auto" />}
            </span>
          </Link>
        ))}

        <div className="pt-4 pb-1">
          <p className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Configurações</p>
        </div>

        {settingsItems.map(item => (
          <Link key={item.href} href={item.href}>
            <span className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname === item.href
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-xs font-medium text-blue-700">
              {userEmail.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-xs text-gray-600 truncate flex-1">{userEmail}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-600 hover:text-red-600 gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
    </>
  )
}
