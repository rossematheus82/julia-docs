import { PDFDocument, PDFFont, StandardFonts, rgb } from 'pdf-lib'
import { sanitizeWinAnsi } from './sanitize'
import { calcularIdade, dataHoje } from '@/lib/utils/date'

export interface PrescricaoData {
  estabelecimento_nome: string
  cnes?: string
  /** CNPJ do estabelecimento — exigido pelo CEAF no cabeçalho da receita. */
  cnpj?: string
  /** Endereço do estabelecimento (logradouro, número, bairro, CEP). */
  endereco?: string
  telefone?: string
  cidade?: string
  uf?: string
  paciente_nome: string
  paciente_cpf?: string
  paciente_birth_date?: string   // YYYY-MM-DD
  cid10?: string
  diagnostico?: string
  medico_nome: string
  medico_crm?: string
  medico_crm_uf?: string
  medico_cns?: string
  medicamentos: Array<{
    nome: string
    apresentacao: string
    quantidade: string
    posologia?: string
  }>
  data_prescricao?: string  // DD/MM/AAAA — uses today if omitted
}

const BLACK = rgb(0, 0, 0)
const GRAY  = rgb(0.4, 0.4, 0.4)
const LIGHT = rgb(0.92, 0.92, 0.92)

function dataExtenso(data?: string): string {
  const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
  const str = data ?? dataHoje()
  const [dia, mes, ano] = str.split('/')
  return `${parseInt(dia)} de ${MESES[parseInt(mes) - 1]} de ${ano}`
}

function isoToBr(iso?: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function drawLine(page: ReturnType<PDFDocument['addPage']>, x1: number, y: number, x2: number) {
  page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness: 0.5, color: GRAY })
}

function textLine(
  page: ReturnType<PDFDocument['addPage']>,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color = BLACK,
) {
  page.drawText(sanitizeWinAnsi(text), { x, y, size, font, color })
}

/**
 * Quebra `text` em linhas que caibam em `maxWidth`, respeitando quebras
 * explícitas (`\n`) e quebrando palavras longas demais por caractere.
 */
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const out: string[] = []
  for (const rawLine of sanitizeWinAnsi(text).split('\n')) {
    const words = rawLine.split(/\s+/).filter(Boolean)
    if (words.length === 0) { out.push(''); continue }
    let line = ''
    for (const w of words) {
      const test = line ? `${line} ${w}` : w
      if (font.widthOfTextAtSize(test, size) <= maxWidth) {
        line = test
        continue
      }
      if (line) { out.push(line); line = '' }
      if (font.widthOfTextAtSize(w, size) > maxWidth) {
        // palavra mais larga que a coluna: quebra por caractere
        let chunk = ''
        for (const ch of w) {
          if (font.widthOfTextAtSize(chunk + ch, size) <= maxWidth) chunk += ch
          else { if (chunk) out.push(chunk); chunk = ch }
        }
        line = chunk
      } else {
        line = w
      }
    }
    if (line) out.push(line)
  }
  return out
}

