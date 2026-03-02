import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { checkRateLimit, getClientIp, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'
import { getAuthenticatedUser } from '@/lib/supabase/apiAuth'

export async function POST(request: NextRequest) {
  // Rate limiting - strict for destructive operations
  const ip = getClientIp(request)
  const rateCheck = await checkRateLimit(`${ip}:/api/account/delete`, rateLimits.strict)
  if (!rateCheck.success) {
    return rateLimitExceeded(rateCheck.resetIn)
  }

  try {
    // Verify authentication
    const auth = await getAuthenticatedUser()
    if (auth.response) return auth.response
    const { user } = auth

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

    const supabaseAdmin = getSupabaseAdmin()

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
