import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendMessage, verifyWebhookSecret, verifyConnectionToken } from '@/lib/telegram/bot'
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
            '❌ <b>Ссылка устарела или недействительна</b>\n\nПолучите новую ссылку в разделе <b>Настройки</b> приложения.',
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
              '❌ <b>Профиль не найден</b>\n\nПолучите новую ссылку в разделе <b>Настройки</b> приложения.',
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
              '✅ <b>Подключение обновлено!</b>\n\nВаш аккаунт Hookah Torus привязан к этому чату. Вы будете получать уведомления.',
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
              '🎉 <b>Подключено!</b>\n\nВаш аккаунт Hookah Torus успешно привязан к Telegram.\n\nТеперь вы будете получать уведомления о:\n• Низком запасе табака\n• Обновлениях заказов\n\nНастройте уведомления в разделе <b>Настройки</b> приложения.',
              { parseMode: 'HTML' }
            )
          }
        }
      } else {
        // Start without token - just welcome message
        await sendMessage(
          chatId,
          '👋 <b>Добро пожаловать в Hookah Torus Bot!</b>\n\nЧтобы подключить бота к вашему аккаунту, используйте ссылку из раздела <b>Настройки</b> в приложении.',
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
            `📊 <b>Статус подключения</b>\n\n` +
            `Заведение: ${connection.profiles?.business_name || 'Не указано'}\n` +
            `Уведомления: ${connection.notifications_enabled ? '✅' : '❌'}\n` +
            `Низкий запас: ${connection.low_stock_alerts ? '✅' : '❌'}\n` +
            `Напоминания: ${connection.session_reminders ? '✅' : '❌'}\n` +
            `Ежедневный отчёт: ${connection.daily_summary ? '✅' : '❌'}`,
            { parseMode: 'HTML' }
          )
        } else {
          await sendMessage(
            chatId,
            '❌ Telegram не подключён к аккаунту Hookah Torus.\n\nИспользуйте ссылку из настроек приложения для подключения.',
            { parseMode: 'HTML' }
          )
        }
      }
    }

    // Handle /help command
    if (messageText === '/help') {
      await sendMessage(
        chatId,
        '📖 <b>Доступные команды:</b>\n\n' +
        '/start - Начать или подключить аккаунт\n' +
        '/status - Проверить статус подключения\n' +
        '/help - Показать справку\n\n' +
        'Настройте уведомления в разделе <b>Настройки → Telegram</b> в приложении.',
        { parseMode: 'HTML' }
      )
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
