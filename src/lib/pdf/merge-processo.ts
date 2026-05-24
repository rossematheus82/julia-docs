/**
 * Gerador do processo completo SES-MG.
 *
 * Abordagem: constrói o PDF final copiando páginas seletivamente:
 *   • Páginas estáticas (Orientações, Checklist, Requerimento, Termo de Adesão)
 *     → copiadas do processo-completo.pdf original, sem modificação.
 *   • Páginas de formulário (Form. Específico + LME)
 *     → geradas pelos fillers individuais (que possuem AcroForm com campos preenchíveis),
 *       substituindo as páginas em branco do original.
 *   • Prescrição Médica → gerada do zero com pdf-lib, adicionada ao final.
 *
 * Para renovação: apenas LME (do PDF original ou standalone) + Prescrição.
 */

import { PDFDocument } from 'pdf-lib'
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import {
  fillSpecificForm,
  fillLmeForm,
  applyMappingsToDoc,
  buildSpecificMappings,
  collectCheckedWidgets,
  paintCheckedMarks,
  prepareWrappedText,
  paintWrappedText,
  TEMPLATES,
  type SupportedDisease,
} from './fill-specific'
import { fillPrescricao, type PrescricaoData } from './fill-prescription'
import { fillRequerimento, type RequerimentoData } from './fill-requerimento'
import { fillTermoAdesao, type TermoAdesaoData } from './fill-termo-adesao'
import type { LmeCommonData } from '@/lib/schemas/lme-common'

const TEMPLATE_DIR = path.join(process.cwd(), 'templates-ses')
const LME_STANDALONE = path.join(TEMPLATE_DIR, 'lme', 'lme-eletronico_Jun2023-v.2.pdf')

function processoPath(disease: string) {
  return path.join(TEMPLATE_DIR, disease, 'processo-completo.pdf')
}

/** Índices das páginas estáticas e dos formulários em cada processo-completo.pdf.
 *
 *  Estrutura esperada (índice começa em 0):
 *    p0  = Orientações Básicas              → estático
 *    p1  = Relação de Documentos e Exames   → estático
 *    p2… = Formulário Específico (2-3 pgs)  → substituir pelo formulário preenchido
 *    p(X) = LME                             → substituir pela LME preenchida
 *    p(X+1) = Requerimento                  → estático
 *    p(X+2) = Termo de Adesão               → estático
 */
const PAGE_CONFIG: Record<SupportedDisease, {
  staticBefore: number[]    // páginas estáticas antes dos formulários (Orientações, Checklist)
  specificPages: number     // quantas páginas tem o form específico
  lmePageIndex: number      // índice da LME no PDF original
  staticAfter: number[]     // páginas estáticas após a LME (Requerimento, Termo)
}> = {
  asma:    { staticBefore: [0, 1], specificPages: 2, lmePageIndex: 4, staticAfter: [5, 6] },
  dpoc:    { staticBefore: [0, 1], specificPages: 2, lmePageIndex: 4, staticAfter: [5, 6] },
  'dpi-fp':{ staticBefore: [0, 1], specificPages: 2, lmePageIndex: 4, staticAfter: [5, 6] },
  hap:     { staticBefore: [0, 1], specificPages: 3, lmePageIndex: 5, staticAfter: [6, 7] },
}

async function copyPages(dest: PDFDocument, src: PDFDocument, indices: number[]) {
  const pages = await dest.copyPages(src, indices)
  pages.forEach(p => dest.addPage(p))
}

export interface ProcessoInput {
  disease: SupportedDisease
  requestType: 'inicial' | 'renovacao' | 'reavaliacao'
  lmeData: LmeCommonData
  specificFormData: unknown
  fillDate: string
  prescricaoData: PrescricaoData
  requerimentoData: RequerimentoData
  termoData: TermoAdesaoData
}

