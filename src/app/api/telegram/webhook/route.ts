import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  sendMessage, editMessageText, answerCallbackQuery, setMyCommands,
  verifyWebhookSecret, verifyConnectionToken,
  formatDailyReport, formatLowStockReport, formatShiftReport,
  kbd, btn, urlBtn,
} from '@/lib/telegram/bot'
import { checkRateLimit, getClientIp, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'
import type { TelegramUpdate } from '@/lib/telegram/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hookahtorus.com'

const MAX_MESSAGE_LENGTH = 1000

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSupabase(): any {
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createClient(supabaseUrl, supabaseServiceKey)
}

// --- Keyboards ---

function statusKeyboard(conn: { low_stock_alerts: boolean; session_reminders: boolean; daily_summary: boolean }) {
  return kbd(
    [
      btn(`Low Stock: ${conn.low_stock_alerts ? '✅' : '❌'}`, 'toggle:low_stock_alerts'),
      btn(`Reminders: ${conn.session_reminders ? '✅' : '❌'}`, 'toggle:session_reminders'),
    ],
    [
      btn(`Daily Report: ${conn.daily_summary ? '✅' : '❌'}`, 'toggle:daily_summary'),
      btn('🔄 Refresh', 'cmd:status'),
    ],
  )
}

const reportKeyboard = kbd(
  [btn('🔄 Refresh', 'cmd:report'), urlBtn('📊 Open in App', `${appUrl}/reports`)],
)

const stockKeyboard = kbd(
  [btn('🔄 Refresh', 'cmd:stock'), urlBtn('📦 Open Inventory', `${appUrl}/inventory`)],
)

const shiftKeyboard = kbd(
  [btn('🔄 Refresh', 'cmd:shift'), urlBtn('🕐 Open Shifts', `${appUrl}/shifts`)],
)

const helpKeyboard = kbd(
  [btn('📊 Report', 'cmd:report'), btn('📦 Stock', 'cmd:stock')],
  [btn('🕐 Shift', 'cmd:shift'), btn('📋 Status', 'cmd:status')],
)

const connectedKeyboard = kbd(
  [btn('📋 Status', 'cmd:status'), btn('❓ Help', 'cmd:help')],
)

// --- Data fetchers ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getConnection(supabase: any, chatId: number): Promise<any> {
  const { data } = await supabase
    .from('telegram_connections')
    .select('*, profiles(business_name)')
    .eq('chat_id', chatId)
    .single()
  return data
}

async function fetchStatusText(supabase: any, chatId: number) {
  const connection = await getConnection(supabase, chatId)
  if (!connection) return { text: '❌ Not connected. Use the link from app settings.', keyboard: undefined, connection: null }

  const text = `📊 <b>Connection Status</b>\n\n` +
    `Business: ${connection.profiles?.business_name || 'Not set'}\n` +
    `Notifications: ${connection.notifications_enabled ? '✅' : '❌'}\n` +
    `Low stock: ${connection.low_stock_alerts ? '✅' : '❌'}\n` +
    `Reminders: ${connection.session_reminders ? '✅' : '❌'}\n` +
    `Daily report: ${connection.daily_summary ? '✅' : '❌'}`

  return { text, keyboard: statusKeyboard(connection), connection }
}

async function fetchReportText(supabase: any, profileId: string) {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const sessionsRes = await supabase.from('sessions').select('total_grams, selling_price')
    .eq('profile_id', profileId).gte('session_date', todayStart.toISOString())
  const barRes = await supabase.from('bar_sales').select('total_revenue, total_cost, quantity')
    .eq('profile_id', profileId).gte('sold_at', todayStart.toISOString())

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s: any[] = sessionsRes.data || []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b: any[] = barRes.data || []
  const hookahRevenue = s.reduce((sum, x) => sum + (x.selling_price || 0), 0)
  const barRevenue = b.reduce((sum, x) => sum + x.total_revenue, 0)
  const barCost = b.reduce((sum, x) => sum + x.total_cost, 0)
  const totalRevenue = hookahRevenue + barRevenue

  return formatDailyReport({
    sessions: s.length,
    tobaccoGrams: s.reduce((sum, x) => sum + x.total_grams, 0),
    hookahRevenue,
    barSales: b.reduce((sum, x) => sum + x.quantity, 0),
    barRevenue,
    totalRevenue,
    totalCost: barCost,
    profit: totalRevenue - barCost,
  })
}

