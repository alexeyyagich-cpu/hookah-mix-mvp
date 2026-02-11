import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendMessage } from '@/lib/telegram/bot'
import type { TelegramUpdate } from '@/lib/telegram/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json()

    // Handle /start command with connection token
    if (update.message?.text?.startsWith('/start')) {
      const token = update.message.text.split(' ')[1]

      if (token) {
        // Decode the connection token
        try {
          const decoded = Buffer.from(token, 'base64url').toString()
          const [profileId] = decoded.split(':')

          if (profileId && supabaseUrl && supabaseServiceKey) {
            const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
                  telegram_user_id: update.message.from?.id,
                  telegram_username: update.message.from?.username || null,
                  chat_id: update.message.chat.id,
                  is_active: true,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id)

              await sendMessage(
                update.message.chat.id,
                '✅ <b>Подключение обновлено!</b>\n\nВаш аккаунт Hookah Torus привязан к этому чату. Вы будете получать уведомления.',
                { parseMode: 'HTML' }
              )
            } else {
              // Create new connection
              await supabase.from('telegram_connections').insert({
                profile_id: profileId,
                telegram_user_id: update.message.from?.id,
                telegram_username: update.message.from?.username || null,
                chat_id: update.message.chat.id,
                is_active: true,
                notifications_enabled: true,
                low_stock_alerts: true,
                session_reminders: false,
                daily_summary: false,
              })

              await sendMessage(
                update.message.chat.id,
                '🎉 <b>Подключено!</b>\n\nВаш аккаунт Hookah Torus успешно привязан к Telegram.\n\nТеперь вы будете получать уведомления о:\n• Низком запасе табака\n• Обновлениях заказов\n\nНастройте уведомления в разделе <b>Настройки</b> приложения.',
                { parseMode: 'HTML' }
              )
            }
          }
        } catch (e) {
          console.error('Failed to decode connection token:', e)
        }
      } else {
        // Start without token - just welcome message
        await sendMessage(
          update.message.chat.id,
          '👋 <b>Добро пожаловать в Hookah Torus Bot!</b>\n\nЧтобы подключить бота к вашему аккаунту, используйте ссылку из раздела <b>Настройки</b> в приложении.',
          { parseMode: 'HTML' }
        )
      }
    }

    // Handle /status command
    if (update.message?.text === '/status') {
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const { data: connection } = await supabase
          .from('telegram_connections')
          .select('*, profiles(business_name)')
          .eq('chat_id', update.message.chat.id)
          .single()

        if (connection) {
          await sendMessage(
            update.message.chat.id,
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
            update.message.chat.id,
            '❌ Telegram не подключён к аккаунту Hookah Torus.\n\nИспользуйте ссылку из настроек приложения для подключения.',
            { parseMode: 'HTML' }
          )
        }
      }
    }

    // Handle /help command
    if (update.message?.text === '/help') {
      await sendMessage(
        update.message.chat.id,
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

// Verify webhook with GET request
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    bot: 'Hookah Torus Bot',
    configured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
  })
}
