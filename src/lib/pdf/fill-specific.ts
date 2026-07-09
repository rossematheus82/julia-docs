import { PDFDocument, PDFName, PDFFont, rgb, StandardFonts } from 'pdf-lib'
import { readFileSync } from 'fs'
import path from 'path'
import { buildAsmaMappings } from './mappings/asma'
import { buildDpocMappings } from './mappings/dpoc'
import { buildDpiFpMappings } from './mappings/dpi-fp'
import { buildHapMappings } from './mappings/hap'
import { buildLmeMappings } from './mappings/lme'
import { sanitizeWinAnsi } from './sanitize'
import type { AsmaFormData } from '@/lib/schemas/asma'
import type { DpocFormData } from '@/lib/schemas/dpoc'
import type { DpiFpFormData } from '@/lib/schemas/dpi-fp'
import type { HapFormData } from '@/lib/schemas/hap'
import type { LmeCommonData } from '@/lib/schemas/lme-common'
import { dataHoje } from '@/lib/utils/date'

export type Mappings = {
  text: Record<string, string>
  checkboxes: Record<string, boolean>
  radios: Record<string, string>
  dropdowns?: Record<string, string>
  /** For radio groups where all export values are 'Yes' — select by widget index (0-based) */
  radiosIndexed?: Record<string, number>
  /** Para grupos de radio em que múltiplos widgets podem ser marcados simultaneamente
   *  (critérios independentes modelados como radio). Lista de índices por campo. */
  radiosMulti?: Record<string, number[]>
  /** Campos cujo texto deve ser quebrado em linhas e DESENHADO manualmente na página
   *  (o flatten do pdf-lib não quebra linha). A caixa é auto-calibrada a partir do
   *  Rect do próprio campo AcroForm; o campo não é preenchido via setText. */
  wrappedText?: Record<string, string>
}

const TEMPLATE_DIR = path.join(process.cwd(), 'templates-ses')
const LME_TEMPLATE = path.join(TEMPLATE_DIR, 'lme', 'lme-eletronico_Jun2023-v.2.pdf')

export const TEMPLATES: Record<string, string> = {
  asma:   path.join(TEMPLATE_DIR, 'asma',   'ASMA (1) - form especifico.pdf'),
  dpoc:   path.join(TEMPLATE_DIR, 'dpoc',   'DOENCA-PULMONAR-OBSTRUTIVA-CRONICA-DPOC-editavel form esp.pdf'),
  'dpi-fp': path.join(TEMPLATE_DIR, 'dpi-fp', 'DOENCA-PULMONAR-INTERSTICIAL-FIBROSANTE-PROGRESSIVA-DPI-FP-1 form.pdf'),
  hap:    path.join(TEMPLATE_DIR, 'hap',    'HIPERTENSAO-ARTERIAL-PULMONAR-HAP-bc3-3 - form eps.pdf'),
}

/** Select a radio button by widget index for groups where all export values are identical. */
function selectRadioByIndex(doc: PDFDocument, fieldName: string, index: number): void {
  const form = doc.getForm()
  const field = form.getRadioGroup(fieldName)
  const acroField = field.acroField
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kids = acroField.dict.get(PDFName.of('Kids')) as any
  if (!kids?.array) return
  let selectedOnKey: ReturnType<typeof PDFName.of> | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  kids.array.forEach((kidRef: any, i: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const widget = doc.context.lookup(kidRef) as any
    if (!widget?.dict) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ap = widget.dict.get(PDFName.of('AP')) as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const n = ap?.dict?.get(PDFName.of('N')) as any
    if (!n?.dict) return
    const onKey = [...n.dict.keys()].find((k: ReturnType<typeof PDFName.of>) => k.toString() !== '/Off')
    if (!onKey) return
    const asValue = i === index ? onKey : PDFName.of('Off')
    widget.dict.set(PDFName.of('AS'), asValue)
    if (i === index) selectedOnKey = onKey
  })
  if (selectedOnKey) acroField.dict.set(PDFName.of('V'), selectedOnKey)
}

/**
 * Marca MÚLTIPLOS widgets de um grupo de radio (para critérios independentes que o PDF
 * modelou como radio — ex: piora funcional CVF e DLCO no DPI-FP). A renderização sai via
 * paintCheckedMarks (o flatten não desenha esses radios de forma confiável).
 */
