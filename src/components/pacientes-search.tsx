'use client'

import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

interface PacientesSearchProps { defaultValue?: string }

export function PacientesSearch({ defaultValue = '' }: PacientesSearchProps) {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams()
    if (term) params.set('q', term)
    router.push(`/pacientes?${params.toString()}`)
  }, 400)

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        className="pl-9"
        placeholder="Buscar por nome, CPF ou CNS..."
        value={value}
        onChange={e => { setValue(e.target.value); handleSearch(e.target.value) }}
      />
    </div>
  )
}
