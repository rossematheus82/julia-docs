'use client'

import type { WizardData, DoctorItem, FacilityItem } from '../lme-wizard'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Stethoscope, Building2 } from 'lucide-react'
import Link from 'next/link'

interface Props {
  data: WizardData
  update: (patch: Partial<WizardData>) => void
  doctors: DoctorItem[] // sempre 1 elemento (o médico do usuário logado)
  facilities: FacilityItem[]
}

export function Step4DoctorFacility({ data, update, doctors, facilities }: Props) {
  const meuMedico = doctors[0]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Estabelecimento</h2>
        <p className="text-sm text-gray-500">Confirme seus dados e selecione o local de atendimento</p>
      </div>

      <div className="space-y-4">
        <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
          <Label className="flex items-center gap-2 mb-1 text-xs text-gray-500">
            <Stethoscope className="h-3.5 w-3.5" />
            Médico responsável (você)
          </Label>
          {meuMedico ? (
            <div className="text-sm text-gray-800">
              <strong>Dr. {meuMedico.full_name}</strong> — CRM {meuMedico.crm}/{meuMedico.crm_uf}
              {meuMedico.specialty ? ` · ${meuMedico.specialty}` : ''}
              <div className="text-xs text-gray-400 mt-0.5">
                <Link href="/perfil-medico" className="hover:underline">Editar meu perfil</Link>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              Perfil de médico não encontrado.{' '}
              <Link href="/perfil-medico/novo" className="text-blue-600 hover:underline">Completar perfil</Link>
            </div>
          )}
        </div>

        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-gray-400" />
            Estabelecimento *
          </Label>
          {facilities.length === 0 ? (
            <div className="p-3 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 text-center">
              Nenhum estabelecimento cadastrado.{' '}
              <Link href="/configuracoes/estabelecimentos" target="_blank" className="text-blue-600 hover:underline">
                Cadastrar estabelecimento
              </Link>
            </div>
          ) : (
            <Select value={data.facility_id ?? undefined} onValueChange={v => update({ facility_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estabelecimento" />
              </SelectTrigger>
              <SelectContent>
                {facilities.map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                    {f.cnes ? ` — CNES ${f.cnes}` : ''}
                    {f.city ? ` — ${f.city}${f.state ? `/${f.state}` : ''}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </div>
  )
}
