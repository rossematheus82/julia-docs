'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Download, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  lmeId: string
  disease: string
  /** Se true, mostra o botão Renovar (mais recente da timeline). */
  showRenew?: boolean
}

const DISEASE_LABELS: Record<string, string> = {
  asma: 'Asma', dpoc: 'DPOC', 'dpi-fp': 'DPI-FP', hap: 'HAP',
}

export function TimelineActions({ lmeId, disease, showRenew }: Props) {
  const [downloading, setDownloading] = useState(false)
  const label = DISEASE_LABELS[disease] ?? disease

  async function download() {
    setDownloading(true)
    try {
      const res = await fetch('/api/pdf/generate', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lmeId, type: 'all' }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Processo_${label}_${lmeId.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao baixar PDF')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex gap-2 mt-2" onClick={e => e.stopPropagation()}>
      <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={download} disabled={downloading}>
        {downloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
        Baixar
      </Button>
      {showRenew && (
        <Link href={`/lmes/${lmeId}/renovar`}>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 text-blue-700 border-blue-200 hover:bg-blue-50">
            <RefreshCw className="h-3 w-3" />
            Renovar
          </Button>
        </Link>
      )}
    </div>
  )
}
