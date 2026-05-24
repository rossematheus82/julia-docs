import { PDFDocument, PDFName } from 'pdf-lib'
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const templatePath = path.join(__dirname, '../templates-ses/hap/HIPERTENSAO-ARTERIAL-PULMONAR-HAP-bc3-3 - form eps.pdf')
const outputPath  = path.join(__dirname, '../test-hap-output-v2.pdf')

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatarData(iso) {
  if (!iso) return ''
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ''
}

function splitIso(iso) {
  if (!iso) return ['', '', '']
  const d = iso.split('T')[0]
  const parts = d.split('-')
  return parts.length === 3 ? [parts[2], parts[1], parts[0]] : ['', '', '']
}

// ── Dados de teste completos ──────────────────────────────────────────────────

const fillDate = '19/05/2026'
const [dia, mes, ano] = fillDate.split('/')

const data = {
  nome_civil:         'Maria da Silva Santos',
  nome_social:        '',
  data_nascimento:    '1975-08-22',
  cid10:              'I27.0',
  grupo_hp:           'I',
  doenca_coracao_esquerdo: false,
  doenca_pulmonar_cronica: false,
  embolia_pulmonar:        false,
  caracteristicas_clinicas: 'Paciente com dispneia progressiva aos médios esforços há 2 anos, com piora nos últimos 6 meses. Exame físico: P2 hiperfonética, sem edema.',
  cateterismo_data:   '2026-03-10',
  papm:               '42',
  poap_pdfve:         '10',
  rvp_wood:           '8,5',
  etiologia_tipo:     'idiopatica_hereditaria_drogas',
  teste_no_resultado: 'negativo',
  teste_no_justificativa_nao_realizacao: '',
  etiologia_associada: {
    colagenoses:              false,
    hipertensao_portopulmonar:false,
    esquistossomose:          false,
    hiv:                      false,
    cardiopatia_congenita:    false,
    veno_oclusiva:            false,
  },
  medicamentos_hap: {
    ambrisentana:           true,
    ambrisentana_posologia: 'Ambrisentana 5mg — 1 comprimido ao dia',
    bosentana:              false,
    bosentana_posologia:    '',
    sildenafil:             true,
    sildenafil_posologia:   'Sildenafil 20mg — 1 comprimido 3x ao dia',
    iloprosta:              false,
    iloprosta_posologia:    '',
  },
  risco:        'intermediario',
  risco_detalhe:'FC III, TC6M 320m, NT-proBNP 820 pg/mL, TAPSE 18mm, índice cardíaco 2,2 L/min/m²',
  classe_funcional: 'III',
  situacoes: {
    doenca_hepatica_grave:     false,
    suspeita_venoclusiva:      false,
    hap_idiopatica_75anos:     false,
    hap_estavel_monoterapia:   false,
    vasorreatividade_positiva: false,
  },
  exames: {
    ecocardiograma:        { data: '2026-02-15', resultado: 'PSAP estimada 65 mmHg, VD dilatado e hipocinético, IT moderada' },
    eletrocardiograma:     { data: '2026-02-15', resultado: 'Desvio do eixo para a direita, sobrecarga de VD' },
    espirometria:          { data: '2026-01-20', resultado: 'Padrão obstrutivo leve (VEF1/CVF 68%)' },
    tc6m:                  { data: '2026-03-05', resultado: '320 metros (previsto 580 m), SpO2 mínima 89%' },
    polissonografia:       { data: '2026-01-15', resultado: 'IAH 3/h — sem SAOS significativa' },
    angiotc_cintilografia: { data: '2026-02-20', resultado: 'Sem sinais de TEP crônico' },
    usg_abdominal:         { data: '2026-01-10', resultado: 'Fígado com textura heterogênea, sem sinais de HPP' },
    gasometria:            { data: '2026-03-10', resultado: 'pH 7,42 / PaO2 72 mmHg / PaCO2 34 mmHg / SatO2 94%' },
    rx_torax:              { data: '2026-02-20', resultado: 'Alargamento do tronco pulmonar, hilos aumentados' },
  },
  outras_observacoes: 'Paciente em acompanhamento regular a cada 3 meses. Solicitação de renovação conforme PCDT HAP.',
}

// ── Montar mapeamentos ────────────────────────────────────────────────────────

const m  = data.medicamentos_hap
const s  = data.situacoes
const ea = data.etiologia_associada
const ex = data.exames

const [nascDia, nascMes, nascAno] = splitIso(data.data_nascimento)
const [catDia,  catMes,  catAno]  = splitIso(data.cateterismo_data)

