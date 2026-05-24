import type { LmeCommonData } from '@/lib/schemas/lme-common'

// Maps LmeCommonData → PDF AcroForm field names for lme-eletronico_Jun2023-v.2.pdf
// Medication quantity layout (6 meds × 6 months):
//   Med 1: Text6-8 (m1-3), Text6a-8a (m4-6)
//   Med 2: Text10-12, Text10a-12a
//   Med 3: Text14-16, Text14a-16a
//   Med 4: Text18-20, Text6b-8b
//   Med 5: Text22-24, Text10b-12b
//   Med 6: Text22a-24a, Text14b-16b
// Dropdowns: "Selecao med 1" through "Selecao med 6" (medication names)
// Radio "Documentos": exportValues=[CPF, CNS]
// Radio "Tratamentos prévios?" / "Incapaz?": both options have exportValue "Yes" — handled specially
// Radio "Raça/Cor": exportValues=[Branca, Preta, Parda, Amarela, Indígena]
// Radio "Preenchido por": exportValues=[Paciente, Mãe do paciente, Responsável, Médico solicitante, Outro]

const QTY_FIELDS = [
  ['Text6',  'Text7',  'Text8',  'Text6a',  'Text7a',  'Text8a'],
  ['Text10', 'Text11', 'Text12', 'Text10a', 'Text11a', 'Text12a'],
  ['Text14', 'Text15', 'Text16', 'Text14a', 'Text15a', 'Text16a'],
  ['Text18', 'Text19', 'Text20', 'Text6b',  'Text7b',  'Text8b'],
  ['Text22', 'Text23', 'Text24', 'Text10b', 'Text11b', 'Text12b'],
  ['Text22a','Text23a','Text24a','Text14b', 'Text15b', 'Text16b'],
] as const

export function buildLmeMappings(data: LmeCommonData, fillDate: string) {
  const meds = data.medicamentos ?? []
  const [tel1, tel2] = (data.telefones ?? '').split(/[/,;]/).map(t => t.trim())

  const text: Record<string, string> = {
    'CNES':                          data.cnes ?? '',
    'Nome do estabelecimento de saúde': data.estabelecimento_nome ?? '',
    'Nome do paciente':              data.paciente_nome ?? '',
    'Nome da mãe do paciente':       data.mae_nome ?? '',
    'Peso':                          data.peso_kg ?? '',
    'Altura':                        data.altura_cm ?? '',
    'CID':                           data.cid10 ?? '',
    'Diagnóstico':                   data.diagnostico ?? '',
    // 'Anamnese' é desenhada manualmente (wrappedText) p/ quebra de linha — ver abaixo
    'TextCNS':                       data.medico_cns ?? '',
    'Today':                         data.data_solicitacao || fillDate,
    'Médico Solicitante':            data.medico_nome ?? '',
    // 'Nome do Responsável' NÃO entra aqui: o campo tem 2 widgets (campo 13 em y=262 e
    // um widget perdido no campo 18 em y=144). Preencher via setText marcaria os dois.
    // Por isso é desenhado manualmente só no campo 13 (ver wrappedText abaixo).
    'Telefone I':                    tel1 ?? '',
    'Telefone II':                   tel2 ?? '',
    'email':                         data.email_paciente ?? '',
    'Etnia':                         data.etnia_detalhe ?? '',
    'Tratamento':                    data.tratamento_previo_descricao ?? '',
    'Nome':                          '',
    'Text25b':                       data.documento_numero ?? '',
    'Text25a':                       '',
  }

  // Medication 1 manual text override + all quantity fields
  meds.forEach((med, i) => {
    if (i >= 6) return
    const q = QTY_FIELDS[i]
    if (i === 0) text['med1'] = [med.nome, med.apresentacao].filter(Boolean).join(' ')
    text[q[0]] = med.quantidades?.mes1 ?? ''
    text[q[1]] = med.quantidades?.mes2 ?? ''
    text[q[2]] = med.quantidades?.mes3 ?? ''
    text[q[3]] = med.quantidades?.mes4 ?? ''
    text[q[4]] = med.quantidades?.mes5 ?? ''
    text[q[5]] = med.quantidades?.mes6 ?? ''
  })

  // Dropdowns: medication names for all 6 slots
  const dropdowns: Record<string, string> = {}
  meds.forEach((med, i) => {
    if (i >= 6) return
    dropdowns[`Selecao med ${i + 1}`] = [med.nome, med.apresentacao].filter(Boolean).join(' ')
  })

  const checkboxes: Record<string, boolean> = {}

  // ATENÇÃO: os nomes dos campos são enganosos —
  //   "Radio Button1"        = Raça/Cor       (NÃO é "preenchido por")
  //   "dados complementares" = Preenchido por (NÃO é raça)
  // Ordem dos widgets da raça (confirmada via diagnóstico visual):
  //   P0=Branca, P1=Amarela, P2=Preta, P3=Indígena, P4=Parda
  const RACA_INDEX: Record<string, number> = {
    Branca: 0, Amarela: 1, Preta: 2, 'Indígena': 3, Parda: 4,
  }
  const racaIndex = data.raca_etnia != null ? (RACA_INDEX[data.raca_etnia] ?? -1) : -1

  // Estes radios têm export "Yes" duplicado em todos os widgets → seleção por índice.
  const radiosIndexed: Record<string, number> = {}
  // Raça/Cor → campo "Radio Button1"
  if (racaIndex >= 0) radiosIndexed['Radio Button1'] = racaIndex
  // Campo 18 — "campos abaixo preenchidos por" → campo "dados complementares":
  // SEMPRE Médico solicitante (índice 3: R0=Paciente, R1=Mãe, R2=Responsável, R3=Médico, R4=Outro).
  radiosIndexed['dados complementares'] = 3
  // Campo 12 — Tratamento prévio: 0 = NÃO, 1 = SIM (sempre marca um dos dois)
  radiosIndexed['Tratamentos prévios?'] = data.tratamento_previo ? 1 : 0
  // Campo 13 — Atestado de capacidade (do cadastro): 0 = NÃO (capaz), 1 = SIM (incapaz)
  radiosIndexed['Incapaz?'] = data.paciente_incapaz ? 1 : 0

  const radios: Record<string, string> = {
    // Campo 21 — Documento (CPF ou CNS)
    'Documentos': data.documento_tipo ?? '',
  }

  // Nome do responsável: desenhado manualmente no widget do campo 13 (kids[0], y=262),
  // sem preencher o campo AcroForm (que vazaria para o widget perdido do campo 18).
  const wrappedText: Record<string, string> = {
    'Anamnese': data.anamnese ?? '',              // campo grande (526x57, ~4 linhas)
    'Nome do Responsável': data.responsavel_nome ?? '',
  }

  return { text, checkboxes, radios, dropdowns, radiosIndexed, wrappedText }
}
