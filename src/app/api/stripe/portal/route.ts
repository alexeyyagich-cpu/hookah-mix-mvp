import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { checkRateLimit, getClientIp, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rateCheck = await checkRateLimit(`${ip}:/api/stripe/portal`, rateLimits.strict)
    if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      )
    }

    // Verify authentication
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
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

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 400 }
      )
    }

    // SECURITY: Verify userId matches authenticated user
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot access another user\'s portal' },
        { status: 403 }
      )
    }

    // Get user's Stripe customer ID
    const supabase = getSupabaseAdmin()
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    // Create billing portal session (locale: auto-detect from browser)
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
      locale: 'auto',
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Portal session error:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
