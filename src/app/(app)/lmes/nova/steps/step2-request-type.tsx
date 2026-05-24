'use client'

import type { WizardData } from '../lme-wizard'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { getCidsByDoenca } from '@/lib/cid10'
import { cn } from '@/lib/utils'

// 2 opções: "Processo Completo" cobre primeira solicitação e mudança de situação clínica;
// "LME + Receita" cobre as renovações de 6 em 6 meses (mais rápido, só LME + prescrição).
// No DB seguem como 'inicial' e 'renovacao' (sem migration necessária).
const REQUEST_TYPES = [
  {
    value: 'inicial',
    label: 'Processo Completo',
    description: 'Primeira solicitação OU mudança de medicamento/situação clínica. Gera todos os documentos.',
    icon: '📋',
  },
  {
    value: 'renovacao',
    label: 'LME + Receita',
    description: 'Renovação a cada 6 meses de tratamento já aprovado. Mais rápido — só o essencial.',
    icon: '📄',
  },
] as const

interface Props {
  data: WizardData
  update: (patch: Partial<WizardData>) => void
}

export function Step2RequestType({ data, update }: Props) {
  const cids = data.disease ? getCidsByDoenca(data.disease) : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Qual tipo de documento você precisa gerar?</h2>
        <p className="text-sm text-gray-500">Escolha conforme o caso</p>
      </div>

      <div className="space-y-3">
        {REQUEST_TYPES.map(rt => {
          const selected = data.request_type === rt.value
          return (
            <button
              key={rt.value}
              type="button"
              onClick={() => update({ request_type: rt.value })}
              className={cn(
                'w-full p-4 rounded-lg border-2 text-left transition-all',
                selected ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl leading-none">{rt.icon}</span>
                <div>
                  <p className={cn('font-medium', selected ? 'text-blue-700' : 'text-gray-900')}>{rt.label}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{rt.description}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {cids.length > 0 && (
        <div>
          <Label>CID-10 *</Label>
          <Select value={data.cid10} onValueChange={v => update({ cid10: v })}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Selecione o CID-10" />
            </SelectTrigger>
            <SelectContent>
              {cids.map(cid => (
                <SelectItem key={cid.codigo} value={cid.codigo}>
                  {cid.codigo} — {cid.descricao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
