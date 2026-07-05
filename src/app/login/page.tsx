'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Eye, EyeOff, Mail, CheckCircle } from 'lucide-react'
import { LEGAL_PRIVACY_VERSION, LEGAL_TERMS_VERSION, PRIVACY_SECTIONS, TERMS_SECTIONS, type LegalSection } from '@/lib/legal-content'

type Tab = 'login' | 'signup' | 'forgot'
type LegalModal = 'termos' | 'privacidade' | null

const LEGAL_CONTENT: Record<Exclude<LegalModal, null>, { title: string; description: string; sections: LegalSection[] }> = {
  termos: {
    title: 'Termos de Uso',
    description: `Versão ${LEGAL_TERMS_VERSION}. Regras básicas para uso seguro do Júlia Docs.`,
    sections: TERMS_SECTIONS,
  },
  privacidade: {
    title: 'Política de Privacidade',
    description: `Versão ${LEGAL_PRIVACY_VERSION}. Como o Júlia Docs trata informações de pacientes e usuários.`,
    sections: PRIVACY_SECTIONS,
  },
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('login')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [signupInviteCode, setSignupInviteCode] = useState('')
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [legalModal, setLegalModal] = useState<LegalModal>(null)

  function set(field: 'email' | 'password', value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword(form)
    if (error) {
      toast.error(error.message === 'Invalid login credentials' ? 'Email ou senha incorretos' : error.message)
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!acceptedPrivacy) {
      toast.error('Confirme a ciência sobre privacidade e uso de dados para criar a conta.')
      return
    }
    setLoading(true)
    const res = await fetch('/api/auth/signup-with-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        inviteCode: signupInviteCode,
        acceptedPrivacy,
      }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(body.error ?? 'Erro ao criar conta')
      setLoading(false)
      return
    }

    const { error: loginError } = await supabase.auth.signInWithPassword(form)
    if (!loginError) {
      toast.success(`Conta criada e vinculada ao ambulatório ${body.workspaceName}.`)
      router.push('/dashboard')
      router.refresh()
      return
    }

    toast.success('Conta criada! Verifique seu email para confirmar o cadastro.')
    setLoading(false)
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    if (!forgotEmail.trim()) return
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/login`,
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    setForgotSent(true)
    setLoading(false)
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo + título */}
        <div className="flex flex-col items-center gap-3">
          <img src="/logo-icon.svg" alt="Júlia Docs" className="h-14 w-14" />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-blue-900">
              <span className="font-bold">Júlia</span><span className="font-normal">Docs</span>
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Automação de LMEs — CEAF/SES-MG</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

          {/* Abas (apenas login e signup — forgot não tem aba) */}
          {tab !== 'forgot' && (
            <div className="grid grid-cols-2 border-b border-gray-200">
              <button
                type="button"
                onClick={() => setTab('login')}
                className={`py-3 text-sm font-medium transition-colors ${
                  tab === 'login'
                    ? 'text-blue-700 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-500 hover:text-gray-700 bg-gray-50'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setTab('signup')}
                className={`py-3 text-sm font-medium transition-colors ${
                  tab === 'signup'
                    ? 'text-blue-700 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-500 hover:text-gray-700 bg-gray-50'
                }`}
              >
                Criar conta
              </button>
            </div>
          )}

          <div className="p-6">

            {/* ── Entrar ── */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="email-login">Email</Label>
                  <Input
                    id="email-login"
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password-login">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password-login"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      placeholder="••••••••"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setForgotEmail(form.email); setForgotSent(false); setTab('forgot') }}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              </form>
            )}

            {/* ── Criar conta ── */}
            {tab === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input
                    id="email-signup"
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password-signup">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password-signup"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      placeholder="mín. 6 caracteres"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="invite-signup">Código de convite do ambulatório</Label>
                  <Input
                    id="invite-signup"
                    type="text"
                    required
                    value={signupInviteCode}
                    onChange={e => setSignupInviteCode(e.target.value.toUpperCase())}
                    placeholder="Ex: JULI-TEST"
                    className="uppercase tracking-widest font-mono"
                  />
                </div>
                <label className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs leading-5 text-gray-600">
                  <Checkbox
                    checked={acceptedPrivacy}
                    onCheckedChange={value => setAcceptedPrivacy(value === true)}
                    aria-label="Confirmar ciência de privacidade"
                    className="mt-0.5"
                  />
                  <span>
                    Confirmo que li e estou ciente dos{' '}
                    <button type="button" onClick={() => setLegalModal('termos')} className="font-medium text-blue-700 hover:underline">
                      Termos de Uso
                    </button>
                    {' '}e da{' '}
                    <button type="button" onClick={() => setLegalModal('privacidade')} className="font-medium text-blue-700 hover:underline">
                      Política de Privacidade
                    </button>
                    .
                  </span>
                </label>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Criando conta...' : 'Criar conta'}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  O acesso ao dashboard depende de um convite valido do ambulatorio
                </p>
              </form>
            )}

            {/* ── Recuperar senha ── */}
            {tab === 'forgot' && (
              <div className="space-y-4">
                <div>
                  <button
                    type="button"
                    onClick={() => { setTab('login'); setForgotSent(false) }}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4"
                  >
                    ← Voltar para o login
                  </button>
                  <h2 className="text-base font-semibold text-gray-900">Recuperar senha</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Enviaremos um link para redefinir sua senha</p>
                </div>

                {forgotSent ? (
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <CheckCircle className="h-10 w-10 text-green-500" />
                    <div>
                      <p className="font-medium text-gray-900">Email enviado!</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Verifique sua caixa de entrada em <strong>{forgotEmail}</strong> e clique no link para redefinir a senha.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setTab('login'); setForgotSent(false) }}
                      className="text-sm text-blue-600 hover:underline mt-2"
                    >
                      Voltar para o login
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgot} className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="email-forgot">Email</Label>
                      <div className="relative">
                        <Input
                          id="email-forgot"
                          type="email"
                          required
                          autoComplete="email"
                          value={forgotEmail}
                          onChange={e => setForgotEmail(e.target.value)}
                          placeholder="seu@email.com"
                          className="pr-10"
                        />
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                    </Button>
                  </form>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
    <Dialog open={legalModal !== null} onOpenChange={open => !open && setLegalModal(null)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {legalModal && (
          <>
            <DialogHeader>
              <DialogTitle>{LEGAL_CONTENT[legalModal].title}</DialogTitle>
              <DialogDescription>{LEGAL_CONTENT[legalModal].description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm leading-6 text-gray-700">
              {LEGAL_CONTENT[legalModal].sections.map(section => (
                <section key={section.title}>
                  <h3 className="font-semibold text-gray-900">{section.title}</h3>
                  <p className="mt-1">{section.body}</p>
                </section>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
    </>
  )
}
