'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  /** Limite de caracteres do campo de destino (anamnese). */
  maxLength: number
  /** Contexto opcional (ex.: doença) para guiar o tom clínico. */
  context?: string
  /** Texto atual da anamnese (pré-carrega o rascunho). */
  currentText: string
  /** Aplica o texto final no campo de anamnese. */
  onApply: (text: string) => void
}

export function AnamneseImproveDialog({ maxLength, context, currentText, onApply }: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [improving, setImproving] = useState(false)
  const [improved, setImproved] = useState(false)

  function openDialog() {
    setText(currentText)
    setImproved(false)
    setOpen(true)
  }

  async function improve() {
    const draft = text.trim()
    if (!draft) { toast.error('Escreva algo para a IA melhorar.'); return }
    setImproving(true)
    try {
      const res = await fetch('/api/ai/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: draft, maxLength, context }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setText(data.text)
      setImproved(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao melhorar com IA')
    } finally {
      setImproving(false)
    }
  }

  function apply() {
    const final = text.trim()
    if (!final) return
    if (final.length > maxLength) {
      toast.error(`O texto tem ${final.length} caracteres — gere com a IA para ajustar ao limite de ${maxLength}.`)
      return
    }
    onApply(final)
    setOpen(false)
  }

  const over = text.length > maxLength

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        title="Escreva livremente; a IA revisa e ajusta o texto ao limite de caracteres, sem inventar dados."
        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-md px-2 py-1 shrink-0"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Melhorar com IA
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" /> Melhorar anamnese com IA
            </DialogTitle>
            <DialogDescription>
              Escreva ou cole o texto sem se preocupar com o tamanho. Ao gerar, a IA revisa a
              redação clínica e <strong>ajusta ao limite de {maxLength} caracteres</strong> do campo,
              sem inventar dados. Revise antes de aplicar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1">
            <Textarea
              className="min-h-48 text-sm"
              placeholder="Descreva a história clínica, sintomas, evolução, exames relevantes..."
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <div className="flex items-center justify-between text-xs">
              <span className={improved ? 'text-green-600' : 'text-gray-400'}>
                {improved ? 'Texto ajustado pela IA — pode editar antes de aplicar.' : 'Rascunho livre (sem limite de caracteres).'}
              </span>
              <span className={over ? 'text-red-500 font-medium' : 'text-gray-400'}>
                {text.length}{improved || over ? ` / ${maxLength}` : ''}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="outline" onClick={improve} disabled={improving} className="gap-1.5 text-blue-700 border-blue-200 hover:bg-blue-50">
              {improving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {improved ? 'Gerar de novo' : 'Melhorar com IA'}
            </Button>
            <Button onClick={apply} disabled={!text.trim() || over}>Aplicar à anamnese</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
