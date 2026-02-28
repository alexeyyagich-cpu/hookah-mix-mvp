import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { logger } from '@/lib/logger'
import { checkRateLimit, getClientIp, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  // Rate limiting - strict for destructive operations
  const ip = getClientIp(request)
  const rateCheck = await checkRateLimit(`${ip}:/api/account/delete`, rateLimits.strict)
  if (!rateCheck.success) {
    return rateLimitExceeded(rateCheck.resetIn)
  }

  try {
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Require confirmation phrase
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    if (body.confirmation !== 'DELETE') {
      return NextResponse.json({ error: 'Invalid confirmation' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Load profile to check for Stripe subscription
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('id', user.id)
      .single()

    // Cancel Stripe subscription if exists
    if (stripe && profile?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(profile.stripe_subscription_id)
      } catch (e) {
        logger.error('Failed to cancel Stripe subscription', { error: String(e) })
        // Continue with deletion even if Stripe fails
      }
    }

    // Delete auth user — this cascades to profiles and all child tables
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteError) {
      logger.error('Account deletion error', { error: String(deleteError) })
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Account deletion error', { error: String(error) })
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
