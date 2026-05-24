import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export interface TermoAdesaoData {
  paciente_nome: string
  paciente_nome_social?: string
  data_solicitacao?: string  // DD/MM/AAAA
  medicamentos: Array<{ nome: string; apresentacao: string }>
}

const BLACK = rgb(0, 0, 0)
const GRAY  = rgb(0.4, 0.4, 0.4)
const DARK  = rgb(0.15, 0.15, 0.15)
const LIGHT = rgb(0.94, 0.94, 0.94)

function dataHoje(): string {
  const d = new Date()
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const ano = d.getFullYear()
  return `${dia}/${mes}/${ano}`
}

export async function fillTermoAdesao(data: TermoAdesaoData): Promise<Uint8Array> {
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
  const titulo = 'TERMO DE ADESÃO AO TRATAMENTO'
  const tW = bold.widthOfTextAtSize(titulo, 13)
  page.drawText(titulo, { x: (W - tW) / 2, y: y - 18, size: 13, font: bold, color: BLACK })
  const subtitulo = 'Componente Especializado da Assistência Farmacêutica — SES-MG'
  const sW = reg.widthOfTextAtSize(subtitulo, 8)
  page.drawText(subtitulo, { x: (W - sW) / 2, y: y - 32, size: 8, font: reg, color: GRAY })

  y -= 60

  // ── Dados do paciente ─────────────────────────────────────────────────────
  page.drawText('NOME CIVIL DO PACIENTE:', { x: margin, y, size: 9, font: bold, color: DARK })
  page.drawText(data.paciente_nome, { x: margin + 148, y, size: 10, font: reg, color: BLACK })
  y -= 14

  page.drawText('NOME SOCIAL:', { x: margin, y, size: 9, font: bold, color: DARK })
  if (data.paciente_nome_social) {
    page.drawText(data.paciente_nome_social, { x: margin + 82, y, size: 10, font: reg, color: BLACK })
  } else {
    page.drawLine({ start: { x: margin + 82, y: y + 2 }, end: { x: right, y: y + 2 }, thickness: 0.4, color: GRAY })
  }
  y -= 14

  page.drawText('DATA DA SOLICITAÇÃO:', { x: margin, y, size: 9, font: bold, color: DARK })
  page.drawText(data.data_solicitacao ?? dataHoje(), { x: margin + 130, y, size: 10, font: reg, color: BLACK })
  y -= 14

  page.drawText('Nº DO PROCESSO SIGAF:', { x: margin, y, size: 9, font: bold, color: DARK })
  page.drawLine({ start: { x: margin + 140, y: y + 2 }, end: { x: right, y: y + 2 }, thickness: 0.4, color: GRAY })
  y -= 20

  page.drawLine({ start: { x: margin, y }, end: { x: right, y }, thickness: 0.5, color: GRAY })
  y -= 14

  // ── Medicamentos ──────────────────────────────────────────────────────────
  page.drawText('MEDICAMENTOS SOLICITADOS', { x: margin, y, size: 10, font: bold, color: DARK })
  y -= 14

  data.medicamentos.forEach((med, i) => {
    page.drawText(`${i + 1}.`, { x: margin, y, size: 10, font: bold, color: BLACK })
    page.drawText(`${med.nome} ${med.apresentacao}`.trim(), { x: margin + 14, y, size: 10, font: reg, color: BLACK })
    y -= 14
  })

  y -= 10
  page.drawLine({ start: { x: margin, y }, end: { x: right, y }, thickness: 0.5, color: GRAY })
  y -= 14

  // ── Texto do termo ────────────────────────────────────────────────────────
  const termText = [
    'Declaro que estou ciente das condições de utilização do medicamento, dos riscos, dos benefícios e',
    'das possíveis reações adversas, conforme orientações recebidas do profissional de saúde.',
    '',
    'Comprometo-me a comparecer para renovação do tratamento conforme prazo estabelecido, a comunicar',
    'qualquer evento adverso e a devolver embalagens e medicamentos não utilizados.',
    '',
    'OBSERVAÇÕES:',
  ]

  termText.forEach(line => {
    page.drawText(line, { x: margin, y, size: 9, font: reg, color: DARK })
    y -= 13
  })

  // blank observações line
  page.drawLine({ start: { x: margin, y: y + 2 }, end: { x: right, y: y + 2 }, thickness: 0.4, color: GRAY })
  y -= 13
  page.drawLine({ start: { x: margin, y: y + 2 }, end: { x: right, y: y + 2 }, thickness: 0.4, color: GRAY })
  y -= 30

  // ── Assinaturas ───────────────────────────────────────────────────────────
  const half = (right - margin) / 2

  page.drawLine({ start: { x: margin, y: y + 2 }, end: { x: margin + half - 10, y: y + 2 }, thickness: 0.5, color: GRAY })
  page.drawLine({ start: { x: margin + half + 10, y: y + 2 }, end: { x: right, y: y + 2 }, thickness: 0.5, color: GRAY })
  y -= 10

  page.drawText('Paciente / Responsável', { x: margin, y, size: 9, font: reg, color: GRAY })
  page.drawText('Profissional de Saúde', { x: margin + half + 10, y, size: 9, font: reg, color: GRAY })

  return doc.save()
}