export async function fillPrescricao(data: PrescricaoData): Promise<Uint8Array> {
  const doc  = await PDFDocument.create()
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const reg  = await doc.embedFont(StandardFonts.Helvetica)

  // A4: 595 × 842 pt
  let page    = doc.addPage([595, 842])
  const W     = 595
  const margin = 50
  const right  = W - margin
  const bottomMargin = 60

  let y = 810

  // Abre nova página quando faltar espaço para o próximo bloco.
  function ensureSpace(needed: number) {
    if (y - needed < bottomMargin) {
      page = doc.addPage([595, 842])
      y = 810
    }
  }

  // ── Header: estabelecimento ───────────────────────────────────────────────
  // O CEAF exige que a receita traga endereço e CNPJ do estabelecimento, além do
  // CNES. As linhas são montadas dinamicamente (endereço longo quebra em várias)
  // e a caixa cinza cresce conforme o conteúdo.
  const headerTextX = margin + 10
  const headerMaxW  = right - headerTextX - 10

  const headerLines: string[] = []
  const ids = [
    data.cnes ? `CNES: ${data.cnes}` : '',
    data.cnpj ? `CNPJ: ${data.cnpj}` : '',
  ].filter(Boolean).join('   ·   ')
  if (ids) headerLines.push(ids)
  if (data.endereco) headerLines.push(...wrapText(data.endereco, reg, 9, headerMaxW))
  const localidade = [
    [data.cidade, data.uf].filter(Boolean).join('/'),
    data.telefone ? `Tel.: ${data.telefone}` : '',
  ].filter(Boolean).join('   ·   ')
  if (localidade) headerLines.push(localidade)

  const nomeLines = wrapText(data.estabelecimento_nome.toUpperCase(), bold, 11, headerMaxW)
  const headerTop = y + 4
  const headerH   = 8 + nomeLines.length * 14 + headerLines.length * 11 + 8
  page.drawRectangle({ x: margin, y: headerTop - headerH, width: right - margin, height: headerH, color: LIGHT })

  let hy = headerTop - 18
  for (const line of nomeLines) {
    textLine(page, line, headerTextX, hy, bold, 11)
    hy -= 14
  }
  for (const line of headerLines) {
    textLine(page, line, headerTextX, hy, reg, 9, GRAY)
    hy -= 11
  }

  y = headerTop - headerH - 12

  // ── Título ────────────────────────────────────────────────────────────────
  const titulo = 'PRESCRIÇÃO MÉDICA'
  const tW = bold.widthOfTextAtSize(titulo, 14)
  textLine(page, titulo, (W - tW) / 2, y, bold, 14)
  y -= 6
  page.drawLine({ start: { x: margin, y }, end: { x: right, y }, thickness: 1.5, color: BLACK })
  y -= 16

  // ── Dados do paciente ─────────────────────────────────────────────────────
  const idade = data.paciente_birth_date ? calcularIdade(data.paciente_birth_date) : null
  const nascStr = isoToBr(data.paciente_birth_date)

  textLine(page, 'Paciente:', margin, y, bold, 10)
  textLine(page, data.paciente_nome, margin + 60, y, reg, 10)
  if (nascStr) {
    textLine(page, `Nasc.: ${nascStr}`, right - 160, y, reg, 10)
  }
  if (idade != null) {
    textLine(page, `Idade: ${idade} anos`, right - 60, y, reg, 10)
  }
  y -= 14

  if (data.paciente_cpf) {
    textLine(page, 'CPF:', margin, y, bold, 10)
    textLine(page, data.paciente_cpf, margin + 30, y, reg, 10)
    y -= 14
  }

  drawLine(page, margin, y + 2, right)
  y -= 12

  // ── Data e cidade ─────────────────────────────────────────────────────────
  const cidade = data.cidade ?? 'Belo Horizonte'
  const dataStr = data.data_prescricao ?? dataHoje()
  textLine(page, `${cidade}, ${dataExtenso(dataStr)}`, margin, y, reg, 10)
  y -= 20

  // ── Medicamentos ──────────────────────────────────────────────────────────
  data.medicamentos.forEach((med, i) => {
    const numLabel = `${i + 1}.`
    const medLine = `${med.nome} ${med.apresentacao}`.trim()
    const qtdLine = `Qtd.: ${med.quantidade}`
    const medTextX = margin + 16
    const medLines = wrapText(medLine, bold, 11, right - medTextX)

    // Pré-calcula a quebra da posologia (indentação pendente sob "Posologia: ").
    const posoLabel = 'Posologia: '
    const posoContentX = medTextX + reg.widthOfTextAtSize(posoLabel, 10)
    const posoLines = med.posologia
      ? wrapText(med.posologia, reg, 10, right - posoContentX)
      : []

    // Garante que o bloco inteiro do medicamento caiba na página.
    const blockHeight =
      Math.max(medLines.length, 1) * 14 +
      12 +
      (med.posologia ? Math.max(posoLines.length, 1) * 12 : 0) +
      6
    ensureSpace(blockHeight)

    textLine(page, numLabel, margin, y, bold, 11)
    for (const line of medLines.length ? medLines : ['']) {
      textLine(page, line, medTextX, y, bold, 11)
      y -= 14
    }

    textLine(page, qtdLine, medTextX, y, reg, 10)
    y -= 12

    if (med.posologia) {
      textLine(page, posoLabel, medTextX, y, reg, 10)
      const lines = posoLines.length ? posoLines : ['']
      lines.forEach(ln => {
        textLine(page, ln, posoContentX, y, reg, 10)
        y -= 12
      })
    }

    y -= 6
  })

  y -= 4
  ensureSpace(70) // mantém divisória, CID e assinatura juntos
  drawLine(page, margin, y + 2, right)
  y -= 12

  // ── CID-10 ────────────────────────────────────────────────────────────────
  if (data.cid10 || data.diagnostico) {
    const cidStr = [data.cid10, data.diagnostico].filter(Boolean).join(' — ')
    textLine(page, `CID-10: ${cidStr}`, margin, y, reg, 9, GRAY)
    y -= 20
  }

  // ── Assinatura do médico ──────────────────────────────────────────────────
  const assinaturaX = right - 220
  drawLine(page, assinaturaX, y + 2, right)
  y -= 14

  const crmStr = data.medico_crm
    ? `CRM ${data.medico_crm}${data.medico_crm_uf ? `/${data.medico_crm_uf}` : ''}`
    : ''
  const cnsStr = data.medico_cns ? `CNS ${data.medico_cns}` : ''
  const credStr = [crmStr, cnsStr].filter(Boolean).join(' · ')

  const medicoLabel = `Dr(a). ${data.medico_nome}`
  const medW = bold.widthOfTextAtSize(medicoLabel, 10)
  textLine(page, medicoLabel, right - medW, y, bold, 10)
  y -= 12

  if (credStr) {
    const credW = reg.widthOfTextAtSize(credStr, 9)
    textLine(page, credStr, right - credW, y, reg, 9, GRAY)
  }

  return doc.save()
}
