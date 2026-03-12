import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendMessage, isTelegramConfigured, formatDailyReport } from '@/lib/telegram/bot'
import { checkRateLimit, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'
import type { Session, BarSale } from '@/types/database'

const reportKeyboard = {
  inline_keyboard: [
    [{ text: '📊 Open Reports', url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://hookahtorus.com'}/reports` }],
  ],
}

export async function GET(request: NextRequest) {
  const rateCheck = await checkRateLimit('cron:telegram-daily-report', rateLimits.strict)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isTelegramConfigured) {
    return NextResponse.json({ message: 'Telegram not configured' })
  }

  const supabase = getSupabaseAdmin()

  // Fetch all active connections with daily_summary enabled
  const { data: connections, error: connError } = await supabase
    .from('telegram_connections')
    .select('chat_id, profile_id, profiles(business_name)')
    .eq('is_active', true)
    .eq('notifications_enabled', true)
    .eq('daily_summary', true)

  if (connError) {
    logger.error('Cron telegram-daily-report: failed to fetch connections', { error: String(connError) })
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
  }

  if (!connections || connections.length === 0) {
    return NextResponse.json({ message: 'No subscribers', sent: 0 })
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const results = await Promise.allSettled(
    connections.map(async (conn) => {
      const { chat_id: chatId, profile_id: profileId } = conn
      const businessName = (conn.profiles as unknown as { business_name: string | null } | null)?.business_name || 'Hookah Torus'

      // Fetch today's data for this profile
      const [sessionsRes, barRes, txRes] = await Promise.all([
        supabase.from('sessions').select('total_grams, selling_price')
          .eq('profile_id', profileId).gte('session_date', todayStart.toISOString()),
        supabase.from('bar_sales').select('total_revenue, total_cost, quantity')
          .eq('profile_id', profileId).gte('sold_at', todayStart.toISOString()),
        supabase.from('inventory_transactions')
          .select('quantity_grams, tobacco_inventory:tobacco_inventory_id(purchase_price, package_grams)')
          .eq('profile_id', profileId).eq('type', 'session')
          .gte('created_at', todayStart.toISOString()),
      ])

      const s: Pick<Session, 'total_grams' | 'selling_price'>[] = sessionsRes.data || []
      const b: Pick<BarSale, 'total_revenue' | 'total_cost' | 'quantity'>[] = barRes.data || []
      const hookahRevenue = s.reduce((sum, x) => sum + (x.selling_price || 0), 0)
      const barRevenue = b.reduce((sum, x) => sum + x.total_revenue, 0)
      const barCost = b.reduce((sum, x) => sum + x.total_cost, 0)

      let tobaccoCost = 0
      for (const tx of (txRes.data || [])) {
        const inv = tx.tobacco_inventory as unknown as { purchase_price: number | null; package_grams: number | null } | null
        if (inv?.purchase_price && inv?.package_grams && inv.package_grams > 0) {
          tobaccoCost += Math.abs(tx.quantity_grams) * (inv.purchase_price / inv.package_grams)
        }
      }

      const totalRevenue = hookahRevenue + barRevenue
      const totalCost = barCost + tobaccoCost

      const text = `🏠 <b>${businessName}</b>\n\n` + formatDailyReport({
        sessions: s.length,
        tobaccoGrams: s.reduce((sum, x) => sum + x.total_grams, 0),
        hookahRevenue,
        barSales: b.reduce((sum, x) => sum + x.quantity, 0),
        barRevenue,
        totalRevenue,
        totalCost,
        profit: totalRevenue - totalCost,
      })

      await sendMessage(chatId, text, { parseMode: 'HTML', replyMarkup: reportKeyboard })
      return 1
    })
  )

  let sent = 0
  for (const result of results) {
    if (result.status === 'fulfilled') sent += result.value
    else logger.error('Cron telegram-daily-report: send failed', { error: String(result.reason) })
  }

  return NextResponse.json({ sent, subscribers: connections.length })
}