function selectRadioWidgets(doc: PDFDocument, fieldName: string, indices: number[]): void {
  const form = doc.getForm()
  const field = form.getRadioGroup(fieldName)
  const acroField = field.acroField
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kids = acroField.dict.get(PDFName.of('Kids')) as any
  if (!kids?.array) return
  const want = new Set(indices)
  let firstOnKey: ReturnType<typeof PDFName.of> | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  kids.array.forEach((kidRef: any, i: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const widget = doc.context.lookup(kidRef) as any
    if (!widget?.dict) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const n = (widget.dict.get(PDFName.of('AP')) as any)?.dict?.get(PDFName.of('N')) as any
    if (!n?.dict) return
    const onKey = [...n.dict.keys()].find((k: ReturnType<typeof PDFName.of>) => k.toString() !== '/Off')
    if (!onKey) return
    const on = want.has(i)
    widget.dict.set(PDFName.of('AS'), on ? onKey : PDFName.of('Off'))
    if (on && !firstOnKey) firstOnKey = onKey
  })
  if (firstOnKey) acroField.dict.set(PDFName.of('V'), firstOnKey)
}

type CheckedMark = { pageIndex: number; cx: number; cy: number; r: number }

/**
 * Collect the center positions of every widget whose AS state is not /Off
 * (i.e. selected radio buttons / checkboxes), keyed by page index.
 * Must run BEFORE `form.flatten()` (which removes widgets). Pair with
 * `paintCheckedMarks` AFTER flatten so the markers sit on top of everything.
 *
 * Works around pdf-lib's `form.flatten()` failing to render selected radio
 * buttons with non-standard export values (e.g. `<1>`, `<2>`, `<3>`).
 */
export function collectCheckedWidgets(doc: PDFDocument): CheckedMark[] {
  const marks: CheckedMark[] = []
  const pages = doc.getPages()
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const annots = (pages[pageIndex].node as any).Annots?.()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const arr: any[] = annots?.asArray?.() ?? []
    for (const annotRef of arr) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const widget = doc.context.lookup(annotRef) as any
        if (!widget?.dict) continue
        const subtype = widget.dict.get(PDFName.of('Subtype'))
        if (subtype?.toString() !== '/Widget') continue
        const as = widget.dict.get(PDFName.of('AS'))
        if (!as) continue
        const asStr = as.toString()
        if (asStr === '/Off' || asStr === '') continue
        // Only mark if AP/N actually defines this on-state
        const ap = widget.dict.get(PDFName.of('AP'))
        const n = ap?.dict?.get(PDFName.of('N'))
        if (!n?.dict) continue
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const keys = [...n.dict.keys()].map((k: any) => k.toString())
        if (!keys.includes(asStr)) continue
        const rect = widget.dict.get(PDFName.of('Rect'))
        if (!rect?.array || rect.array.length < 4) continue
        const x1 = rect.array[0].numberValue
        const y1 = rect.array[1].numberValue
        const x2 = rect.array[2].numberValue
        const y2 = rect.array[3].numberValue
        marks.push({
          pageIndex,
          cx: (x1 + x2) / 2,
          cy: (y1 + y2) / 2,
          r: Math.min(x2 - x1, y2 - y1) * 0.3,
        })
      } catch { /* ignorar widget problemático */ }
    }
  }
  return marks
}

/** Paint the collected marks as filled black circles. Call AFTER `form.flatten()`. */
export function paintCheckedMarks(doc: PDFDocument, marks: CheckedMark[]): void {
  const pages = doc.getPages()
  for (const m of marks) {
    const page = pages[m.pageIndex]
    if (!page) continue
    page.drawCircle({ x: m.cx, y: m.cy, size: m.r, color: rgb(0, 0, 0) })
  }
}

/** Quebra `text` em linhas que cabem em `maxWidth` (em pontos), preservando \n e
 *  quebrando palavras longas demais. */
function wrapToWidth(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const out: string[] = []
  for (const paragraph of String(text).split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean)
    if (words.length === 0) { out.push(''); continue }
    let line = ''
    for (const word of words) {
      const test = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(test, size) <= maxWidth) { line = test; continue }
      if (line) { out.push(line); line = '' }
      if (font.widthOfTextAtSize(word, size) > maxWidth) {
        let chunk = ''
        for (const ch of word) {
          if (chunk && font.widthOfTextAtSize(chunk + ch, size) > maxWidth) { out.push(chunk); chunk = ch }
          else chunk += ch
        }
        line = chunk
      } else {
        line = word
      }
    }
    if (line) out.push(line)
  }
  return out
}

type FieldPlacement = { pageIndex: number; x1: number; y1: number; x2: number; y2: number }

