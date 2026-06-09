import type { AIProvider, AIExtractionResult, AIExtractParams, AITextImproveParams } from './index'
import {
  buildExtractionPrompt,
  getLmeFieldDescriptions,
  getAsmaFieldDescriptions,
  getDpocFieldDescriptions,
  getDpiFpFieldDescriptions,
  getHapFieldDescriptions,
} from './prompts'
import { improveSystemPrompt, improveUserPrompt, capToLimit } from './improve'

const DISEASE_FIELD_DESCRIPTIONS: Record<string, () => string> = {
  asma:    getAsmaFieldDescriptions,
  dpoc:    getDpocFieldDescriptions,
  'dpi-fp': getDpiFpFieldDescriptions,
  hap:     getHapFieldDescriptions,
}

interface GeminiGenConfig {
  temperature?: number
  responseMimeType?: string
}

/** Provider do Google Gemini via REST (sem SDK). Gratuito no tier free. */
export class GeminiProvider implements AIProvider {
  private apiKey: string
  private model: string

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? ''
    this.model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'
  }

  private async generate(system: string, user: string, generationConfig: GeminiGenConfig): Promise<string> {
    if (!this.apiKey) throw new Error('GEMINI_API_KEY não configurada.')
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig,
      }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`Erro da IA (Gemini ${res.status}): ${detail.slice(0, 200)}`)
    }
    const json = await res.json()
    const text = json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
    if (!text) throw new Error('Resposta vazia da IA (Gemini)')
    return text
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
    const system =
      'Você é um assistente médico especializado em formulários do CEAF/SES-MG. ' +
      'Responda SEMPRE com JSON válido e nada mais. Nunca use blocos de código markdown.'

    const raw = await this.generate(system, prompt, { temperature: 0.1, responseMimeType: 'application/json' })
    const cleaned = raw.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')

    let parsed: { data: unknown; confidence: unknown; warnings: string[] }
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('A IA (Gemini) retornou resposta não-JSON. Tente novamente.')
      try {
        parsed = JSON.parse(match[0])
      } catch {
        throw new Error('A IA (Gemini) retornou JSON malformado. Tente novamente.')
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

    const filledConfidence: Partial<Record<keyof T, 'high' | 'medium' | 'low'>> = { ...confidence }
    for (const key of Object.keys(validated.data as object) as Array<keyof T>) {
      if (!filledConfidence[key]) {
        const val = (validated.data as Record<string, unknown>)[key as string]
        filledConfidence[key] = val !== null && val !== undefined && val !== '' ? 'medium' : 'low'
      }
    }

    return { data: validated.data, confidence: filledConfidence, warnings }
  }

  async improveText({ text, maxLength, context }: AITextImproveParams): Promise<string> {
    const raw = await this.generate(
      improveSystemPrompt(maxLength),
      improveUserPrompt(text, maxLength, context),
      { temperature: 0.3 },
    )
    return capToLimit(raw, maxLength)
  }
}
