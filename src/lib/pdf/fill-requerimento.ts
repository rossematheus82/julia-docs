import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export interface RequerimentoData {
  unidade_solicitante: string
  paciente_nome: string
  paciente_nome_social?: string
  paciente_cpf?: string
  telefones?: string
  medicamentos: Array<{ nome: string; apresentacao: string }>
}

const BLACK = rgb(0, 0, 0)
const GRAY  = rgb(0.4, 0.4, 0.4)
const LIGHT = rgb(0.94, 0.94, 0.94)
const DARK  = rgb(0.15, 0.15, 0.15)

function drawLine(page: ReturnType<PDFDocument['addPage']>, x1: number, y: number, x2: number) {
  page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness: 0.5, color: GRAY })
}

function drawBlankLine(
  page: ReturnType<PDFDocument['addPage']>,
  x: number,
  y: number,
  width: number,
) {
  page.drawLine({ start: { x, y: y + 2 }, end: { x: x + width, y: y + 2 }, thickness: 0.4, color: GRAY })
}

export async function fillRequerimento(data: RequerimentoData): Promise<Uint8Array> {
  const doc  = await PDFDocument.create()
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const reg  = await doc.embedFont(StandardFonts.Helvetica)

  const page  = doc.addPage([595, 842])
  const W     = 595
  const margin = 50
  const right  = W - margin

  let y = 810

  // ── Header ────────────────────────────────────────────────────────────────
  page.drawRectangle({ x: margin, y: y - 44, width: right - margin, height: 48, color: LIGHT })
  const titulo = 'REQUERIMENTO DE MEDICAMENTOS DO CEAF'
  const tW = bold.widthOfTextAtSize(titulo, 12)
  page.drawText(titulo, { x: (W - tW) / 2, y: y - 20, size: 12, font: bold, color: BLACK })
  const subtitulo = 'Componente Especializado da Assistência Farmacêutica — SES-MG'
  const sW = reg.widthOfTextAtSize(subtitulo, 8)
  page.drawText(subtitulo, { x: (W - sW) / 2, y: y - 32, size: 8, font: reg, color: GRAY })

  y -= 60

  // ── Seção: Unidade solicitante ────────────────────────────────────────────
  page.drawText('UNIDADE SOLICITANTE:', { x: margin, y, size: 9, font: bold, color: DARK })
  page.drawText(data.unidade_solicitante, { x: margin + 130, y, size: 10, font: reg, color: BLACK })
  y -= 14

  page.drawText('CAF DE REFERÊNCIA:', { x: margin, y, size: 9, font: bold, color: DARK })
  drawBlankLine(page, margin + 120, y, 200)
  y -= 20

  drawLine(page, margin, y + 4, right)
  y -= 14

  // ── Dados do paciente ─────────────────────────────────────────────────────
  page.drawText('DADOS DO PACIENTE', { x: margin, y, size: 10, font: bold, color: DARK })
  y -= 14

  page.drawText('NOME CIVIL COMPLETO:', { x: margin, y, size: 9, font: bold, color: DARK })
  if (data.paciente_nome) {
    page.drawText(data.paciente_nome, { x: margin + 132, y, size: 10, font: reg, color: BLACK })
  }
  y -= 14

  page.drawText('NOME SOCIAL:', { x: margin, y, size: 9, font: bold, color: DARK })
  if (data.paciente_nome_social) {
    page.drawText(data.paciente_nome_social, { x: margin + 82, y, size: 10, font: reg, color: BLACK })
  } else {
    drawBlankLine(page, margin + 82, y, 300)
  }
  y -= 14

  page.drawText('CPF:', { x: margin, y, size: 9, font: bold, color: DARK })
  if (data.paciente_cpf) {
    page.drawText(data.paciente_cpf, { x: margin + 30, y, size: 10, font: reg, color: BLACK })
  } else {
    drawBlankLine(page, margin + 30, y, 150)
  }
  page.drawText('TELEFONE(S):', { x: margin + 220, y, size: 9, font: bold, color: DARK })
  if (data.telefones) {
    page.drawText(data.telefones, { x: margin + 298, y, size: 10, font: reg, color: BLACK })
  } else {
    drawBlankLine(page, margin + 298, y, 150)
  }
  y -= 20

  drawLine(page, margin, y + 4, right)
  y -= 14

  // ── Medicamentos solicitados ──────────────────────────────────────────────
  page.drawText('MEDICAMENTO(S) SOLICITADO(S)', { x: margin, y, size: 10, font: bold, color: DARK })
  y -= 14

  data.medicamentos.forEach((med, i) => {
    const label = `${i + 1}.`
    page.drawText(label, { x: margin, y, size: 10, font: bold, color: BLACK })
    page.drawText(`${med.nome} ${med.apresentacao}`.trim(), { x: margin + 14, y, size: 10, font: reg, color: BLACK })
    y -= 14
  })

  // Fill remaining slots up to 6
  for (let i = data.medicamentos.length; i < 6; i++) {
    page.drawText(`${i + 1}.`, { x: margin, y, size: 10, font: bold, color: GRAY })
    drawBlankLine(page, margin + 14, y, right - margin - 14)
    y -= 14
  }

  y -= 10
  drawLine(page, margin, y + 4, right)
  y -= 14

  // ── Campos em branco (preenchidos na farmácia) ────────────────────────────
  const blanks = [
    'DATA DE APRESENTAÇÃO DOS DOCUMENTOS:',
    'NÚMERO DO PROCESSO SEI:',
    'NÚMERO DO PROCESSO SIGAF:',
    'OBSERVAÇÕES:',
  ]
  blanks.forEach(label => {
    page.drawText(label, { x: margin, y, size: 9, font: bold, color: DARK })
    drawBlankLine(page, margin + reg.widthOfTextAtSize(label, 9) + 30, y, 200)
    y -= 14
  })

  y -= 20
  drawLine(page, margin, y + 4, right)
  y -= 20

  // ── Assinaturas ───────────────────────────────────────────────────────────
  const half = (right - margin) / 2
  drawBlankLine(page, margin, y, half - 10)
  drawBlankLine(page, margin + half + 10, y, half - 10)
  y -= 10
  page.drawText('Assinatura do Profissional da Farmácia', { x: margin, y, size: 8, font: reg, color: GRAY })
  page.drawText('Assinatura do Paciente / Responsável', { x: margin + half + 10, y, size: 8, font: reg, color: GRAY })

  return doc.save()
}
