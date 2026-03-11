import { NextRequest, NextResponse } from 'next/server'
import { sendMessage } from '@/lib/telegram/bot'
import { logger } from '@/lib/logger'

const ADMIN_TELEGRAM_CHAT_ID = process.env.ADMIN_TELEGRAM_CHAT_ID
  ? Number(process.env.ADMIN_TELEGRAM_CHAT_ID)
  : null

export async function POST(request: NextRequest) {
  if (!ADMIN_TELEGRAM_CHAT_ID) {
    return NextResponse.json({ ok: true })
  }

  try {
    const { email, businessName, ownerName } = await request.json()

    const text = [
      '<b>🆕 Новая регистрация!</b>',
      '',
      `📧 <b>Email:</b> ${escapeHtml(email || '—')}`,
      `🏢 <b>Заведение:</b> ${escapeHtml(businessName || '—')}`,
      `👤 <b>Владелец:</b> ${escapeHtml(ownerName || '—')}`,
      '',
      `🕐 ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}`,
    ].join('\n')

    await sendMessage(ADMIN_TELEGRAM_CHAT_ID, text, { parseMode: 'HTML' })
  } catch (error) {
    logger.error('Failed to send signup notification', { error: String(error) })
  }

  // Always return OK — notification failure should not block registration
  return NextResponse.json({ ok: true })
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
