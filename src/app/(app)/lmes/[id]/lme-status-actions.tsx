'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import type { LmeStatus } from '@/lib/supabase/types'

interface Props {
  lmeId: string
  currentStatus: string
  statuses: Array<{ value: string; label: string }>
}

export function LmeStatusActions({ lmeId, currentStatus, statuses }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)

  async function changeStatus(newStatus: string | null) {
    if (!newStatus || newStatus === status) return
    setLoading(true)
    const updateData: { status: LmeStatus; next_renewal_date?: string } = { status: newStatus as LmeStatus }
    if (newStatus === 'deferida') {
      const renewalDate = new Date()
      renewalDate.setDate(renewalDate.getDate() + 180)
      updateData.next_renewal_date = renewalDate.toISOString().split('T')[0]
    }
    const { error } = await supabase.from('lmes').update(updateData).eq('id', lmeId)
    setLoading(false)
    if (error) { toast.error('Erro ao atualizar status'); return }
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
