'use client'

import type { WizardData } from '../lme-wizard'
import { Wind, ActivitySquare, Layers, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

const DISEASES = [
  {
    value: 'asma',
    label: 'Asma',
    description: 'Asma moderada a grave não controlada',
    icon: Wind,
    color: 'blue',
  },
  {
    value: 'dpoc',
    label: 'DPOC',
    description: 'Doença Pulmonar Obstrutiva Crônica',
    icon: ActivitySquare,
    color: 'green',
  },
  {
    value: 'dpi-fp',
    label: 'DPI-FP',
    description: 'Doença Pulmonar Intersticial Fibrosante Progressiva',
    icon: Layers,
    color: 'orange',
  },
  {
    value: 'hap',
    label: 'HAP',
    description: 'Hipertensão Arterial Pulmonar',
    icon: Heart,
    color: 'red',
  },
] as const

const COLOR_MAP = {
  blue: {
    card: 'border-blue-300 bg-blue-50',
    icon: 'bg-blue-100 text-blue-600',
    label: 'text-blue-700',
  },
  green: {
    card: 'border-green-300 bg-green-50',
    icon: 'bg-green-100 text-green-600',
    label: 'text-green-700',
  },
  orange: {
    card: 'border-orange-300 bg-orange-50',
    icon: 'bg-orange-100 text-orange-600',
    label: 'text-orange-700',
  },
  red: {
    card: 'border-red-300 bg-red-50',
    icon: 'bg-red-100 text-red-600',
    label: 'text-red-700',
  },
}

interface Props {
  data: WizardData
  update: (patch: Partial<WizardData>) => void
}

export function Step1Disease({ data, update }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Selecione a doença</h2>
        <p className="text-sm text-gray-500">Escolha o protocolo clínico correspondente</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {DISEASES.map(disease => {
          const Icon = disease.icon
          const colors = COLOR_MAP[disease.color]
          const selected = data.disease === disease.value
          return (
            <button
              key={disease.value}
              type="button"
              onClick={() => update({ disease: disease.value, cid10: '' })}
              className={cn(
                'p-4 rounded-lg border-2 text-left transition-all hover:shadow-sm',
                selected ? colors.card : 'border-gray-200 bg-white hover:border-gray-300'
              )}
            >
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', selected ? colors.icon : 'bg-gray-100 text-gray-500')}>
                <Icon className="h-5 w-5" />
              </div>
              <p className={cn('font-semibold text-base', selected ? colors.label : 'text-gray-900')}>
                {disease.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{disease.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
