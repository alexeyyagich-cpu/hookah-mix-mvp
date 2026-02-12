import { Resend } from 'resend'

// Initialize Resend client
const resendApiKey = process.env.RESEND_API_KEY
export const resend = resendApiKey ? new Resend(resendApiKey) : null

export const isEmailConfigured = Boolean(resendApiKey)

// Email sender
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Hookah Torus <noreply@hookah-torus.com>'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    // Resend not configured, email not sent
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Email send error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Failed to send email' }
  }
}

// Low stock alert email
interface LowStockItem {
  brand: string
  flavor: string
  quantity: number
  threshold: number
}

export function generateLowStockEmailHtml(items: LowStockItem[], businessName: string): string {
  const itemsHtml = items
    .map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.brand}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.flavor}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; color: ${item.quantity <= 0 ? '#ef4444' : '#f59e0b'};">
          ${item.quantity.toFixed(0)}г
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.threshold}г</td>
      </tr>
    `)
    .join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #ff6b35, #ff8c42); padding: 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">Hookah Torus</h1>
        </div>
        <div style="padding: 24px;">
          <h2 style="color: #333; margin: 0 0 8px;">Низкий запас табака</h2>
          <p style="color: #666; margin: 0 0 24px;">
            ${businessName} — ${items.length} позиций требуют внимания
          </p>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background: #f8f8f8;">
                <th style="padding: 12px; text-align: left; font-weight: 600;">Бренд</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Вкус</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Остаток</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Порог</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://hookah-torus.com'}/inventory"
               style="display: inline-block; background: #ff6b35; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Открыть инвентарь
            </a>
          </div>
        </div>
        <div style="background: #f8f8f8; padding: 16px; text-align: center; color: #999; font-size: 12px;">
          Hookah Torus — Управление кальянным бизнесом
        </div>
      </div>
    </body>
    </html>
  `
}

// Order status update email
interface OrderStatusEmailData {
  orderNumber: string
  status: string
  statusText: string
  supplierName: string
  total: number
  estimatedDelivery?: string
}

export function generateOrderStatusEmailHtml(data: OrderStatusEmailData, businessName: string): string {
  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    shipped: '#8b5cf6',
    delivered: '#22c55e',
    cancelled: '#ef4444',
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #ff6b35, #ff8c42); padding: 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">Hookah Torus</h1>
        </div>
        <div style="padding: 24px;">
          <h2 style="color: #333; margin: 0 0 8px;">Обновление заказа</h2>
          <p style="color: #666; margin: 0 0 24px;">${businessName}</p>

          <div style="background: #f8f8f8; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #666;">Заказ:</span>
              <span style="font-weight: 600;">${data.orderNumber}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #666;">Поставщик:</span>
              <span style="font-weight: 600;">${data.supplierName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #666;">Сумма:</span>
              <span style="font-weight: 600;">${data.total.toFixed(2)} €</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #666;">Статус:</span>
              <span style="background: ${statusColors[data.status] || '#666'}; color: #fff; padding: 4px 12px; border-radius: 4px; font-weight: 600; font-size: 14px;">
                ${data.statusText}
              </span>
            </div>
            ${data.estimatedDelivery ? `
            <div style="display: flex; justify-content: space-between; margin-top: 12px;">
              <span style="color: #666;">Доставка:</span>
              <span style="font-weight: 600;">${data.estimatedDelivery}</span>
            </div>
            ` : ''}
          </div>

          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://hookah-torus.com'}/marketplace/orders"
               style="display: inline-block; background: #ff6b35; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Посмотреть заказы
            </a>
          </div>
        </div>
        <div style="background: #f8f8f8; padding: 16px; text-align: center; color: #999; font-size: 12px;">
          Hookah Torus — Управление кальянным бизнесом
        </div>
      </div>
    </body>
    </html>
  `
}

// Daily summary email
interface DailySummaryData {
  sessionsCount: number
  totalGramsUsed: number
  lowStockCount: number
  topFlavor?: string
  revenue?: number
}

export function generateDailySummaryEmailHtml(data: DailySummaryData, businessName: string, date: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #ff6b35, #ff8c42); padding: 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">Hookah Torus</h1>
        </div>
        <div style="padding: 24px;">
          <h2 style="color: #333; margin: 0 0 8px;">Дневной отчёт</h2>
          <p style="color: #666; margin: 0 0 24px;">
            ${businessName} — ${date}
          </p>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
            <div style="background: #f0f9ff; border-radius: 8px; padding: 16px; text-align: center;">
              <div style="font-size: 28px; font-weight: 700; color: #3b82f6;">${data.sessionsCount}</div>
              <div style="color: #666; font-size: 14px;">Сессий</div>
            </div>
            <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; text-align: center;">
              <div style="font-size: 28px; font-weight: 700; color: #22c55e;">${data.totalGramsUsed}г</div>
              <div style="color: #666; font-size: 14px;">Расход</div>
            </div>
            ${data.lowStockCount > 0 ? `
            <div style="background: #fef3c7; border-radius: 8px; padding: 16px; text-align: center;">
              <div style="font-size: 28px; font-weight: 700; color: #f59e0b;">${data.lowStockCount}</div>
              <div style="color: #666; font-size: 14px;">Мало на складе</div>
            </div>
            ` : ''}
            ${data.topFlavor ? `
            <div style="background: #faf5ff; border-radius: 8px; padding: 16px; text-align: center;">
              <div style="font-size: 18px; font-weight: 700; color: #8b5cf6;">${data.topFlavor}</div>
              <div style="color: #666; font-size: 14px;">Топ вкус</div>
            </div>
            ` : ''}
          </div>

          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://hookah-torus.com'}/dashboard"
               style="display: inline-block; background: #ff6b35; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Открыть дашборд
            </a>
          </div>
        </div>
        <div style="background: #f8f8f8; padding: 16px; text-align: center; color: #999; font-size: 12px;">
          Hookah Torus — Управление кальянным бизнесом
        </div>
      </div>
    </body>
    </html>
  `
}

// Welcome email for new users
export function generateWelcomeEmailHtml(ownerName: string, businessName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #ff6b35, #ff8c42); padding: 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 28px;">Добро пожаловать в Hookah Torus!</h1>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 18px; color: #333; margin: 0 0 16px;">
            Привет, ${ownerName || 'Владелец'}!
          </p>
          <p style="color: #666; margin: 0 0 24px; line-height: 1.6;">
            Мы рады, что ${businessName || 'ваше заведение'} теперь с нами. Hookah Torus поможет вам:
          </p>

          <div style="margin-bottom: 24px;">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <span style="background: #ff6b35; color: #fff; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px;">📊</span>
              <span style="color: #333;">Вести учёт табака и инвентаря</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <span style="background: #ff6b35; color: #fff; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px;">🧮</span>
              <span style="color: #333;">Создавать идеальные миксы</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <span style="background: #ff6b35; color: #fff; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px;">👥</span>
              <span style="color: #333;">Запоминать предпочтения гостей</span>
            </div>
            <div style="display: flex; align-items: center;">
              <span style="background: #ff6b35; color: #fff; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px;">📈</span>
              <span style="color: #333;">Анализировать статистику</span>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://hookah-torus.com'}/onboarding"
               style="display: inline-block; background: #ff6b35; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Начать настройку
            </a>
          </div>
        </div>
        <div style="background: #f8f8f8; padding: 16px; text-align: center; color: #999; font-size: 12px;">
          Hookah Torus — Управление кальянным бизнесом
        </div>
      </div>
    </body>
    </html>
  `
}
