import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ACTIVE_WORKSPACE_COOKIE = 'active_workspace_id'
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function withSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Content-Security-Policy', "base-uri 'self'; object-src 'none'; frame-ancestors 'none'")
  if (response.headers.get('Content-Type')?.includes('application/json')) {
    response.headers.set('Cache-Control', 'no-store')
  }
  return response
}

function isAllowedOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (!origin) return true

  const allowed = new Set([request.nextUrl.origin])
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    try {
      allowed.add(new URL(appUrl).origin)
    } catch {}
  }

  return allowed.has(origin)
}

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

  if (isApiRoute && UNSAFE_METHODS.has(request.method) && !isAllowedOrigin(request)) {
    return withSecurityHeaders(NextResponse.json({ error: 'Origem nao permitida' }, { status: 403 }))
  }

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return withSecurityHeaders(NextResponse.redirect(url))
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return withSecurityHeaders(NextResponse.redirect(url))
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
      return withSecurityHeaders(NextResponse.redirect(url))
    }

    // Resolve workspace ativo: cookie → fallback pro primeiro do usuário
    const cookieValue = request.cookies.get(ACTIVE_WORKSPACE_COOKIE)?.value
    const validCookie = cookieValue && memberships.some(m => m.workspace_id === cookieValue)
      ? cookieValue
      : memberships[0].workspace_id

    // Se o cookie tava inválido, atualiza pra valer dali pra frente
    if (cookieValue !== validCookie) {
      supabaseResponse.cookies.set(ACTIVE_WORKSPACE_COOKIE, validCookie, {
        path: '/',
        sameSite: 'lax',
        httpOnly: true,
        secure: request.nextUrl.protocol === 'https:',
        maxAge: 60 * 60 * 24 * 365,
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
      return withSecurityHeaders(NextResponse.redirect(url))
    }
  }

  return withSecurityHeaders(supabaseResponse)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
