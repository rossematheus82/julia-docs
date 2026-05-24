import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ACTIVE_WORKSPACE_COOKIE = 'active_workspace_id'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isAuthRoute = path.startsWith('/login')
  const isOnboarding = path.startsWith('/onboarding')
  const isPerfilNovo = path.startsWith('/perfil-medico/novo')
  const isApiRoute = path.startsWith('/api')
  const isPublic = isAuthRoute || isApiRoute || path === '/'

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Para todas as páginas autenticadas (exceto onboarding/perfil novo/API/login):
  // 1) precisa de workspace ativo
  // 2) precisa de perfil de médico naquele workspace
  if (user && !isPublic && !isOnboarding && !isPerfilNovo) {
    const { data: memberships } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)

    if (!memberships || memberships.length === 0) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }

    // Resolve workspace ativo: cookie → fallback pro primeiro do usuário
    const cookieValue = request.cookies.get(ACTIVE_WORKSPACE_COOKIE)?.value
    const validCookie = cookieValue && memberships.some(m => m.workspace_id === cookieValue)
      ? cookieValue
      : memberships[0].workspace_id

    // Se o cookie tava inválido, atualiza pra valer dali pra frente
    if (cookieValue !== validCookie) {
      supabaseResponse.cookies.set(ACTIVE_WORKSPACE_COOKIE, validCookie, {
        path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365,
      })
    }

    // Exige perfil de médico no workspace ativo
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('owner_user_id', user.id)
      .eq('workspace_id', validCookie)
      .maybeSingle()

    if (!doctor) {
      const url = request.nextUrl.clone()
      url.pathname = '/perfil-medico/novo'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
