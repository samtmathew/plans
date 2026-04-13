import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes — always accessible
  const publicRoutes = ['/', '/login', '/signup']
  const isPublicRoute = publicRoutes.includes(pathname)
  const isJoinRoute = pathname.startsWith('/join/')
  const isApiRoute = pathname.startsWith('/api/')
  const isAuthRoute = pathname.startsWith('/auth/')

  if (isPublicRoute || isJoinRoute || isApiRoute || isAuthRoute) {
    // Skip landing page for already-authenticated users
    if (pathname === '/' && user) {
      const homeUrl = request.nextUrl.clone()
      homeUrl.pathname = '/home'
      return NextResponse.redirect(homeUrl)
    }
    return supabaseResponse
  }

  // Not authenticated → redirect to login
  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated — check if profile exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  // No profile — redirect to onboarding
  if (!profile) {
    // But if already on onboarding, let through
    if (pathname === '/onboarding') {
      return supabaseResponse
    }
    const onboardingUrl = request.nextUrl.clone()
    onboardingUrl.pathname = '/onboarding'
    return NextResponse.redirect(onboardingUrl)
  }

  // Has profile — redirect away from onboarding if they try to visit
  if (pathname === '/onboarding') {
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = '/home'
    return NextResponse.redirect(homeUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
