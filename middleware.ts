import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Quickly allow non-relevant paths (extra safety; matcher is already narrow)
  const isProtected = (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/tickets') ||
    pathname.startsWith('/calendar') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/repairs')
  )
  const needsUserCheck = isProtected || pathname === '/login'

  if (!needsUserCheck) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshing the auth token only when needed
  let user = null as any
  if (needsUserCheck) {
    try {
      const res = await supabase.auth.getUser()
      user = res.data.user
    } catch (err) {
      try {
        await supabase.auth.signOut()
      } catch {}
    }
  }

  // Protect dashboard routes
  if (isProtected && !user) {
    const resp = NextResponse.redirect(new URL('/login', request.url))
    resp.cookies.delete('sb-access-token')
    resp.cookies.delete('sb-refresh-token')
    return resp
  }

  // Redirect authenticated users away from login page to dashboard
  if (pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/tickets/:path*',
    '/calendar/:path*',
    '/profile/:path*',
    '/repairs/:path*',
    '/login',
    '/',
  ],
}
