import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { stripe, PRICE_TO_TIER } from '@/lib/stripe'
import { checkRateLimit, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const rateCheck = await checkRateLimit('cron:subscription-sync', rateLimits.strict)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!stripe) {
    return NextResponse.json({ message: 'Stripe not configured' })
  }

  const supabase = getSupabaseAdmin()

  // Fetch all profiles with active Stripe subscriptions
  const { data: profiles, error: queryError } = await supabase
    .from('profiles')
    .select('id, subscription_tier, subscription_expires_at, stripe_subscription_id, stripe_customer_id')
    .not('stripe_subscription_id', 'is', null)
    .neq('stripe_subscription_id', '')
    .limit(500)

  if (queryError) {
    logger.error('Cron subscription-sync: query failed', { error: String(queryError) })
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ message: 'No subscriptions to sync', synced: 0 })
  }

  let synced = 0
  let mismatches = 0

  const results = await Promise.allSettled(
    profiles.map(async (profile) => {
      try {
        const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id!)

        const priceId = subscription.items.data[0]?.price.id
        const expectedTier = priceId ? PRICE_TO_TIER[priceId] : null
        const status = subscription.status

        // Active/trialing subscriptions — ensure tier and expiry match
        if (status === 'active' || status === 'trialing') {
          const firstItem = subscription.items.data[0]
          const currentPeriodEnd = firstItem?.current_period_end
          if (!currentPeriodEnd) return 0

          const expiresAt = new Date(currentPeriodEnd * 1000).toISOString()
          const needsUpdate =
            (expectedTier && profile.subscription_tier !== expectedTier) ||
            profile.subscription_expires_at !== expiresAt

          if (needsUpdate) {
            await supabase
              .from('profiles')
              .update({
                subscription_tier: expectedTier || profile.subscription_tier,
                subscription_expires_at: expiresAt,
              })
              .eq('id', profile.id)

            logger.info('Cron subscription-sync: fixed mismatch', {
              profileId: profile.id,
              oldTier: profile.subscription_tier,
              newTier: expectedTier,
              oldExpiry: profile.subscription_expires_at,
              newExpiry: expiresAt,
            })
            mismatches++
          }
        }
        // Canceled/expired — ensure downgraded
        else if (status === 'canceled' || status === 'incomplete_expired') {
          if (profile.subscription_tier !== 'trial') {
            await supabase
              .from('profiles')
              .update({
                subscription_tier: 'trial',
                trial_expires_at: new Date().toISOString(),
                subscription_expires_at: null,
                stripe_subscription_id: null,
              })
              .eq('id', profile.id)

            logger.warn('Cron subscription-sync: forced downgrade', {
              profileId: profile.id, stripeStatus: status,
            })
            mismatches++
          }
        }

        return 1
      } catch (err) {
        // Subscription not found in Stripe — clean up stale reference
        const errMsg = String(err)
        if (errMsg.includes('No such subscription')) {
          await supabase
            .from('profiles')
            .update({ stripe_subscription_id: null })
            .eq('id', profile.id)

          logger.warn('Cron subscription-sync: cleaned stale subscription', {
            profileId: profile.id, subscriptionId: profile.stripe_subscription_id,
          })
          mismatches++
        } else {
          logger.error('Cron subscription-sync: Stripe API error', {
            profileId: profile.id, error: errMsg,
          })
        }
        return 0
      }
    })
  )

  for (const result of results) {
    if (result.status === 'fulfilled') synced += result.value
    else logger.error('Cron subscription-sync: error', { error: String(result.reason) })
  }

  return NextResponse.json({ synced, mismatches, checked: profiles.length })
}
