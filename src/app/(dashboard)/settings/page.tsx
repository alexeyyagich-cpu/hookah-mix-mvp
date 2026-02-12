'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { useNotificationSettings } from '@/lib/hooks/useNotificationSettings'
import { usePushNotifications } from '@/lib/hooks/usePushNotifications'
import { useTelegram } from '@/lib/hooks/useTelegram'
import { useEmailSettings } from '@/lib/hooks/useEmailSettings'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SettingsPage() {
  const { user, profile, refreshProfile, signOut, isDemoMode } = useAuth()
  const { tier, isExpired, daysUntilExpiry } = useSubscription()
  const { settings: notificationSettings, updateSettings: updateNotificationSettings } = useNotificationSettings()
  const { isSupported: pushSupported, isSubscribed: pushSubscribed, permission: pushPermission, loading: pushLoading, subscribe: subscribePush, unsubscribe: unsubscribePush } = usePushNotifications()
  const { connection: telegramConnection, loading: telegramLoading, connectLink: telegramConnectLink, updateSettings: updateTelegramSettings, disconnect: disconnectTelegram } = useTelegram()
  const { settings: emailSettings, loading: emailLoading, isConfigured: emailConfigured, updateSettings: updateEmailSettings } = useEmailSettings()
  const supabase = createClient()

  const [businessName, setBusinessName] = useState(profile?.business_name || '')
  const [ownerName, setOwnerName] = useState(profile?.owner_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [address, setAddress] = useState(profile?.address || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [portalLoading, setPortalLoading] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('profiles')
      .update({
        business_name: businessName || null,
        owner_name: ownerName || null,
        phone: phone || null,
        address: address || null,
      })
      .eq('id', user.id)

    if (error) {
      setMessage('Ошибка сохранения: ' + error.message)
    } else {
      setMessage('Настройки сохранены!')
      await refreshProfile()
    }

    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Вы уверены? Все данные будут удалены безвозвратно.')) return
    if (!confirm('Это действие нельзя отменить. Продолжить?')) return

    // In production, this would call an API to delete the account
    await signOut()
  }

  const handleManageSubscription = async () => {
    if (!user || isDemoMode) return

    setPortalLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setMessage('Ошибка: ' + (data.error || 'Не удалось открыть портал'))
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      void error
      setMessage('Ошибка при открытии портала подписки')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setPortalLoading(false)
    }
  }

  const hasActiveSubscription = profile?.stripe_subscription_id && tier !== 'free'

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Настройки</h1>
        <p className="text-[var(--color-textMuted)]">
          Управление профилем и подпиской
        </p>
      </div>

      {/* Subscription Status */}
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1">Подписка</h2>
            <div className="flex items-center gap-2">
              <span className={`badge ${tier === 'free' ? 'badge-warning' : 'badge-success'}`}>
                {tier.toUpperCase()}
              </span>
              {isExpired && (
                <span className="badge badge-danger">Истекла</span>
              )}
              {daysUntilExpiry !== null && daysUntilExpiry <= 7 && !isExpired && (
                <span className="text-sm text-[var(--color-warning)]">
                  Истекает через {daysUntilExpiry} дн.
                </span>
              )}
            </div>
            {tier === 'free' && (
              <p className="text-sm text-[var(--color-textMuted)] mt-2">
                Обновите подписку для доступа к полному функционалу
              </p>
            )}
            {hasActiveSubscription && (
              <p className="text-sm text-[var(--color-textMuted)] mt-2">
                Управляйте подпиской, измените тариф или отмените
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {hasActiveSubscription ? (
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="btn btn-primary disabled:opacity-50"
              >
                {portalLoading ? 'Загрузка...' : 'Управление'}
              </button>
            ) : (
              <Link href="/pricing" className="btn btn-primary">
                {tier === 'free' ? 'Обновить' : 'Изменить тариф'}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="card p-6 space-y-5">
        <h2 className="text-lg font-semibold">Профиль заведения</h2>

        {message && (
          <div className={`p-4 rounded-lg ${
            message.includes('Ошибка')
              ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
              : 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] text-[var(--color-textMuted)] cursor-not-allowed"
          />
          <p className="text-xs text-[var(--color-textMuted)]">
            Email нельзя изменить
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Название заведения</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
              placeholder="Lounge Bar"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Имя владельца</label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
              placeholder="Иван Петров"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Телефон</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Адрес</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
            placeholder="123 Main Street, New York"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary disabled:opacity-50"
        >
          {saving ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </form>

      {/* Notification Settings */}
      <div className="card p-6 space-y-5">
        <h2 className="text-lg font-semibold">Уведомления</h2>

        <div className="space-y-4">
          {/* Low Stock Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Уведомления о низком остатке</h3>
              <p className="text-sm text-[var(--color-textMuted)]">
                Показывать уведомления при входе, если табак заканчивается
              </p>
            </div>
            <button
              onClick={() => updateNotificationSettings({
                low_stock_enabled: !notificationSettings?.low_stock_enabled
              })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                notificationSettings?.low_stock_enabled
                  ? 'bg-[var(--color-primary)]'
                  : 'bg-[var(--color-border)]'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  notificationSettings?.low_stock_enabled ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Threshold Slider */}
          <div className={notificationSettings?.low_stock_enabled ? '' : 'opacity-50 pointer-events-none'}>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Порог предупреждения</label>
              <span className="text-sm font-bold text-[var(--color-primary)]">
                {notificationSettings?.low_stock_threshold || 50}г
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={200}
              step={10}
              value={notificationSettings?.low_stock_threshold || 50}
              onChange={(e) => updateNotificationSettings({
                low_stock_threshold: parseInt(e.target.value)
              })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[var(--color-textMuted)] mt-1">
              <span>10г</span>
              <span>200г</span>
            </div>
          </div>

          {/* Push Notifications */}
          {pushSupported && (
            <>
              <hr className="border-[var(--color-border)]" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Push-уведомления</h3>
                  <p className="text-sm text-[var(--color-textMuted)]">
                    {pushPermission === 'denied'
                      ? 'Уведомления заблокированы в браузере'
                      : 'Получать уведомления даже когда сайт закрыт'}
                  </p>
                </div>
                <button
                  onClick={() => pushSubscribed ? unsubscribePush() : subscribePush()}
                  disabled={pushLoading || pushPermission === 'denied'}
                  className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${
                    pushSubscribed
                      ? 'bg-[var(--color-primary)]'
                      : 'bg-[var(--color-border)]'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      pushSubscribed ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
              {pushSubscribed && (
                <p className="text-xs text-[var(--color-success)] flex items-center gap-1">
                  <span>✓</span> Push-уведомления включены
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Email Notifications */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Email-уведомления</h2>
            <p className="text-sm text-[var(--color-textMuted)]">
              Получайте важные уведомления на почту
            </p>
          </div>
        </div>

        {emailLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !emailConfigured ? (
          <p className="text-sm text-[var(--color-textMuted)] italic">
            Email-сервис не настроен. Добавьте RESEND_API_KEY в переменные окружения.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Master toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Email-уведомления</h3>
                <p className="text-sm text-[var(--color-textMuted)]">
                  Включить отправку уведомлений на {user?.email}
                </p>
              </div>
              <button
                onClick={() => updateEmailSettings({
                  email_notifications_enabled: !emailSettings?.email_notifications_enabled
                })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  emailSettings?.email_notifications_enabled
                    ? 'bg-[var(--color-primary)]'
                    : 'bg-[var(--color-border)]'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    emailSettings?.email_notifications_enabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Individual toggles */}
            <div className={emailSettings?.email_notifications_enabled ? 'space-y-3 pt-2' : 'space-y-3 pt-2 opacity-50 pointer-events-none'}>
              <div className="flex items-center justify-between">
                <span className="text-sm">Низкий запас табака</span>
                <button
                  onClick={() => updateEmailSettings({
                    low_stock_email: !emailSettings?.low_stock_email
                  })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    emailSettings?.low_stock_email ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    emailSettings?.low_stock_email ? 'left-5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Обновления заказов</span>
                <button
                  onClick={() => updateEmailSettings({
                    order_updates_email: !emailSettings?.order_updates_email
                  })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    emailSettings?.order_updates_email ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    emailSettings?.order_updates_email ? 'left-5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Ежедневный отчёт</span>
                <button
                  onClick={() => updateEmailSettings({
                    daily_summary_email: !emailSettings?.daily_summary_email
                  })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    emailSettings?.daily_summary_email ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    emailSettings?.daily_summary_email ? 'left-5' : 'left-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Telegram Integration */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0088cc] flex items-center justify-center">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-3.083 11.783-3.083 11.783-.145.58-.515.748-.845.748-.511 0-.753-.342-1.258-.788l-3.255-2.548-.961.926c-.144.138-.264.254-.529.254-.294 0-.345-.108-.483-.365l-1.088-3.575-3.13-.972c-.567-.164-.575-.565.152-.851l12.178-4.688c.467-.182.9.114.751.676z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Telegram</h2>
            <p className="text-sm text-[var(--color-textMuted)]">
              Получайте уведомления в Telegram
            </p>
          </div>
        </div>

        {telegramLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : telegramConnection ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-success)]/10">
              <span className="text-[var(--color-success)]">✓</span>
              <span className="text-sm">
                Подключён как <strong>@{telegramConnection.telegram_username || telegramConnection.telegram_user_id}</strong>
              </span>
            </div>

            {/* Notification toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Уведомления о низком остатке</span>
                <button
                  onClick={() => updateTelegramSettings({
                    low_stock_alerts: !telegramConnection.low_stock_alerts
                  })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    telegramConnection.low_stock_alerts ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    telegramConnection.low_stock_alerts ? 'left-5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Напоминания о сессиях</span>
                <button
                  onClick={() => updateTelegramSettings({
                    session_reminders: !telegramConnection.session_reminders
                  })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    telegramConnection.session_reminders ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    telegramConnection.session_reminders ? 'left-5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Ежедневный отчёт</span>
                <button
                  onClick={() => updateTelegramSettings({
                    daily_summary: !telegramConnection.daily_summary
                  })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    telegramConnection.daily_summary ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    telegramConnection.daily_summary ? 'left-5' : 'left-0.5'
                  }`} />
                </button>
              </div>
            </div>

            <button
              onClick={disconnectTelegram}
              className="text-sm text-[var(--color-danger)] hover:underline"
            >
              Отключить Telegram
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-textMuted)]">
              Подключите Telegram для получения уведомлений о низком запасе табака, статусах заказов и ежедневных отчётов.
            </p>

            {telegramConnectLink ? (
              <a
                href={telegramConnectLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0088cc] text-white font-medium hover:opacity-90 transition-opacity"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-3.083 11.783-3.083 11.783-.145.58-.515.748-.845.748-.511 0-.753-.342-1.258-.788l-3.255-2.548-.961.926c-.144.138-.264.254-.529.254-.294 0-.345-.108-.483-.365l-1.088-3.575-3.13-.972c-.567-.164-.575-.565.152-.851l12.178-4.688c.467-.182.9.114.751.676z"/>
                </svg>
                Подключить Telegram
              </a>
            ) : (
              <p className="text-sm text-[var(--color-textMuted)] italic">
                Telegram-бот не настроен. Добавьте TELEGRAM_BOT_TOKEN в переменные окружения.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="card p-6 border-[var(--color-danger)]/30">
        <h2 className="text-lg font-semibold text-[var(--color-danger)] mb-4">
          Опасная зона
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Выйти из аккаунта</h3>
              <p className="text-sm text-[var(--color-textMuted)]">
                Вы будете разлогинены на этом устройстве
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="btn btn-ghost border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
            >
              Выйти
            </button>
          </div>

          <hr className="border-[var(--color-border)]" />

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Удалить аккаунт</h3>
              <p className="text-sm text-[var(--color-textMuted)]">
                Все данные будут удалены безвозвратно
              </p>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="btn bg-[var(--color-danger)] text-white hover:opacity-80"
            >
              Удалить аккаунт
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
