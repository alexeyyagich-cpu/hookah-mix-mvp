// Telegram Bot Client

import type { TelegramNotification } from './types'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_API_URL = 'https://api.telegram.org/bot'

export const isTelegramConfigured = Boolean(TELEGRAM_BOT_TOKEN)

async function callTelegramApi<T>(method: string, params: Record<string, unknown> = {}): Promise<T | null> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('Telegram bot token not configured')
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
  const lines = items.map(item => `• ${item.brand} ${item.flavor}: ${item.quantity}г`)
  return `
<b>⚠️ Низкий запас табака</b>

Следующие позиции заканчиваются:

${lines.join('\n')}

<a href="${process.env.NEXT_PUBLIC_APP_URL}/inventory">Открыть инвентарь</a>
  `.trim()
}

export function formatSessionReminder(tableNames: string[], duration: number): string {
  return `
<b>⏰ Напоминание о сессиях</b>

Столы ${tableNames.join(', ')} заняты более ${duration} минут.

<a href="${process.env.NEXT_PUBLIC_APP_URL}/floor">Открыть план зала</a>
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
<b>${statusEmoji[status] || '📋'} Обновление заказа</b>

Заказ: ${orderNumber}
Поставщик: ${supplierName}
Статус: ${status}

<a href="${process.env.NEXT_PUBLIC_APP_URL}/marketplace/orders">Открыть заказы</a>
  `.trim()
}

export function formatDailySummary(stats: {
  sessionsToday: number
  tobaccoUsed: number
  lowStockCount: number
  revenue?: number
}): string {
  return `
<b>📊 Ежедневный отчёт</b>

• Сессий сегодня: ${stats.sessionsToday}
• Использовано табака: ${stats.tobaccoUsed}г
• Позиций с низким запасом: ${stats.lowStockCount}
${stats.revenue ? `• Выручка: €${stats.revenue.toFixed(2)}` : ''}

<a href="${process.env.NEXT_PUBLIC_APP_URL}/statistics">Подробная статистика</a>
  `.trim()
}

// Generate deep link for connecting Telegram
export function generateConnectLink(profileId: string): string {
  if (!TELEGRAM_BOT_TOKEN) return ''

  // Extract bot username from token (first part before :)
  // In production, you'd have the bot username in env vars
  const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'hookah_torus_bot'

  // Create a unique connection token
  const token = Buffer.from(`${profileId}:${Date.now()}`).toString('base64url')

  return `https://t.me/${botUsername}?start=${token}`
}