/** Localiza a página e o retângulo do widget de um campo de texto. */
function findFieldPlacement(doc: PDFDocument, fieldName: string): FieldPlacement | null {
  let field
  try { field = doc.getForm().getTextField(fieldName) } catch { return null }
  const acro = field.acroField
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let wdict: any = acro.dict
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kids = acro.dict.get(PDFName.of('Kids')) as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (kids?.array?.[0]) wdict = (doc.context.lookup(kids.array[0]) as any)?.dict
  const rect = wdict?.get(PDFName.of('Rect'))
  if (!rect?.array || rect.array.length < 4) return null
  const x1 = rect.array[0].numberValue, y1 = rect.array[1].numberValue
  const x2 = rect.array[2].numberValue, y2 = rect.array[3].numberValue
  const pages = doc.getPages()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pRef = wdict?.get(PDFName.of('P')) as any
  let pageIndex = pages.findIndex(p => pRef && p.ref.objectNumber === pRef.objectNumber)
  if (pageIndex < 0) {
    // fallback: procura o widget nos Annots de cada página
    const targetRef = kids?.array?.[0]
    for (let i = 0; i < pages.length && pageIndex < 0; i++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const annots = (pages[i].node as any).Annots?.()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const arr: any[] = annots?.asArray?.() ?? []
      for (const ref of arr) {
        if (targetRef && ref.objectNumber === targetRef.objectNumber) { pageIndex = i; break }
      }
    }
  }
  if (pageIndex < 0) pageIndex = 0
  return { pageIndex, x1, y1, x2, y2 }
}

type WrappedPrep = {
  font: PDFFont
  items: { pageIndex: number; x: number; yTop: number; lines: string[]; fontSize: number; lineHeight: number }[]
}

const HAP_EXAM_RESULT_FIELDS = new Set([
  'Text25', 'Text26', 'Text67', 'Text28', 'Text29', 'Text30', 'Text31', 'Text68', 'Text33',
])

/** Calcula posições e linhas dos campos de texto longo. Chamar ANTES do flatten
 *  (o flatten remove os widgets, perdendo os Rects). */
export async function prepareWrappedText(doc: PDFDocument, wrappedText?: Record<string, string>): Promise<WrappedPrep | null> {
  if (!wrappedText) return null
  const entries = Object.entries(wrappedText).filter(([, v]) => v && v.trim())
  if (entries.length === 0) return null
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const padX = 2, padTop = 2.5
  const items: WrappedPrep['items'] = []
  for (const [name, rawValue] of entries) {
    const value = sanitizeWinAnsi(rawValue)
    const pl = findFieldPlacement(doc, name)
    if (!pl) continue
    const maxWidth = (pl.x2 - pl.x1) - padX * 2
    const boxHeight = pl.y2 - pl.y1
    // Auto-ajuste: reduz a fonte (10→7) até o texto caber inteiro na altura da caixa.
    // O espaçamento de 1.08 mantém a leitura e permite até 7 linhas na caixa de
    // anamnese da LME, sem ultrapassar o retângulo oficial.
    const compact = HAP_EXAM_RESULT_FIELDS.has(name)
    const sizes = compact ? [8, 7.5, 7, 6.5, 6, 5.5, 5, 4.5] : [10, 9.5, 9, 8.5, 8, 7.5, 7]
    let fontSize = 10, lineHeight = fontSize * 1.15
    let lines = wrapToWidth(value, font, fontSize, maxWidth)
    for (const size of sizes) {
      const lh = size * (compact ? 0.98 : 1.08)
      const maxLines = Math.max(1, Math.floor((boxHeight - 1) / lh))
      const wrapped = wrapToWidth(value, font, size, maxWidth)
      fontSize = size; lineHeight = lh; lines = wrapped.slice(0, maxLines)
      if (wrapped.length <= maxLines) break // coube inteiro
    }
    items.push({ pageIndex: pl.pageIndex, x: pl.x1 + padX, yTop: pl.y2 - padTop, lines, fontSize, lineHeight })
  }
  return { font, items }
}

/** Desenha o texto longo já quebrado. Chamar DEPOIS do flatten (fica por cima). */
export function paintWrappedText(doc: PDFDocument, prep: WrappedPrep | null): void {
  if (!prep) return
  const pages = doc.getPages()
  for (const it of prep.items) {
    const page = pages[it.pageIndex]
    if (!page) continue
    it.lines.forEach((ln, i) => {
      if (!ln) return
      page.drawText(ln, {
        x: it.x,
        y: it.yTop - it.fontSize - i * it.lineHeight,
        font: prep.font,
        size: it.fontSize,
        color: rgb(0, 0, 0),
      })
    })
  }
}

