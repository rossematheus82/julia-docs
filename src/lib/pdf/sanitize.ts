/**
 * Substitui caracteres que a fonte WinAnsi (Helvetica padrão do pdf-lib) não
 * consegue codificar por equivalentes ASCII seguros. Evita o erro
 * "WinAnsi cannot encode ..." ao desenhar/preencher texto no PDF.
 *
 * Chaves comuns (setas, ≥/≤, aspas curvas, traços, bullets) viram ASCII; qualquer
 * outro caractere fora do conjunto Latin-1 vira "?" como salvaguarda final.
 */
const MAP: Record<string, string> = {
  '→': '->', '←': '<-', '↔': '<->', '↦': '->', '⇒': '=>', '⇐': '<=', '⇔': '<=>',
  '≥': '>=', '≤': '<=', '≠': '!=', '≈': '~', '≅': '~', '∼': '~', '−': '-', '∞': 'inf',
  '′': "'", '″': '"', '‴': "'''",
  '–': '-', '—': '-', '―': '-', '‒': '-',
  '“': '"', '”': '"', '„': '"', '‟': '"', '‘': "'", '’': "'", '‚': ',',
  '•': '-', '◦': '-', '▪': '-', '‣': '-', '·': '-', '∙': '-', '●': '-',
  '…': '...', '™': '(TM)', '€': 'EUR', '©': '(c)', '®': '(R)',
  '×': 'x', '÷': '/', '➔': '->', '➜': '->', '⟶': '->',
  ' ': ' ', ' ': ' ', ' ': ' ', ' ': ' ', '​': '', '\t': ' ',
}

export function sanitizeWinAnsi(input: string): string {
  if (!input) return input
  let out = ''
  for (const ch of input) {
    const mapped = MAP[ch]
    if (mapped !== undefined) { out += mapped; continue }
    const code = ch.codePointAt(0) ?? 0
    if (code === 0x0a || code === 0x0d) { out += ch; continue }      // quebras de linha
    if (code >= 0x20 && code <= 0x7e) { out += ch; continue }        // ASCII imprimível
    if (code >= 0xa0 && code <= 0xff) { out += ch; continue }        // Latin-1 (acentos PT-BR)
    out += '?'
  }
  return out
}
