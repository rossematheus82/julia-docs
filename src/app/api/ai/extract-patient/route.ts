import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'
import { PatientExtractionSchema } from '@/lib/schemas/patient-extraction'

const SYSTEM_PROMPT = `Você é um assistente de extração de dados médicos. Extraia as informações do paciente do texto fornecido, que pode vir do sistema Tasy ou outro prontuário eletrônico.

Retorne um objeto JSON com exatamente estes campos:
- full_name: string (obrigatório — nome completo do paciente)
- social_name: string ou null (nome social se diferente do nome civil)
- mother_name: string ou null (buscar: "Mãe", "Nome da Mãe", "Filiação")
- birth_date: string ou null (formato DD/MM/YYYY — buscar: "Dt. Nascimento", "Data Nasc.", "D.N.", "Nascimento")
- cpf: string ou null (SÓ DÍGITOS, sem pontos ou traços — 11 dígitos)
- cns: string ou null (buscar: "CNS", "Cartão SUS", "Cartão Nacional de Saúde")
- sex: "M", "F", "O" ou null ("M"=Masculino/Masc./M, "F"=Feminino/Fem./F, "O"=Outro/Indeterminado)
- race_ethnicity: "Branca","Preta","Parda","Amarela","Indígena" ou null (buscar: "Cor/Raça", "Etnia", "Raça" — mapear: Branca/Caucasiana=Branca, Negra/Negro/Preto=Preta, Mestiça/Parda/Mista/Miscigenada=Parda, Amarela/Asiática=Amarela, Indígena=Indígena)
- phone: string ou null (SÓ DÍGITOS — buscar: "Tel", "Telefone", "Celular", "Fone", "Cel.")
- email: string ou null
- address: string ou null (endereço completo em uma string — buscar: "End.", "Endereço", "Residência")
- weight_kg: número ou null (buscar: "Peso" — extrair só o número, ex: "78kg" → 78, "78,5kg" → 78.5)
- height_cm: número ou null (buscar: "Altura", "Alt." — converter para cm se em metros: "1,72m" → 172, "1.72m" → 172)
- is_incapable: booleano (true se o texto mencionar "responsável legal", "representante legal", "curador", "tutora", ou se o paciente for claramente menor de idade)
- responsible_name: string ou null (se is_incapable=true, extrair o nome do responsável legal)

REGRAS IMPORTANTES:
- NUNCA invente dados. Retorne null para qualquer campo não explicitamente presente no texto.
- CPF: remova TODA formatação (pontos, traços), retorne só os 11 dígitos.
- Telefone: remova TODA formatação (parênteses, traços, espaços), retorne só os dígitos.
- Data de nascimento: sempre no formato DD/MM/YYYY.
- Altura em metros (ex: "1,72m"): multiplique por 100 e arredonde para inteiro.
- Peso: extraia só o número.
- is_incapable padrão é false.`

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { text } = await req.json() as { text: string }
    if (!text?.trim()) return NextResponse.json({ error: 'Texto obrigatório' }, { status: 400 })

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'GROQ_API_KEY não configurado' }, { status: 500 })

    const groq = new Groq({ apiKey })
    const model = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile'

    const response = await groq.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text.trim() },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    })

    const content = response.choices[0]?.message?.content ?? '{}'
    let raw: unknown
    try {
      raw = JSON.parse(content)
    } catch {
      return NextResponse.json({ error: 'Resposta da IA inválida' }, { status: 500 })
    }

    const parsed = PatientExtractionSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados extraídos inválidos', details: parsed.error.issues }, { status: 422 })
    }

    return NextResponse.json({ data: parsed.data })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
