import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { grantAccessToken } from '@/lib/ready2order/client'
import { checkRateLimit, getClientIp, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rateCheck = await checkRateLimit(`${ip}:/api/r2o/connect`, rateLimits.strict)
    if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

    const developerToken = process.env.R2O_DEVELOPER_TOKEN
    if (!developerToken) {
      return NextResponse.json(
        { error: 'ready2order is not configured' },
        { status: 500 }
      )
    }

    // Verify authentication
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check subscription (Pro+ required)
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_expires_at')
      .eq('id', user.id)
      .single()

    if (!profile || profile.subscription_tier === 'free') {
      return NextResponse.json(
        { error: 'Pro subscription required for POS integration' },
        { status: 403 }
      )
    }

    // Check if expired
    if (profile.subscription_expires_at) {
      const expires = new Date(profile.subscription_expires_at)
      if (expires < new Date()) {
        return NextResponse.json(
          { error: 'Subscription expired' },
          { status: 403 }
        )
      }
    }

    // Check if already connected
    const { data: existing } = await supabase
      .from('r2o_connections')
      .select('id, status')
      .eq('profile_id', user.id)
      .single()

    if (existing?.status === 'connected') {
      return NextResponse.json(
        { error: 'Already connected to ready2order' },
        { status: 409 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hookahtorus.com'

    // Generate CSRF state parameter
    const state = randomBytes(32).toString('hex')
    const redirectUri = `${appUrl}/api/r2o/callback?state=${state}`

    // Request grant access from r2o
    const grant = await grantAccessToken(developerToken, redirectUri)

    // Set state in httpOnly cookie for CSRF verification on callback
    const response = NextResponse.json({
      grantAccessUri: grant.grantAccessUri,
    })
    response.cookies.set('r2o_state', state, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/api/r2o/callback',
      maxAge: 600, // 10 minutes
    })
    return response
  } catch (error) {
    console.error('r2o connect error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate POS connection' },
      { status: 500 }
    )
  }
}
