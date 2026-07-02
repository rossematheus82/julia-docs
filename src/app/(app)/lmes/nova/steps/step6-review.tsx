'use client'

import type { WizardData, PatientItem, DoctorItem, FacilityItem } from '../lme-wizard'
import { CheckCircle, Sparkles, User, Stethoscope, Building2, FileText, AlertCircle } from 'lucide-react'
import { validateLme } from '../validate'
import { calcularIdade } from '@/lib/utils/date'

const DISEASE_LABELS: Record<string, string> = {
  asma: 'Asma', dpoc: 'DPOC', 'dpi-fp': 'DPI-FP', hap: 'HAP',
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  inicial: 'Processo Completo', renovacao: 'LME + Receita',
  reavaliacao: 'Processo Completo', // legado
}

interface Props {
  data: WizardData
  update: (patch: Partial<WizardData>) => void
  patients: PatientItem[]
  doctors: DoctorItem[]
  facilities: FacilityItem[]
}

export function Step6Review({ data, patients, doctors, facilities }: Props) {
  const patient = patients.find(p => p.id === data.patient_id)
  const doctor = doctors.find(d => d.id === data.doctor_id)
  const facility = facilities.find(f => f.id === data.facility_id)

  const age = calcularIdade(patient?.birth_date)

  const lmeFieldCount = Object.keys(data.lme_data).length
  const specificFieldCount = Object.keys(data.specific_form_data).length

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Revisão final</h2>
        <p className="text-sm text-gray-500">Confirme os dados antes de criar a LME</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Doença e tipo */}
        <div className="col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-semibold text-blue-900">{DISEASE_LABELS[data.disease ?? '']}</p>
              <p className="text-sm text-blue-700">
                {REQUEST_TYPE_LABELS[data.request_type ?? '']} · CID-10: {data.cid10 || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Paciente */}
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-500 uppercase">Paciente</span>
          </div>
          {patient ? (
            <>
              <p className="font-medium text-sm text-gray-900">{patient.full_name}</p>
              <p className="text-xs text-gray-500">
                {age !== null ? `${age} anos` : ''}
                {age !== null && patient.cpf ? ' · ' : ''}
                {patient.cpf ? `CPF ${patient.cpf}` : ''}
              </p>
            </>
          ) : (
            <p className="text-sm text-red-500">Não selecionado</p>
          )}
        </div>

        {/* Médico */}
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Stethoscope className="h-4 w-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-500 uppercase">Médico</span>
          </div>
          {doctor ? (
            <>
              <p className="font-medium text-sm text-gray-900">Dr. {doctor.full_name}</p>
              <p className="text-xs text-gray-500">CRM {doctor.crm}/{doctor.crm_uf}</p>
            </>
          ) : (
            <p className="text-sm text-red-500">Não selecionado</p>
          )}
        </div>

        {/* Estabelecimento */}
        <div className="col-span-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-4 w-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-500 uppercase">Estabelecimento</span>
          </div>
          {facility ? (
            <p className="font-medium text-sm text-gray-900">
              {facility.name}
              {facility.cnes ? ` — CNES ${facility.cnes}` : ''}
            </p>
          ) : (
            <p className="text-sm text-red-500">Não selecionado</p>
          )}
        </div>
      </div>

      {/* Status dos dados */}
      <div className="space-y-2">
        {data.aiUsed && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
            <Sparkles className="h-4 w-4 text-green-600" />
            <span className="text-green-800">
              IA preencheu {lmeFieldCount} campos da LME e {specificFieldCount} do formulário específico
            </span>
          </div>
        )}

        {(() => {
          const issues = validateLme(data)
          if (issues.length === 0) {
            return (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-blue-800">Tudo certo! Clique em <strong>Gerar LME</strong> abaixo.</span>
              </div>
            )
          }
          return (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
              <div className="flex items-center gap-2 mb-2 font-medium text-red-800">
                <AlertCircle className="h-4 w-4" />
                Faltam {issues.length} campo(s) pra poder gerar a LME:
              </div>
              <ul className="space-y-1 ml-1">
                {issues.map((issue, i) => (
                  <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span><strong>{issue.campo}:</strong> {issue.mensagem}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-red-600 mt-2">Volte ao passo correspondente para preencher.</p>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
