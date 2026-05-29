'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TextareaCounted } from '@/components/lme/textarea-counted'
import { SPEC_TEXT_LIMITS, LME_TEXT_LIMITS } from '@/lib/pdf/text-limits'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertTriangle } from 'lucide-react'
import type { Disease, RequestType } from '@/lib/supabase/types'
import { MEDICAMENTOS, getMedicamentosByDoenca } from '@/lib/medicamentos'
import { CIDS_PRINCIPAIS } from '@/lib/cid10'

// ─── Types ───────────────────────────────────────────────────────────────────

type MedQuantidades = { mes1: string; mes2: string; mes3: string; mes4: string; mes5: string; mes6: string }

type Medicamento = {
  medId?: string
  nome: string
  apresentacao: string
  quantidades: MedQuantidades
  posologia?: string
}

type TratPrevAsma = {
  tipo: string
  medicamento?: string
  dose?: string
  tempo_uso?: string
  frequencia?: string
  num_cursos_ano?: string
  especificacao?: string
}

// Nome da doença por código CID (lista única e completa em src/lib/cid10.ts)
const diagnosticoPorCID: Record<string, string> = Object.fromEntries(
  CIDS_PRINCIPAIS.map(c => [c.codigo, c.descricao]),
)
const diagnosticosConhecidos = new Set(Object.values(diagnosticoPorCID))

function defaultQuantidades(): MedQuantidades {
  return { mes1: '1', mes2: '1', mes3: '1', mes4: '1', mes5: '1', mes6: '1' }
}

function calcIdadeAnos(birthDate: string): number {
  const hoje = new Date()
  const nasc = new Date(birthDate)
  let age = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) age--
  return age
}

// ─── Field label with dot indicator ──────────────────────────────────────────

function FL({
  label,
  fieldKey,
  aiFields,
  changedFields,
  value,
  required,
}: {
  label: string
  fieldKey: string
  aiFields: Set<string>
  changedFields: Set<string>
  value: unknown
  required?: boolean
}) {
  const hasValue = value != null && value !== '' && value !== false && !(Array.isArray(value) && value.length === 0)
  const isAi = aiFields.has(fieldKey) && !changedFields.has(fieldKey) && hasValue
  const isManual = changedFields.has(fieldKey)
  const isEmpty = required && !hasValue
  return (
    <div className="flex items-center gap-1.5 mb-1">
      {isAi ? (
        <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" title="Preenchido pela IA" />
      ) : isManual ? (
        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" title="Editado manualmente" />
      ) : isEmpty ? (
        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="Campo obrigatório vazio" />
      ) : (
        <span className="w-2 h-2 shrink-0" />
      )}
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
    </div>
  )
}

// ─── Checkbox row helper ──────────────────────────────────────────────────────

function CBRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}

// ─── Section props shared across disease panels ───────────────────────────────

interface SectionProps {
  aiFields: Set<string>
  changedFields: Set<string>
  getSpec: (k: string) => string
  getBoolSpec: (k: string) => boolean
  setSpec: (k: string, v: unknown) => void
  setSpecMany: (patch: Record<string, unknown>) => void
  getNestedBool: (parent: string, child: string) => boolean
  setNestedBool: (parent: string, child: string, v: boolean) => void
  getNestedText: (parent: string, child: string) => string
  setNestedText: (parent: string, child: string, v: string) => void
  getSpecRaw: (k: string) => unknown
  sc: string   // sectionClass
  sh: string   // sectionHeader
  requestType?: RequestType | null
}

// ─── DPI-FP ──────────────────────────────────────────────────────────────────

function DpiFpSection({
  aiFields, changedFields, getSpec, getBoolSpec, setSpec, getNestedBool, setNestedBool, sc, sh,
}: SectionProps) {
  const classificacao = getSpec('classificacao')
  const isNaoFpi = classificacao === 'nao_fpi'

  return (
    <div className={sc}>
      <p className={sh}>Formulário específico — DPI-FP</p>

      {/* Classificação */}
      <div>
        <FL label="Classificação *" fieldKey="spec.classificacao" aiFields={aiFields} changedFields={changedFields} value={classificacao} required />
        <Select value={classificacao || undefined} onValueChange={v => setSpec('classificacao', v)}>
          <SelectTrigger><SelectValue placeholder="Selecione a classificação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="fpi">FPI — Fibrose Pulmonar Idiopática (J84.1)</SelectItem>
            <SelectItem value="nao_fpi">Fibrosante não-FPI</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Características clínicas */}
      <div>
        <FL label="Características clínicas / História clínica" fieldKey="spec.caracteristicas_clinicas" aiFields={aiFields} changedFields={changedFields} value={getSpec('caracteristicas_clinicas')} />
        <TextareaCounted
          className="min-h-24"
          maxLength={SPEC_TEXT_LIMITS['dpi-fp'].caracteristicas_clinicas}
          placeholder="Descreva as características clínicas: achados de TCAR, espirometria, gasometria, etc."
          value={getSpec('caracteristicas_clinicas')}
          onChange={v => setSpec('caracteristicas_clinicas', v)}
        />
      </div>

      {/* MRC */}
      <div>
        <FL label="Grau de dispneia (Escala MRC) *" fieldKey="spec.mrc" aiFields={aiFields} changedFields={changedFields} value={getSpec('mrc')} required />
        <Select value={getSpec('mrc') || undefined} onValueChange={v => setSpec('mrc', v)}>
          <SelectTrigger><SelectValue placeholder="Selecione o grau" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="0">0 — Dispneia só com exercício intenso</SelectItem>
            <SelectItem value="1">1 — Dispneia ao subir ladeiras ou andar rápido</SelectItem>
            <SelectItem value="2">2 — Caminha mais devagar ou para para respirar</SelectItem>
            <SelectItem value="3">3 — Para para respirar após ~100m</SelectItem>
            <SelectItem value="4">4 — Dispneia ao se vestir; não sai de casa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Exacerbações */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-800">Exacerbações no último ano?</p>
        </div>
        <Switch
          checked={getBoolSpec('exacerbacoes_ultimo_ano')}
          onCheckedChange={v => setSpec('exacerbacoes_ultimo_ano', v)}
        />
      </div>
      {getBoolSpec('exacerbacoes_ultimo_ano') && (
        <div>
          <FL label="Quantidade de exacerbações" fieldKey="spec.exacerbacoes_qtd" aiFields={aiFields} changedFields={changedFields} value={getSpec('exacerbacoes_qtd')} />
          <Input placeholder="Ex: 2" value={getSpec('exacerbacoes_qtd')} onChange={e => setSpec('exacerbacoes_qtd', e.target.value)} />
        </div>
      )}

      {/* Para DPI não-FPI: declínio funcional e progressão TCAR */}
      {isNaoFpi && (
        <>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Declínio funcional em 12 meses</p>
            <div className="space-y-2 pl-2">
              <CBRow label="Declínio de CVF ≥ 5%" checked={getNestedBool('piora_funcional', 'declinio_cvf_5')} onChange={v => setNestedBool('piora_funcional', 'declinio_cvf_5', v)} />
              <CBRow label="Declínio de DLCO ≥ 10%" checked={getNestedBool('piora_funcional', 'declinio_dlco_10')} onChange={v => setNestedBool('piora_funcional', 'declinio_dlco_10', v)} />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Critérios de progressão na TCAR</p>
            <div className="space-y-2 pl-2">
              <CBRow label="Bronquiectasias de tração" checked={getNestedBool('progressao_tcar', 'bronquiectasia_tracao')} onChange={v => setNestedBool('progressao_tcar', 'bronquiectasia_tracao', v)} />
              <CBRow label="Vidro fosco com bronquiectasias" checked={getNestedBool('progressao_tcar', 'vidro_fosco_bronquiectasia')} onChange={v => setNestedBool('progressao_tcar', 'vidro_fosco_bronquiectasia', v)} />
              <CBRow label="Reticulação fina" checked={getNestedBool('progressao_tcar', 'reticulacao_fina')} onChange={v => setNestedBool('progressao_tcar', 'reticulacao_fina', v)} />
              <CBRow label="Reticulação grosseira" checked={getNestedBool('progressao_tcar', 'reticulacao_grosseira')} onChange={v => setNestedBool('progressao_tcar', 'reticulacao_grosseira', v)} />
              <CBRow label="Faveolamento" checked={getNestedBool('progressao_tcar', 'faveolamento')} onChange={v => setNestedBool('progressao_tcar', 'faveolamento', v)} />
              <CBRow label="Perda de volume lobar" checked={getNestedBool('progressao_tcar', 'perda_volume_lobar')} onChange={v => setNestedBool('progressao_tcar', 'perda_volume_lobar', v)} />
            </div>
          </div>
        </>
      )}

      {/* Tratamentos */}
      <div>
        <FL label="Tratamentos prévios e atuais" fieldKey="spec.tratamentos" aiFields={aiFields} changedFields={changedFields} value={getSpec('tratamentos')} />
        <TextareaCounted
          className="min-h-16"
          maxLength={SPEC_TEXT_LIMITS['dpi-fp'].tratamentos}
          placeholder="Liste os tratamentos já realizados e os em uso atual"
          value={getSpec('tratamentos')}
          onChange={v => setSpec('tratamentos', v)}
        />
      </div>

      {/* Em caso de troca de medicamento, justificar a solicitação */}
      <div>
        <FL label="Em caso de troca de medicamento, justificar a solicitação" fieldKey="spec.justificativa_troca" aiFields={aiFields} changedFields={changedFields} value={getSpec('justificativa_troca')} />
        <TextareaCounted
          className="min-h-16"
          maxLength={SPEC_TEXT_LIMITS['dpi-fp'].justificativa_troca}
          placeholder="Descreva o motivo da troca ou reavaliação do tratamento (se aplicável)"
          value={getSpec('justificativa_troca')}
          onChange={v => setSpec('justificativa_troca', v)}
        />
      </div>
    </div>
  )
}

