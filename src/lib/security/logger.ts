const REDACTION_PATTERNS: Array<[RegExp, string]> = [
  [/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[CPF]'],
  [/\b\d{15}\b/g, '[CNS]'],
  [/\b[A-Z]\d{2}(?:\.\d)?\b/gi, '[CID]'],
]

function redactText(value: string) {
  return REDACTION_PATTERNS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    value,
  )
}

function safeValue(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactText(value.message).slice(0, 240),
    }
  }

  if (typeof value === 'string') return redactText(value).slice(0, 240)
  if (typeof value === 'number' || typeof value === 'boolean' || value == null) return value

  if (Array.isArray(value)) return value.slice(0, 5).map(safeValue)

  if (typeof value === 'object') {
    const safe: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (/name|nome|cpf|cns|cid|diagnostico|justificativa|prontuario|address|email|phone/i.test(key)) {
        safe[key] = '[REDACTED]'
      } else {
        safe[key] = safeValue(item)
      }
    }
    return safe
  }

  return '[UNLOGGABLE]'
}

export function logError(scope: string, error?: unknown, context?: Record<string, unknown>) {
  console.error(scope, {
    error: safeValue(error),
    ...(context ? { context: safeValue(context) } : {}),
  })
}
