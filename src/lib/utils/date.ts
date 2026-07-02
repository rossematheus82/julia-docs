export const TZ_BRASILIA = 'America/Sao_Paulo'

function hojePartesBrasilia() {
  const iso = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ_BRASILIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  const [ano, mes, dia] = iso.split('-')
  return { iso, ano, mes, dia }
}

function utcDateFromIsoDate(iso: string) {
  const [ano, mes, dia] = iso.split('-').map(Number)
  return new Date(Date.UTC(ano, mes - 1, dia))
}

/** Formata Date ou string ISO para exibicao: DD/MM/AAAA */
export function formatarData(data: Date | string | null | undefined): string {
  if (!data) return ''
  if (typeof data === 'string') {
    // Data pura YYYY-MM-DD: nao converte para Date para evitar troca de dia por timezone.
    const m = data.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (m) return `${m[3]}/${m[2]}/${m[1]}`
  }

  const d = typeof data === 'string' ? new Date(data) : data
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: TZ_BRASILIA,
  })
}

/** Data atual em Brasilia: DD/MM/AAAA */
export function dataHoje(): string {
  const { dia, mes, ano } = hojePartesBrasilia()
  return `${dia}/${mes}/${ano}`
}

/** Data atual em Brasilia: YYYY-MM-DD */
export function hojeIsoBrasilia(): string {
  return hojePartesBrasilia().iso
}

/** Soma dias a partir do calendario de Brasilia e retorna YYYY-MM-DD. */
export function adicionarDiasIsoBrasilia(dias: number): string {
  const base = utcDateFromIsoDate(hojeIsoBrasilia())
  base.setUTCDate(base.getUTCDate() + dias)
  return base.toISOString().slice(0, 10)
}

/** Diferenca em dias de calendario entre hoje em Brasilia e uma data YYYY-MM-DD. */
export function diasAteDataIso(dataIso: string | null | undefined): number | null {
  if (!dataIso || !/^\d{4}-\d{2}-\d{2}$/.test(dataIso)) return null
  const alvo = utcDateFromIsoDate(dataIso)
  const hoje = utcDateFromIsoDate(hojeIsoBrasilia())
  return Math.round((alvo.getTime() - hoje.getTime()) / 86_400_000)
}

/** Data + hora em Brasilia: DD/MM/AAAA HH:mm */
export function formatarDataHora(data: Date | string | null | undefined): string {
  if (!data) return ''
  const d = typeof data === 'string' ? new Date(data) : data
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ_BRASILIA,
  })
}

/** Para o PDF: formato por extenso, exemplo "18 de maio de 2026". */
export function formatarDataExtenso(data: Date | string | null | undefined): string {
  if (!data) return ''
  const d = typeof data === 'string' ? new Date(data) : data
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: TZ_BRASILIA,
  })
}

/** Converte DD/MM/AAAA para string ISO YYYY-MM-DD para salvar no banco. */
export function parsarDataBr(dataStr: string): string | null {
  if (!dataStr) return null
  const parts = dataStr.split('/')
  if (parts.length !== 3) return null
  const [dia, mes, ano] = parts
  if (!dia || !mes || !ano) return null
  const d = new Date(Number(ano), Number(mes) - 1, Number(dia))
  if (Number.isNaN(d.getTime())) return null
  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
}

/** Converte YYYY-MM-DD para DD/MM/AAAA. */
export function isoParaBr(iso: string | null | undefined): string {
  if (!iso) return ''
  const [ano, mes, dia] = iso.split('-')
  if (!ano || !mes || !dia) return iso
  return `${dia}/${mes}/${ano}`
}

/** Calcula idade em anos completos a partir de YYYY-MM-DD. */
export function calcularIdade(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null
  const [anoNasc, mesNasc, diaNasc] = birthDate.split('-').map(Number)
  if (!anoNasc || !mesNasc || !diaNasc) return null

  const { ano, mes, dia } = hojePartesBrasilia()
  let age = Number(ano) - anoNasc
  const monthDiff = Number(mes) - mesNasc
  if (monthDiff < 0 || (monthDiff === 0 && Number(dia) < diaNasc)) age--
  return age
}

/** Formata CPF com mascara: 000.000.000-00 */
export function formatarCPF(cpf: string | null | undefined): string {
  if (!cpf) return ''
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return cpf
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

/** Formata telefone com mascara: (00) 00000-0000 */
export function formatarTelefone(tel: string | null | undefined): string {
  if (!tel) return ''
  const digits = tel.replace(/\D/g, '')
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return tel
}
