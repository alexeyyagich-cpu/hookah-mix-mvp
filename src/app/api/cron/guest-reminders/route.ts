import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendPushToUser, isPushConfigured } from '@/lib/push/server'
import { checkRateLimit, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

const INACTIVE_DAYS = 30

export async function GET(request: NextRequest) {
  const rateCheck = await checkRateLimit('cron:guest-reminders', rateLimits.strict)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isPushConfigured) {
    return NextResponse.json({ message: 'Push not configured' })
  }

  const supabase = getSupabaseAdmin()

  // Find guests inactive for 30+ days, grouped by profile_id
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - INACTIVE_DAYS)

  const { data: inactiveGuests, error: queryError } = await supabase
    .from('guests')
    .select('profile_id, name, last_visit_at, visit_count')
    .lt('last_visit_at', cutoffDate.toISOString())
    .gt('visit_count', 0)
    .limit(2000)

  if (queryError) {
    logger.error('Cron guest-reminders query failed', { error: String(queryError) })
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
  }

  if (!inactiveGuests || inactiveGuests.length === 0) {
    return NextResponse.json({ message: 'No inactive guests', sent: 0 })
  }

  // Group by profile
  const byProfile = new Map<string, typeof inactiveGuests>()
  for (const guest of inactiveGuests) {
    const existing = byProfile.get(guest.profile_id) || []
    existing.push(guest)
    byProfile.set(guest.profile_id, existing)
  }

  const results = await Promise.allSettled(
    [...byProfile.entries()].map(async ([profileId, guests]) => {
      const count = guests.length
      const topGuests = guests
        .sort((a, b) => b.visit_count - a.visit_count)
        .slice(0, 3)
        .map(g => g.name)
        .join(', ')

      const body = count <= 3
        ? `${topGuests} — haven't visited in ${INACTIVE_DAYS}+ days`
        : `${topGuests} and ${count - 3} more — haven't visited in ${INACTIVE_DAYS}+ days`

      return sendPushToUser(profileId, {
        title: `${count} inactive ${count === 1 ? 'guest' : 'guests'}`,
        body,
        tag: 'guest-reminders-weekly',
        url: '/guests',
      })
    })
  )

  let totalSent = 0
  for (const result of results) {
    if (result.status === 'fulfilled') totalSent += result.value
    else logger.error('Guest reminder push failed', { error: String(result.reason) })
  }

  return NextResponse.json({ sent: totalSent, profiles: byProfile.size, inactiveGuests: inactiveGuests.length })
}
