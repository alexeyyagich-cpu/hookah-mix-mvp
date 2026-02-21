import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendMessage, verifyWebhookSecret, verifyConnectionToken, formatDailyReport, formatLowStockReport, formatShiftReport } from '@/lib/telegram/bot'
import { checkRateLimit, getClientIp, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'
import type { TelegramUpdate } from '@/lib/telegram/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Max message length to process
const MAX_MESSAGE_LENGTH = 1000

export async function POST(request: NextRequest) {
  // Rate limiting for webhook
  const ip = getClientIp(request)
  const rateCheck = checkRateLimit(`telegram:${ip}`, rateLimits.webhook)
  if (!rateCheck.success) {
    return rateLimitExceeded(rateCheck.resetIn)
  }

  // Verify webhook secret (X-Telegram-Bot-Api-Secret-Token header)
  const secretHeader = request.headers.get('x-telegram-bot-api-secret-token')
  if (!verifyWebhookSecret(secretHeader)) {
    // Invalid Telegram webhook secret
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const update: TelegramUpdate = await request.json()

    // Only process message updates (ignore callback queries, etc.)
    const message = update.message
    if (!message) {
      return NextResponse.json({ ok: true })
    }

    // Validate message has reasonable length
    const messageText = message.text
    if (messageText && messageText.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ ok: true }) // Silently ignore oversized messages
    }

    const chatId = message.chat.id

    // Handle /start command with connection token
    if (messageText?.startsWith('/start')) {
      const token = messageText.split(' ')[1]

      if (token) {
        // Verify the signed connection token
        const { valid, profileId } = verifyConnectionToken(token)

        if (!valid || !profileId) {
          await sendMessage(
            chatId,
            '❌ <b>Link expired or invalid</b>\n\nGet a new link in the <b>Settings</b> section of the app.',
            { parseMode: 'HTML' }
          )
          return NextResponse.json({ ok: true })
        }

        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey)

          // Verify profile exists
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', profileId)
            .single()

          if (!profile) {
            await sendMessage(
              chatId,
              '❌ <b>Profile not found</b>\n\nGet a new link in the <b>Settings</b> section of the app.',
              { parseMode: 'HTML' }
            )
            return NextResponse.json({ ok: true })
          }

          // Check if connection already exists
          const { data: existing } = await supabase
            .from('telegram_connections')
            .select('id')
            .eq('profile_id', profileId)
            .single()

          if (existing) {
            // Update existing connection
            await supabase
              .from('telegram_connections')
              .update({
                telegram_user_id: message.from?.id,
                telegram_username: message.from?.username || null,
                chat_id: chatId,
                is_active: true,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existing.id)

            await sendMessage(
              chatId,
              '✅ <b>Connection updated!</b>\n\nYour Hookah Torus account is linked to this chat. You will receive notifications.',
              { parseMode: 'HTML' }
            )
          } else {
            // Create new connection
            await supabase.from('telegram_connections').insert({
              profile_id: profileId,
              telegram_user_id: message.from?.id,
              telegram_username: message.from?.username || null,
              chat_id: chatId,
              is_active: true,
              notifications_enabled: true,
              low_stock_alerts: true,
              session_reminders: false,
              daily_summary: false,
            })

            await sendMessage(
              chatId,
              '🎉 <b>Connected!</b>\n\nYour Hookah Torus account is now linked to Telegram.\n\nYou will receive notifications about:\n• Low tobacco stock\n• Order updates\n\nConfigure notifications in the <b>Settings</b> section of the app.',
              { parseMode: 'HTML' }
            )
          }
        }
      } else {
        // Start without token - just welcome message
        await sendMessage(
          chatId,
          '👋 <b>Welcome to Hookah Torus Bot!</b>\n\nTo connect the bot to your account, use the link from the <b>Settings</b> section in the app.',
          { parseMode: 'HTML' }
        )
      }
    }

    // Handle /status command
    if (messageText === '/status') {
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const { data: connection } = await supabase
          .from('telegram_connections')
          .select('*, profiles(business_name)')
          .eq('chat_id', chatId)
          .single()

        if (connection) {
          await sendMessage(
            chatId,
            `📊 <b>Connection Status</b>\n\n` +
            `Business: ${connection.profiles?.business_name || 'Not set'}\n` +
            `Notifications: ${connection.notifications_enabled ? '✅' : '❌'}\n` +
            `Low stock: ${connection.low_stock_alerts ? '✅' : '❌'}\n` +
            `Reminders: ${connection.session_reminders ? '✅' : '❌'}\n` +
            `Daily report: ${connection.daily_summary ? '✅' : '❌'}`,
            { parseMode: 'HTML' }
          )
        } else {
          await sendMessage(
            chatId,
            '❌ Telegram is not connected to a Hookah Torus account.\n\nUse the link from the app settings to connect.',
            { parseMode: 'HTML' }
          )
        }
      }
    }

    // Handle /help command
    if (messageText === '/help') {
      await sendMessage(
        chatId,
        '📖 <b>Available commands:</b>\n\n' +
        '/start - Start or connect your account\n' +
        '/status - Check connection status\n' +
        '/report - Today\'s revenue & session report\n' +
        '/stock - Low stock alert\n' +
        '/shift - Current/last shift summary\n' +
        '/help - Show help\n\n' +
        'Configure notifications in <b>Settings → Telegram</b> in the app.',
        { parseMode: 'HTML' }
      )
    }

    // Handle /report command — today's sessions, revenue, profit
    if (messageText === '/report' && supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const { data: connection } = await supabase
        .from('telegram_connections')
        .select('profile_id')
        .eq('chat_id', chatId)
        .single()

      if (!connection) {
        await sendMessage(chatId, '❌ Not connected. Use the link from app settings.', { parseMode: 'HTML' })
      } else {
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        const { data: sessions } = await supabase
          .from('sessions')
          .select('total_grams, selling_price')
          .eq('profile_id', connection.profile_id)
          .gte('session_date', todayStart.toISOString())

        const { data: barSales } = await supabase
          .from('bar_sales')
          .select('total_revenue, total_cost, quantity')
          .eq('profile_id', connection.profile_id)
          .gte('sold_at', todayStart.toISOString())

        const sessionsArr = sessions || []
        const salesArr = barSales || []
        const hookahRevenue = sessionsArr.reduce((s, x) => s + (x.selling_price || 0), 0)
        const tobaccoGrams = sessionsArr.reduce((s, x) => s + x.total_grams, 0)
        const barRevenue = salesArr.reduce((s, x) => s + x.total_revenue, 0)
        const barCost = salesArr.reduce((s, x) => s + x.total_cost, 0)
        const totalRevenue = hookahRevenue + barRevenue

        await sendMessage(chatId, formatDailyReport({
          sessions: sessionsArr.length,
          tobaccoGrams,
          hookahRevenue,
          barSales: salesArr.reduce((s, x) => s + x.quantity, 0),
          barRevenue,
          totalRevenue,
          totalCost: barCost,
          profit: totalRevenue - barCost,
        }), { parseMode: 'HTML' })
      }
    }

    // Handle /stock command — low stock items
    if (messageText === '/stock' && supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const { data: connection } = await supabase
        .from('telegram_connections')
        .select('profile_id')
        .eq('chat_id', chatId)
        .single()

      if (!connection) {
        await sendMessage(chatId, '❌ Not connected. Use the link from app settings.', { parseMode: 'HTML' })
      } else {
        const { data: settings } = await supabase
          .from('notification_settings')
          .select('low_stock_threshold')
          .eq('profile_id', connection.profile_id)
          .single()

        const threshold = settings?.low_stock_threshold || 50

        const { data: inventory } = await supabase
          .from('tobacco_inventory')
          .select('brand, flavor, quantity_grams')
          .eq('profile_id', connection.profile_id)
          .lte('quantity_grams', threshold)
          .order('quantity_grams', { ascending: true })

        await sendMessage(chatId, formatLowStockReport(
          (inventory || []).map(i => ({ brand: i.brand, flavor: i.flavor, quantity: i.quantity_grams, threshold }))
        ), { parseMode: 'HTML' })
      }
    }

    // Handle /shift command — current or last shift summary
    if (messageText === '/shift' && supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const { data: connection } = await supabase
        .from('telegram_connections')
        .select('profile_id')
        .eq('chat_id', chatId)
        .single()

      if (!connection) {
        await sendMessage(chatId, '❌ Not connected. Use the link from app settings.', { parseMode: 'HTML' })
      } else {
        // Get the most recent shift (open or last closed)
        const { data: shifts } = await supabase
          .from('shifts')
          .select('*')
          .eq('profile_id', connection.profile_id)
          .order('opened_at', { ascending: false })
          .limit(1)

        const shift = shifts?.[0]
        if (!shift) {
          await sendMessage(chatId, formatShiftReport(null), { parseMode: 'HTML' })
        } else {
          const start = new Date(shift.opened_at)
          const end = shift.closed_at ? new Date(shift.closed_at) : new Date()

          const { data: sessions } = await supabase
            .from('sessions')
            .select('selling_price')
            .eq('profile_id', connection.profile_id)
            .gte('session_date', start.toISOString())
            .lte('session_date', end.toISOString())

          const { data: barSales } = await supabase
            .from('bar_sales')
            .select('total_revenue, quantity')
            .eq('profile_id', connection.profile_id)
            .gte('sold_at', start.toISOString())
            .lte('sold_at', end.toISOString())

          const sessionsArr = sessions || []
          const salesArr = barSales || []
          const hookahRevenue = sessionsArr.reduce((s, x) => s + (x.selling_price || 0), 0)
          const barRevenue = salesArr.reduce((s, x) => s + x.total_revenue, 0)

          await sendMessage(chatId, formatShiftReport({
            staffName: shift.opened_by_name || null,
            openedAt: shift.opened_at,
            closedAt: shift.closed_at,
            sessions: sessionsArr.length,
            barSales: salesArr.reduce((s, x) => s + x.quantity, 0),
            hookahRevenue,
            barRevenue,
            totalRevenue: hookahRevenue + barRevenue,
          }), { parseMode: 'HTML' })
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}

// Health check endpoint - don't reveal sensitive configuration
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
