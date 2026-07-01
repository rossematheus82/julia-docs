import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { isPlatformAdminEmail } from '@/lib/platform-admin'
import { UUID_RE, readJsonBody } from '@/lib/api/security'

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: platformUser } = await admin
    .from('platform_users')
    .select('role, status')
    .eq('user_id', user.id)
    .maybeSingle()

  const isAdmin = isPlatformAdminEmail(user.email)
    || (platformUser?.role === 'platform_admin' && platformUser?.status === 'active')
  if (!isAdmin) return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })

  const parsed = await readJsonBody<{ userId?: unknown; status?: unknown }>(request, 8 * 1024)
  if ('response' in parsed) return parsed.response

  const { userId, status } = parsed.data
  if (typeof userId !== 'string' || !UUID_RE.test(userId)) {
    return NextResponse.json({ error: 'userId invalido' }, { status: 400 })
  }
  if (status !== 'active' && status !== 'banned') {
    return NextResponse.json({ error: 'status invalido' }, { status: 400 })
  }
  if (userId === user.id && status === 'banned') {
    return NextResponse.json({ error: 'Voce nao pode banir a propria conta.' }, { status: 400 })
  }

  const { data: target, error: targetError } = await admin.auth.admin.getUserById(userId)
  if (targetError || !target.user) {
    return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 })
  }
  if (status === 'banned' && isPlatformAdminEmail(target.user.email)) {
    return NextResponse.json({ error: 'Nao e permitido banir uma conta administradora.' }, { status: 400 })
  }

  const { error } = await admin
    .from('platform_users')
    .upsert({
      user_id: userId,
      email: target.user.email ?? '',
      role: isPlatformAdminEmail(target.user.email) ? 'platform_admin' : 'basic',
      status,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    }, { onConflict: 'user_id' })

  if (error) {
    return NextResponse.json({ error: 'Erro ao atualizar usuario' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
