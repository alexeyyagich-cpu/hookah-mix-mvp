import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPushToUser, isPushConfigured } from '@/lib/push/server'
import { checkRateLimit, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  // Rate limit: prevent abuse if cron secret leaks
  const rateCheck = await checkRateLimit('cron:low-stock', rateLimits.strict)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  // Verify Vercel cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isPushConfigured) {
    return NextResponse.json({ message: 'Push not configured' })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Find all profiles with low stock items (< 50g)
  const { data: lowStockItems, error: queryError } = await supabase
    .from('tobacco_inventory')
    .select('profile_id, brand, flavor, quantity_grams')
    .lt('quantity_grams', 50)
    .gt('quantity_grams', 0)
    .limit(1000)

  if (queryError) {
    logger.error('Cron low-stock query failed', { error: String(queryError) })
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
  }

  if (!lowStockItems || lowStockItems.length === 0) {
    return NextResponse.json({ message: 'No low stock items', sent: 0 })
  }

  // Group by profile
  const byProfile = new Map<string, typeof lowStockItems>()
  for (const item of lowStockItems) {
    const existing = byProfile.get(item.profile_id) || []
    existing.push(item)
    byProfile.set(item.profile_id, existing)
  }

  const results = await Promise.allSettled(
    [...byProfile.entries()].map(async ([profileId, items]) => {
      const count = items.length
      const body = items
        .slice(0, 3)
        .map((i) => `${i.brand} ${i.flavor}: ${i.quantity_grams}g`)
        .join('\n') + (count > 3 ? `\n...and ${count - 3} more` : '')

      return sendPushToUser(profileId, {
        title: `Low stock: ${count} ${count === 1 ? 'item' : 'items'}`,
        body,
        tag: 'low-stock-daily',
        url: '/inventory',
      })
    })
  )

  let totalSent = 0
  for (const result of results) {
    if (result.status === 'fulfilled') totalSent += result.value
    else logger.error('Push failed', { error: String(result.reason) })
  }

  return NextResponse.json({ sent: totalSent, profiles: byProfile.size })
}
