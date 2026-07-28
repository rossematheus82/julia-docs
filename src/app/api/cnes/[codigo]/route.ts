import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveWorkspace } from '@/lib/active-workspace'
import { buscarEstabelecimentoPorCnes } from '@/lib/cnes'
import { logError } from '@/lib/security/logger'

/**
 * Consulta pública do CNES (DataSUS) para autopreencher o cadastro de
 * estabelecimento — endereço e CNPJ que precisam constar na receita.
 * Exige sessão autenticada com workspace ativo (evita virar proxy aberto).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const active = await getActiveWorkspace(supabase, user.id)
  if (!active) return NextResponse.json({ error: 'Sem workspace' }, { status: 403 })

  const { codigo } = await params
  if (!/^\d{7}$/.test(codigo)) {
    return NextResponse.json({ error: 'CNES inválido — informe 7 dígitos' }, { status: 400 })
  }

  try {
    const estabelecimento = await buscarEstabelecimentoPorCnes(codigo)
    if (!estabelecimento) {
      return NextResponse.json({ error: 'CNES não encontrado no cadastro nacional' }, { status: 404 })
    }
    return NextResponse.json({ estabelecimento })
  } catch (error) {
    logError('cnes_lookup_failed', error, { cnes: codigo })
    return NextResponse.json(
      { error: 'Não foi possível consultar o CNES agora. Preencha os dados manualmente.' },
      { status: 502 },
    )
  }
}
