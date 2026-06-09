'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { MessageSquarePlus, Lightbulb, Bug, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type Tipo = 'sugestao' | 'erro'

export function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState<Tipo>('sugestao')
  const [mensagem, setMensagem] = useState('')
  const [contato, setContato] = useState('')
  const [sending, setSending] = useState(false)

  async function enviar() {
    const msg = mensagem.trim()
    if (!msg) { toast.error('Escreva sua mensagem.'); return }
    setSending(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, mensagem: msg, contato: contato.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      toast.success('Obrigado! Sua mensagem foi enviada.')
      setMensagem(''); setContato(''); setTipo('sugestao'); setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Aba flutuante na borda direita */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Enviar sugestão ou reportar erro"
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-1.5 rounded-l-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-2.5 py-3 shadow-lg [writing-mode:vertical-rl] rotate-180"
      >
        <MessageSquarePlus className="h-4 w-4 rotate-90" />
        Sugestões / Erros
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquarePlus className="h-4 w-4 text-blue-500" /> Sugestões e erros
            </DialogTitle>
            <DialogDescription>
              Conte uma sugestão ou descreva um erro que encontrou. Sua mensagem vai direto para o
              responsável. <strong>Não inclua dados de pacientes.</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipo('sugestao')}
                className={`flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm ${tipo === 'sugestao' ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}
              >
                <Lightbulb className="h-4 w-4" /> Sugestão
              </button>
              <button
                type="button"
                onClick={() => setTipo('erro')}
                className={`flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm ${tipo === 'erro' ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600'}`}
              >
                <Bug className="h-4 w-4" /> Reportar erro
              </button>
            </div>

            <div>
              <Label className="text-xs text-gray-500">Mensagem</Label>
              <Textarea
                className="min-h-32 text-sm mt-0.5"
                placeholder={tipo === 'erro' ? 'O que aconteceu? Em que tela? O que você esperava?' : 'Qual a sua ideia para melhorar o sistema?'}
                value={mensagem}
                onChange={e => setMensagem(e.target.value)}
                maxLength={4000}
              />
            </div>

            <div>
              <Label className="text-xs text-gray-500">Contato para retorno (opcional)</Label>
              <Input
                className="mt-0.5"
                placeholder="E-mail ou WhatsApp, se quiser resposta"
                value={contato}
                onChange={e => setContato(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={enviar} disabled={sending || !mensagem.trim()} className="gap-1.5">
              {sending && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