const textFields = {
  // Identificação
  Text1:  data.nome_civil,
  Text2:  data.nome_social ?? '',
  Text3:  nascDia, Text4: nascMes, Text5: nascAno,
  Text38: data.cid10,
  Text6:  data.caracteristicas_clinicas,
  // Cateterismo
  Text55: catDia, Text56: catMes, Text57: catAno,
  Text7:  data.papm,
  Text8:  data.poap_pdfve,
  Text9:  data.rvp_wood,
  // Posologias medicamentos (p2, x=227)
  Text11: m.ambrisentana_posologia ?? '',
  Text12: m.bosentana_posologia    ?? '',
  Text13: m.sildenafil_posologia   ?? '',
  Text14: m.iloprosta_posologia    ?? '',
  // Outras observações (p2, large)
  Text15: data.outras_observacoes ?? '',
  // Exames — TODOS têm data + resultado (p3)
  Text16: formatarData(ex.ecocardiograma?.data),        Text25: ex.ecocardiograma?.resultado        ?? '',
  Text17: formatarData(ex.eletrocardiograma?.data),     Text26: ex.eletrocardiograma?.resultado     ?? '',
  Text18: formatarData(ex.espirometria?.data),          Text67: ex.espirometria?.resultado          ?? '',
  Text19: formatarData(ex.tc6m?.data),                  Text28: ex.tc6m?.resultado                  ?? '',
  Text20: formatarData(ex.polissonografia?.data),       Text29: ex.polissonografia?.resultado       ?? '',
  Text21: formatarData(ex.angiotc_cintilografia?.data), Text30: ex.angiotc_cintilografia?.resultado ?? '',
  Text22: formatarData(ex.usg_abdominal?.data),         Text31: ex.usg_abdominal?.resultado         ?? '',
  Text23: formatarData(ex.gasometria?.data),            Text68: ex.gasometria?.resultado            ?? '',
  Text24: formatarData(ex.rx_torax?.data),              Text33: ex.rx_torax?.resultado              ?? '',
  // Data de preenchimento (p3)
  Text35: dia, Text36: mes, Text37: ano,
}

const checkboxFields = {
  // Etiologia tipo (p1, x=70)
  Button39: data.etiologia_tipo === 'idiopatica_hereditaria_drogas',
  Button40: data.etiologia_tipo === 'associada',
  // Etiologia associada (p1, x=116)
  Button41: Boolean(ea.colagenoses),
  Button42: Boolean(ea.hipertensao_portopulmonar),
  Button43: Boolean(ea.esquistossomose),
  Button44: Boolean(ea.hiv),
  Button45: Boolean(ea.cardiopatia_congenita),
  Button46: Boolean(ea.veno_oclusiva),
  // Medicamentos (p2, x=93)
  Button47: Boolean(m.ambrisentana),
  Button48: Boolean(m.bosentana),
  Button49: Boolean(m.sildenafil),
  Button50: Boolean(m.iloprosta),
}

const grupoIdx  = ['I','II','III','IV','V'].indexOf(data.grupo_hp)
const classeIdx = ['I','II','III','IV'].indexOf(data.classe_funcional)

const radioFields = {
  Button51: grupoIdx  >= 0 ? `<${grupoIdx  + 1}>` : '',
  // Cofatores (p1, y=580/553/526)
  Button52: data.doenca_coracao_esquerdo ? '<1>' : '<2>',
  Button53: data.doenca_pulmonar_cronica  ? '<1>' : '<2>',
  Button54: data.embolia_pulmonar         ? '<1>' : '<2>',
  Button58: data.teste_no_resultado === 'positivo' ? '<1>'
          : data.teste_no_resultado === 'negativo' ? '<2>'
          : '',
  Button60: data.risco === 'baixo'         ? '<1>'
          : data.risco === 'intermediario' ? '<2>'
          : data.risco === 'alto'          ? '<3>'
          : '',
  Button61: classeIdx >= 0 ? `<${classeIdx + 1}>` : '',
  Button62: s.doenca_hepatica_grave     ? '<1>' : '<2>',
  Button63: s.suspeita_venoclusiva      ? '<1>' : '<2>',
  Button64: s.hap_idiopatica_75anos     ? '<1>' : '<2>',
  Button65: s.hap_estavel_monoterapia   ? '<1>' : '<2>',
  Button66: s.vasorreatividade_positiva ? '<1>' : '<2>',
}

// ── Aplicar ao PDF ────────────────────────────────────────────────────────────

const bytes = readFileSync(templatePath)
const doc   = await PDFDocument.load(bytes)
const form  = doc.getForm()

let textOk = 0, textFail = []
for (const [name, value] of Object.entries(textFields)) {
  try {
    const f = form.getTextField(name)
    f.setFontSize(8)
    f.setText(value)
    textOk++
  } catch {
    textFail.push(name)
  }
}

let cbOk = 0, cbFail = []
for (const [name, checked] of Object.entries(checkboxFields)) {
  try {
    const f = form.getCheckBox(name)
    checked ? f.check() : f.uncheck()
    cbOk++
  } catch {
    cbFail.push(name)
  }
}

let radioOk = 0, radioFail = []
for (const [name, option] of Object.entries(radioFields)) {
  if (!option) continue
  try {
    const f = form.getRadioGroup(name)
    f.select(option)
    radioOk++
  } catch {
    radioFail.push(`${name}=${option}`)
  }
}

const pdfBytes = await doc.save()
writeFileSync(outputPath, pdfBytes)

console.log(`\n✓ PDF gerado: ${outputPath}`)
console.log(`\nTextos   : ${textOk} preenchidos${textFail.length ? ' | falhas: ' + textFail.join(', ') : ''}`)
console.log(`Checkboxes: ${cbOk} preenchidos${cbFail.length   ? ' | falhas: ' + cbFail.join(', ')   : ''}`)
console.log(`Radios    : ${radioOk} preenchidos${radioFail.length ? ' | falhas: ' + radioFail.join(', ') : ''}`)
console.log(`\nCampos de texto preenchidos:`)
for (const [k, v] of Object.entries(textFields)) {
  if (v) console.log(`  ${k}: "${v.slice(0, 60)}${v.length > 60 ? '...' : ''}"`)
}
