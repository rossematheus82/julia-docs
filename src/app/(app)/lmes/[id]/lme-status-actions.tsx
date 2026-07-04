'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface Props {
  lmeId: string
  currentStatus: string
  statuses: Array<{ value: string; label: string }>
}

export function LmeStatusActions({ lmeId, currentStatus, statuses }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)

  async function changeStatus(newStatus: string | null) {
    if (!newStatus || newStatus === status) return
    setLoading(true)
    const res = await fetch(`/api/lmes/${lmeId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setLoading(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body.error ?? 'Erro ao atualizar status')
      return
    }
    setStatus(newStatus as string)
    toast.success('Status atualizado!')
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <Select value={status} onValueChange={changeStatus} disabled={loading}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statuses.map(s => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-gray-400">
        Alterar para &quot;Deferida&quot; define automaticamente a data de renovação para 180 dias.
      </p>
    </div>
  )
}
