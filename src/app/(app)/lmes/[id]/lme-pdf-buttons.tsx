'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileText, Loader2, Download, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Props {
  lmeId: string
  disease: string
  hasLmeData: boolean
  hasSpecificFormData: boolean
  lmePdfUrl: string | null
  specificFormPdfUrl: string | null
  prescriptionPdfUrl: string | null
  situacoesOk?: boolean
  isCreator: boolean
}

async function downloadPdf(lmeId: string, type: string, filename: string) {
  const res = await fetch('/api/pdf/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lmeId, type }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const DISEASE_LABELS: Record<string, string> = {
  asma: 'Asma', dpoc: 'DPOC', 'dpi-fp': 'DPI-FP', hap: 'HAP',
}

export function LmePdfButtons({
  lmeId, disease, hasLmeData,
  hasSpecificFormData: _hasSpecificFormData,
  lmePdfUrl: _l, specificFormPdfUrl: _s, prescriptionPdfUrl: _p,
  situacoesOk,
  isCreator,
}: Props) {
  const router = useRouter()
  const [generatingAll, setGeneratingAll] = useState(false)
  const [generatingLme, setGeneratingLme] = useState(false)
  const [showIndividual, setShowIndividual] = useState(false)

  const diseaseLabel = DISEASE_LABELS[disease] ?? disease
  const canGenerate = hasLmeData && (situacoesOk ?? true)

  async function handleAll() {
    setGeneratingAll(true)
    try {
      await downloadPdf(lmeId, 'all', `Processo_${diseaseLabel}_${lmeId.slice(0, 8)}.pdf`)
      toast.success(isCreator ? 'Processo completo gerado! Status atualizado para Emitida.' : 'Processo original baixado.')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar processo')
    } finally {
      setGeneratingAll(false)
    }
  }

  async function handleLme() {
    setGeneratingLme(true)
    try {
      await downloadPdf(lmeId, 'lme', `LME_${diseaseLabel}_${lmeId.slice(0, 8)}.pdf`)
      toast.success(isCreator ? 'LME gerada!' : 'LME original baixada.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar PDF')
    } finally {
      setGeneratingLme(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Botão principal */}
      <Button
        className="w-full gap-2"
        onClick={handleAll}
        disabled={!canGenerate || generatingAll}
      >
        {generatingAll
          ? <><Loader2 className="h-4 w-4 animate-spin" /> {isCreator ? 'Gerando processo...' : 'Baixando...'}</>
          : <>
              {isCreator ? <FileText className="h-4 w-4" /> : <Download className="h-4 w-4" />}
              {isCreator ? 'Gerar processo completo' : 'Baixar processo original'}
            </>
        }
      </Button>

      {!canGenerate && (
        <p className="text-xs text-gray-400 text-center">
          {!hasLmeData
            ? 'Preencha os campos da LME para gerar os documentos.'
            : 'Responda todas as situações específicas (item 11) no formulário HAP.'}
        </p>
      )}

      {!isCreator && (
        <Link href={`/lmes/${lmeId}/renovar`} className="block">
          <Button variant="outline" className="w-full gap-2 border-blue-200 text-blue-700 hover:bg-blue-50">
            <RefreshCw className="h-4 w-4" /> Renovar / repetir em meu nome
          </Button>
        </Link>
      )}

      {/* Downloads individuais (colapsável) */}
      <button
        type="button"
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 w-full justify-center"
        onClick={() => setShowIndividual(v => !v)}
      >
        {showIndividual ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Downloads individuais
      </button>

      {showIndividual && (
        <div className="space-y-1.5 pt-1 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-xs h-8"
            onClick={handleLme}
            disabled={!hasLmeData || generatingLme}
          >
            {generatingLme ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            {isCreator ? 'LME (SES-MG)' : 'LME original (SES-MG)'}
          </Button>
        </div>
      )}
    </div>
  )
}