export async function gerarProcessoCompleto(input: ProcessoInput, apenasLme = false): Promise<Uint8Array> {
  const { disease, requestType, lmeData, specificFormData, fillDate } = input
  const hasCompleto = existsSync(processoPath(disease))

  // Índices das páginas da LME dentro do processo (preenchidos durante a montagem).
  // Garante que o download "LME" seja exatamente a mesma página do processo completo.
  let lmeStart = 0
  let lmeCount = 0

  /** Retorna o processo completo OU, se apenasLme, somente as páginas da LME extraídas dele. */
  const finish = async (doc: PDFDocument): Promise<Uint8Array> => {
    if (!apenasLme) return doc.save()
    const out = await PDFDocument.create()
    const indices = Array.from({ length: lmeCount }, (_, i) => lmeStart + i)
    const pages = await out.copyPages(doc, indices)
    pages.forEach(p => out.addPage(p))
    return out.save()
  }

  // ── Renovação: só LME + 2 vias de Prescrição ───────────────────────────
  if (requestType === 'renovacao') {
    const doc = await PDFDocument.create()

    lmeStart = doc.getPageCount()
    const lmeDoc = await PDFDocument.load(await fillLmeForm(lmeData, fillDate))
    lmeDoc.getForm().flatten()
    await copyPages(doc, lmeDoc, lmeDoc.getPageIndices())
    lmeCount = doc.getPageCount() - lmeStart

    const prescDoc = await PDFDocument.load(await fillPrescricao(input.prescricaoData))
    await copyPages(doc, prescDoc, prescDoc.getPageIndices())
    // 2ª via da prescrição
    const prescDoc2 = await PDFDocument.load(await fillPrescricao(input.prescricaoData))
    await copyPages(doc, prescDoc2, prescDoc2.getPageIndices())

    return finish(doc)
  }

  // ── Inicial / Reavaliação ────────────────────────────────────────────────
  const doc = await PDFDocument.create()

  if (hasCompleto) {
    const completeDoc = await PDFDocument.load(readFileSync(processoPath(disease)))
    const cfg = PAGE_CONFIG[disease]

    // 1. Páginas estáticas antes (Orientações, Checklist) — sem toque
    await copyPages(doc, completeDoc, cfg.staticBefore)

    // 2. Formulário específico preenchido + flatten → valores ficam visíveis ao copiar
    // Aplica mappings direto no documento sem ciclo save/reload (evita perda de estado de radio buttons)
    const specificDoc = await PDFDocument.load(readFileSync(TEMPLATES[disease]))
    const specificMappings = buildSpecificMappings(disease, specificFormData, fillDate)
    await applyMappingsToDoc(specificDoc, specificMappings)
    const specificMarks = collectCheckedWidgets(specificDoc) // antes do flatten remover os widgets
    const specificWrapped = await prepareWrappedText(specificDoc, specificMappings.wrappedText) // idem (precisa dos Rects)
    specificDoc.getForm().flatten()
    paintCheckedMarks(specificDoc, specificMarks) // marcadores por cima (workaround flatten radio)
    paintWrappedText(specificDoc, specificWrapped) // texto longo quebrado por cima (workaround flatten)
    await copyPages(doc, specificDoc, specificDoc.getPageIndices())

    // 3. LME preenchida + flatten
    lmeStart = doc.getPageCount()
    const lmeDoc = await PDFDocument.load(await fillLmeForm(lmeData, fillDate))
    lmeDoc.getForm().flatten()
    await copyPages(doc, lmeDoc, lmeDoc.getPageIndices())
    lmeCount = doc.getPageCount() - lmeStart

    // 4. Páginas estáticas após (Requerimento, Termo de Adesão) — sem toque
    await copyPages(doc, completeDoc, cfg.staticAfter)
  } else {
    // Fallback: concatena PDFs individuais + Requerimento/Termo do zero
    const specDoc = await PDFDocument.load(readFileSync(TEMPLATES[disease]))
    const specMappings = buildSpecificMappings(disease, specificFormData, fillDate)
    await applyMappingsToDoc(specDoc, specMappings)
    const specMarks = collectCheckedWidgets(specDoc)
    const specWrapped = await prepareWrappedText(specDoc, specMappings.wrappedText)
    specDoc.getForm().flatten()
    paintCheckedMarks(specDoc, specMarks)
    paintWrappedText(specDoc, specWrapped)
    await copyPages(doc, specDoc, specDoc.getPageIndices())

    lmeStart = doc.getPageCount()
    const lmeDoc = await PDFDocument.load(await fillLmeForm(lmeData, fillDate))
    lmeDoc.getForm().flatten()
    await copyPages(doc, lmeDoc, lmeDoc.getPageIndices())
    lmeCount = doc.getPageCount() - lmeStart

    const reqDoc = await PDFDocument.load(await fillRequerimento(input.requerimentoData))
    await copyPages(doc, reqDoc, reqDoc.getPageIndices())

    const termoDoc = await PDFDocument.load(await fillTermoAdesao(input.termoData))
    await copyPages(doc, termoDoc, termoDoc.getPageIndices())
  }

  // 5. Prescrição Médica — 2 vias (geradas separadamente para garantir páginas independentes)
  const prescDoc = await PDFDocument.load(await fillPrescricao(input.prescricaoData))
  await copyPages(doc, prescDoc, prescDoc.getPageIndices())
  const prescDoc2 = await PDFDocument.load(await fillPrescricao(input.prescricaoData))
  await copyPages(doc, prescDoc2, prescDoc2.getPageIndices())

  return finish(doc)
}
