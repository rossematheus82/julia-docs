import { z } from 'zod'
import type { Disease, RequestType } from '../supabase/types'
import { ClaudeProvider } from './claude-provider'
import { OpenAIProvider } from './openai-provider'
import { GroqProvider } from './groq-provider'

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

export interface AIProvider {
  extractFields<T>(params: AIExtractParams<T>): Promise<AIExtractionResult<T>>
}

function getProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER ?? 'claude'
  if (provider === 'openai') return new OpenAIProvider()
  if (provider === 'groq')   return new GroqProvider()
  return new ClaudeProvider()
}

export const aiProvider: AIProvider = getProvider()

export function anonymizeProntuario(text: string): string {
  return text
    .replace(/\b[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÀÇÑ][a-záéíóúâêîôûãõàçñ]+(?:\s+[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÀÇÑ][a-záéíóúâêîôûãõàçñ]+){1,4}\b/g, '[PACIENTE]')
    .replace(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g, '[CPF]')
    .replace(/\d{15}/g, '[CNS]')
    .replace(/\(\d{2}\)\s*\d{4,5}-?\d{4}/g, '[TELEFONE]')
}