/** Fill AcroForm fields on an already-loaded PDFDocument (in-place). */
export async function applyMappingsToDoc(doc: PDFDocument, mappings: Mappings): Promise<void> {
  const form = doc.getForm()

  const wrappedSet = new Set(Object.keys(mappings.wrappedText ?? {}))
  for (const [fieldName, value] of Object.entries(mappings.text)) {
    if (wrappedSet.has(fieldName)) continue // desenhado manualmente — não preencher o campo
    try {
      const field = form.getTextField(fieldName)
      field.setFontSize(10)
      field.setText(sanitizeWinAnsi(value))
    } catch { /* campo não encontrado — ignorar */ }
  }

  for (const [fieldName, checked] of Object.entries(mappings.checkboxes)) {
    try {
      const field = form.getCheckBox(fieldName)
      if (checked) field.check()
      else field.uncheck()
    } catch { /* campo não encontrado — ignorar */ }
  }

  for (const [fieldName, option] of Object.entries(mappings.radios)) {
    if (!option) continue
    try {
      const field = form.getRadioGroup(fieldName)
      field.select(option)
    } catch { /* campo não encontrado — ignorar */ }
  }

  if (mappings.radiosIndexed) {
    for (const [fieldName, index] of Object.entries(mappings.radiosIndexed)) {
      if (index < 0) continue
      try {
        selectRadioByIndex(doc, fieldName, index)
      } catch { /* campo não encontrado — ignorar */ }
    }
  }

  if (mappings.radiosMulti) {
    for (const [fieldName, indices] of Object.entries(mappings.radiosMulti)) {
      if (!indices?.length) continue
      try {
        selectRadioWidgets(doc, fieldName, indices)
      } catch { /* campo não encontrado — ignorar */ }
    }
  }

  if (mappings.dropdowns) {
    for (const [fieldName, value] of Object.entries(mappings.dropdowns)) {
      if (!value) continue
      try {
        const field = form.getDropdown(fieldName)
        const existing = field.getOptions()
        if (!existing.includes(value)) field.addOptions([value])
        field.select(value)
      } catch { /* campo não encontrado — ignorar */ }
    }
  }
}

async function applyMappings(pdfBytes: Buffer, mappings: Mappings): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes)
  await applyMappingsToDoc(doc, mappings)
  // Texto longo desenhado manualmente (download individual não passa por flatten)
  paintWrappedText(doc, await prepareWrappedText(doc, mappings.wrappedText))
  return doc.save()
}

export function buildSpecificMappings(disease: SupportedDisease, formData: unknown, fillDate: string): Mappings {
  switch (disease) {
    case 'asma':    return buildAsmaMappings(formData as AsmaFormData, fillDate)
    case 'dpoc':    return buildDpocMappings(formData as DpocFormData, fillDate)
    case 'dpi-fp':  return buildDpiFpMappings(formData as DpiFpFormData, fillDate)
    case 'hap':     return buildHapMappings(formData as HapFormData, fillDate)
    default:        throw new Error(`Doença não suportada: ${disease}`)
  }
}

export async function fillAsmaForm(data: AsmaFormData, fillDate?: string): Promise<Uint8Array> {
  const date = fillDate ?? dataHoje()
  const bytes = readFileSync(TEMPLATES.asma)
  return applyMappings(bytes, buildAsmaMappings(data, date))
}

export async function fillDpocForm(data: DpocFormData, fillDate?: string): Promise<Uint8Array> {
  const date = fillDate ?? dataHoje()
  const bytes = readFileSync(TEMPLATES.dpoc)
  return applyMappings(bytes, buildDpocMappings(data, date))
}

export async function fillDpiFpForm(data: DpiFpFormData, fillDate?: string): Promise<Uint8Array> {
  const date = fillDate ?? dataHoje()
  const bytes = readFileSync(TEMPLATES['dpi-fp'])
  return applyMappings(bytes, buildDpiFpMappings(data, date))
}

export async function fillHapForm(data: HapFormData, fillDate?: string): Promise<Uint8Array> {
  const date = fillDate ?? dataHoje()
const bytes = readFileSync(TEMPLATES.hap)
  return applyMappings(bytes, buildHapMappings(data, date))
}

export async function fillLmeForm(data: LmeCommonData, fillDate?: string): Promise<Uint8Array> {
  const date = fillDate ?? dataHoje()
  const bytes = readFileSync(LME_TEMPLATE)
  return applyMappings(bytes, buildLmeMappings(data, date))
}

export type SupportedDisease = 'asma' | 'dpoc' | 'dpi-fp' | 'hap'

export async function fillSpecificForm(disease: SupportedDisease, formData: unknown, fillDate?: string): Promise<Uint8Array> {
  switch (disease) {
    case 'asma':    return fillAsmaForm(formData as AsmaFormData, fillDate)
    case 'dpoc':    return fillDpocForm(formData as DpocFormData, fillDate)
    case 'dpi-fp':  return fillDpiFpForm(formData as DpiFpFormData, fillDate)
    case 'hap':     return fillHapForm(formData as HapFormData, fillDate)
    default:        throw new Error(`Doença não suportada: ${disease}`)
  }
}
