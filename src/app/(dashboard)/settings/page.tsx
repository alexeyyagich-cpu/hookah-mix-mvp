'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { useNotificationSettings } from '@/lib/hooks/useNotificationSettings'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const { tier, isExpired, daysUntilExpiry } = useSubscription()
  const { settings: notificationSettings, updateSettings: updateNotificationSettings } = useNotificationSettings()
  const supabase = createClient()

  const [businessName, setBusinessName] = useState(profile?.business_name || '')
  const [ownerName, setOwnerName] = useState(profile?.owner_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [address, setAddress] = useState(profile?.address || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

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
          </div>
          <Link href="/pricing" className="btn btn-primary">
            {tier === 'free' ? 'Обновить' : 'Управление'}
          </Link>
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
        </div>
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
