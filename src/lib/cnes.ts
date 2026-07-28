/**
 * Consulta de estabelecimentos no CNES (API de Dados Abertos do Ministério da
 * Saúde). Usada para preencher endereço e CNPJ do estabelecimento a partir do
 * código CNES — dados que o CEAF exige no cabeçalho da receita.
 *
 * A API é pública e não exige chave. Só é chamada no servidor (rota
 * `/api/cnes/[codigo]`), nunca direto do browser.
 */

const CNES_API = 'https://apidadosabertos.saude.gov.br/cnes/estabelecimentos'

/** Código IBGE da UF → sigla. */
const UF_POR_CODIGO: Record<number, string> = {
  11: 'RO', 12: 'AC', 13: 'AM', 14: 'RR', 15: 'PA', 16: 'AP', 17: 'TO',
  21: 'MA', 22: 'PI', 23: 'CE', 24: 'RN', 25: 'PB', 26: 'PE', 27: 'AL', 28: 'SE', 29: 'BA',
  31: 'MG', 32: 'ES', 33: 'RJ', 35: 'SP',
  41: 'PR', 42: 'SC', 43: 'RS',
  50: 'MS', 51: 'MT', 52: 'GO', 53: 'DF',
}

export interface CnesEstabelecimento {
  cnes: string
  /** Nome fantasia (ou razão social quando não houver fantasia). */
  nome: string
  razao_social: string | null
  cnpj: string | null
  /** Logradouro, número — bairro, CEP (montado a partir dos campos da API). */
  endereco: string | null
  cep: string | null
  telefone: string | null
  state: string | null
  codigo_municipio: string | null
}

function limpo(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : ''
}

/** 19136829000225 → 19.136.829/0002-25 (retorna cru se não tiver 14 dígitos). */
export function formatarCnpj(valor: string): string {
  const d = valor.replace(/\D/g, '')
  if (d.length !== 14) return valor.trim()
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

function formatarCep(valor: string): string {
  const d = valor.replace(/\D/g, '')
  if (d.length !== 8) return valor.trim()
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

/**
 * Busca um estabelecimento pelo código CNES (7 dígitos).
 * Retorna `null` quando não encontrado; lança em falha de rede/timeout.
 */
export async function buscarEstabelecimentoPorCnes(cnes: string): Promise<CnesEstabelecimento | null> {
  const codigo = cnes.replace(/\D/g, '')
  if (codigo.length !== 7) return null

  const res = await fetch(`${CNES_API}/${codigo}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(12_000),
    cache: 'no-store',
  })

  if (res.status === 404) return null
  if (!res.ok) throw new Error(`CNES respondeu ${res.status}`)

  const raw = await res.json() as Record<string, unknown>
  if (!raw || !raw.codigo_cnes) return null

  const logradouro = limpo(raw.endereco_estabelecimento)
  const numero     = limpo(raw.numero_estabelecimento)
  const bairro     = limpo(raw.bairro_estabelecimento)
  const cepRaw     = limpo(raw.codigo_cep_estabelecimento)

  const linha = [logradouro, numero].filter(Boolean).join(', ')
  const endereco = [linha, bairro, cepRaw ? `CEP ${formatarCep(cepRaw)}` : '']
    .filter(Boolean)
    .join(' — ')

  const cnpjRaw = limpo(raw.numero_cnpj) || limpo(raw.numero_cnpj_entidade)
  const ufCodigo = Number(raw.codigo_uf)

  return {
    cnes: String(raw.codigo_cnes).padStart(7, '0'),
    nome: limpo(raw.nome_fantasia) || limpo(raw.nome_razao_social),
    razao_social: limpo(raw.nome_razao_social) || null,
    cnpj: cnpjRaw ? formatarCnpj(cnpjRaw) : null,
    endereco: endereco || null,
    cep: cepRaw ? formatarCep(cepRaw) : null,
    telefone: limpo(raw.numero_telefone_estabelecimento) || null,
    state: UF_POR_CODIGO[ufCodigo] ?? null,
    codigo_municipio: limpo(raw.codigo_municipio) || null,
  }
}
