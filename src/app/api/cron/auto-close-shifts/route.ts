import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendPushToUser, isPushConfigured } from '@/lib/push/server'
import { checkRateLimit, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

const MAX_SHIFT_HOURS = 18

export async function GET(request: NextRequest) {
  const rateCheck = await checkRateLimit('cron:auto-close-shifts', rateLimits.strict)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  // Find all open shifts older than MAX_SHIFT_HOURS
  const cutoff = new Date(Date.now() - MAX_SHIFT_HOURS * 60 * 60 * 1000).toISOString()

  const { data: staleShifts, error: queryError } = await supabase
    .from('shifts')
    .select('id, profile_id, opened_by_name, opened_at, organization_id')
    .is('closed_at', null)
    .eq('status', 'open')
    .lt('opened_at', cutoff)
    .limit(200)

  if (queryError) {
    logger.error('Cron auto-close-shifts: query failed', { error: String(queryError) })
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
  }

  if (!staleShifts || staleShifts.length === 0) {
    return NextResponse.json({ message: 'No stale shifts', closed: 0 })
  }

  const now = new Date().toISOString()

  const results = await Promise.allSettled(
    staleShifts.map(async (shift) => {
      // Close the shift
      const { error: updateError } = await supabase
        .from('shifts')
        .update({
          closed_at: now,
          status: 'closed',
          updated_at: now,
        })
        .eq('id', shift.id)
        .is('closed_at', null) // optimistic lock: only close if still open

      if (updateError) {
        logger.error('Cron auto-close-shifts: update failed', { shiftId: shift.id, error: String(updateError) })
        return 0
      }

      const hours = Math.round((Date.now() - new Date(shift.opened_at).getTime()) / 3600000)
      const staffName = shift.opened_by_name || 'Unknown'

      logger.warn('Cron auto-close-shifts: force closed shift', {
        shiftId: shift.id,
        profileId: shift.profile_id,
        staffName,
        hoursOpen: hours,
      })

      // Notify owner via push
      if (isPushConfigured) {
        await sendPushToUser(shift.profile_id, {
          title: 'Shift auto-closed',
          body: `Shift by ${staffName} was open for ${hours}h and has been automatically closed.`,
          tag: 'auto-close-shift',
          url: '/shifts',
        }).catch((err) => logger.error('Cron auto-close-shifts: push failed', { error: String(err) }))
      }

      return 1
    })
  )

  let closed = 0
  for (const result of results) {
    if (result.status === 'fulfilled') closed += result.value
    else logger.error('Cron auto-close-shifts: error', { error: String(result.reason) })
  }

  return NextResponse.json({ closed, checked: staleShifts.length })
}
