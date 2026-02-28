import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe, STRIPE_PRICES } from '@/lib/stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { stripeCheckoutSchema, validateBody } from '@/lib/validation'
import { checkRateLimit, getClientIp, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rateCheck = await checkRateLimit(`${ip}:/api/stripe/checkout`, rateLimits.strict)
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

    let rawBody: unknown
    try {
      rawBody = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const validation = validateBody(stripeCheckoutSchema, rawBody)
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { priceId, userId } = validation.data

    // SECURITY: Verify userId matches authenticated user
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot perform action for another user' },
        { status: 403 }
      )
    }

    // Validate price ID
    const validPrices = Object.values(STRIPE_PRICES)
    if (!validPrices.includes(priceId)) {
      return NextResponse.json(
        { error: 'Invalid price ID' },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      return NextResponse.json({ error: 'Application URL not configured' }, { status: 500 })
    }

    // Check if user already has a Stripe customer ID
    const supabase = getSupabaseAdmin()
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    // Build checkout session params
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?canceled=true`,
      metadata: { supabase_user_id: userId },
      subscription_data: { metadata: { supabase_user_id: userId } },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      locale: 'auto',
    }

    if (profile?.stripe_customer_id) {
      // Returning customer — reuse existing Stripe customer
      sessionParams.customer = profile.stripe_customer_id
      sessionParams.customer_update = { name: 'auto', address: 'auto' }
    }
    // New customer — no email pre-fill, Stripe creates customer during checkout.
    // Webhook (handleCheckoutCompleted) links customer_id to the user profile.

    const session = await stripe.checkout.sessions.create(sessionParams)

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    logger.error('Stripe checkout error', { error: String(error) })
    return NextResponse.json(
      { error: 'Checkout failed. Please try again.' },
      { status: 500 }
    )
  }
}
