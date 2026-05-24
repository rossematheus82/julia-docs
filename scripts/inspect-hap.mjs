import { PDFDocument } from 'pdf-lib'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const templatePath = path.join(__dirname, '../templates-ses/hap/HIPERTENSAO-ARTERIAL-PULMONAR-HAP-bc3-3 - form eps.pdf')

const bytes = readFileSync(templatePath)
const doc = await PDFDocument.load(bytes)
const form = doc.getForm()
const fields = form.getFields()

console.log(`\nTotal de campos: ${fields.length}\n`)
for (const f of fields) {
  const type = f.constructor.name
  let extra = ''
  try {
    if (type === 'PDFTextField') {
      const tf = f
      extra = ` | maxLen=${tf.getMaxLength() ?? 'none'} | multiline=${tf.isMultiline()}`
    }
    if (type === 'PDFRadioGroup') {
      const rg = f
      extra = ` | options=${JSON.stringify(rg.getOptions())}`
    }
    if (type === 'PDFCheckBox') {
      extra = ` | checked=${f.isChecked()}`
    }
  } catch {}
  console.log(`[${type}] "${f.getName()}"${extra}`)
}
