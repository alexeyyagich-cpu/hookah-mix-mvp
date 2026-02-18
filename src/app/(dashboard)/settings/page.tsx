'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { useModules } from '@/lib/hooks/useModules'
import { useReady2Order } from '@/lib/hooks/useReady2Order'
import { useNotificationSettings } from '@/lib/hooks/useNotificationSettings'
import { usePushNotifications } from '@/lib/hooks/usePushNotifications'
import { useTelegram } from '@/lib/hooks/useTelegram'
import { useEmailSettings } from '@/lib/hooks/useEmailSettings'
import { createClient } from '@/lib/supabase/client'
import { QRCodeCanvas } from 'qrcode.react'
import Link from 'next/link'

export default function SettingsPage() {
  const { user, profile, refreshProfile, signOut, isDemoMode } = useAuth()
  const { tier, isExpired, daysUntilExpiry, canUsePOS } = useSubscription()
  const { modules, isHookahActive, isBarActive, canActivateBar, toggleModule, loading: modulesLoading } = useModules()
  const { connection: r2oConnection, loading: r2oLoading, error: r2oError, syncing: r2oSyncing, syncResult: r2oSyncResult, connect: r2oConnect, disconnect: r2oDisconnect, sync: r2oSync, refresh: r2oRefresh } = useReady2Order()
  const searchParams = useSearchParams()

  // Handle r2o callback redirect
  useEffect(() => {
    const r2oStatus = searchParams.get('r2o')
    if (r2oStatus === 'connected') {
      r2oRefresh()
      // Clean up URL
      window.history.replaceState({}, '', '/settings')
    } else if (r2oStatus === 'error') {
      window.history.replaceState({}, '', '/settings')
    }
  }, [searchParams, r2oRefresh])
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

  // QR Menu state
  const [venueSlug, setVenueSlug] = useState(profile?.venue_slug || '')
  const [slugSaving, setSlugSaving] = useState(false)
  const [slugMessage, setSlugMessage] = useState('')
  const qrRef = useRef<HTMLCanvasElement>(null)

  const menuUrl = venueSlug ? `https://hookahtorus.com/menu/${venueSlug}` : ''

  const handleSaveSlug = useCallback(async () => {
    if (!user) return
    setSlugSaving(true)
    setSlugMessage('')

    const slug = venueSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    setVenueSlug(slug)

    if (!slug) {
      setSlugMessage('Введите URL для меню')
      setSlugSaving(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({ venue_slug: slug })
      .eq('id', user.id)

    if (error) {
      setSlugMessage(error.message.includes('unique') ? 'Этот URL уже занят' : 'Ошибка: ' + error.message)
    } else {
      setSlugMessage('URL сохранён!')
      await refreshProfile()
    }
    setSlugSaving(false)
    setTimeout(() => setSlugMessage(''), 3000)
  }, [user, venueSlug, supabase, refreshProfile])

  const handleCopyUrl = useCallback(() => {
    navigator.clipboard.writeText(menuUrl)
    setSlugMessage('URL скопирован!')
    setTimeout(() => setSlugMessage(''), 2000)
  }, [menuUrl])

  const handleDownloadQR = useCallback(() => {
    const canvas = qrRef.current
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `qr-menu-${venueSlug}.png`
    link.href = url
    link.click()
  }, [venueSlug])

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

      {/* Modules */}
      <div className="card p-6 space-y-5">
        <h2 className="text-lg font-semibold">Модули заведения</h2>
        <p className="text-sm text-[var(--color-textMuted)]">
          Включайте нужные разделы для вашего бизнеса
        </p>

        <div className="space-y-4">
          {/* Hookah */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔥</span>
              <div>
                <h3 className="font-medium">Кальянная</h3>
                <p className="text-xs text-[var(--color-textMuted)]">Табак, миксы, чаши, сессии</p>
              </div>
            </div>
            <button
              onClick={() => toggleModule('hookah')}
              disabled={modulesLoading || (isHookahActive && !isBarActive)}
              title={isHookahActive && !isBarActive ? 'Нельзя отключить единственный модуль' : undefined}
              className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${
                isHookahActive ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                isHookahActive ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>

          {/* Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">🍸</span>
              <div>
                <h3 className="font-medium">Бар</h3>
                <p className="text-xs text-[var(--color-textMuted)]">Ингредиенты, рецепты, меню, продажи</p>
              </div>
            </div>
            <button
              onClick={() => toggleModule('bar')}
              disabled={modulesLoading || (isBarActive && !isHookahActive)}
              title={isBarActive && !isHookahActive ? 'Нельзя отключить единственный модуль' : undefined}
              className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${
                isBarActive ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                isBarActive ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>

          {/* Kitchen - coming soon */}
          <div className="flex items-center justify-between opacity-50">
            <div className="flex items-center gap-3">
              <span className="text-xl">🍳</span>
              <div>
                <h3 className="font-medium">Кухня</h3>
                <p className="text-xs text-[var(--color-textMuted)]">Продукты, рецепты, калькуляция</p>
              </div>
            </div>
            <span className="text-xs text-[var(--color-textMuted)]">Скоро</span>
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
              placeholder="Jan Kowalski"
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
            placeholder="+48 22 123 4567"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Адрес</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
            placeholder="ul. Nowy Swiat 42, Warsaw"
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

      {/* QR Menu */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold">QR-меню</h2>
            <p className="text-sm text-[var(--color-textMuted)]">
              Публичное меню по QR-коду для гостей
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">URL вашего меню</label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] overflow-hidden">
                <span className="px-3 text-sm text-[var(--color-textMuted)] whitespace-nowrap border-r border-[var(--color-border)]">
                  hookahtorus.com/menu/
                </span>
                <input
                  type="text"
                  value={venueSlug}
                  onChange={(e) => setVenueSlug(e.target.value)}
                  className="flex-1 px-3 py-3 bg-transparent focus:outline-none"
                  placeholder="my-lounge"
                />
              </div>
              <button
                onClick={handleSaveSlug}
                disabled={slugSaving}
                className="btn btn-primary disabled:opacity-50 whitespace-nowrap"
              >
                {slugSaving ? '...' : 'Сохранить'}
              </button>
            </div>
            {slugMessage && (
              <p className={`text-sm ${slugMessage.includes('Ошибка') || slugMessage.includes('занят') || slugMessage.includes('Введите') ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`}>
                {slugMessage}
              </p>
            )}
            <p className="text-xs text-[var(--color-textMuted)]">
              Латинские буквы, цифры и дефис. Например: my-lounge
            </p>
          </div>

          {venueSlug && profile?.venue_slug && (
            <div className="flex flex-col items-center gap-4 pt-4 border-t border-[var(--color-border)]">
              <div className="p-4 bg-white rounded-2xl">
                <QRCodeCanvas
                  ref={qrRef}
                  value={menuUrl}
                  size={200}
                  level="M"
                  marginSize={2}
                />
              </div>

              <p className="text-sm text-center text-[var(--color-textMuted)]">
                <a
                  href={menuUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-primary)] hover:underline"
                >
                  {menuUrl}
                </a>
              </p>

              <div className="flex gap-3">
                <button onClick={handleCopyUrl} className="btn btn-ghost text-sm">
                  Копировать URL
                </button>
                <button onClick={handleDownloadQR} className="btn btn-primary text-sm">
                  Скачать QR
                </button>
              </div>

              <p className="text-xs text-[var(--color-textMuted)] text-center">
                Распечатайте QR-код и разместите на столах — гости смогут открыть меню с телефона
              </p>
            </div>
          )}
        </div>
      </div>

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

      {/* POS Касса (ready2order) */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00b341] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold">POS Касса (ready2order)</h2>
            <p className="text-sm text-[var(--color-textMuted)]">
              Синхронизация с кассовой системой ready2order
            </p>
          </div>
        </div>

        {!canUsePOS ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-bgHover)]">
            <svg className="w-5 h-5 text-[var(--color-textMuted)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <p className="text-sm font-medium">Доступно на тарифе Pro</p>
              <p className="text-xs text-[var(--color-textMuted)]">
                Обновите подписку для интеграции с POS-системой
              </p>
            </div>
            <Link href="/pricing" className="btn btn-primary btn-sm ml-auto">
              Обновить
            </Link>
          </div>
        ) : r2oLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : r2oConnection ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-success)]/10">
              <span className="text-[var(--color-success)]">✓</span>
              <span className="text-sm">
                POS подключена
                {r2oConnection.last_sync_at && (
                  <span className="text-[var(--color-textMuted)]">
                    {' '}· последняя синхронизация: {new Date(r2oConnection.last_sync_at).toLocaleString('ru-RU')}
                  </span>
                )}
              </span>
            </div>

            {r2oError && (
              <div className="p-3 rounded-xl bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-sm">
                {r2oError}
              </div>
            )}

            {r2oSyncResult && (
              <div className="p-3 rounded-xl bg-[var(--color-primary)]/10 text-sm">
                Синхронизировано: {r2oSyncResult.synced} из {r2oSyncResult.total}
                {r2oSyncResult.errors > 0 && (
                  <span className="text-[var(--color-danger)]"> ({r2oSyncResult.errors} ошибок)</span>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={r2oSync}
                disabled={r2oSyncing}
                className="btn btn-primary disabled:opacity-50"
              >
                {r2oSyncing ? 'Синхронизация...' : 'Синхронизировать'}
              </button>
              <button
                onClick={r2oDisconnect}
                className="text-sm text-[var(--color-danger)] hover:underline"
              >
                Отключить POS
              </button>
            </div>

            {!r2oConnection.webhook_registered && (
              <p className="text-xs text-[var(--color-warning)]">
                Вебхуки не зарегистрированы. Автоматическое списание при продажах недоступно.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-textMuted)]">
              Подключите ready2order для автоматической синхронизации товаров, отслеживания продаж и управления остатками из кассы.
            </p>

            {r2oError && (
              <div className="p-3 rounded-xl bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-sm">
                {r2oError}
              </div>
            )}

            <button
              onClick={r2oConnect}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00b341] text-white font-medium hover:opacity-90 transition-opacity"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Подключить POS
            </button>
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
