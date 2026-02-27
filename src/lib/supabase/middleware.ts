import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from '@/lib/config'

const SECURITY_HEADERS: [string, string][] = [
  ['X-Content-Type-Options', 'nosniff'],
  ['X-Frame-Options', 'SAMEORIGIN'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ['Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()'],
]

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of SECURITY_HEADERS) {
    response.headers.set(key, value)
  }
  return response
}

export async function updateSession(request: NextRequest) {
  // Skip auth check if Supabase is not configured
  if (!isSupabaseConfigured) {
    return applySecurityHeaders(NextResponse.next({ request }))
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public paths that do NOT require authentication
  const publicPaths = [
    '/', '/login', '/register', '/forgot-password', '/update-password',
    '/join', '/tip', '/lounge', '/menu', '/mix', '/pricing',
    '/legal', '/recommend', '/offline', '/setup',
    // Specific public API routes (individual routes handle their own auth)
    '/api/health', '/api/public', '/api/stripe/webhook',
    '/api/telegram/webhook', '/api/r2o/webhooks', '/api/cron',
    '/api/invite/accept',
  ]
  const isPublicPath = publicPaths.some(path =>
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/')
  )
  const isStaticPath = request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname === '/manifest.json' ||
    request.nextUrl.pathname === '/sw.js' ||
    request.nextUrl.pathname === '/sitemap.xml' ||
    request.nextUrl.pathname === '/robots.txt' ||
    request.nextUrl.pathname.startsWith('/images')
  const isProtectedPath = !isPublicPath && !isStaticPath

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return applySecurityHeaders(NextResponse.redirect(url))
  }

  // Trial expiry enforcement — block write API calls for expired trial users
  // Exempt: /api/stripe (so users can still pay to upgrade)
  if (user && isProtectedPath) {
    const isWriteOp = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)
    const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
    const isStripeRoute = request.nextUrl.pathname.startsWith('/api/stripe/')

    if (isWriteOp && isApiRoute && !isStripeRoute) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, trial_expires_at')
        .eq('id', user.id)
        .single()

      if (
        profile?.subscription_tier === 'trial' &&
        profile?.trial_expires_at &&
        new Date(profile.trial_expires_at) < new Date()
      ) {
        const trialExpiredResponse = NextResponse.json(
          { error: 'Trial expired. Please upgrade to continue.' },
          { status: 402 }
        )
        // Copy auth cookies to preserve session
        for (const cookie of supabaseResponse.cookies.getAll()) {
          trialExpiredResponse.cookies.set(cookie.name, cookie.value)
        }
        return applySecurityHeaders(trialExpiredResponse)
      }
    }
  }

  // Public auth paths that don't require login
  const publicAuthPaths = ['/forgot-password', '/update-password']
  const isPublicAuthPath = publicAuthPaths.some(path => request.nextUrl.pathname === path)

  if (isPublicAuthPath) {
    return supabaseResponse
  }

  // Redirect authenticated users from auth/landing pages to dashboard
  const authPaths = ['/login', '/register']
  const isAuthPath = authPaths.some(path => request.nextUrl.pathname === path)
  const isRootPath = request.nextUrl.pathname === '/'

  if ((isAuthPath || isRootPath) && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return applySecurityHeaders(NextResponse.redirect(url))
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return applySecurityHeaders(supabaseResponse)
}
