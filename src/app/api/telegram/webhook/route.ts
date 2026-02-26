import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import {
  sendMessage, editMessageText, answerCallbackQuery, setMyCommands,
  verifyWebhookSecret, verifyConnectionToken,
  formatDailyReport, formatLowStockReport, formatShiftReport,
  kbd, btn, urlBtn,
} from '@/lib/telegram/bot'
import { checkRateLimit, getClientIp, rateLimits, rateLimitExceeded } from '@/lib/rateLimit'
import type { TelegramUpdate } from '@/lib/telegram/types'
import type { Session, BarSale, TobaccoInventory, Shift } from '@/types/database'
import { STRIPE_MESSAGE_MAX_LENGTH } from '@/lib/constants'

interface TelegramConnection {
  id: string
  profile_id: string
  telegram_user_id: number | null
  telegram_username: string | null
  chat_id: number
  is_active: boolean
  notifications_enabled: boolean
  low_stock_alerts: boolean
  session_reminders: boolean
  daily_summary: boolean
  updated_at: string
  profiles?: { business_name: string | null }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hookahtorus.com'

const MAX_MESSAGE_LENGTH = STRIPE_MESSAGE_MAX_LENGTH

function getSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createClient(supabaseUrl, supabaseServiceKey)
}

// --- Keyboards ---

const mainMenu = kbd(
  [btn('📊 Today\'s Report', 'cmd:report'), btn('📦 Stock Check', 'cmd:stock')],
  [btn('🕐 Shift Summary', 'cmd:shift'), btn('⚙️ Settings', 'cmd:status')],
  [urlBtn('🌐 Open App', appUrl)],
)

function statusKeyboard(conn: { low_stock_alerts: boolean; session_reminders: boolean; daily_summary: boolean }) {
  return kbd(
    [
      btn(`Low Stock: ${conn.low_stock_alerts ? '✅' : '❌'}`, 'toggle:low_stock_alerts'),
      btn(`Reminders: ${conn.session_reminders ? '✅' : '❌'}`, 'toggle:session_reminders'),
    ],
    [
      btn(`Daily Report: ${conn.daily_summary ? '✅' : '❌'}`, 'toggle:daily_summary'),
    ],
    [btn('🔄 Refresh', 'cmd:status'), btn('← Menu', 'cmd:menu')],
  )
}

const reportKeyboard = kbd(
  [btn('🔄 Refresh', 'cmd:report'), urlBtn('📊 Open in App', `${appUrl}/reports`)],
  [btn('← Menu', 'cmd:menu')],
)

const stockKeyboard = kbd(
  [btn('🔄 Refresh', 'cmd:stock'), urlBtn('📦 Open Inventory', `${appUrl}/inventory`)],
  [btn('← Menu', 'cmd:menu')],
)

const shiftKeyboard = kbd(
  [btn('🔄 Refresh', 'cmd:shift'), urlBtn('🕐 Open Shifts', `${appUrl}/shifts`)],
  [btn('← Menu', 'cmd:menu')],
)

// --- Main menu text ---

function mainMenuText(businessName: string) {
  return `🏠 <b>${businessName || 'Hookah Torus'}</b>\n\nChoose an action:`
}

// --- Data fetchers ---

async function getConnection(supabase: SupabaseClient, chatId: number): Promise<TelegramConnection | null> {
  const { data } = await supabase
    .from('telegram_connections')
    .select('id, profile_id, telegram_user_id, telegram_username, chat_id, is_active, notifications_enabled, low_stock_alerts, session_reminders, daily_summary, updated_at, profiles(business_name)')
    .eq('chat_id', chatId)
    .single()
  return data as TelegramConnection | null
}

async function fetchStatusText(supabase: SupabaseClient, chatId: number) {
  const connection = await getConnection(supabase, chatId)
  if (!connection) return { text: '❌ Not connected. Use the link from app settings.', keyboard: undefined, connection: null }

  const text = `⚙️ <b>Notification Settings</b>\n\n` +
    `Business: ${connection.profiles?.business_name || 'Not set'}\n\n` +
    `Toggle notifications with the buttons below:`

  return { text, keyboard: statusKeyboard(connection), connection }
}

