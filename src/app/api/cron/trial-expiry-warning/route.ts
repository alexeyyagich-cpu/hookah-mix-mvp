import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendPushToUser, isPushConfigured } from '@/lib/push/server'
import { sendEmail, isEmailConfigured, generatePaymentFailureEmailHtml } from '@/lib/email/resend'
import { sendMessage, isTelegramConfigured } from '@/lib/telegram/bot'
import { checkRateLimit, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const rateCheck = await checkRateLimit('cron:trial-expiry-warning', rateLimits.strict)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const now = new Date()

  // Find trial profiles expiring in the next 24 hours (but not already expired)
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()

  const { data: expiringProfiles, error: queryError } = await supabase
    .from('profiles')
    .select('id, business_name, trial_expires_at')
    .eq('subscription_tier', 'trial')
    .not('trial_expires_at', 'is', null)
    .gt('trial_expires_at', now.toISOString())
    .lte('trial_expires_at', in24h)
    .limit(500)

  if (queryError) {
    logger.error('Cron trial-expiry-warning: query failed', { error: String(queryError) })
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
  }

  if (!expiringProfiles || expiringProfiles.length === 0) {
    return NextResponse.json({ message: 'No expiring trials', notified: 0 })
  }

  let notified = 0

  const results = await Promise.allSettled(
    expiringProfiles.map(async (profile) => {
      const expiresAt = new Date(profile.trial_expires_at!)
      const hoursLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (60 * 60 * 1000))
      const businessName = profile.business_name || 'Your business'

      const message = `Your free trial expires in ${hoursLeft} hours. Upgrade now to keep all your data and continue managing your business without interruption.`

      // Push notification
      if (isPushConfigured) {
        await sendPushToUser(profile.id, {
          title: 'Trial expires soon',
          body: `Your trial expires in ${hoursLeft} hours. Upgrade to continue.`,
          tag: 'trial-expiry-warning',
          url: '/pricing',
          requireInteraction: true,
        }).catch(() => {})
      }

      // Email notification
      if (isEmailConfigured) {
        try {
          const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
          if (authUser?.user?.email) {
            await sendEmail({
              to: authUser.user.email,
              subject: `Your Hookah Torus trial expires in ${hoursLeft} hours`,
              html: generatePaymentFailureEmailHtml(businessName, message),
            })
          }
        } catch (err) {
          logger.error('Cron trial-expiry-warning: email failed', { error: String(err), profileId: profile.id })
        }
      }

      // Telegram notification
      if (isTelegramConfigured) {
        const { data: tgConn } = await supabase
          .from('telegram_connections')
          .select('chat_id')
          .eq('profile_id', profile.id)
          .eq('is_active', true)
          .single()

        if (tgConn) {
          await sendMessage(tgConn.chat_id,
            `⏰ <b>Trial Expiring Soon</b>\n\n${message}\n\n<a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://hookahtorus.com'}/pricing">Upgrade Now</a>`,
            { parseMode: 'HTML' }
          ).catch(() => {})
        }
      }

      return 1
    })
  )

  for (const r of results) {
    if (r.status === 'fulfilled') notified += r.value
    else logger.error('Cron trial-expiry-warning: error', { error: String(r.reason) })
  }

  return NextResponse.json({ notified, checked: expiringProfiles.length })
}
