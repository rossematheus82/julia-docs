import { z } from 'zod'
import type { Disease, RequestType } from '../supabase/types'
import { GroqProvider } from './groq-provider'
import { GeminiProvider } from './gemini-provider'

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface AIExtractionResult<T> {
  data: T
  confidence: Partial<Record<keyof T, ConfidenceLevel>>
  warnings: string[]
}

export interface AIExtractParams<T> {
  prontuario: string
  schema: z.ZodSchema<T>
  diseaseContext: Disease
  requestType: RequestType
  anonymize?: boolean
}

export interface AITextImproveParams {
  /** Texto escrito pelo médico a ser melhorado. */
  text: string
  /** Limite rígido de caracteres do campo de destino. */
  maxLength: number
  /** Contexto opcional (ex.: doença) para guiar o tom clínico. */
  context?: string
}

export interface AIProvider {
  extractFields<T>(params: AIExtractParams<T>): Promise<AIExtractionResult<T>>
  /** Reescreve o texto com clareza clínica respeitando o limite de caracteres. */
  improveText?(params: AITextImproveParams): Promise<string>
}

function getProvider(): AIProvider {
  // Apenas provedores gratuitos: Groq (padrão) e Gemini.
  const provider = process.env.AI_PROVIDER ?? 'groq'
  if (provider === 'gemini') return new GeminiProvider()
  return new GroqProvider()
}

export const aiProvider: AIProvider = getProvider()

export function anonymizeProntuario(text: string): string {
  return text
    .replace(/\b[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÀÇÑ][a-záéíóúâêîôûãõàçñ]+(?:\s+[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÀÇÑ][a-záéíóúâêîôûãõàçñ]+){1,4}\b/g, '[PACIENTE]')
    .replace(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g, '[CPF]')
    .replace(/\d{15}/g, '[CNS]')
    .replace(/\(\d{2}\)\s*\d{4,5}-?\d{4}/g, '[TELEFONE]')
}

/**
 * Campos de identificação do paciente/médico/estabelecimento. Sempre vêm do
 * cadastro, nunca do prontuário — o texto enviado à IA é anonimizado, então
 * qualquer valor devolvido aqui viria com marcador no lugar do nome
 * (ex.: "Marilaine das [PACIENTE]"). Descartamos esses campos na extração.
 */
const CAMPOS_IDENTIFICACAO = [
  'paciente_nome', 'mae_nome', 'nome_civil', 'nome_social',
  'telefones', 'email_paciente', 'responsavel_nome', 'paciente_incapaz',
  'raca_etnia', 'etnia_detalhe', 'documento_tipo', 'documento_numero',
  'medico_nome', 'medico_cns', 'cnes', 'estabelecimento_nome',
]

const PLACEHOLDER_RE = /\[(?:PACIENTE|CPF|CNS|TELEFONE)\]/g

/** Remove marcadores da anonimização que tenham sobrado num texto livre. */
function limparPlaceholders(texto: string): string {
  return texto
    .replace(PLACEHOLDER_RE, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim()
}

/**
 * Higieniza o resultado da IA: descarta campos de identificação e limpa
 * marcadores da anonimização que tenham sobrado em campos de texto.
 */
export function limparExtracao<T extends Record<string, unknown>>(data: T): T {
  const limpo: Record<string, unknown> = {}
  for (const [chave, valor] of Object.entries(data)) {
    if (CAMPOS_IDENTIFICACAO.includes(chave)) continue
    limpo[chave] = typeof valor === 'string' ? limparPlaceholders(valor) : valor
  }
  return limpo as T
}
