import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { staffProfileId, amount, currency, payerName, message, slug } = body

    if (!staffProfileId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (amount > 500) {
      return NextResponse.json(
        { error: 'Amount too large' },
        { status: 400 }
      )
    }

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
              currency: currency || 'eur',
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
          payer_name: payerName || '',
          message: message || '',
          type: 'tip',
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/tip/${slug}?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/tip/${slug}`,
      })

      return NextResponse.json({ url: session.url })
    }

    // Fallback: save tip directly without payment (for dev/demo)
    const { error: insertError } = await supabase
      .from('tips')
      .insert({
        staff_profile_id: staffProfileId,
        amount,
        currency: currency || 'EUR',
        status: 'completed',
        payer_name: payerName || null,
        message: message || null,
      })

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to record tip' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Tip session error:', error)
    return NextResponse.json(
      { error: 'Failed to create tip session' },
      { status: 500 }
    )
  }
}
