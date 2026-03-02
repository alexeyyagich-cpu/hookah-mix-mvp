import { NextResponse } from 'next/server'
import { checkRateLimit, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'
import { getAdminUser } from '@/lib/supabase/apiAuth'
import type { AdminStats, SubscriptionTier } from '@/types/database'

export async function GET(request: Request) {
  const rateCheck = await checkRateLimit('admin:stats', rateLimits.standard)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  const admin = await getAdminUser(request)
  if (admin.response) return admin.response
  const { adminClient: supabase } = admin

  try {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

    // All orgs
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, subscription_tier, trial_expires_at, subscription_expires_at, created_at')

    const allOrgs = orgs || []
    const total_orgs = allOrgs.length

    // Count by tier
    const orgs_by_tier: Record<SubscriptionTier, number> = { trial: 0, core: 0, multi: 0, enterprise: 0 }
    for (const org of allOrgs) {
      const tier = (org.subscription_tier || 'trial') as SubscriptionTier
      orgs_by_tier[tier] = (orgs_by_tier[tier] || 0) + 1
    }

    // MRR calculation (€/month)
    const mrr = orgs_by_tier.core * 79 + orgs_by_tier.multi * 149 + orgs_by_tier.enterprise * 299

    // Recent signups (30 days)
    const recent_signups_30d = allOrgs.filter(o => o.created_at >= thirtyDaysAgo).length

    // Trials expiring in 7 days
    const trials_expiring_7d = allOrgs.filter(o =>
      o.subscription_tier === 'trial' &&
      o.trial_expires_at &&
      o.trial_expires_at > now.toISOString() &&
      o.trial_expires_at < sevenDaysFromNow
    ).length

    // Trial to paid conversion rate
    const totalTrialsEver = allOrgs.length // all orgs started as trial
    const paidOrgs = allOrgs.filter(o => o.subscription_tier !== 'trial').length
    const trial_to_paid_rate = totalTrialsEver > 0 ? Math.round((paidOrgs / totalTrialsEver) * 100) : 0

    // Active orgs (had sessions in last 7 days) + Total users — parallel
    const [{ count: activeSessionsCount }, { count: totalUsers }] = await Promise.all([
      supabase
        .from('sessions')
        .select('profile_id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true }),
    ])

    const stats: AdminStats = {
      total_orgs,
      orgs_by_tier,
      active_orgs_7d: activeSessionsCount || 0,
      mrr,
      trials_expiring_7d,
      recent_signups_30d,
      trial_to_paid_rate,
      total_users: totalUsers || 0,
    }

    return NextResponse.json(stats)
  } catch (err) {
    logger.error('Admin stats error', { error: String(err) })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
