'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  LEGAL_PRIVACY_VERSION,
  LEGAL_TERMS_VERSION,
  PRIVACY_SECTIONS,
  TERMS_SECTIONS,
  type LegalSection,
} from '@/lib/legal-content'
import { toast } from 'sonner'

type LegalView = 'termos' | 'privacidade'

const LEGAL_VIEWS: Record<LegalView, { title: string; version: string; sections: LegalSection[] }> = {
  termos: {
    title: 'Termos de Uso',
    version: LEGAL_TERMS_VERSION,
    sections: TERMS_SECTIONS,
  },
  privacidade: {
    title: 'Política de Privacidade',
    version: LEGAL_PRIVACY_VERSION,
    sections: PRIVACY_SECTIONS,
  },
}

export function LegalAcceptanceGate({ required }: { required: boolean }) {
  const router = useRouter()
  const [view, setView] = useState<LegalView>('termos')
  const [accepted, setAccepted] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!required) return null

  const current = LEGAL_VIEWS[view]

  async function acceptTerms() {
    if (!accepted) {
      toast.error('Confirme que leu e aceita os Termos de Uso e a Política de Privacidade.')
      return
    }

    setSaving(true)
    const res = await fetch('/api/legal/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const body = await res.json().catch(() => ({}))
    setSaving(false)

    if (!res.ok) {
      toast.error(body.error ?? 'Erro ao registrar aceite.')
      return
    }

    toast.success('Aceite registrado.')
    router.refresh()
  }

  return (
    <Dialog open>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-2xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Atualização de Termos e Privacidade</DialogTitle>
          <DialogDescription>
            Nossa plataforma criou e atualizou termos para se adequar à LGPD e reforçar a proteção dos dados.
            Leia e aceite os Termos de Uso e a Política de Privacidade para continuar usando o Júlia Docs.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Button
            type="button"
            variant={view === 'termos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('termos')}
          >
            Termos
          </Button>
          <Button
            type="button"
            variant={view === 'privacidade' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('privacidade')}
          >
            Privacidade
          </Button>
        </div>

        <div className="max-h-[46vh] overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-700">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">{current.title}</h3>
            <p className="text-xs text-gray-500">Versão {current.version}</p>
          </div>
          <div className="space-y-4">
            {current.sections.map(section => (
              <section key={section.title}>
                <h4 className="font-semibold text-gray-900">{section.title}</h4>
                <p className="mt-1">{section.body}</p>
              </section>
            ))}
          </div>
        </div>

        <label className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm leading-5 text-gray-700">
          <Checkbox
            checked={accepted}
            onCheckedChange={value => setAccepted(value === true)}
            aria-label="Confirmar aceite dos termos atualizados"
            className="mt-0.5"
          />
          <span>
            Confirmo que li e aceito os Termos de Uso versão {LEGAL_TERMS_VERSION} e a Política de Privacidade versão {LEGAL_PRIVACY_VERSION}.
          </span>
        </label>

        <DialogFooter>
          <Button type="button" onClick={acceptTerms} disabled={saving || !accepted}>
            {saving ? 'Registrando...' : 'Aceitar e continuar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