async function fetchReportText(supabase: SupabaseClient, profileId: string) {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [sessionsRes, barRes] = await Promise.all([
    supabase.from('sessions').select('total_grams, selling_price')
      .eq('profile_id', profileId).gte('session_date', todayStart.toISOString()),
    supabase.from('bar_sales').select('total_revenue, total_cost, quantity')
      .eq('profile_id', profileId).gte('sold_at', todayStart.toISOString()),
  ])

  const s: Pick<Session, 'total_grams' | 'selling_price'>[] = sessionsRes.data || []
  const b: Pick<BarSale, 'total_revenue' | 'total_cost' | 'quantity'>[] = barRes.data || []
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

async function fetchStockText(supabase: SupabaseClient, profileId: string) {
  const settingsRes = await supabase
    .from('notification_settings').select('low_stock_threshold')
    .eq('profile_id', profileId).single()

  const threshold = (settingsRes.data as { low_stock_threshold: number } | null)?.low_stock_threshold || 50

  const invRes = await supabase
    .from('tobacco_inventory').select('brand, flavor, quantity_grams')
    .eq('profile_id', profileId).lte('quantity_grams', threshold)
    .order('quantity_grams', { ascending: true })

  const items: Pick<TobaccoInventory, 'brand' | 'flavor' | 'quantity_grams'>[] = invRes.data || []
  return formatLowStockReport(
    items.map(i => ({ brand: i.brand, flavor: i.flavor, quantity: i.quantity_grams, threshold }))
  )
}

async function fetchShiftText(supabase: SupabaseClient, profileId: string) {
  const shiftsRes = await supabase
    .from('shifts').select('id, profile_id, opened_by, opened_by_name, opened_at, closed_at, starting_cash, closing_cash, status')
    .eq('profile_id', profileId).order('opened_at', { ascending: false }).limit(1)

  const shift: Shift | undefined = (shiftsRes.data as Shift[] | null)?.[0]
  if (!shift) return formatShiftReport(null)

  const start = new Date(shift.opened_at)
  const end = shift.closed_at ? new Date(shift.closed_at) : new Date()

  const [sessionsRes, barRes] = await Promise.all([
    supabase.from('sessions').select('selling_price')
      .eq('profile_id', profileId)
      .gte('session_date', start.toISOString()).lte('session_date', end.toISOString()),
    supabase.from('bar_sales').select('total_revenue, quantity')
      .eq('profile_id', profileId)
      .gte('sold_at', start.toISOString()).lte('sold_at', end.toISOString()),
  ])

  const s: Pick<Session, 'selling_price'>[] = sessionsRes.data || []
  const b: Pick<BarSale, 'total_revenue' | 'quantity'>[] = barRes.data || []
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

// --- Send main menu ---

async function sendMainMenu(supabase: SupabaseClient, chatId: number) {
  const connection = await getConnection(supabase, chatId)
  if (connection) {
    await sendMessage(chatId, mainMenuText(connection.profiles?.business_name ?? ''), {
      parseMode: 'HTML', replyMarkup: mainMenu,
    })
  } else {
    await sendMessage(chatId,
      '👋 <b>Welcome to Hookah Torus Bot!</b>\n\nTo connect, use the link from <b>Settings</b> in the app.',
      { parseMode: 'HTML' }
    )
  }
}

// --- Webhook handler ---

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rateCheck = await checkRateLimit(`telegram:${ip}`, rateLimits.webhook)
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
        const statusText = `⚙️ <b>Notification Settings</b>\n\n` +
          `Business: ${updated.profiles?.business_name || 'Not set'}\n\n` +
          `Toggle notifications with the buttons below:`

        await editMessageText(chatId, messageId, statusText, {
          parseMode: 'HTML',
          replyMarkup: statusKeyboard(updated),
        })

        return NextResponse.json({ ok: true })
      }

      // Command buttons
      if (data.startsWith('cmd:')) {
        const cmd = data.slice(4)

        // Menu — send new message (not edit) so it's always at the bottom
        if (cmd === 'menu') {
          await answerCallbackQuery(cq.id)
          await sendMainMenu(supabase, chatId)
          return NextResponse.json({ ok: true })
        }

        const connection = await getConnection(supabase, chatId)

        if (!connection) {
          await answerCallbackQuery(cq.id, 'Not connected')
          return NextResponse.json({ ok: true })
        }

        if (cmd === 'status') {
          const { text, keyboard } = await fetchStatusText(supabase, chatId)
          await editMessageText(chatId, messageId, text, { parseMode: 'HTML', replyMarkup: keyboard })
          await answerCallbackQuery(cq.id)
        } else if (cmd === 'report') {
          const text = await fetchReportText(supabase, connection.profile_id)
          await editMessageText(chatId, messageId, text, { parseMode: 'HTML', replyMarkup: reportKeyboard })
          await answerCallbackQuery(cq.id)
        } else if (cmd === 'stock') {
          const text = await fetchStockText(supabase, connection.profile_id)
          await editMessageText(chatId, messageId, text, { parseMode: 'HTML', replyMarkup: stockKeyboard })
          await answerCallbackQuery(cq.id)
        } else if (cmd === 'shift') {
          const text = await fetchShiftText(supabase, connection.profile_id)
          await editMessageText(chatId, messageId, text, { parseMode: 'HTML', replyMarkup: shiftKeyboard })
          await answerCallbackQuery(cq.id)
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
    const supabase = getSupabase()

    // /start with connection token
    if (messageText?.startsWith('/start')) {
      const token = messageText.split(' ')[1]

      if (token) {
        const { valid, profileId } = verifyConnectionToken(token)

        if (!valid || !profileId) {
          await sendMessage(chatId,
            '❌ <b>Link expired or invalid</b>\n\nGet a new link in <b>Settings</b>.',
            { parseMode: 'HTML' }
          )
          return NextResponse.json({ ok: true })
        }

        if (!supabase) return NextResponse.json({ ok: true })

        const { data: profile } = await supabase
          .from('profiles').select('id, business_name').eq('id', profileId).single()

        if (!profile) {
          await sendMessage(chatId,
            '❌ <b>Profile not found</b>\n\nGet a new link in <b>Settings</b>.',
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
        }

        // Connected — show welcome + main menu
        await sendMessage(chatId,
          `🎉 <b>Connected to ${profile.business_name || 'Hookah Torus'}!</b>\n\nYou will receive notifications about low stock and order updates.\nConfigure in ⚙️ Settings below.`,
          { parseMode: 'HTML', replyMarkup: mainMenu }
        )
      } else {
        // /start without token — show menu if connected, welcome if not
        if (supabase) {
          await sendMainMenu(supabase, chatId)
        }
      }
    }

    // Slash commands → show main menu (commands still work via / autocomplete)
    else if (messageText === '/status' || messageText === '/report' || messageText === '/stock' || messageText === '/shift' || messageText === '/help') {
      if (!supabase) return NextResponse.json({ ok: true })
      const connection = await getConnection(supabase, chatId)
      if (!connection) {
        await sendMessage(chatId, '❌ Not connected. Use the link from app settings.', { parseMode: 'HTML' })
        return NextResponse.json({ ok: true })
      }

      if (messageText === '/status') {
        const { text, keyboard } = await fetchStatusText(supabase, chatId)
        await sendMessage(chatId, text, { parseMode: 'HTML', replyMarkup: keyboard })
      } else if (messageText === '/report') {
        const text = await fetchReportText(supabase, connection.profile_id)
        await sendMessage(chatId, text, { parseMode: 'HTML', replyMarkup: reportKeyboard })
      } else if (messageText === '/stock') {
        const text = await fetchStockText(supabase, connection.profile_id)
        await sendMessage(chatId, text, { parseMode: 'HTML', replyMarkup: stockKeyboard })
      } else if (messageText === '/shift') {
        const text = await fetchShiftText(supabase, connection.profile_id)
        await sendMessage(chatId, text, { parseMode: 'HTML', replyMarkup: shiftKeyboard })
      } else if (messageText === '/help') {
        await sendMainMenu(supabase, chatId)
      }
    }

    // Any other text → show main menu
    else if (messageText && supabase) {
      await sendMainMenu(supabase, chatId)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}

// Health check + register commands (requires webhook secret)
let commandsRegistered = false
export async function GET(request: NextRequest) {
  const secretHeader = request.headers.get('x-telegram-bot-api-secret-token')
  if (!verifyWebhookSecret(secretHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!commandsRegistered) {
    await setMyCommands([
      { command: 'start', description: 'Main menu' },
      { command: 'status', description: 'Notification settings' },
      { command: 'report', description: "Today's revenue report" },
      { command: 'stock', description: 'Low stock alert' },
      { command: 'shift', description: 'Current shift summary' },
    ])
    commandsRegistered = true
  }
  return NextResponse.json({ status: 'ok' })
}
