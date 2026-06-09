/**
 * Código legível e estável para identificar uma LME, derivado dos próprios
 * dados (não precisa de coluna no banco). Formato: DOENÇA-DDMMAA-XXXX
 * Ex.: DPC-220526-7909
 */
const DISEASE_ABBR: Record<string, string> = {
  asma: 'ASM',
  dpoc: 'DPC',
  'dpi-fp': 'DPI',
  hap: 'HAP',
}

export function lmeCode(opts: { id: string; disease?: string | null; createdAt?: string | null }): string {
  const doenca = DISEASE_ABBR[opts.disease ?? ''] ?? 'LME'

  let dataParte = ''
  if (opts.createdAt) {
    const dt = new Date(opts.createdAt)
    if (!Number.isNaN(dt.getTime())) {
      const dd = String(dt.getDate()).padStart(2, '0')
      const mm = String(dt.getMonth() + 1).padStart(2, '0')
      const aa = String(dt.getFullYear()).slice(-2)
      dataParte = `${dd}${mm}${aa}`
    }
  }

  const idParte = opts.id.replace(/-/g, '').slice(0, 4).toUpperCase()
  return [doenca, dataParte, idParte].filter(Boolean).join('-')
}
