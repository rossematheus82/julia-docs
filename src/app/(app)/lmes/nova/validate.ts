import type { WizardData } from './lme-wizard'

export interface ValidationIssue {
  /** Caminho amigável do campo que está faltando */
  campo: string
  /** Mensagem detalhada */
  mensagem: string
  /** Qual passo do wizard contém o campo — pra mandar a pessoa lá */
  step: number
}

/**
 * Campos do formulário específico que são obrigatórios para emitir.
 *
 * Motivo de existir: campos não respondidos saem em branco no PDF (ou, pior,
 * saíam com a marcação de fábrica do template — o form de DPOC vem com o grupo
 * de gravidade "A" pré-marcado), e o processo volta do CEAF.
 *
 * Só vale para processo completo; em renovação o formulário específico nem é
 * preenchido.
 */
const CAMPOS_ESPECIFICOS_OBRIGATORIOS: Partial<Record<string, Array<{ campo: string; rotulo: string; mensagem: string }>>> = {
  dpoc: [{
    campo: 'gravidade_grupo',
    rotulo: 'Gravidade (GOLD)',
    mensagem: 'Selecione o grupo de gravidade (GOLD) do DPOC: A, B ou E',
  }],
}

/**
 * Roda todas as validações e retorna TODAS as falhas (não para na primeira).
 * Assim a pessoa vê de uma vez tudo o que falta preencher.
 */
export function validateLme(data: WizardData): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Steps 1-4: doença, tipo, paciente, médico/local
  if (!data.disease)       issues.push({ campo: 'Doença',         mensagem: 'Selecione a doença',                       step: 0 })
  if (!data.request_type)  issues.push({ campo: 'Tipo',           mensagem: 'Escolha o tipo (Processo Completo / LME + Receita)', step: 1 })
  if (!data.cid10)         issues.push({ campo: 'CID-10',         mensagem: 'Selecione o CID-10',                       step: 1 })
  if (!data.patient_id)    issues.push({ campo: 'Paciente',       mensagem: 'Escolha o paciente',                       step: 2 })
  if (!data.doctor_id)     issues.push({ campo: 'Médico',         mensagem: 'Perfil de médico não encontrado (vá em Meu perfil)', step: 3 })
  if (!data.facility_id)   issues.push({ campo: 'Estabelecimento',mensagem: 'Selecione o estabelecimento de atendimento', step: 3 })

  // Step 5: dados clínicos
  const lme = (data.lme_data as Record<string, unknown> | undefined) ?? {}
  const anamnese = typeof lme.anamnese === 'string' ? lme.anamnese.trim() : ''
  if (!anamnese) {
    issues.push({ campo: 'Anamnese', mensagem: 'Preencha a anamnese / história clínica', step: 4 })
  }
  if (typeof lme.tratamento_previo !== 'boolean') {
    issues.push({ campo: 'Tratamento prévio', mensagem: 'Informe se o paciente realizou ou está em tratamento da doença', step: 4 })
  }

  type Med = { nome?: string; apresentacao?: string; posologia?: string; quantidades?: Record<string, string> }
  const meds: Med[] = Array.isArray(lme.medicamentos) ? (lme.medicamentos as Med[]) : []
  if (meds.length === 0) {
    issues.push({ campo: 'Medicamentos', mensagem: 'Adicione pelo menos um medicamento', step: 4 })
  } else {
    meds.forEach((m, i) => {
      const ref = m.nome || `Medicamento ${i + 1}`
      if (!m.nome)         issues.push({ campo: `Med. ${i + 1}`,  mensagem: `Nome do ${i === 0 ? 'medicamento' : `${i + 1}º medicamento`} faltando`, step: 4 })
      if (!m.apresentacao) issues.push({ campo: ref,              mensagem: `Apresentação de ${ref} faltando`,           step: 4 })
      if (!m.posologia)    issues.push({ campo: ref,              mensagem: `Posologia de ${ref} faltando`,              step: 4 })
      const qtdMes1 = m.quantidades?.mes1
      if (!qtdMes1)        issues.push({ campo: ref,              mensagem: `Quantidade do 1º mês de ${ref} faltando`,    step: 4 })
    })
  }

  // Formulário específico da doença (não existe em renovação — só LME + receita)
  if (data.disease && data.request_type !== 'renovacao') {
    const spec = (data.specific_form_data as Record<string, unknown> | undefined) ?? {}
    for (const obrigatorio of CAMPOS_ESPECIFICOS_OBRIGATORIOS[data.disease] ?? []) {
      const valor = spec[obrigatorio.campo]
      const vazio = valor == null || (typeof valor === 'string' && !valor.trim())
      if (vazio) {
        issues.push({ campo: obrigatorio.rotulo, mensagem: obrigatorio.mensagem, step: 4 })
      }
    }
  }

  return issues
}
