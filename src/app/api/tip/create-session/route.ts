import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { checkRateLimit, getClientIp, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'

let supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error('Supabase is not configured')
    }
    supabaseAdmin = createClient(url, key)
  }
  return supabaseAdmin
}

const ALLOWED_CURRENCIES = ['eur', 'usd', 'gbp', 'chf', 'pln', 'czk']
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  // Rate limit: strict (10/min per IP) for payment session creation
  const ip = getClientIp(request)
  const rateCheck = await checkRateLimit(`tip-create:${ip}`, rateLimits.strict)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  try {
    const body = await request.json()
    const { staffProfileId, amount, currency, payerName, message, slug } = body

    if (!staffProfileId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!UUID_REGEX.test(staffProfileId)) {
      return NextResponse.json(
        { error: 'Invalid staff profile ID' },
        { status: 400 }
      )
    }

    if (amount > 500) {
      return NextResponse.json(
        { error: 'Amount too large' },
        { status: 400 }
      )
    }

    if (currency && !ALLOWED_CURRENCIES.includes(currency.toLowerCase())) {
      return NextResponse.json(
        { error: 'Unsupported currency' },
        { status: 400 }
      )
    }

    // Truncate user-supplied strings
    const safeName = payerName ? String(payerName).slice(0, 100) : ''
    const safeMessage = message ? String(message).slice(0, 500) : ''

    const supabase = getSupabaseAdmin()

    // Verify staff profile exists and is enabled
    const { data: staffProfile, error: profileError } = await supabase
      .from('staff_profiles')
      .select('*')
      .eq('id', staffProfileId)
      .eq('is_tip_enabled', true)
      .single()

    if (profileError || !staffProfile) {
      return NextResponse.json(
        { error: 'Staff profile not found or tips disabled' },
        { status: 404 }
      )
    }

    // If Stripe is configured, create a Checkout session
    if (stripe) {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: (currency || 'eur').toLowerCase(),
              product_data: {
                name: `Tip for ${staffProfile.display_name}`,
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        metadata: {
          staff_profile_id: staffProfileId,
          payer_name: safeName,
          message: safeMessage,
          type: 'tip',
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/tip/${slug}?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/tip/${slug}`,
      })

      return NextResponse.json({ url: session.url })
    }

    // Stripe not configured — reject the request
    return NextResponse.json(
      { error: 'Payment processing is not configured. Tips cannot be created without Stripe.' },
      { status: 503 }
    )
  } catch (error) {
    console.error('Tip session error:', error)
    return NextResponse.json(
      { error: 'Failed to create tip session' },
      { status: 500 }
    )
  }
}
