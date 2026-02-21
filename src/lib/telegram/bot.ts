// Telegram Bot Client

import { createHmac } from 'crypto'
import type { TelegramNotification } from './types'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET
const TELEGRAM_API_URL = 'https://api.telegram.org/bot'

export const isTelegramConfigured = Boolean(TELEGRAM_BOT_TOKEN)
export const webhookSecretConfigured = Boolean(TELEGRAM_WEBHOOK_SECRET)

// Verify webhook request is from Telegram
export function verifyWebhookSecret(secretHeader: string | null): boolean {
  if (!TELEGRAM_WEBHOOK_SECRET) {
    // Fail closed: reject all requests when secret is not configured
    return false
  }
  return secretHeader === TELEGRAM_WEBHOOK_SECRET
}

// Compact binary token: 16-byte UUID + 4-byte timestamp (seconds) + 8-byte HMAC = 28 bytes → 38 chars base64url
// Telegram deep link start param is limited to 64 chars

function signTokenData(data: Buffer): Buffer {
  const secret = TELEGRAM_WEBHOOK_SECRET || TELEGRAM_BOT_TOKEN || 'default-secret'
  return createHmac('sha256', secret).update(data).digest().subarray(0, 8)
}

function uuidToBytes(uuid: string): Buffer {
  return Buffer.from(uuid.replace(/-/g, ''), 'hex')
}

