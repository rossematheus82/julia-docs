import OpenAI from 'openai'
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

export class OpenAIProvider implements AIProvider {
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }

  async extractFields<T>(params: AIExtractParams<T>): Promise<AIExtractionResult<T>> {
    const { prontuario, schema, diseaseContext, requestType } = params

    const lmeFields = getLmeFieldDescriptions()
    const diseaseFields = DISEASE_FIELD_DESCRIPTIONS[diseaseContext]?.() ?? ''
    const allFields = `### Campos LME\n${lmeFields}\n\n### Campos Formulário Específico\n${diseaseFields}`

    const prompt = buildExtractionPrompt(prontuario, diseaseContext, requestType, allFields)

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente médico especializado em formulários CEAF/SES-MG. Responda SEMPRE com JSON válido.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    })

    const text = response.choices[0]?.message?.content ?? '{}'
    let parsed: { data: unknown; confidence: unknown; warnings: string[] }
    try {
      parsed = JSON.parse(text)
    } catch {
      throw new Error('A IA retornou resposta não-JSON.')
    }

    const validated = schema.safeParse(parsed.data)
    return {
      data: (validated.success ? validated.data : parsed.data) as T,
      confidence: (parsed.confidence ?? {}) as Partial<Record<keyof T, 'high' | 'medium' | 'low'>>,
      warnings: (parsed.warnings as string[]) ?? [],
    }
  }
}
