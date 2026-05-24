'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { WizardData, PatientItem } from '../lme-wizard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Plus, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { differenceInYears, parseISO } from 'date-fns'

interface Props {
  data: WizardData
  update: (patch: Partial<WizardData>) => void
  patients: PatientItem[]
}

export function Step3Patient({ data, update, patients }: Props) {
  const [q, setQ] = useState('')

  const filtered = q.trim()
    ? patients.filter(p =>
        p.full_name.toLowerCase().includes(q.toLowerCase()) ||
        (p.cpf && p.cpf.includes(q)) ||
        (p.cns && p.cns.includes(q))
      )
    : patients

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Paciente</h2>
        <p className="text-sm text-gray-500">Selecione ou cadastre o paciente</p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome, CPF ou CNS..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <Link href="/pacientes/novo" target="_blank">
          <Button variant="outline" size="icon" title="Cadastrar novo paciente">
            <Plus className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {patients.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <User className="h-10 w-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">Nenhum paciente cadastrado.</p>
          <Link href="/pacientes/novo" target="_blank">
            <Button size="sm" className="mt-2">Cadastrar paciente</Button>
          </Link>
        </div>
      )}

      <div className="space-y-1 max-h-72 overflow-y-auto">
        {filtered.map(p => {
          const selected = data.patient_id === p.id
          const age = p.birth_date ? differenceInYears(new Date(), parseISO(p.birth_date)) : null
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => update({ patient_id: p.id })}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all',
                selected ? 'border-blue-400 bg-blue-50' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium',
                selected ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-600'
              )}>
                {p.full_name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className={cn('font-medium text-sm truncate', selected ? 'text-blue-700' : 'text-gray-900')}>
                  {p.full_name}
                </p>
                <p className="text-xs text-gray-500">
                  {age !== null ? `${age} anos` : ''}
                  {age !== null && p.cpf ? ' · ' : ''}
                  {p.cpf ? `CPF ${p.cpf}` : ''}
                </p>
              </div>
            </button>
          )
        })}
        {filtered.length === 0 && q && (
          <p className="text-sm text-gray-400 text-center py-4">Nenhum paciente encontrado para &quot;{q}&quot;</p>
        )}
      </div>
    </div>
  )
}
