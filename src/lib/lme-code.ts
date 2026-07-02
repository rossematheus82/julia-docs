import { formatarData } from '@/lib/utils/date'

/**
 * Codigo legivel e estavel para identificar uma LME, derivado dos proprios
 * dados. Formato: DOENCA-DDMMAA-XXXX. A data usa calendario de Brasilia.
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
    const [dd, mm, yyyy] = formatarData(opts.createdAt).split('/')
    if (dd && mm && yyyy) dataParte = `${dd}${mm}${yyyy.slice(-2)}`
  }

  const idParte = opts.id.replace(/-/g, '').slice(0, 4).toUpperCase()
  return [doenca, dataParte, idParte].filter(Boolean).join('-')
}
