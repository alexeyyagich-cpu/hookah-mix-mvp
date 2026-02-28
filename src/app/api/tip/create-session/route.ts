import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { checkRateLimit, getClientIp, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'
import { tipCreateSessionSchema, validateBody } from '@/lib/validation'

export async function POST(request: NextRequest) {
  // Rate limit: strict (10/min per IP) for payment session creation
  const ip = getClientIp(request)
  const rateCheck = await checkRateLimit(`tip-create:${ip}`, rateLimits.strict)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  try {
    let rawBody: unknown
    try {
      rawBody = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const validation = validateBody(tipCreateSessionSchema, rawBody)
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { staffProfileId, amount, currency, payerName, message, slug } = validation.data

    // Zod already enforces max lengths; keep safeName/safeMessage for downstream use
    const safeName = payerName || ''
    const safeMessage = message || ''

    const supabase = getSupabaseAdmin()

    // Verify staff profile exists and is enabled
    const { data: staffProfile, error: profileError } = await supabase
      .from('staff_profiles')
      .select('id, display_name, is_tip_enabled')
      .eq('id', staffProfileId)
      .eq('is_tip_enabled', true)
      .single()

    if (profileError || !staffProfile) {
      return NextResponse.json(
        { error: 'Staff profile not found or tips disabled' },
        { status: 404 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      return NextResponse.json({ error: 'Application URL not configured' }, { status: 500 })
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
        success_url: `${appUrl}/tip/${slug}?success=true`,
        cancel_url: `${appUrl}/tip/${slug}`,
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
