import Groq from 'groq-sdk'
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
  asma:    getAsmaFieldDescriptions,
  dpoc:    getDpocFieldDescriptions,
  'dpi-fp': getDpiFpFieldDescriptions,
  hap:     getHapFieldDescriptions,
}

export class GroqProvider implements AIProvider {
  private client: Groq
  private model: string

  constructor() {
    this.client = new Groq({ apiKey: process.env.GROQ_API_KEY })
    this.model = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile'
  }

  async extractFields<T>(params: AIExtractParams<T>): Promise<AIExtractionResult<T>> {
    const { prontuario, schema, diseaseContext, requestType } = params

    const allFields = [
      '### Campos LME (genérico)',
      getLmeFieldDescriptions(),
      '',
      `### Campos Formulário Específico (${diseaseContext.toUpperCase()})`,
      DISEASE_FIELD_DESCRIPTIONS[diseaseContext]?.() ?? '',
    ].join('\n')

    const prompt = buildExtractionPrompt(prontuario, diseaseContext, requestType, allFields)

    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Você é um assistente médico especializado em formulários do CEAF/SES-MG. ' +
            'Responda SEMPRE com JSON válido e nada mais. Nunca use blocos de código markdown.',
        },
        { role: 'user', content: prompt },
      ],
    })

    const raw = response.choices[0]?.message?.content
    if (!raw) throw new Error('Resposta vazia da IA (Groq)')

    // Remove markdown fences if the model disobey (just in case)
    const cleaned = raw.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')

    let parsed: { data: unknown; confidence: unknown; warnings: string[] }
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      // Second attempt: extract the first {...} block
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('A IA (Groq) retornou resposta não-JSON. Tente novamente.')
      try {
        parsed = JSON.parse(match[0])
      } catch {
        throw new Error('A IA (Groq) retornou JSON malformado. Tente novamente.')
      }
    }

    const validated = schema.safeParse(parsed.data)

    const confidence = (parsed.confidence ?? {}) as Partial<Record<keyof T, 'high' | 'medium' | 'low'>>
    const warnings   = (parsed.warnings as string[]) ?? []

    if (!validated.success) {
      return {
        data: parsed.data as T,
        confidence,
        warnings: [...warnings, 'Alguns campos podem não estar no formato esperado — revise antes de prosseguir.'],
      }
    }

    // Fill in confidence = 'low' for fields not returned by the model
    const filledConfidence: Partial<Record<keyof T, 'high' | 'medium' | 'low'>> = { ...confidence }
    for (const key of Object.keys(validated.data as object) as Array<keyof T>) {
      if (!filledConfidence[key]) {
        const val = (validated.data as Record<string, unknown>)[key as string]
        filledConfidence[key] = val !== null && val !== undefined && val !== '' ? 'medium' : 'low'
      }
    }

    return { data: validated.data, confidence: filledConfidence, warnings }
  }
}