async function fetchStockText(supabase: any, profileId: string) {
  const settingsRes = await supabase
    .from('notification_settings').select('low_stock_threshold')
    .eq('profile_id', profileId).single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const threshold = (settingsRes.data as any)?.low_stock_threshold || 50

  const invRes = await supabase
    .from('tobacco_inventory').select('brand, flavor, quantity_grams')
    .eq('profile_id', profileId).lte('quantity_grams', threshold)
    .order('quantity_grams', { ascending: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return formatLowStockReport(
    ((invRes.data || []) as any[]).map(i => ({ brand: i.brand, flavor: i.flavor, quantity: i.quantity_grams, threshold }))
  )
}

async function fetchShiftText(supabase: any, profileId: string) {
  const shiftsRes = await supabase
    .from('shifts').select('*')
    .eq('profile_id', profileId).order('opened_at', { ascending: false }).limit(1)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shift: any = (shiftsRes.data as any[])?.[0]
  if (!shift) return formatShiftReport(null)

  const start = new Date(shift.opened_at)
  const end = shift.closed_at ? new Date(shift.closed_at) : new Date()

  const sessionsRes = await supabase.from('sessions').select('selling_price')
    .eq('profile_id', profileId)
    .gte('session_date', start.toISOString()).lte('session_date', end.toISOString())
  const barRes = await supabase.from('bar_sales').select('total_revenue, quantity')
    .eq('profile_id', profileId)
    .gte('sold_at', start.toISOString()).lte('sold_at', end.toISOString())

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s: any[] = sessionsRes.data || []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b: any[] = barRes.data || []
  const hookahRevenue = s.reduce((sum, x) => sum + (x.selling_price || 0), 0)
  const barRevenue = b.reduce((sum, x) => sum + x.total_revenue, 0)

  return formatShiftReport({
    staffName: shift.opened_by_name || null,
    openedAt: shift.opened_at,
    closedAt: shift.closed_at,
    sessions: s.length,
    barSales: b.reduce((sum, x) => sum + x.quantity, 0),
    hookahRevenue,
    barRevenue,
    totalRevenue: hookahRevenue + barRevenue,
  })
}

// --- Webhook handler ---

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rateCheck = checkRateLimit(`telegram:${ip}`, rateLimits.webhook)
  if (!rateCheck.success) return rateLimitExceeded(rateCheck.resetIn)

  const secretHeader = request.headers.get('x-telegram-bot-api-secret-token')
  if (!verifyWebhookSecret(secretHeader)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const update: TelegramUpdate = await request.json()

    // --- Handle callback queries (button presses) ---
    if (update.callback_query) {
      const cq = update.callback_query
      const chatId = cq.message?.chat.id
      const messageId = cq.message?.message_id
      if (!chatId || !messageId) {
        await answerCallbackQuery(cq.id)
        return NextResponse.json({ ok: true })
      }

      const supabase = getSupabase()
      if (!supabase) {
        await answerCallbackQuery(cq.id, 'Service unavailable')
        return NextResponse.json({ ok: true })
      }

      const data = cq.data || ''

      // Toggle notification settings
      if (data.startsWith('toggle:')) {
        const field = data.slice(7) as 'low_stock_alerts' | 'session_reminders' | 'daily_summary'
        const validFields = ['low_stock_alerts', 'session_reminders', 'daily_summary']
        if (!validFields.includes(field)) {
          await answerCallbackQuery(cq.id)
          return NextResponse.json({ ok: true })
        }

        const connection = await getConnection(supabase, chatId)
        if (!connection) {
          await answerCallbackQuery(cq.id, 'Not connected')
          return NextResponse.json({ ok: true })
        }

        const newValue = !connection[field]
        await supabase.from('telegram_connections')
          .update({ [field]: newValue, updated_at: new Date().toISOString() })
          .eq('id', connection.id)

        const label = field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        await answerCallbackQuery(cq.id, `${label}: ${newValue ? '✅ On' : '❌ Off'}`)

        // Refresh the status message with updated keyboard
        const updated = { ...connection, [field]: newValue }
        const statusText = `📊 <b>Connection Status</b>\n\n` +
          `Business: ${updated.profiles?.business_name || 'Not set'}\n` +
          `Notifications: ${updated.notifications_enabled ? '✅' : '❌'}\n` +
          `Low stock: ${updated.low_stock_alerts ? '✅' : '❌'}\n` +
          `Reminders: ${updated.session_reminders ? '✅' : '❌'}\n` +
          `Daily report: ${updated.daily_summary ? '✅' : '❌'}`

        await editMessageText(chatId, messageId, statusText, {
          parseMode: 'HTML',
          replyMarkup: statusKeyboard(updated),
        })

        return NextResponse.json({ ok: true })
      }

      // Command buttons (refresh / quick action)
      if (data.startsWith('cmd:')) {
        const cmd = data.slice(4)
        const connection = await getConnection(supabase, chatId)

        if (cmd === 'help') {
          await editMessageText(chatId, messageId,
            '📖 <b>Available commands:</b>\n\n' +
            '/start - Start or connect your account\n' +
            '/status - Connection status & settings\n' +
            '/report - Today\'s revenue report\n' +
            '/stock - Low stock alert\n' +
            '/shift - Current shift summary\n' +
            '/help - Show help',
            { parseMode: 'HTML', replyMarkup: helpKeyboard }
          )
          await answerCallbackQuery(cq.id)
          return NextResponse.json({ ok: true })
        }

        if (!connection) {
          await answerCallbackQuery(cq.id, 'Not connected')
          return NextResponse.json({ ok: true })
        }

        if (cmd === 'status') {
          const { text } = await fetchStatusText(supabase, chatId)
          await editMessageText(chatId, messageId, text, {
            parseMode: 'HTML',
            replyMarkup: statusKeyboard(connection),
          })
          await answerCallbackQuery(cq.id, 'Updated')
        } else if (cmd === 'report') {
          const text = await fetchReportText(supabase, connection.profile_id)
          await editMessageText(chatId, messageId, text, { parseMode: 'HTML', replyMarkup: reportKeyboard })
          await answerCallbackQuery(cq.id, 'Updated')
        } else if (cmd === 'stock') {
          const text = await fetchStockText(supabase, connection.profile_id)
          await editMessageText(chatId, messageId, text, { parseMode: 'HTML', replyMarkup: stockKeyboard })
          await answerCallbackQuery(cq.id, 'Updated')
        } else if (cmd === 'shift') {
          const text = await fetchShiftText(supabase, connection.profile_id)
          await editMessageText(chatId, messageId, text, { parseMode: 'HTML', replyMarkup: shiftKeyboard })
          await answerCallbackQuery(cq.id, 'Updated')
        } else {
          await answerCallbackQuery(cq.id)
        }

        return NextResponse.json({ ok: true })
      }

      await answerCallbackQuery(cq.id)
      return NextResponse.json({ ok: true })
    }

    // --- Handle message updates ---
    const message = update.message
    if (!message) return NextResponse.json({ ok: true })

    const messageText = message.text
    if (messageText && messageText.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ ok: true })
    }

    const chatId = message.chat.id

    // /start with connection token
    if (messageText?.startsWith('/start')) {
      const token = messageText.split(' ')[1]

      if (token) {
        const { valid, profileId } = verifyConnectionToken(token)

        if (!valid || !profileId) {
          await sendMessage(chatId,
            '❌ <b>Link expired or invalid</b>\n\nGet a new link in the <b>Settings</b> section of the app.',
            { parseMode: 'HTML' }
          )
          return NextResponse.json({ ok: true })
        }

        const supabase = getSupabase()
        if (!supabase) return NextResponse.json({ ok: true })

        const { data: profile } = await supabase
          .from('profiles').select('id').eq('id', profileId).single()

        if (!profile) {
          await sendMessage(chatId,
            '❌ <b>Profile not found</b>\n\nGet a new link in the <b>Settings</b> section of the app.',
            { parseMode: 'HTML' }
          )
          return NextResponse.json({ ok: true })
        }

        const { data: existing } = await supabase
          .from('telegram_connections').select('id').eq('profile_id', profileId).single()

        if (existing) {
          await supabase.from('telegram_connections').update({
            telegram_user_id: message.from?.id,
            telegram_username: message.from?.username || null,
            chat_id: chatId,
            is_active: true,
            updated_at: new Date().toISOString(),
          }).eq('id', existing.id)

          await sendMessage(chatId,
            '✅ <b>Connection updated!</b>\n\nYour Hookah Torus account is linked to this chat.',
            { parseMode: 'HTML', replyMarkup: connectedKeyboard }
          )
        } else {
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

          await sendMessage(chatId,
            '🎉 <b>Connected!</b>\n\nYour Hookah Torus account is now linked to Telegram.\n\nYou will receive notifications about:\n• Low tobacco stock\n• Order updates\n\nConfigure notifications in <b>Settings</b>.',
            { parseMode: 'HTML', replyMarkup: connectedKeyboard }
          )
        }
      } else {
        await sendMessage(chatId,
          '👋 <b>Welcome to Hookah Torus Bot!</b>\n\nTo connect, use the link from <b>Settings</b> in the app.',
          { parseMode: 'HTML', replyMarkup: kbd([btn('❓ Help', 'cmd:help')]) }
        )
      }
    }

    // /status
    else if (messageText === '/status') {
      const supabase = getSupabase()
      if (!supabase) return NextResponse.json({ ok: true })

      const { text, keyboard } = await fetchStatusText(supabase, chatId)
      await sendMessage(chatId, text, { parseMode: 'HTML', replyMarkup: keyboard })
    }

    // /help
    else if (messageText === '/help') {
      await sendMessage(chatId,
        '📖 <b>Available commands:</b>\n\n' +
        '/start - Start or connect your account\n' +
        '/status - Connection status & settings\n' +
        '/report - Today\'s revenue report\n' +
        '/stock - Low stock alert\n' +
        '/shift - Current shift summary\n' +
        '/help - Show help',
        { parseMode: 'HTML', replyMarkup: helpKeyboard }
      )
    }

    // /report
    else if (messageText === '/report') {
      const supabase = getSupabase()
      if (!supabase) return NextResponse.json({ ok: true })
      const connection = await getConnection(supabase, chatId)
      if (!connection) {
        await sendMessage(chatId, '❌ Not connected. Use the link from app settings.', { parseMode: 'HTML' })
      } else {
        const text = await fetchReportText(supabase, connection.profile_id)
        await sendMessage(chatId, text, { parseMode: 'HTML', replyMarkup: reportKeyboard })
      }
    }

    // /stock
    else if (messageText === '/stock') {
      const supabase = getSupabase()
      if (!supabase) return NextResponse.json({ ok: true })
      const connection = await getConnection(supabase, chatId)
      if (!connection) {
        await sendMessage(chatId, '❌ Not connected. Use the link from app settings.', { parseMode: 'HTML' })
      } else {
        const text = await fetchStockText(supabase, connection.profile_id)
        await sendMessage(chatId, text, { parseMode: 'HTML', replyMarkup: stockKeyboard })
      }
    }

    // /shift
    else if (messageText === '/shift') {
      const supabase = getSupabase()
      if (!supabase) return NextResponse.json({ ok: true })
      const connection = await getConnection(supabase, chatId)
      if (!connection) {
        await sendMessage(chatId, '❌ Not connected. Use the link from app settings.', { parseMode: 'HTML' })
      } else {
        const text = await fetchShiftText(supabase, connection.profile_id)
        await sendMessage(chatId, text, { parseMode: 'HTML', replyMarkup: shiftKeyboard })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}

// Health check + register commands
let commandsRegistered = false
export async function GET() {
  if (!commandsRegistered) {
    await setMyCommands([
      { command: 'status', description: 'Connection status & settings' },
      { command: 'report', description: "Today's revenue report" },
      { command: 'stock', description: 'Low stock alert' },
      { command: 'shift', description: 'Current shift summary' },
      { command: 'help', description: 'Available commands' },
    ])
    commandsRegistered = true
  }
  return NextResponse.json({ status: 'ok' })
}
