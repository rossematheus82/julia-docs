'use client'

import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

interface LmesSearchProps {
  defaultQ?: string
  defaultStatus?: string
  defaultDisease?: string
}

const ALL = '_all'

export function LmesSearch({ defaultQ = '', defaultStatus = '', defaultDisease = '' }: LmesSearchProps) {
  const router = useRouter()
  const [q, setQ] = useState(defaultQ)
  const [status, setStatus] = useState(defaultStatus || ALL)
  const [disease, setDisease] = useState(defaultDisease || ALL)

  function buildParams(newQ: string, newStatus: string, newDisease: string) {
    const params = new URLSearchParams()
    if (newQ) params.set('q', newQ)
    if (newStatus && newStatus !== ALL) params.set('status', newStatus)
    if (newDisease && newDisease !== ALL) params.set('disease', newDisease)
    router.push(`/lmes?${params.toString()}`)
  }

  const handleSearch = useDebouncedCallback((val: string) => buildParams(val, status, disease), 400)

  return (
    <div className="flex gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-9"
          placeholder="Buscar por paciente..."
          value={q}
          onChange={e => { setQ(e.target.value); handleSearch(e.target.value) }}
        />
      </div>
      <Select value={status} onValueChange={v => { setStatus(v); buildParams(q, v, disease) }}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos</SelectItem>
          <SelectItem value="rascunho">Rascunho</SelectItem>
          <SelectItem value="emitida">Emitida</SelectItem>
        </SelectContent>
      </Select>
      <Select value={disease} onValueChange={v => { setDisease(v); buildParams(q, status, v) }}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Doença" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todas</SelectItem>
          <SelectItem value="asma">Asma</SelectItem>
          <SelectItem value="dpoc">DPOC</SelectItem>
          <SelectItem value="dpi-fp">DPI-FP</SelectItem>
          <SelectItem value="hap">HAP</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
