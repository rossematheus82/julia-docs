/**
 * Extrai a página da LME de cada processo-completo.pdf e salva como lme-modelo.pdf.
 *
 * Uso: node scripts/extract-lme-page.mjs
 *
 * Requer que os seguintes arquivos existam:
 *   templates-ses/<doenca>/processo-completo.pdf
 *
 * Ajuste os índices de página (lmePage) conforme a posição real da LME em cada PDF
 * (índice começa em 0). Para ver as páginas de cada PDF:
 *   node scripts/inspect-pdf-fields.mjs
 */

import { PDFDocument } from 'pdf-lib'
import { readFile, writeFile, access } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const TEMPLATES = path.join(ROOT, 'templates-ses')

// Ajustar índices conforme os PDFs reais
// Para confirmar os índices, abra cada processo-completo.pdf e conte as páginas (começando em 0)
const DOENCAS = {
  asma:    { lmePage: 4 },  // p0=Orientações, p1=Checklist, p2-3=FormAsma, p4=LME, p5=Req, p6=Termo
  dpoc:    { lmePage: 4 },
  'dpi-fp': { lmePage: 4 },
  hap:     { lmePage: 5 },  // HAP tem 3 páginas no form específico
}

async function fileExists(p) {
  try { await access(p); return true } catch { return false }
}

async function run() {
  let anyDone = false

  for (const [doenca, config] of Object.entries(DOENCAS)) {
    const inputPath = path.join(TEMPLATES, doenca, 'processo-completo.pdf')

    if (!(await fileExists(inputPath))) {
      console.log(`⚠️  ${doenca}/processo-completo.pdf não encontrado — pulando`)
      continue
    }

    const bytes = await readFile(inputPath)
    const pdfDoc = await PDFDocument.load(bytes)
    const total = pdfDoc.getPageCount()

    if (config.lmePage >= total) {
      console.log(`❌ ${doenca}: índice ${config.lmePage} fora do range (PDF tem ${total} páginas)`)
      continue
    }

    const novoDoc = await PDFDocument.create()
    const [pagina] = await novoDoc.copyPages(pdfDoc, [config.lmePage])
    novoDoc.addPage(pagina)

    const outPath = path.join(TEMPLATES, doenca, 'lme-modelo.pdf')
    await writeFile(outPath, await novoDoc.save())
    console.log(`✅ ${doenca}/lme-modelo.pdf extraído (página ${config.lmePage} de ${total})`)
    anyDone = true
  }

  if (!anyDone) {
    console.log('\nNenhum processo-completo.pdf encontrado.')
    console.log('Coloque os PDFs completos da SES em:')
    for (const doenca of Object.keys(DOENCAS)) {
      console.log(`  templates-ses/${doenca}/processo-completo.pdf`)
    }
  }
}

run().catch(err => { console.error(err); process.exit(1) })
