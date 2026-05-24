const TZ = 'America/Sao_Paulo'

/** Formata Date ou string ISO para exibição: DD/MM/AAAA */
export function formatarData(data: Date | string | null | undefined): string {
  if (!data) return ''
  if (typeof data === 'string') {
    // ISO date string YYYY-MM-DD — parse directly to avoid UTC midnight shift
    const m = data.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m) return `${m[3]}/${m[2]}/${m[1]}`
  }
  const d = typeof data === 'string' ? new Date(data) : data
  if (isNaN(d.getTime())) return ''
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  return `${dia}/${mes}/${d.getFullYear()}`
}

/** Data atual formatada: DD/MM/AAAA — usa getDate/getMonth/getFullYear para evitar problemas de timezone */
export function dataHoje(): string {
  const d = new Date()
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const ano = d.getFullYear()
  return `${dia}/${mes}/${ano}`
}

/** Data + hora: DD/MM/AAAA HH:mm */
export function formatarDataHora(data: Date | string | null | undefined): string {
  if (!data) return ''
  const d = typeof data === 'string' ? new Date(data) : data
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: TZ,
  })
}

/** Para o PDF — formato por extenso: "18 de maio de 2026" */
export function formatarDataExtenso(data: Date | string | null | undefined): string {
  if (!data) return ''
  const d = typeof data === 'string' ? new Date(data) : data
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: TZ })
}

/** Converte DD/MM/AAAA para string ISO YYYY-MM-DD (para salvar no banco) */
export function parsarDataBr(dataStr: string): string | null {
  if (!dataStr) return null
  const parts = dataStr.split('/')
  if (parts.length !== 3) return null
  const [dia, mes, ano] = parts
  if (!dia || !mes || !ano) return null
  const d = new Date(Number(ano), Number(mes) - 1, Number(dia))
  if (isNaN(d.getTime())) return null
  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
}

/** Converte YYYY-MM-DD para DD/MM/AAAA */
export function isoParaBr(iso: string | null | undefined): string {
  if (!iso) return ''
  const [ano, mes, dia] = iso.split('-')
  if (!ano || !mes || !dia) return iso
  return `${dia}/${mes}/${ano}`
}

/** Calcula idade em anos completos a partir de YYYY-MM-DD ou ISO string */
export function calcularIdade(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null
  const hoje = new Date()
  const nasc = new Date(birthDate)
  if (isNaN(nasc.getTime())) return null
  let age = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) age--
  return age
}

/** Formata CPF com máscara: 000.000.000-00 */
export function formatarCPF(cpf: string | null | undefined): string {
  if (!cpf) return ''
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return cpf
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

/** Formata telefone com máscara: (00) 00000-0000 */
export function formatarTelefone(tel: string | null | undefined): string {
  if (!tel) return ''
  const digits = tel.replace(/\D/g, '')
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return tel
}
