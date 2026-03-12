import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendPushToUser, isPushConfigured } from '@/lib/push/server'
import { sendEmail, isEmailConfigured, generatePaymentFailureEmailHtml } from '@/lib/email/resend'
import { sendMessage, isTelegramConfigured } from '@/lib/telegram/bot'
import { checkRateLimit, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

// Grace period: 7 days after subscription_expires_at before hard downgrade
const GRACE_PERIOD_DAYS = 7
// Warning: send email/push 3 days before expiry
const WARNING_DAYS_BEFORE = 3

export async function GET(request: NextRequest) {
  const rateCheck = await checkRateLimit('cron:subscription-check', rateLimits.strict)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const now = new Date()

  // --- 1. Expiry warnings: subscriptions expiring in WARNING_DAYS_BEFORE days ---
  const warningDate = new Date(now.getTime() + WARNING_DAYS_BEFORE * 24 * 60 * 60 * 1000).toISOString()

  const { data: expiringProfiles } = await supabase
    .from('profiles')
    .select('id, business_name, subscription_tier, subscription_expires_at, stripe_subscription_id')
    .neq('subscription_tier', 'trial')
    .not('subscription_expires_at', 'is', null)
    .lte('subscription_expires_at', warningDate)
    .gt('subscription_expires_at', now.toISOString())
    .limit(500)

  let warnings = 0
  if (expiringProfiles && expiringProfiles.length > 0) {
    const warningResults = await Promise.allSettled(
      expiringProfiles.map(async (profile) => {
        const expiresAt = new Date(profile.subscription_expires_at!)
        const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

        // Send push notification
        if (isPushConfigured) {
          await sendPushToUser(profile.id, {
            title: 'Subscription expiring soon',
            body: `Your ${profile.subscription_tier} plan expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Renew to avoid service interruption.`,
            tag: 'subscription-warning',
            url: '/pricing',
            requireInteraction: true,
          }).catch(() => {})
        }

        // Send email
        if (isEmailConfigured) {
          const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
          if (authUser?.user?.email) {
            await sendEmail({
              to: authUser.user.email,
              subject: `Your Hookah Torus subscription expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
              html: generatePaymentFailureEmailHtml(
                profile.business_name || 'Your business',
                `Your ${profile.subscription_tier} plan expires on ${expiresAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. Please renew to continue using all features.`,
              ),
            }).catch(() => {})
          }
        }

        // Send Telegram if connected
        if (isTelegramConfigured) {
          const { data: tgConn } = await supabase
            .from('telegram_connections')
            .select('chat_id')
            .eq('profile_id', profile.id)
            .eq('is_active', true)
            .single()

          if (tgConn) {
            await sendMessage(tgConn.chat_id,
              `⚠️ <b>Subscription Expiring</b>\n\nYour <b>${profile.subscription_tier}</b> plan expires in <b>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</b>.\n\nRenew now to avoid service interruption.\n\n<a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://hookahtorus.com'}/pricing">Renew Subscription</a>`,
              { parseMode: 'HTML' }
            ).catch(() => {})
          }
        }

        return 1
      })
    )

    for (const r of warningResults) {
      if (r.status === 'fulfilled') warnings += r.value
    }
  }

  // --- 2. Grace period expiry: downgrade profiles past grace period ---
  const graceExpiry = new Date(now.getTime() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data: expiredProfiles } = await supabase
    .from('profiles')
    .select('id, business_name, subscription_tier')
    .neq('subscription_tier', 'trial')
    .not('subscription_expires_at', 'is', null)
    .lte('subscription_expires_at', graceExpiry)
    .limit(500)

  let downgrades = 0
  if (expiredProfiles && expiredProfiles.length > 0) {
    const downgradeResults = await Promise.allSettled(
      expiredProfiles.map(async (profile) => {
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_tier: 'trial',
            trial_expires_at: now.toISOString(), // immediately expired
            subscription_expires_at: null,
            stripe_subscription_id: null,
          })
          .eq('id', profile.id)
          .neq('subscription_tier', 'trial') // optimistic lock

        if (error) {
          logger.error('Cron subscription-check: downgrade failed', { profileId: profile.id, error: String(error) })
          return 0
        }

        logger.warn('Cron subscription-check: downgraded expired profile', {
          profileId: profile.id,
          tier: profile.subscription_tier,
        })

        // Notify via push
        if (isPushConfigured) {
          await sendPushToUser(profile.id, {
            title: 'Subscription expired',
            body: 'Your plan has been downgraded. Upgrade to restore full access.',
            tag: 'subscription-expired',
            url: '/pricing',
            requireInteraction: true,
          }).catch(() => {})
        }

        return 1
      })
    )

    for (const r of downgradeResults) {
      if (r.status === 'fulfilled') downgrades += r.value
    }
  }

  return NextResponse.json({ warnings, downgrades })
}
