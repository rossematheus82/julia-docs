import { PDFDocument, PDFName } from 'pdf-lib'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const templatePath = path.join(__dirname, '../templates-ses/hap/HIPERTENSAO-ARTERIAL-PULMONAR-HAP-bc3-3 - form eps.pdf')

const bytes = readFileSync(templatePath)
const doc = await PDFDocument.load(bytes)
const form = doc.getForm()
const pages = doc.getPages()

console.log(`\nPages: ${pages.length}\n`)

const fields = form.getFields()

for (const f of fields) {
  const widgets = f.acroField.getWidgets()
  for (const widget of widgets) {
    const rect = widget.getRectangle()
    const pageRef = widget.P()
    let pageNum = '?'
    for (let i = 0; i < pages.length; i++) {
      if (pages[i].ref === pageRef) { pageNum = String(i + 1); break }
    }
    const type = f.constructor.name.replace('PDF', '')
    let opts = ''
    try {
      if (type === 'RadioGroup') opts = ` opts=${JSON.stringify(f.getOptions())}`
    } catch {}
    console.log(`p${pageNum} [${type}] "${f.getName()}" x=${Math.round(rect.x)} y=${Math.round(rect.y)} w=${Math.round(rect.width)} h=${Math.round(rect.height)}${opts}`)
  }
}
