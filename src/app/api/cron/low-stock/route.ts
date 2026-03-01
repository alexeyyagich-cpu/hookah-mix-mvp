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

  // Fetch per-profile thresholds
  const { data: settingsRows } = await supabase
    .from('notification_settings')
    .select('profile_id, low_stock_threshold')

  const thresholdByProfile = new Map<string, number>()
  for (const row of settingsRows || []) {
    thresholdByProfile.set(row.profile_id, row.low_stock_threshold ?? 50)
  }
  const defaultThreshold = 50

  // Find all inventory items with stock > 0
  const { data: allItems, error: queryError } = await supabase
    .from('tobacco_inventory')
    .select('profile_id, brand, flavor, quantity_grams')
    .gt('quantity_grams', 0)
    .limit(2000)

  if (queryError) {
    logger.error('Cron low-stock query failed', { error: String(queryError) })
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
  }

  // Filter items below their profile's threshold
  const lowStockItems = (allItems || []).filter(item => {
    const threshold = thresholdByProfile.get(item.profile_id) ?? defaultThreshold
    return item.quantity_grams < threshold
  })

  if (lowStockItems.length === 0) {
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
