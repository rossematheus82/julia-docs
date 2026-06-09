/** Prompt e pós-processamento compartilhados entre os providers para "Melhorar com IA". */

export function improveSystemPrompt(maxLength: number): string {
  return (
    'Você é um assistente médico que revisa textos clínicos de LMEs do CEAF/SES-MG. ' +
    'Melhore clareza, gramática, ortografia e objetividade em português do Brasil, mantendo TODOS os fatos clínicos. ' +
    'NÃO invente dados, diagnósticos, exames ou medicamentos que não estejam no texto. ' +
    'Use linguagem técnica, impessoal e concisa. ' +
    `O texto final DEVE ter no máximo ${maxLength} caracteres. ` +
    'Responda APENAS com o texto revisado, sem comentários, aspas ou marcações.'
  )
}

export function improveUserPrompt(text: string, maxLength: number, context?: string): string {
  const ctx = context ? ` O texto descreve um caso de ${context.toUpperCase()}.` : ''
  return `Revise e melhore o texto abaixo (limite de ${maxLength} caracteres).${ctx}\n\n"""\n${text}\n"""`
}

/** Salvaguarda: nunca exceder o limite do campo (corta na última palavra). */
export function capToLimit(raw: string, maxLength: number): string {
  let out = raw.trim().replace(/^["']|["']$/g, '').trim()
  if (out.length > maxLength) {
    out = out.slice(0, maxLength)
    const lastSpace = out.lastIndexOf(' ')
    if (lastSpace > maxLength * 0.6) out = out.slice(0, lastSpace)
    out = out.trim()
  }
  return out
}
