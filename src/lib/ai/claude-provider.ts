import Anthropic from '@anthropic-ai/sdk'
import type { AIProvider, AIExtractionResult, AIExtractParams } from './index'
import {
  buildExtractionPrompt,
  getLmeFieldDescriptions,
  getAsmaFieldDescriptions,
  getDpocFieldDescriptions,
  getDpiFpFieldDescriptions,
  getHapFieldDescriptions,
} from './prompts'

const DISEASE_FIELD_DESCRIPTIONS: Record<string, () => string> = {
  'asma': getAsmaFieldDescriptions,
  'dpoc': getDpocFieldDescriptions,
  'dpi-fp': getDpiFpFieldDescriptions,
  'hap': getHapFieldDescriptions,
}

export class ClaudeProvider implements AIProvider {
  private client: Anthropic

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }

  async extractFields<T>(params: AIExtractParams<T>): Promise<AIExtractionResult<T>> {
    const { prontuario, schema, diseaseContext, requestType } = params

    const lmeFields = getLmeFieldDescriptions()
    const diseaseFields = DISEASE_FIELD_DESCRIPTIONS[diseaseContext]?.() ?? ''
    const allFields = `### Campos LME (genérico)\n${lmeFields}\n\n### Campos Formulário Específico (${diseaseContext.toUpperCase()})\n${diseaseFields}`

    const prompt = buildExtractionPrompt(prontuario, diseaseContext, requestType, allFields)

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
      system: 'Você é um assistente médico especializado em formulários do CEAF/SES-MG. Responda SEMPRE com JSON válido e nada mais.',
    })

    const content = response.content[0]
    if (content.type !== 'text') throw new Error('Resposta inesperada da IA')

    let parsed: { data: unknown; confidence: unknown; warnings: string[] }
    try {
      const text = content.text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '')
      parsed = JSON.parse(text)
    } catch {
      throw new Error('A IA retornou resposta não-JSON. Tente novamente.')
    }

    const validated = schema.safeParse(parsed.data)
    if (!validated.success) {
      return {
        data: parsed.data as T,
        confidence: (parsed.confidence ?? {}) as Partial<Record<keyof T, 'high' | 'medium' | 'low'>>,
        warnings: [
          ...((parsed.warnings as string[]) ?? []),
          'Alguns campos podem não estar no formato esperado — revise antes de prosseguir.',
        ],
      }
    }

    return {
      data: validated.data,
      confidence: (parsed.confidence ?? {}) as Partial<Record<keyof T, 'high' | 'medium' | 'low'>>,
      warnings: (parsed.warnings as string[]) ?? [],
    }
  }
}
