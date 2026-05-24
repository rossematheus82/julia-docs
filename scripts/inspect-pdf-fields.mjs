/**
 * Script de inspeção de campos AcroForm dos PDFs SES-MG.
 * Uso: node scripts/inspect-pdf-fields.mjs
 *
 * Coloque os PDFs em templates-ses/{doenca}/ antes de rodar.
 */

import { PDFDocument } from 'pdf-lib'
import { readFileSync, readdirSync } from 'fs'
import { join, extname } from 'path'

const ROOT = join(process.cwd(), 'templates-ses')
const DISEASES = ['asma', 'dpoc', 'dpi-fp', 'hap']

for (const disease of DISEASES) {
  const dir = join(ROOT, disease)
  let files
  try {
    files = readdirSync(dir).filter(f => extname(f).toLowerCase() === '.pdf')
  } catch {
    console.log(`\n[${disease.toUpperCase()}] pasta não encontrada ou vazia`)
    continue
  }

  for (const file of files) {
    const path = join(dir, file)
    const bytes = readFileSync(path)
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true })
    const form = pdf.getForm()
    const fields = form.getFields()

    console.log(`\n${'='.repeat(60)}`)
    console.log(`[${disease.toUpperCase()}] ${file}  —  ${fields.length} campos`)
    console.log('='.repeat(60))

    for (const field of fields) {
      const type = field.constructor.name
      const name = field.getName()
      let extra = ''

      if (type === 'PDFTextField') {
        extra = `  multiline=${field.isMultiline()}`
      } else if (type === 'PDFCheckBox') {
        extra = ''
      } else if (type === 'PDFRadioGroup') {
        extra = `  options=[${field.getOptions().join(', ')}]`
      } else if (type === 'PDFDropdown') {
        extra = `  options=[${field.getOptions().join(', ')}]`
      }

      console.log(`  ${type.padEnd(18)} | ${name}${extra}`)
    }
  }
}