function bytesToUuid(buf: Buffer): string {
  const hex = buf.toString('hex')
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`
}

// Verify connection token signature
export function verifyConnectionToken(token: string): { valid: boolean; profileId: string | null } {
  try {
    const buf = Buffer.from(token, 'base64url')

    if (buf.length !== 28) {
      return { valid: false, profileId: null }
    }

    const uuidBuf = buf.subarray(0, 16)
    const tsBuf = buf.subarray(16, 20)
    const sigBuf = buf.subarray(20, 28)

    // Check timestamp - token valid for 1 hour
    const tokenTimeSec = tsBuf.readUInt32BE(0)
    const nowSec = Math.floor(Date.now() / 1000)
    if (nowSec - tokenTimeSec > 3600) {
      return { valid: false, profileId: null }
    }

    // Verify HMAC
    const dataBuf = buf.subarray(0, 20)
    const expectedSig = signTokenData(dataBuf)
    if (!sigBuf.equals(expectedSig)) {
      return { valid: false, profileId: null }
    }

    return { valid: true, profileId: bytesToUuid(uuidBuf) }
  } catch {
    return { valid: false, profileId: null }
  }
}

async function callTelegramApi<T>(method: string, params: Record<string, unknown> = {}): Promise<T | null> {
  if (!TELEGRAM_BOT_TOKEN) {
    // Telegram bot token not configured
    return null
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}${TELEGRAM_BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    const data = await response.json()

    if (!data.ok) {
      console.error('Telegram API error:', data.description)
      return null
    }

    return data.result as T
  } catch (error) {
    console.error('Telegram API request failed:', error)
    return null
  }
}

export async function sendMessage(
  chatId: number,
  text: string,
  options: {
    parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'
    replyMarkup?: unknown
  } = {}
) {
  return callTelegramApi<{ message_id: number }>('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: options.parseMode,
    reply_markup: options.replyMarkup,
  })
}

export async function sendNotification(notification: TelegramNotification) {
  return sendMessage(notification.chatId, notification.message, {
    parseMode: notification.parseMode || 'HTML',
  })
}

// Notification formatters

export function formatLowStockAlert(items: { brand: string; flavor: string; quantity: number }[]): string {
  const lines = items.map(item => `• ${item.brand} ${item.flavor}: ${item.quantity}g`)
  return `
<b>⚠️ Low Tobacco Stock</b>

The following items are running low:

${lines.join('\n')}

<a href="${process.env.NEXT_PUBLIC_APP_URL}/inventory">Open Inventory</a>
  `.trim()
}

export function formatSessionReminder(tableNames: string[], duration: number): string {
  return `
<b>⏰ Session Reminder</b>

Tables ${tableNames.join(', ')} have been occupied for over ${duration} minutes.

<a href="${process.env.NEXT_PUBLIC_APP_URL}/floor">Open Floor Plan</a>
  `.trim()
}

export function formatOrderStatusUpdate(
  orderNumber: string,
  status: string,
  supplierName: string
): string {
  const statusEmoji: Record<string, string> = {
    pending: '🕐',
    confirmed: '✅',
    shipped: '🚚',
    delivered: '📦',
    cancelled: '❌',
  }

  return `
<b>${statusEmoji[status] || '📋'} Order Update</b>

Order: ${orderNumber}
Supplier: ${supplierName}
Status: ${status}

<a href="${process.env.NEXT_PUBLIC_APP_URL}/marketplace/orders">View Orders</a>
  `.trim()
}

export function formatDailySummary(stats: {
  sessionsToday: number
  tobaccoUsed: number
  lowStockCount: number
  revenue?: number
}): string {
  return `
<b>📊 Daily Report</b>

• Sessions today: ${stats.sessionsToday}
• Tobacco used: ${stats.tobaccoUsed}g
• Low stock items: ${stats.lowStockCount}
${stats.revenue ? `• Revenue: €${stats.revenue.toFixed(2)}` : ''}

<a href="${process.env.NEXT_PUBLIC_APP_URL}/statistics">Detailed Statistics</a>
  `.trim()
}

// Report formatters for bot commands

export function formatDailyReport(data: {
  sessions: number
  tobaccoGrams: number
  hookahRevenue: number
  barSales: number
  barRevenue: number
  totalRevenue: number
  totalCost: number
  profit: number
}): string {
  return `
<b>📊 Today's Report</b>

<b>Hookah</b>
• Sessions: ${data.sessions}
• Tobacco used: ${data.tobaccoGrams}g
• Revenue: €${data.hookahRevenue.toFixed(2)}

<b>Bar</b>
• Sales: ${data.barSales}
• Revenue: €${data.barRevenue.toFixed(2)}

<b>Totals</b>
• Revenue: €${data.totalRevenue.toFixed(2)}
• Cost: €${data.totalCost.toFixed(2)}
• Profit: €${data.profit.toFixed(2)}

<a href="${process.env.NEXT_PUBLIC_APP_URL}/reports">Full P&L Report</a>
  `.trim()
}

export function formatLowStockReport(items: { brand: string; flavor: string; quantity: number; threshold: number }[]): string {
  if (items.length === 0) {
    return '✅ <b>All stock levels are OK</b>\n\nNo items below threshold.'
  }

  const lines = items.map(item =>
    `• ${item.brand} ${item.flavor}: <b>${item.quantity}g</b> (threshold: ${item.threshold}g)`
  )
  return `
<b>📦 Low Stock Report</b>

${items.length} item(s) below threshold:

${lines.join('\n')}

<a href="${process.env.NEXT_PUBLIC_APP_URL}/inventory">Open Inventory</a>
  `.trim()
}

export function formatShiftReport(shift: {
  staffName: string | null
  openedAt: string
  closedAt: string | null
  sessions: number
  barSales: number
  hookahRevenue: number
  barRevenue: number
  totalRevenue: number
} | null): string {
  if (!shift) {
    return '💤 <b>No active or recent shift</b>\n\nOpen a shift in the app to start tracking.'
  }

  const status = shift.closedAt ? '✅ Closed' : '🟢 Active'
  const duration = shift.closedAt
    ? Math.round((new Date(shift.closedAt).getTime() - new Date(shift.openedAt).getTime()) / 3600000 * 10) / 10
    : Math.round((Date.now() - new Date(shift.openedAt).getTime()) / 3600000 * 10) / 10

  return `
<b>🕐 Shift Summary</b>

Status: ${status}
${shift.staffName ? `Staff: ${shift.staffName}` : ''}
Duration: ${duration}h

• Hookah sessions: ${shift.sessions}
• Bar sales: ${shift.barSales}
• Hookah revenue: €${shift.hookahRevenue.toFixed(2)}
• Bar revenue: €${shift.barRevenue.toFixed(2)}
• Total revenue: €${shift.totalRevenue.toFixed(2)}

<a href="${process.env.NEXT_PUBLIC_APP_URL}/shifts">Open Shifts</a>
  `.trim()
}

// Generate deep link for connecting Telegram
export function generateConnectLink(profileId: string): string {
  if (!TELEGRAM_BOT_TOKEN) return ''

  const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'hookah_torus_bot'

  // Compact binary token: UUID (16) + timestamp_sec (4) + HMAC (8) = 28 bytes → 38 chars base64url
  const uuidBuf = uuidToBytes(profileId)
  const tsBuf = Buffer.alloc(4)
  tsBuf.writeUInt32BE(Math.floor(Date.now() / 1000), 0)
  const dataBuf = Buffer.concat([uuidBuf, tsBuf])
  const sigBuf = signTokenData(dataBuf)
  const token = Buffer.concat([dataBuf, sigBuf]).toString('base64url')

  return `https://t.me/${botUsername}?start=${token}`
}
