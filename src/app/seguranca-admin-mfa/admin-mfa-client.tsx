'use client'

import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Loader2, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

type Mode = 'loading' | 'enroll' | 'verify'

export function AdminMfaClient({ email, next }: { email: string; next: string }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [mode, setMode] = useState<Mode>('loading')
  const [factorId, setFactorId] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function prepareMfa() {
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
      if (factorsError) {
        toast.error('Erro ao verificar MFA da conta.')
        setMode('verify')
        return
      }

      const verifiedTotp = factors.totp.find(factor => factor.status === 'verified')
      if (verifiedTotp) {
        setFactorId(verifiedTotp.id)
        setMode('verify')
        return
      }

      const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'JuliaDocs Admin',
      })

      if (enrollError) {
        toast.error(enrollError.message || 'Erro ao iniciar MFA.')
        setMode('verify')
        return
      }

      setFactorId(enrolled.id)
      setQrCode(enrolled.totp.qr_code)
      setMode('enroll')
    }

    void prepareMfa()
  }, [supabase])

  async function verifyCode(event: FormEvent) {
    event.preventDefault()
    const cleanCode = code.replace(/\D/g, '')
    if (!factorId || cleanCode.length !== 6) {
      toast.error('Informe o codigo de 6 digitos.')
      return
    }

    setLoading(true)
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
    if (challengeError) {
      setLoading(false)
      toast.error(challengeError.message || 'Erro ao validar MFA.')
      return
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: cleanCode,
    })
    setLoading(false)

    if (verifyError) {
      toast.error(verifyError.message || 'Codigo invalido.')
      return
    }

    toast.success('MFA validado.')
    router.replace(next)
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <section className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Verificacao administrativa</h1>
            <p className="text-sm text-gray-500">{email}</p>
          </div>
        </div>

        {mode === 'loading' ? (
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparando verificacao em duas etapas...
          </div>
        ) : (
          <form onSubmit={verifyCode} className="space-y-4">
            {mode === 'enroll' && (
              <div className="space-y-3">
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
                  Escaneie o QR Code em um app autenticador e depois informe o codigo gerado.
                </div>
                {qrCode && (
                  <div className="flex justify-center rounded-lg border border-gray-200 bg-white p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrCode} alt="QR Code para configurar MFA" className="h-56 w-56" />
                  </div>
                )}
              </div>
            )}

            {mode === 'verify' && (
              <div className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                <Smartphone className="mt-0.5 h-4 w-4 text-blue-600" />
                Abra seu app autenticador e informe o codigo de 6 digitos.
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="mfa-code" className="text-sm font-medium text-gray-700">
                Codigo do app autenticador
              </label>
              <Input
                id="mfa-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center font-mono text-lg tracking-[0.35em]"
              />
            </div>

            <Button type="submit" className="w-full gap-2" disabled={loading || code.length !== 6}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Validar e continuar
            </Button>
          </form>
        )}
      </section>
    </main>
  )
}