// ─── Asma ─────────────────────────────────────────────────────────────────────

function AsmaSection({
  aiFields, changedFields, getSpec, setSpec, getNestedBool, setNestedBool, getSpecRaw, sc, sh, requestType,
}: SectionProps) {
  const L = SPEC_TEXT_LIMITS.asma
  const DIAG_ITEMS = [
    { key: 'corpo_estranho_inalado', label: 'Corpo estranho inalado' },
    { key: 'rinossinusite', label: 'Rinossinusite' },
    { key: 'disfuncao_cordas_vocais', label: 'Disfunção de cordas vocais' },
    { key: 'dpoc', label: 'DPOC' },
    { key: 'bronquiectasias', label: 'Bronquiectasias' },
    { key: 'refluxo_gastroesofagico', label: 'Refluxo gastroesofágico' },
    { key: 'insuficiencia_cardiaca', label: 'Insuficiência cardíaca' },
    { key: 'tuberculose_pulmonar', label: 'Tuberculose pulmonar' },
    { key: 'tromboembolismo_pulmonar', label: 'Tromboembolismo pulmonar' },
    { key: 'tosse_medicamentos', label: 'Tosse por medicamentos' },
  ]

  return (
    <div className={sc}>
      <p className={sh}>Formulário específico — Asma</p>

      {/* Gravidade */}
      <div>
        <FL label="Classificação de gravidade *" fieldKey="spec.gravidade" aiFields={aiFields} changedFields={changedFields} value={getSpec('gravidade')} required />
        <Select value={getSpec('gravidade') || undefined} onValueChange={v => setSpec('gravidade', v)}>
          <SelectTrigger><SelectValue placeholder="Selecione a gravidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="leve">Leve</SelectItem>
            <SelectItem value="moderada">Moderada</SelectItem>
            <SelectItem value="grave">Grave</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Achados exame físico */}
      <div>
        <FL label="Achados ao exame físico" fieldKey="spec.achados_exame_fisico" aiFields={aiFields} changedFields={changedFields} value={getSpec('achados_exame_fisico')} />
        <TextareaCounted className="min-h-16" maxLength={SPEC_TEXT_LIMITS.asma.achados_exame_fisico} placeholder="Descreva os achados relevantes..." value={getSpec('achados_exame_fisico')} onChange={v => setSpec('achados_exame_fisico', v)} />
      </div>

      {/* Diagnóstico diferencial */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Diagnósticos diferenciais excluídos</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
          {DIAG_ITEMS.map(({ key, label }) => (
            <CBRow key={key} label={label} checked={getNestedBool('diag_diferencial', key)} onChange={v => setNestedBool('diag_diferencial', key, v)} />
          ))}
        </div>
      </div>

      {/* 5. Tratamentos Prévios */}
      {(() => {
        const tratArr: TratPrevAsma[] = Array.isArray(getSpecRaw('tratamentos_previos'))
          ? (getSpecRaw('tratamentos_previos') as TratPrevAsma[])
          : []
        const hasTipo = (tipo: string) => tratArr.some(t => t.tipo === tipo)
        const getTrat = (tipo: string) => tratArr.find(t => t.tipo === tipo) ?? { tipo }
        const toggleTrat = (tipo: string) => {
          const next = hasTipo(tipo)
            ? tratArr.filter(t => t.tipo !== tipo)
            : [...tratArr, { tipo }]
          setSpec('tratamentos_previos', next)
        }
        const setTratField = (tipo: string, field: string, value: string) => {
          const entry = hasTipo(tipo) ? getTrat(tipo) : { tipo }
          const updated = { ...entry, [field]: value }
          const next = hasTipo(tipo)
            ? tratArr.map(t => t.tipo === tipo ? updated : t)
            : [...tratArr, updated]
          setSpec('tratamentos_previos', next)
        }

        const TRATOS = [
          { tipo: 'ci', label: 'Corticoide inalatório (CI)', fields: [
            { key: 'medicamento', label: 'Medicamento' },
            { key: 'dose', label: 'Dose diária (mcg)' },
            { key: 'tempo_uso', label: 'Tempo de uso' },
          ]},
          { tipo: 'laba', label: 'LABA (isolado)', fields: [
            { key: 'medicamento', label: 'Medicamento' },
            { key: 'dose', label: 'Dose diária (mcg)' },
            { key: 'tempo_uso', label: 'Tempo de uso' },
          ]},
          { tipo: 'ci_laba', label: 'CI + LABA (associação fixa)', fields: [
            { key: 'medicamento', label: 'Associação' },
            { key: 'dose', label: 'Dose e posologia' },
            { key: 'tempo_uso', label: 'Tempo de uso' },
          ]},
          { tipo: 'saba_ci', label: 'SABA (resgate) + CI', fields: [
            { key: 'medicamento', label: 'Associação' },
            { key: 'frequencia', label: 'Frequência' },
            { key: 'tempo_uso', label: 'Tempo de uso' },
          ]},
          { tipo: 'ocs', label: 'Corticoide oral (OCS)', fields: [
            { key: 'medicamento', label: 'Medicamento' },
            { key: 'dose', label: 'Dose e duração' },
            { key: 'num_cursos_ano', label: 'Nº de cursos/ano' },
          ]},
          { tipo: 'outros', label: 'Outros (ex: tiotrópio, montelucaste)', fields: [
            { key: 'especificacao', label: 'Especificar' },
          ]},
        ]

        return (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">5. Tratamentos prévios</p>
            <div className="space-y-2">
              {TRATOS.map(({ tipo, label, fields }) => (
                <div key={tipo} className={`border rounded-lg ${hasTipo(tipo) ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'}`}>
                  <label className="flex items-center gap-2 p-3 cursor-pointer">
                    <Checkbox checked={hasTipo(tipo)} onCheckedChange={() => toggleTrat(tipo)} />
                    <span className="text-sm text-gray-800">{label}</span>
                  </label>
                  {hasTipo(tipo) && (
                    <div className={`px-3 pb-3 grid grid-cols-${fields.length === 1 ? '1' : '3'} gap-2`}>
                      {fields.map(f => (
                        <div key={f.key}>
                          <Label className="text-xs text-gray-600">{f.label}</Label>
                          <Input
                            className="h-7 text-xs mt-0.5"
                            value={(getTrat(tipo) as Record<string, string>)[f.key] ?? ''}
                            onChange={e => setTratField(tipo, f.key, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Critérios Omalizumabe */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Critérios para Omalizumabe (se aplicável)</p>
        <div className="space-y-2 pl-2">
          <CBRow label="Exacerbação grave no último ano" checked={getNestedBool('omalizumabe', 'exacerbacao_grave_ultimo_ano')} onChange={v => setNestedBool('omalizumabe', 'exacerbacao_grave_ultimo_ano', v)} />
          <CBRow label="Alergia mediada por IgE" checked={getNestedBool('omalizumabe', 'alergia_igE')} onChange={v => setNestedBool('omalizumabe', 'alergia_igE', v)} />
          <CBRow label="IgE sérica entre 30 e 1500 UI/mL" checked={getNestedBool('omalizumabe', 'igE_30_1500')} onChange={v => setNestedBool('omalizumabe', 'igE_30_1500', v)} />
          <CBRow label="Asma grave T2 alérgica" checked={getNestedBool('omalizumabe', 'asma_grave_t2_alergica')} onChange={v => setNestedBool('omalizumabe', 'asma_grave_t2_alergica', v)} />
        </div>
      </div>

      {/* Critérios Mepolizumabe */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Critérios para Mepolizumabe (se aplicável)</p>
        <div className="space-y-2 pl-2">
          <CBRow label="Exacerbação grave no último ano" checked={getNestedBool('mepolizumabe', 'exacerbacao_grave_ultimo_ano')} onChange={v => setNestedBool('mepolizumabe', 'exacerbacao_grave_ultimo_ano', v)} />
          <CBRow label="Eosinófilos ≥ 300/µL" checked={getNestedBool('mepolizumabe', 'eosinofilos_300')} onChange={v => setNestedBool('mepolizumabe', 'eosinofilos_300', v)} />
          <CBRow label="Asma grave T2 eosinofílica" checked={getNestedBool('mepolizumabe', 'asma_grave_t2_eosinofilica')} onChange={v => setNestedBool('mepolizumabe', 'asma_grave_t2_eosinofilica', v)} />
        </div>
      </div>

      {/* Outras observações */}
      <div>
        <FL label="Outras observações" fieldKey="spec.outras_observacoes" aiFields={aiFields} changedFields={changedFields} value={getSpec('outras_observacoes')} />
        <TextareaCounted className="min-h-16" maxLength={L.outras_observacoes} placeholder="Observações adicionais..." value={getSpec('outras_observacoes')} onChange={v => setSpec('outras_observacoes', v)} />
      </div>

      {/* Justificativa troca — apenas reavaliação */}
      {requestType === 'reavaliacao' && (
        <div>
          <FL label="Justificativa para troca de medicamento *" fieldKey="spec.justificativa_troca" aiFields={aiFields} changedFields={changedFields} value={getSpec('justificativa_troca')} required />
          <Textarea
            className="min-h-20 text-sm"
            placeholder="Descreva o motivo da solicitação de troca de medicamento..."
            value={getSpec('justificativa_troca')}
            onChange={e => setSpec('justificativa_troca', e.target.value)}
          />
        </div>
      )}
    </div>
  )
}

// ─── DPOC ─────────────────────────────────────────────────────────────────────

function DpocSection({
  aiFields, changedFields, getSpec, getBoolSpec, setSpec, getSpecRaw, getNestedBool, setNestedBool, getNestedText, setNestedText, sc, sh, requestType,
}: SectionProps) {
  const L = SPEC_TEXT_LIMITS.dpoc
  // `spec` = campo de texto inline que aparece logo abaixo do item quando marcado
  // (igual à LME do SES-MG, que tem "Especificar: ___" ao lado do item).
  const HISTORIA_ITEMS: { key: string; label: string; spec?: { field: string; placeholder: string } }[] = [
    { key: 'tabagista', label: 'Tabagista ou ex-tabagista', spec: { field: 'macos_ano', placeholder: 'Informar quantidade de maços/ano (ex: 40)' } },
    { key: 'exposicao_poluentes_ambientais', label: 'Exposição a poluentes ambientais', spec: { field: 'poluentes_ambientais_especificacao', placeholder: 'Especificar poluentes ambientais...' } },
    { key: 'exposicao_poluentes_ocupacionais', label: 'Exposição a poluentes ocupacionais', spec: { field: 'poluentes_ocupacionais_especificacao', placeholder: 'Especificar poluentes ocupacionais...' } },
    { key: 'dispneia_controlada', label: 'Dispneia controlada' },
    { key: 'dispneia_persistente', label: 'Dispneia persistente' },
    { key: 'respiracao_ofegante', label: 'Respiração ofegante' },
    { key: 'pressao_toracica', label: 'Sensação de pressão torácica' },
    { key: 'tosse_cronica', label: 'Tosse crônica' },
    { key: 'expectoracao', label: 'Expectoração' },
    { key: 'sibilancia', label: 'Sibilância' },
    { key: 'deficiencia_alfa1', label: 'Deficiência de alfa-1 antitripsina' },
    { key: 'historia_familiar', label: 'História familiar de DPOC' },
    { key: 'fatores_infancia', label: 'Fatores relacionados à infância' },
    { key: 'outros', label: 'Outros', spec: { field: 'outros_especificacao', placeholder: 'Especificar...' } },
  ]
  const OUTROS_DIAG_ITEMS = [
    { key: 'asma', label: 'Asma' },
    { key: 'tuberculose', label: 'Tuberculose' },
    { key: 'hiv', label: 'HIV' },
    { key: 'infeccoes_broncopulmonares', label: 'Infecções broncopulmonares de repetição' },
    { key: 'bronquiectasias', label: 'Bronquiectasias' },
    { key: 'bronquiolite_obliterante', label: 'Bronquiolite obliterante' },
    { key: 'icc', label: 'Insuficiência cardíaca congestiva' },
  ]

  return (
    <div className={sc}>
      <p className={sh}>Formulário específico — DPOC</p>

      {/* Gravidade grupo */}
      <div>
        <FL label="Grupo de gravidade (GOLD) *" fieldKey="spec.gravidade_grupo" aiFields={aiFields} changedFields={changedFields} value={getSpec('gravidade_grupo')} required />
        <Select value={getSpec('gravidade_grupo') || undefined} onValueChange={v => setSpec('gravidade_grupo', v)}>
          <SelectTrigger><SelectValue placeholder="Selecione o grupo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="A">Grupo A — Baixo risco, poucos sintomas</SelectItem>
            <SelectItem value="B">Grupo B — Baixo risco, mais sintomas</SelectItem>
            <SelectItem value="E">Grupo E — Alto risco de exacerbações</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* História clínica — item + caixa "Especificar" inline (igual LME SES-MG) */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">3.1 História clínica — assinalar características</p>
        <div className="space-y-2 pl-2">
          {HISTORIA_ITEMS.map(({ key, label, spec }) => (
            <div key={key}>
              <CBRow label={label} checked={getNestedBool('historia', key)} onChange={v => setNestedBool('historia', key, v)} />
              {spec && getNestedBool('historia', key) && (
                <Input
                  className="mt-1 ml-6 h-8 text-sm"
                  placeholder={spec.placeholder}
                  value={getNestedText('historia', spec.field)}
                  onChange={e => setNestedText('historia', spec.field, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Exacerbações */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <p className="text-sm font-medium text-gray-800">Exacerbações nos últimos 12 meses?</p>
        <Switch checked={getBoolSpec('exacerbacoes_12m')} onCheckedChange={v => setSpec('exacerbacoes_12m', v)} />
      </div>

      {getBoolSpec('exacerbacoes_12m') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FL label="Exacerbações moderadas (qtd)" fieldKey="spec.exacerbacoes_moderadas_qtd" aiFields={aiFields} changedFields={changedFields} value={getSpec('exacerbacoes_moderadas_qtd')} />
            <Input placeholder="0" value={getSpec('exacerbacoes_moderadas_qtd')} onChange={e => setSpec('exacerbacoes_moderadas_qtd', e.target.value)} />
          </div>
          <div>
            <FL label="Exacerbações graves (qtd)" fieldKey="spec.exacerbacoes_graves_qtd" aiFields={aiFields} changedFields={changedFields} value={getSpec('exacerbacoes_graves_qtd')} />
            <Input placeholder="0" value={getSpec('exacerbacoes_graves_qtd')} onChange={e => setSpec('exacerbacoes_graves_qtd', e.target.value)} />
          </div>
        </div>
      )}

      {/* Outros diagnósticos */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Outros diagnósticos</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
          {OUTROS_DIAG_ITEMS.map(({ key, label }) => (
            <CBRow key={key} label={label} checked={getNestedBool('outros_diagnosticos', key)} onChange={v => setNestedBool('outros_diagnosticos', key, v)} />
          ))}
        </div>
      </div>

      {/* 4. Em uso de medicamento para DPOC — SIM/NÃO explícito (não força NÃO se não respondido) */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-sm font-medium text-gray-800">4. Paciente em uso de algum medicamento para tratamento da DPOC?</p>
        <div className="flex gap-6 mt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="radio" name="dpoc_em_uso" checked={getSpecRaw('em_uso_medicamento') === true} onChange={() => setSpec('em_uso_medicamento', true)} className="accent-blue-600" />
            <span className="text-sm text-gray-700">SIM</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="radio" name="dpoc_em_uso" checked={getSpecRaw('em_uso_medicamento') === false} onChange={() => setSpec('em_uso_medicamento', false)} className="accent-blue-600" />
            <span className="text-sm text-gray-700">NÃO</span>
          </label>
        </div>
      </div>

      {/* Tratamentos atuais */}
      <div>
        <FL label="Tratamentos atuais" fieldKey="spec.tratamentos_atuais" aiFields={aiFields} changedFields={changedFields} value={getSpec('tratamentos_atuais')} />
        <TextareaCounted className="min-h-16" maxLength={L.tratamentos_atuais} placeholder="Medicamentos em uso, doses, tempo de uso..." value={getSpec('tratamentos_atuais')} onChange={v => setSpec('tratamentos_atuais', v)} />
      </div>

      {/* Outras observações */}
      <div>
        <FL label="Outras observações" fieldKey="spec.outras_observacoes" aiFields={aiFields} changedFields={changedFields} value={getSpec('outras_observacoes')} />
        <TextareaCounted className="min-h-16" maxLength={L.outras_observacoes} placeholder="Observações adicionais..." value={getSpec('outras_observacoes')} onChange={v => setSpec('outras_observacoes', v)} />
      </div>

      {requestType === 'reavaliacao' && (
        <div>
          <FL label="Justificativa para troca de medicamento *" fieldKey="spec.justificativa_troca" aiFields={aiFields} changedFields={changedFields} value={getSpec('justificativa_troca')} required />
          <Textarea
            className="min-h-20 text-sm"
            placeholder="Descreva o motivo da solicitação de troca de medicamento..."
            value={getSpec('justificativa_troca')}
            onChange={e => setSpec('justificativa_troca', e.target.value)}
          />
        </div>
      )}
    </div>
  )
}

// ─── HAP ──────────────────────────────────────────────────────────────────────

function HapSection({
  aiFields, changedFields, getSpec, setSpec, setSpecMany, getNestedBool, setNestedBool, getSpecRaw, sc, sh, requestType,
}: SectionProps) {
  const L = SPEC_TEXT_LIMITS.hap
  // Etiologia 7.1 e 7.2 são mutuamente exclusivas; ao trocar, limpa os campos da outra ramificação
  const setEtiologiaTipo = (tipo: string) => {
    if (tipo === 'idiopatica_hereditaria_drogas') {
      // 7.1 selecionado → zera sub-etiologias do 7.2.1
      setSpecMany({ etiologia_tipo: tipo, etiologia_associada: {} })
    } else if (tipo === 'associada') {
      // 7.2 selecionado → zera teste de vasorreatividade (7.1.1) e justificativa
      setSpecMany({ etiologia_tipo: tipo, teste_no_resultado: undefined, teste_no_justificativa_nao_realizacao: '' })
    } else {
      setSpec('etiologia_tipo', tipo)
    }
  }
  const EXAMES = [
    { key: 'ecocardiograma',       label: 'Ecocardiograma' },
    { key: 'eletrocardiograma',    label: 'Eletrocardiograma' },
    { key: 'espirometria',         label: 'Espirometria' },
    { key: 'tc6m',                 label: 'Teste de caminhada 6 min (TC6M)' },
    { key: 'polissonografia',      label: 'Polissonografia / Oximetria Noturna' },
    { key: 'angiotc_cintilografia',label: 'Angiotomografia / Cintilografia Pulmonar' },
    { key: 'usg_abdominal',        label: 'Ultrassonografia abdominal' },
    { key: 'gasometria',           label: 'Gasometria arterial' },
    { key: 'rx_torax',             label: 'Radiografia de tórax' },
  ]
  const MEDS_HAP = [
    { key: 'ambrisentana', label: 'Ambrisentana' },
    { key: 'bosentana', label: 'Bosentana' },
    { key: 'sildenafil', label: 'Sildenafil' },
    { key: 'iloprosta', label: 'Iloprosta' },
  ]
  const ASSOC = [
    { key: 'colagenoses', label: 'Colagenoses' },
    { key: 'hipertensao_portopulmonar', label: 'Hipertensão portopulmonar' },
    { key: 'esquistossomose', label: 'Esquistossomose' },
    { key: 'hiv', label: 'HIV' },
    { key: 'cardiopatia_congenita', label: 'Cardiopatia congênita' },
    { key: 'veno_oclusiva', label: 'Doença pulmonar venoclusiva / Hemangiomatose capilar pulmonar' },
  ]

  // exames pode ser objeto (carregado do DB) ou JSON string (editado na sessão)
  const examesRaw = getSpecRaw('exames')
  const examesObj: Record<string, { data?: string; resultado?: string }> = (() => {
    if (!examesRaw) return {}
    if (typeof examesRaw === 'string') {
      try { return JSON.parse(examesRaw) } catch { return {} }
    }
    if (typeof examesRaw === 'object' && !Array.isArray(examesRaw)) {
      return examesRaw as Record<string, { data?: string; resultado?: string }>
    }
    return {}
  })()
  const setExame = (key: string, field: 'data' | 'resultado', value: string) => {
    const updated = { ...examesObj, [key]: { ...(examesObj[key] ?? {}), [field]: value } }
    setSpec('exames', updated)
  }

  const situacoesObj = (getSpecRaw('situacoes') as Record<string, boolean | undefined>) ?? {}
  const SITUACOES_ITEMS = [
    { key: 'doenca_hepatica_grave',   label: 'Doença hepática grave' },
    { key: 'suspeita_venoclusiva',    label: 'Suspeita ou alta probabilidade de doença pulmonar venoclusiva ou hemangiomatose pulmonar capilar' },
    { key: 'hap_idiopatica_75anos',   label: 'Paciente com HAP-I > 75 anos e com múltiplos fatores de risco para IC com FE preservada (HAS, DM, DAC, FA, obesidade)' },
    { key: 'hap_estavel_monoterapia', label: 'Paciente com HAP que permanecem estáveis em baixo risco após tratamento prolongado (> 5–10 anos) com monoterapia' },
    { key: 'vasorreatividade_positiva', label: 'Paciente com HAP-I/H/D com teste de vasorreatividade pulmonar positivo em CF I–II e resposta hemodinâmica sustentada após 1 ano de BCC' },
  ]

  return (
    <div className={sc}>
      <p className={sh}>Formulário específico — HAP</p>

      {/* Grupo HP */}
      <div>
        <FL label="Grupo de HP *" fieldKey="spec.grupo_hp" aiFields={aiFields} changedFields={changedFields} value={getSpec('grupo_hp')} required />
        <Select value={getSpec('grupo_hp') || undefined} onValueChange={v => setSpec('grupo_hp', v)}>
          <SelectTrigger><SelectValue placeholder="Selecione o grupo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="I">Grupo I — Hipertensão arterial pulmonar</SelectItem>
            <SelectItem value="II">Grupo II — HP por doença do coração esquerdo</SelectItem>
            <SelectItem value="III">Grupo III — HP por doença pulmonar</SelectItem>
            <SelectItem value="IV">Grupo IV — HP tromboembólica crônica</SelectItem>
            <SelectItem value="V">Grupo V — HP de mecanismos multifatoriais</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 4.2 – Cofatores / causas de HP */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">4.2 O paciente possui:</p>
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
          {([
            { key: 'doenca_coracao_esquerdo', label: 'Fatores de risco ou dados ecocardiográficos compatíveis com doença do coração esquerdo como causa de HP?' },
            { key: 'doenca_pulmonar_cronica',  label: 'Exames compatíveis com doença pulmonar crônica como causa de HP?' },
            { key: 'embolia_pulmonar',         label: 'Exames compatíveis com embolia pulmonar como causa de HP?' },
          ] as { key: 'doenca_coracao_esquerdo' | 'doenca_pulmonar_cronica' | 'embolia_pulmonar'; label: string }[]).map(({ key, label }) => {
            const raw = getSpecRaw(key)
            const val: boolean | undefined = raw == null ? undefined : Boolean(raw)
            return (
              <div key={key} className={`flex items-start justify-between gap-4 p-3 ${val == null ? 'bg-red-50/40' : 'bg-white'}`}>
                <div className="flex items-start gap-1.5 flex-1 min-w-0">
                  {val == null
                    ? <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-[5px]" />
                    : <span className="w-2 h-2 shrink-0 mt-[5px]" />}
                  <span className="text-sm text-gray-700 leading-snug">{label}</span>
                </div>
                <div className="flex gap-4 shrink-0 pt-0.5">
                  <label className="flex items-center gap-1 cursor-pointer select-none">
                    <input type="radio" name={`hp42_${key}`} checked={val === true}  onChange={() => setSpec(key, true)}  className="accent-blue-600" />
                    <span className="text-sm text-gray-700">SIM</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer select-none">
                    <input type="radio" name={`hp42_${key}`} checked={val === false} onChange={() => setSpec(key, false)} className="accent-blue-600" />
                    <span className="text-sm text-gray-700">NÃO</span>
                  </label>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Classe funcional */}
      <div>
        <FL label="Classe funcional NYHA/WHO-FC *" fieldKey="spec.classe_funcional" aiFields={aiFields} changedFields={changedFields} value={getSpec('classe_funcional')} required />
        <Select value={getSpec('classe_funcional') || undefined} onValueChange={v => setSpec('classe_funcional', v)}>
          <SelectTrigger><SelectValue placeholder="Selecione a classe" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="I">Classe I — Sem limitação</SelectItem>
            <SelectItem value="II">Classe II — Leve limitação</SelectItem>
            <SelectItem value="III">Classe III — Limitação acentuada</SelectItem>
            <SelectItem value="IV">Classe IV — Limitação em repouso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Risco */}
      <div className="space-y-2">
        <FL label="9. Estratificação de risco (conforme PCDT) *" fieldKey="spec.risco" aiFields={aiFields} changedFields={changedFields} value={getSpec('risco')} required />
        <Select value={getSpec('risco') || undefined} onValueChange={v => setSpec('risco', v)}>
          <SelectTrigger><SelectValue placeholder="Selecione o risco" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="baixo">Risco Baixo</SelectItem>
            <SelectItem value="intermediario">Risco Intermediário</SelectItem>
            <SelectItem value="alto">Risco Alto</SelectItem>
          </SelectContent>
        </Select>
        {getSpec('risco') && (
          <div>
            <FL label="Detalhar critérios de estratificação" fieldKey="spec.risco_detalhe" aiFields={aiFields} changedFields={changedFields} value={getSpec('risco_detalhe')} />
            <Textarea
              className="min-h-20 text-sm"
              placeholder="Descreva os critérios utilizados para estratificação de risco..."
              value={getSpec('risco_detalhe')}
              onChange={e => setSpec('risco_detalhe', e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Cateterismo cardíaco direito */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Cateterismo cardíaco direito</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <FL label="PAPm (mmHg)" fieldKey="spec.papm" aiFields={aiFields} changedFields={changedFields} value={getSpec('papm')} />
            <Input placeholder="Ex: 35" value={getSpec('papm')} onChange={e => setSpec('papm', e.target.value)} />
          </div>
          <div>
            <FL label="POAP/PDF-VE (mmHg)" fieldKey="spec.poap_pdfve" aiFields={aiFields} changedFields={changedFields} value={getSpec('poap_pdfve')} />
            <Input placeholder="Ex: 12" value={getSpec('poap_pdfve')} onChange={e => setSpec('poap_pdfve', e.target.value)} />
          </div>
          <div>
            <FL label="RVP (unidades Wood)" fieldKey="spec.rvp_wood" aiFields={aiFields} changedFields={changedFields} value={getSpec('rvp_wood')} />
            <Input placeholder="Ex: 3" value={getSpec('rvp_wood')} onChange={e => setSpec('rvp_wood', e.target.value)} />
          </div>
          <div>
            <FL label="Data do cateterismo" fieldKey="spec.cateterismo_data" aiFields={aiFields} changedFields={changedFields} value={getSpec('cateterismo_data')} />
            <Input type="date" value={getSpec('cateterismo_data')} onChange={e => setSpec('cateterismo_data', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Etiologia */}
      <div>
        <FL label="Etiologia" fieldKey="spec.etiologia_tipo" aiFields={aiFields} changedFields={changedFields} value={getSpec('etiologia_tipo')} />
        <Select value={getSpec('etiologia_tipo') || undefined} onValueChange={setEtiologiaTipo}>
          <SelectTrigger><SelectValue placeholder="Selecione a etiologia" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="idiopatica_hereditaria_drogas">Idiopática / Hereditária / Drogas</SelectItem>
            <SelectItem value="associada">Associada a outras condições</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {getSpec('etiologia_tipo') === 'idiopatica_hereditaria_drogas' && (
        <div className="pl-4 border-l-2 border-blue-200 space-y-3">
          <p className="text-sm font-medium text-gray-700">7.1.1 Caso assinalado o item acima, indicar:</p>
          <div>
            <FL label="Teste de vasorreatividade com óxido nítrico (NO)" fieldKey="spec.teste_no_resultado" aiFields={aiFields} changedFields={changedFields} value={getSpec('teste_no_resultado')} />
            <div className="flex gap-6 mt-1">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="radio" name="teste_no_resultado" checked={getSpec('teste_no_resultado') === 'positivo'} onChange={() => setSpec('teste_no_resultado', 'positivo')} className="accent-blue-600" />
                <span className="text-sm text-gray-700">Positivo</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="radio" name="teste_no_resultado" checked={getSpec('teste_no_resultado') === 'negativo'} onChange={() => setSpec('teste_no_resultado', 'negativo')} className="accent-blue-600" />
                <span className="text-sm text-gray-700">Negativo</span>
              </label>
            </div>
          </div>
          <div>
            <FL label="Justificativa para não realização do teste (se aplicável)" fieldKey="spec.teste_no_justificativa_nao_realizacao" aiFields={aiFields} changedFields={changedFields} value={getSpec('teste_no_justificativa_nao_realizacao')} />
            <TextareaCounted
              className="min-h-16"
              maxLength={L.teste_no_justificativa_nao_realizacao}
              placeholder="Preencher se o teste não foi realizado..."
              value={getSpec('teste_no_justificativa_nao_realizacao')}
              onChange={v => setSpec('teste_no_justificativa_nao_realizacao', v)}
            />
          </div>
        </div>
      )}

      {getSpec('etiologia_tipo') === 'associada' && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Condições associadas</p>
          <div className="space-y-2 pl-2">
            {ASSOC.map(({ key, label }) => (
              <CBRow key={key} label={label} checked={getNestedBool('etiologia_associada', key)} onChange={v => setNestedBool('etiologia_associada', key, v)} />
            ))}
          </div>
        </div>
      )}

      {/* Medicamentos HAP */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Medicamentos solicitados para HAP</p>
        <div className="space-y-3 pl-2">
          {MEDS_HAP.map(({ key, label }) => {
            const medObj = (getSpecRaw('medicamentos_hap') as Record<string, unknown>) ?? {}
            const posologia = typeof medObj[`${key}_posologia`] === 'string' ? medObj[`${key}_posologia`] as string : ''
            return (
              <div key={key}>
                <CBRow label={label} checked={getNestedBool('medicamentos_hap', key)} onChange={v => setNestedBool('medicamentos_hap', key, v)} />
                {getNestedBool('medicamentos_hap', key) && (
                  <Input
                    className="mt-1 ml-6 h-7 text-xs"
                    placeholder="Posologia (dose, frequência)"
                    value={posologia}
                    onChange={e => setSpec('medicamentos_hap', { ...medObj, [`${key}_posologia`]: e.target.value })}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Situações específicas — Seção 11 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">11. O paciente apresenta alguma das situações abaixo?</p>
          {!SITUACOES_ITEMS.every(({ key }) => situacoesObj[key] != null) && (
            <span className="text-xs text-red-500">Todos os itens são obrigatórios</span>
          )}
        </div>
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
          {SITUACOES_ITEMS.map(({ key, label }) => {
            const val = situacoesObj[key]
            return (
              <div key={key} className={`flex items-start justify-between gap-4 p-3 ${val == null ? 'bg-red-50/40' : 'bg-white'}`}>
                <div className="flex items-start gap-1.5 flex-1 min-w-0">
                  {val == null
                    ? <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-[5px]" title="Obrigatório" />
                    : <span className="w-2 h-2 shrink-0 mt-[5px]" />}
                  <span className="text-sm text-gray-700 leading-snug">{label}</span>
                </div>
                <div className="flex gap-4 shrink-0 pt-0.5">
                  <label className="flex items-center gap-1 cursor-pointer select-none">
                    <input
                      type="radio"
                      name={`sit_${key}`}
                      checked={val === true}
                      onChange={() => setSpec('situacoes', { ...situacoesObj, [key]: true })}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">SIM</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer select-none">
                    <input
                      type="radio"
                      name={`sit_${key}`}
                      checked={val === false}
                      onChange={() => setSpec('situacoes', { ...situacoesObj, [key]: false })}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">NÃO</span>
                  </label>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 12. Exames complementares — rolagem horizontal no mobile (tabela com colunas fixas) */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">12. Exames complementares</p>
        <div className="overflow-x-auto">
        <div className="border border-gray-200 rounded-lg overflow-hidden min-w-[440px]">
          <div className="grid grid-cols-[1fr_120px_160px] gap-0 bg-gray-50 border-b border-gray-200 px-3 py-1.5">
            <span className="text-xs font-medium text-gray-500">Exame</span>
            <span className="text-xs font-medium text-gray-500">Data</span>
            <span className="text-xs font-medium text-gray-500">Resultado</span>
          </div>
          {EXAMES.map(({ key, label }) => (
            <div key={key} className="grid grid-cols-[1fr_120px_160px] gap-0 items-center border-b border-gray-100 last:border-0 px-3 py-1.5">
              <span className="text-sm text-gray-700">{label}</span>
              <Input
                className="h-7 text-xs border-0 border-r border-gray-200 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                type="date"
                value={examesObj[key]?.data ?? ''}
                onChange={e => setExame(key, 'data', e.target.value)}
              />
              <div className="relative">
                <Input
                  className="h-7 text-xs border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 pl-2 pr-9"
                  placeholder="Resultado"
                  maxLength={L.exame_resultado}
                  value={examesObj[key]?.resultado ?? ''}
                  onChange={e => setExame(key, 'resultado', e.target.value)}
                />
                <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] tabular-nums text-gray-400">
                  {(examesObj[key]?.resultado?.length ?? 0)}/{L.exame_resultado}
                </span>
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>

      {/* Características clínicas */}
      <div>
        <FL label="Características clínicas" fieldKey="spec.caracteristicas_clinicas" aiFields={aiFields} changedFields={changedFields} value={getSpec('caracteristicas_clinicas')} />
        <TextareaCounted className="min-h-16" maxLength={L.caracteristicas_clinicas} placeholder="Descreva as características clínicas relevantes..." value={getSpec('caracteristicas_clinicas')} onChange={v => setSpec('caracteristicas_clinicas', v)} />
      </div>

      {/* Outras observações */}
      <div>
        <FL label="Outras observações" fieldKey="spec.outras_observacoes" aiFields={aiFields} changedFields={changedFields} value={getSpec('outras_observacoes')} />
        <TextareaCounted className="min-h-16" maxLength={L.outras_observacoes} placeholder="Observações adicionais..." value={getSpec('outras_observacoes')} onChange={v => setSpec('outras_observacoes', v)} />
      </div>

      {/* Justificativa troca — apenas reavaliação */}
      {requestType === 'reavaliacao' && (
        <div>
          <FL label="Justificativa para troca de medicamento *" fieldKey="spec.justificativa_troca" aiFields={aiFields} changedFields={changedFields} value={getSpec('justificativa_troca')} required />
          <Textarea
            className="min-h-20 text-sm"
            placeholder="Descreva o motivo da solicitação de troca de medicamento..."
            value={getSpec('justificativa_troca')}
            onChange={e => setSpec('justificativa_troca', e.target.value)}
          />
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface LmeFormEditorProps {
  lmeData: Record<string, unknown>
  specificData: Record<string, unknown>
  disease: Disease | null
  requestType: RequestType | null
  aiUsed: boolean
  onLmeDataChange: (data: Record<string, unknown>) => void
  onSpecificDataChange: (data: Record<string, unknown>) => void
  patientWeight?: string | null
  patientHeight?: string | null
  patientBirthDate?: string | null
  patientIncapable?: boolean | null
  patientResponsibleName?: string | null
  cid10?: string | null
}

export function LmeFormEditor({
  lmeData,
  specificData,
  disease,
  requestType,
  aiUsed,
  onLmeDataChange,
  onSpecificDataChange,
  patientWeight,
  patientHeight,
  patientBirthDate,
  patientIncapable,
  patientResponsibleName,
  cid10,
}: LmeFormEditorProps) {
  const [aiFields] = useState<Set<string>>(() => {
    if (!aiUsed) return new Set()
    const keys = new Set<string>()
    const isNonEmpty = (v: unknown) =>
      v != null && v !== '' && v !== false && !(Array.isArray(v) && v.length === 0)
    Object.entries(lmeData).forEach(([k, v]) => { if (isNonEmpty(v)) keys.add(k) })
    Object.entries(specificData).forEach(([k, v]) => { if (isNonEmpty(v)) keys.add(`spec.${k}`) })
    return keys
  })

  const [changedFields, setChangedFields] = useState<Set<string>>(new Set())
  const markChanged = (key: string) => setChangedFields(prev => new Set(Array.from(prev).concat(key)))

  // Auto-preenche o diagnóstico a partir do nome da doença do CID.
  // Atualiza ao trocar o CID, mas preserva texto que o médico tenha customizado.
  useEffect(() => {
    if (!cid10) return
    const diag = diagnosticoPorCID[cid10.trim().toUpperCase()]
    if (!diag) return
    const atual = typeof lmeData.diagnostico === 'string' ? lmeData.diagnostico.trim() : ''
    if (atual === '' || diagnosticosConhecidos.has(atual)) {
      onLmeDataChange({ ...lmeData, diagnostico: diag })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cid10])

  // DPI-FP: deriva a classificação a partir do CID (J84.1 = FPI; demais = não-FPI).
  // Só sobrescreve se o campo ainda estiver vazio (não atropela escolha manual do médico).
  useEffect(() => {
    if (disease !== 'dpi-fp' || !cid10) return
    const code = cid10.trim().toUpperCase()
    const cls = code === 'J84.1' ? 'fpi' : 'nao_fpi'
    const atual = typeof specificData.classificacao === 'string' ? specificData.classificacao.trim() : ''
    if (atual === '') {
      onSpecificDataChange({ ...specificData, classificacao: cls })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cid10, disease])

  // Pre-fill peso/altura from patient profile if not already set
  useEffect(() => {
    const updates: Record<string, unknown> = {}
    if (!lmeData.peso_kg && patientWeight) updates.peso_kg = patientWeight
    if (!lmeData.altura_cm && patientHeight) updates.altura_cm = patientHeight
    if (Object.keys(updates).length > 0) {
      onLmeDataChange({ ...lmeData, ...updates })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getLme = (key: string) => (lmeData[key] as string) ?? ''
  const getBoolLme = (key: string) => Boolean(lmeData[key])
  const setLme = (key: string, value: unknown) => {
    markChanged(key)
    onLmeDataChange({ ...lmeData, [key]: value })
  }

  const getSpec = (key: string) => {
    const v = specificData[key]
    return typeof v === 'string' ? v : ''
  }
  const getSpecRaw = (key: string) => specificData[key]
  const getBoolSpec = (key: string) => Boolean(specificData[key])
  const setSpec = (key: string, value: unknown) => {
    markChanged(`spec.${key}`)
    onSpecificDataChange({ ...specificData, [key]: value })
  }
  // Atualiza vários campos de uma vez (evita estado defasado de setSpec sequencial)
  const setSpecMany = (patch: Record<string, unknown>) => {
    Object.keys(patch).forEach(k => markChanged(`spec.${k}`))
    onSpecificDataChange({ ...specificData, ...patch })
  }
  const getNestedBool = (parent: string, child: string) => {
    const obj = (specificData[parent] as Record<string, boolean>) ?? {}
    return Boolean(obj[child])
  }
  const setNestedBool = (parent: string, child: string, value: boolean) => {
    markChanged(`spec.${parent}`)
    const obj = (specificData[parent] as Record<string, boolean>) ?? {}
    onSpecificDataChange({ ...specificData, [parent]: { ...obj, [child]: value } })
  }
  const getNestedText = (parent: string, child: string) => {
    const obj = (specificData[parent] as Record<string, unknown>) ?? {}
    const v = obj[child]
    return typeof v === 'string' ? v : ''
  }
  const setNestedText = (parent: string, child: string, value: string) => {
    markChanged(`spec.${parent}`)
    const obj = (specificData[parent] as Record<string, unknown>) ?? {}
    onSpecificDataChange({ ...specificData, [parent]: { ...obj, [child]: value } })
  }

  const medicamentos: Medicamento[] = Array.isArray(lmeData.medicamentos)
    ? (lmeData.medicamentos as Medicamento[])
    : []

  const setMedicamentos = (meds: Medicamento[]) => {
    markChanged('medicamentos')
    onLmeDataChange({ ...lmeData, medicamentos: meds })
  }

  const idadeAnos = patientBirthDate ? calcIdadeAnos(patientBirthDate) : null
  const medOptions = disease ? getMedicamentosByDoenca(disease as 'asma' | 'dpoc' | 'dpi-fp' | 'hap') : []

  function isMedSelected(medId: string) {
    return medicamentos.some(m => m.medId === medId)
  }

  function toggleMed(medId: string) {
    const catalog = MEDICAMENTOS.find(m => m.id === medId)
    if (!catalog) return
    if (isMedSelected(medId)) {
      setMedicamentos(medicamentos.filter(m => m.medId !== medId))
    } else {
      if (medicamentos.length >= 6) return
      const existing = medicamentos.find(m => m.medId === medId)
      setMedicamentos([...medicamentos, existing ?? {
        medId,
        nome: catalog.nome,
        apresentacao: catalog.apresentacao,
        quantidades: defaultQuantidades(),
      }])
    }
  }

  function updateQuantidade(medId: string, mes: keyof MedQuantidades, value: string) {
    setMedicamentos(medicamentos.map(m =>
      m.medId === medId ? { ...m, quantidades: { ...m.quantidades, [mes]: value } } : m
    ))
  }

  function updatePosologia(medId: string, value: string) {
    setMedicamentos(medicamentos.map(m =>
      m.medId === medId ? { ...m, posologia: value } : m
    ))
  }

  const sc = 'bg-white border border-gray-200 rounded-lg p-5 space-y-4'
  const sh = 'text-sm font-semibold text-gray-800 border-b border-gray-100 pb-2'

  const sectionProps: SectionProps = {
    aiFields, changedFields, getSpec, getBoolSpec, setSpec, setSpecMany, getSpecRaw, getNestedBool, setNestedBool, getNestedText, setNestedText,
    sc, sh, requestType,
  }

  return (
    <div className="space-y-5">
      {/* Legenda */}
      {aiUsed && (
        <div className="flex items-center gap-5 text-xs text-gray-500 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 shrink-0" /> Preenchido pela IA</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" /> Editado manualmente</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 shrink-0" /> Obrigatório vazio</span>
        </div>
      )}

      {/* ── Dados clínicos comuns ── */}
      <div className={sc}>
        <p className={sh}>Dados da LME</p>

        <div>
          <FL label="Anamnese / História clínica *" fieldKey="anamnese" aiFields={aiFields} changedFields={changedFields} value={getLme('anamnese')} required />
          <TextareaCounted
            className="min-h-28"
            maxLength={LME_TEXT_LIMITS.anamnese}
            placeholder="Descreva a história clínica, sintomas, evolução da doença, exames relevantes..."
            value={getLme('anamnese')}
            onChange={v => setLme('anamnese', v)}
          />
        </div>

        <div>
          <FL label="Diagnóstico" fieldKey="diagnostico" aiFields={aiFields} changedFields={changedFields} value={getLme('diagnostico')} />
          <div className="flex h-9 w-full items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700">
            {getLme('diagnostico') || <span className="text-gray-400">Preenchido automaticamente pelo CID</span>}
          </div>
          <p className="text-xs text-gray-400 mt-1">Definido pelo CID — não editável.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FL label="Peso (kg)" fieldKey="peso_kg" aiFields={aiFields} changedFields={changedFields} value={getLme('peso_kg') || patientWeight} />
            <Input placeholder={patientWeight ?? 'Ex: 70'} value={getLme('peso_kg')} onChange={e => setLme('peso_kg', e.target.value)} />
          </div>
          <div>
            <FL label="Altura (cm)" fieldKey="altura_cm" aiFields={aiFields} changedFields={changedFields} value={getLme('altura_cm') || patientHeight} />
            <Input placeholder={patientHeight ?? 'Ex: 170'} value={getLme('altura_cm')} onChange={e => setLme('altura_cm', e.target.value)} />
          </div>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-800">12. Paciente realizou tratamento prévio ou está em tratamento da doença?</p>
          <div className="flex gap-6 mt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="radio" name="tratamento_previo" checked={!getBoolLme('tratamento_previo')} onChange={() => setLme('tratamento_previo', false)} className="accent-blue-600" />
              <span className="text-sm text-gray-700">NÃO</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="radio" name="tratamento_previo" checked={getBoolLme('tratamento_previo')} onChange={() => setLme('tratamento_previo', true)} className="accent-blue-600" />
              <span className="text-sm text-gray-700">SIM. Relatar:</span>
            </label>
          </div>
        </div>

        {getBoolLme('tratamento_previo') && (
          <div>
            <FL label="Descrição do tratamento prévio" fieldKey="tratamento_previo_descricao" aiFields={aiFields} changedFields={changedFields} value={getLme('tratamento_previo_descricao')} />
            <TextareaCounted className="min-h-16" maxLength={LME_TEXT_LIMITS.tratamento_previo_descricao} placeholder="Medicamentos, doses, duração do tratamento prévio..." value={getLme('tratamento_previo_descricao')} onChange={v => setLme('tratamento_previo_descricao', v)} />
          </div>
        )}

        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-800">13. Atestado de capacidade</p>
          <p className="text-xs text-gray-500 mb-2">Preenchido automaticamente a partir do cadastro do paciente.</p>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" checked={!patientIncapable} readOnly className="accent-blue-600" />
              NÃO (paciente capaz)
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" checked={Boolean(patientIncapable)} readOnly className="accent-blue-600" />
              SIM (paciente incapaz)
            </label>
          </div>
          {patientIncapable && patientResponsibleName && (
            <p className="text-sm text-gray-700 mt-2">Responsável: <strong>{patientResponsibleName}</strong></p>
          )}
          {patientIncapable && !patientResponsibleName && (
            <p className="text-xs text-red-500 mt-2">Paciente marcado como incapaz mas sem responsável cadastrado. Edite o cadastro do paciente.</p>
          )}
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-800">18. Campos abaixo preenchidos por</p>
          <p className="text-sm text-gray-700 mt-1">Médico solicitante</p>
          <p className="text-xs text-gray-400 mt-1">Sempre o médico solicitante — não configurável.</p>
        </div>
      </div>

      {/* ── Medicamentos ── */}
      <div className={sc}>
        <div className="flex items-center justify-between">
          <p className={sh}>Medicamentos solicitados (até 6)</p>
          <span className="text-xs text-gray-400">{medicamentos.length}/6 selecionados</span>
        </div>

        {medOptions.length === 0 && (
          <p className="text-sm text-gray-400">Selecione uma doença para ver os medicamentos disponíveis.</p>
        )}

        {medOptions.length > 0 && (
          <div className="space-y-2">
            {medOptions.map(opt => {
              const selected = isMedSelected(opt.id)
              const blocked = !selected && medicamentos.length >= 6
              const ageOk = idadeAnos == null || idadeAnos >= opt.idadeMinima
              const med = medicamentos.find(m => m.medId === opt.id)

              return (
                <div key={opt.id} className={`border rounded-lg transition-colors ${selected ? 'border-blue-300 bg-blue-50/40' : 'border-gray-200 bg-white'}`}>
                  <label className={`flex items-start gap-3 p-3 cursor-pointer ${blocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <Checkbox
                      checked={selected}
                      disabled={blocked}
                      onCheckedChange={() => !blocked && toggleMed(opt.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{opt.nome}</p>
                      <p className="text-xs text-gray-500">{opt.apresentacao}</p>
                      {opt.obs && <p className="text-xs text-orange-600 mt-0.5">{opt.obs}</p>}
                      {opt.idadeMinima > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">Idade mínima: {opt.idadeMinima} anos</p>
                      )}
                    </div>
                  </label>

                  {/* Aviso de idade */}
                  {!ageOk && idadeAnos !== null && (
                    <div className="mx-3 mb-3 flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      Este medicamento exige idade mínima de {opt.idadeMinima} anos. O paciente tem {idadeAnos} anos.
                    </div>
                  )}

                  {/* Quantidades por mês + posologia */}
                  {selected && med && (
                    <div className="px-3 pb-3 space-y-2">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Quantidade por mês (1º ao 6º)</p>
                        <div className="grid grid-cols-6 gap-1">
                          {(['mes1', 'mes2', 'mes3', 'mes4', 'mes5', 'mes6'] as const).map((m, mi) => (
                            <div key={m}>
                              <Input
                                className="h-7 text-xs text-center px-1"
                                placeholder="1"
                                value={med.quantidades[m]}
                                onChange={e => updateQuantidade(opt.id, m, e.target.value)}
                              />
                              <p className="text-center text-xs text-gray-400 mt-0.5">{mi + 1}º</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Posologia</Label>
                        <Input
                          className="h-7 text-xs mt-0.5"
                          placeholder="Ex: 1 inalação 2x ao dia"
                          value={med.posologia ?? ''}
                          onChange={e => updatePosologia(opt.id, e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Formulário específico da doença ──
       *  Só aparece em "Processo Completo". LME + Receita (renovação) não preenche
       *  formulário específico — usa só os dados básicos da LME. */}
      {requestType !== 'renovacao' && (
        <>
          {disease === 'dpi-fp' && <DpiFpSection {...sectionProps} />}
          {disease === 'asma' && <AsmaSection {...sectionProps} />}
          {disease === 'dpoc' && <DpocSection {...sectionProps} />}
          {disease === 'hap' && <HapSection {...sectionProps} />}
        </>
      )}
      {requestType === 'renovacao' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <p className="font-medium">LME + Receita</p>
          <p className="text-xs mt-0.5 text-blue-700">
            Como é uma renovação, o formulário específico da doença não precisa ser preenchido —
            o paciente já tem o processo aprovado. Preencha apenas os campos da LME acima.
          </p>
        </div>
      )}
    </div>
  )
}
