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
import { useLocale, useTranslation, LOCALES, LOCALE_LABELS } from '@/lib/i18n'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { Locale } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { LOW_STOCK_THRESHOLD, TOAST_TIMEOUT } from '@/lib/constants'
import { QRCodeCanvas } from 'qrcode.react'
import LoungeProfileSettings from '@/components/settings/LoungeProfileSettings'
import Link from 'next/link'

export default function SettingsPage() {
  const { user, profile, refreshProfile, signOut, isDemoMode } = useAuth()
  const { tier, isExpired, daysUntilExpiry, canUsePOS } = useSubscription()
  const { modules, isHookahActive, isBarActive, canActivateBar, toggleModule, loading: modulesLoading } = useModules()
  const { connection: r2oConnection, loading: r2oLoading, error: r2oError, syncing: r2oSyncing, syncResult: r2oSyncResult, connect: r2oConnect, disconnect: r2oDisconnect, sync: r2oSync, refresh: r2oRefresh } = useReady2Order()
  const searchParams = useSearchParams()
  const { locale, setLocale } = useLocale()
  const ts = useTranslation('settings')
  const tc = useTranslation('common')

  // Handle r2o callback redirect
  useEffect(() => {
    const r2oStatus = searchParams.get('r2o')
    if (r2oStatus === 'connected') {
      r2oRefresh()
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
  const [deleteLoading, setDeleteLoading] = useState(false)

  // QR Menu state
  const [venueSlug, setVenueSlug] = useState(profile?.venue_slug || '')
  const [slugSaving, setSlugSaving] = useState(false)
  const [slugMessage, setSlugMessage] = useState('')
  const qrRef = useRef<HTMLCanvasElement>(null)

  const menuUrl = venueSlug ? `https://hookahtorus.com/menu/${venueSlug}` : ''

  const handleLocaleChange = useCallback(async (newLocale: Locale) => {
    setLocale(newLocale)
    if (user && !isDemoMode) {
      await supabase.from('profiles').update({ locale: newLocale }).eq('id', user.id)
    }
  }, [user, isDemoMode, supabase, setLocale])

  const handleSaveSlug = useCallback(async () => {
    if (!user) return
    setSlugSaving(true)
    setSlugMessage('')

    const slug = venueSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    setVenueSlug(slug)

    if (!slug) {
      setSlugMessage(ts.slugEmpty)
      setSlugSaving(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({ venue_slug: slug })
      .eq('id', user.id)

    if (error) {
      setSlugMessage(error.message.includes('unique') ? ts.slugTaken : tc.error + ': ' + error.message)
    } else {
      setSlugMessage(ts.slugSaved)
      await refreshProfile()
    }
    setSlugSaving(false)
    setTimeout(() => setSlugMessage(''), TOAST_TIMEOUT)
  }, [user, venueSlug, supabase, refreshProfile, ts, tc])

  const handleCopyUrl = useCallback(() => {
    navigator.clipboard.writeText(menuUrl)
    setSlugMessage(ts.slugCopied)
    setTimeout(() => setSlugMessage(''), 2000)
  }, [menuUrl, ts])

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
      setMessage(tc.errorSaving + ': ' + error.message)
    } else {
      setMessage(ts.saved)
      await refreshProfile()
    }

    setSaving(false)
    setTimeout(() => setMessage(''), TOAST_TIMEOUT)
  }

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDeleteAccount = async () => {
    setShowDeleteConfirm(true)
  }

  const confirmDeleteAccount = async () => {
    setShowDeleteConfirm(false)
    setDeleteLoading(true)
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      })
      if (res.ok) {
        await signOut()
      } else {
        const data = await res.json()
        setMessage(tc.error + ': ' + (data.error || ts.deleteError))
        setTimeout(() => setMessage(''), 5000)
      }
    } catch {
      setMessage(ts.deleteError)
      setTimeout(() => setMessage(''), 5000)
    } finally {
      setDeleteLoading(false)
    }
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
        setMessage(tc.error + ': ' + (data.error || ts.portalError))
        setTimeout(() => setMessage(''), TOAST_TIMEOUT)
      }
    } catch (error) {
      void error
      setMessage(ts.portalOpenError)
      setTimeout(() => setMessage(''), TOAST_TIMEOUT)
    } finally {
      setPortalLoading(false)
    }
  }

  const hasActiveSubscription = profile?.stripe_subscription_id && tier !== 'free'

  const sections = [
    { id: 'general', label: ts.sectionGeneral },
    { id: 'subscription', label: ts.sectionSubscription },
    { id: 'venue', label: ts.sectionVenue },
    { id: 'notifications', label: ts.sectionNotifications },
    { id: 'integrations', label: ts.sectionIntegrations },
    { id: 'account', label: ts.sectionAccount },
  ]

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{ts.title}</h1>
        <p className="text-[var(--color-textMuted)]">
          {ts.subtitle}
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {sections.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => scrollTo(s.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap text-[var(--color-textMuted)] hover:bg-[var(--color-bgHover)] hover:text-[var(--color-text)] transition-colors"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Language Selector */}
      <div id="general" className="card p-6 space-y-4 scroll-mt-4">
        <div>
          <h2 className="text-lg font-semibold">{ts.language}</h2>
          <p className="text-sm text-[var(--color-textMuted)]">{ts.languageDescription}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {LOCALES.map((loc) => {
            const info = LOCALE_LABELS[loc]
            return (
              <button
                type="button"
                key={loc}
                onClick={() => handleLocaleChange(loc)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  locale === loc
                    ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                    : 'bg-[var(--color-bgHover)] text-[var(--color-text)] hover:bg-[var(--color-border)]'
                }`}
              >
                <span>{info.flag}</span>
                <span>{info.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Subscription Status */}
      <div id="subscription" className="card p-6 scroll-mt-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1">{ts.subscription}</h2>
            <div className="flex items-center gap-2">
              <span className={`badge ${tier === 'free' ? 'badge-warning' : 'badge-success'}`}>
                {tier.toUpperCase()}
              </span>
              {isExpired && (
                <span className="badge badge-danger">{ts.expired}</span>
              )}
              {daysUntilExpiry !== null && daysUntilExpiry <= 7 && !isExpired && (
                <span className="text-sm text-[var(--color-warning)]">
                  {ts.expiresIn(daysUntilExpiry)}
                </span>
              )}
            </div>
            {tier === 'free' && (
              <p className="text-sm text-[var(--color-textMuted)] mt-2">
                {ts.upgradeForFull}
              </p>
            )}
            {hasActiveSubscription && (
              <p className="text-sm text-[var(--color-textMuted)] mt-2">
                {ts.manageSubscription}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {hasActiveSubscription ? (
              <button
                type="button"
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="btn btn-primary disabled:opacity-50"
              >
                {portalLoading ? tc.loading : ts.manage}
              </button>
            ) : (
              <Link href="/pricing" className="btn btn-primary">
                {tier === 'free' ? tc.upgrade : ts.changePlan}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="card p-6 space-y-5">
        <h2 className="text-lg font-semibold">{ts.venueModules}</h2>
        <p className="text-sm text-[var(--color-textMuted)]">
          {ts.modulesDescription}
        </p>

        <div className="space-y-4">
          {/* Hookah */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔥</span>
              <div>
                <h3 className="font-medium">{ts.hookahModule}</h3>
                <p className="text-xs text-[var(--color-textMuted)]">{ts.hookahModuleDesc}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggleModule('hookah')}
              disabled={modulesLoading || (isHookahActive && !isBarActive)}
              title={isHookahActive && !isBarActive ? ts.cannotDisableSingle : undefined}
              className={`relative shrink-0 w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${
                isHookahActive ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
              }`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                isHookahActive ? 'translate-x-6' : ''
              }`} />
            </button>
          </div>

          {/* Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">🍸</span>
              <div>
                <h3 className="font-medium">{ts.barModule}</h3>
                <p className="text-xs text-[var(--color-textMuted)]">{ts.barModuleDesc}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggleModule('bar')}
              disabled={modulesLoading || (isBarActive && !isHookahActive)}
              title={isBarActive && !isHookahActive ? ts.cannotDisableSingle : undefined}
              className={`relative shrink-0 w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${
                isBarActive ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
              }`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                isBarActive ? 'translate-x-6' : ''
              }`} />
            </button>
          </div>

          {/* Kitchen - coming soon */}
          <div className="flex items-center justify-between opacity-50">
            <div className="flex items-center gap-3">
              <span className="text-xl">🍳</span>
              <div>
                <h3 className="font-medium">{ts.kitchenModule}</h3>
                <p className="text-xs text-[var(--color-textMuted)]">{ts.kitchenModuleDesc}</p>
              </div>
            </div>
            <span className="text-xs text-[var(--color-textMuted)]">{tc.soon}</span>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="card p-6 space-y-5">
        <h2 className="text-lg font-semibold">{ts.venueProfile}</h2>

        {message && (
          <div className={`p-4 rounded-lg ${
            message.includes(tc.error)
              ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
              : 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium">{ts.emailLabel}</label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="input text-[var(--color-textMuted)] cursor-not-allowed"
          />
          <p className="text-xs text-[var(--color-textMuted)]">
            {ts.emailCannotChange}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">{ts.businessNameLabel}</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="input"
              placeholder={ts.placeholderBusinessName}
              maxLength={100}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">{ts.ownerNameLabel}</label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="input"
              placeholder={ts.placeholderOwnerName}
              maxLength={100}
              disabled={saving}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">{ts.phoneLabel}</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input"
            placeholder={ts.placeholderPhone}
            maxLength={30}
            disabled={saving}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">{ts.addressLabel}</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="input"
            placeholder={ts.placeholderAddress}
            maxLength={200}
            disabled={saving}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary disabled:opacity-50"
        >
          {saving ? tc.saving : tc.save}
        </button>
      </form>

      {/* QR Menu */}
      <div id="venue" className="card p-6 space-y-5 scroll-mt-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold">{ts.qrMenu}</h2>
            <p className="text-sm text-[var(--color-textMuted)]">
              {ts.qrMenuDesc}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">{ts.menuUrl}</label>
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
                  placeholder={ts.placeholderSlug}
                />
              </div>
              <button
                type="button"
                onClick={handleSaveSlug}
                disabled={slugSaving}
                className="btn btn-primary disabled:opacity-50 whitespace-nowrap"
              >
                {slugSaving ? '...' : ts.saveSlug}
              </button>
            </div>
            {slugMessage && (
              <p className={`text-sm ${slugMessage === ts.slugSaved || slugMessage === ts.slugCopied ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                {slugMessage}
              </p>
            )}
            <p className="text-xs text-[var(--color-textMuted)]">
              {ts.slugHint}
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
                <button type="button" onClick={handleCopyUrl} className="btn btn-ghost text-sm">
                  {ts.copyUrl}
                </button>
                <button type="button" onClick={handleDownloadQR} className="btn btn-primary text-sm">
                  {ts.downloadQr}
                </button>
              </div>

              <p className="text-xs text-[var(--color-textMuted)] text-center">
                {ts.qrPrintHint}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lounge Profile */}
      <LoungeProfileSettings />

      {/* Notification Settings */}
      <div id="notifications" className="card p-6 space-y-5 scroll-mt-4">
        <h2 className="text-lg font-semibold">{ts.notifications}</h2>

        <div className="space-y-4">
          {/* Low Stock Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{ts.lowStockNotifications}</h3>
              <p className="text-sm text-[var(--color-textMuted)]">
                {ts.lowStockDesc}
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateNotificationSettings({
                low_stock_enabled: !notificationSettings?.low_stock_enabled
              })}
              className={`relative shrink-0 w-12 h-6 rounded-full transition-colors ${
                notificationSettings?.low_stock_enabled
                  ? 'bg-[var(--color-primary)]'
                  : 'bg-[var(--color-border)]'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  notificationSettings?.low_stock_enabled ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          {/* Threshold Slider */}
          <div className={notificationSettings?.low_stock_enabled ? '' : 'opacity-50 pointer-events-none'}>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">{ts.warningThreshold}</label>
              <span className="text-sm font-bold text-[var(--color-primary)]">
                {notificationSettings?.low_stock_threshold || LOW_STOCK_THRESHOLD}{tc.grams}
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={200}
              step={10}
              value={notificationSettings?.low_stock_threshold || LOW_STOCK_THRESHOLD}
              onChange={(e) => updateNotificationSettings({
                low_stock_threshold: parseInt(e.target.value)
              })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[var(--color-textMuted)] mt-1">
              <span>10{tc.grams}</span>
              <span>200{tc.grams}</span>
            </div>
          </div>

          {/* Push Notifications */}
          {pushSupported && (
            <>
              <hr className="border-[var(--color-border)]" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{ts.pushNotifications}</h3>
                  <p className="text-sm text-[var(--color-textMuted)]">
                    {pushPermission === 'denied'
                      ? ts.pushBlocked
                      : ts.pushDescription}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => pushSubscribed ? unsubscribePush() : subscribePush()}
                  disabled={pushLoading || pushPermission === 'denied'}
                  className={`relative shrink-0 w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${
                    pushSubscribed
                      ? 'bg-[var(--color-primary)]'
                      : 'bg-[var(--color-border)]'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      pushSubscribed ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>
              {pushSubscribed && (
                <p className="text-xs text-[var(--color-success)] flex items-center gap-1">
                  <span>✓</span> {ts.pushEnabled}
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
            <h2 className="text-lg font-semibold">{ts.emailNotifications}</h2>
            <p className="text-sm text-[var(--color-textMuted)]">
              {ts.emailNotifDesc}
            </p>
          </div>
        </div>

        {emailLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !emailConfigured ? (
          <p className="text-sm text-[var(--color-textMuted)] italic">
            {ts.emailNotConfigured}
          </p>
        ) : (
          <div className="space-y-4">
            {/* Master toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{ts.emailNotifications}</h3>
                <p className="text-sm text-[var(--color-textMuted)]">
                  {ts.emailToggleDesc(user?.email || '')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => updateEmailSettings({
                  email_notifications_enabled: !emailSettings?.email_notifications_enabled
                })}
                className={`relative shrink-0 w-12 h-6 rounded-full transition-colors ${
                  emailSettings?.email_notifications_enabled
                    ? 'bg-[var(--color-primary)]'
                    : 'bg-[var(--color-border)]'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    emailSettings?.email_notifications_enabled ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* Individual toggles */}
            <div className={emailSettings?.email_notifications_enabled ? 'space-y-3 pt-2' : 'space-y-3 pt-2 opacity-50 pointer-events-none'}>
              <div className="flex items-center justify-between">
                <span className="text-sm">{ts.lowStockEmail}</span>
                <button
                  type="button"
                  onClick={() => updateEmailSettings({
                    low_stock_email: !emailSettings?.low_stock_email
                  })}
                  className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${
                    emailSettings?.low_stock_email ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    emailSettings?.low_stock_email ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">{ts.orderUpdatesEmail}</span>
                <button
                  type="button"
                  onClick={() => updateEmailSettings({
                    order_updates_email: !emailSettings?.order_updates_email
                  })}
                  className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${
                    emailSettings?.order_updates_email ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    emailSettings?.order_updates_email ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">{ts.dailySummaryEmail}</span>
                <button
                  type="button"
                  onClick={() => updateEmailSettings({
                    daily_summary_email: !emailSettings?.daily_summary_email
                  })}
                  className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${
                    emailSettings?.daily_summary_email ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    emailSettings?.daily_summary_email ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* POS (ready2order) — brand color #00b341 intentionally not theme-variable */}
      <div id="integrations" className="card p-6 space-y-5 scroll-mt-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00b341] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold">{ts.posTitle}</h2>
            <p className="text-sm text-[var(--color-textMuted)]">
              {ts.posDesc}
            </p>
          </div>
        </div>

        {!canUsePOS ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-bgHover)]">
            <svg className="w-5 h-5 text-[var(--color-textMuted)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <p className="text-sm font-medium">{ts.posProOnly}</p>
              <p className="text-xs text-[var(--color-textMuted)]">
                {ts.posProUpgrade}
              </p>
            </div>
            <Link href="/pricing" className="btn btn-primary btn-sm ml-auto">
              {tc.upgrade}
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
                {ts.posConnected}
                {r2oConnection.last_sync_at && (
                  <span className="text-[var(--color-textMuted)]">
                    {' '}· {ts.lastSync}: {new Date(r2oConnection.last_sync_at).toLocaleString(locale)}
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
                {ts.synced(r2oSyncResult.synced, r2oSyncResult.total)}
                {r2oSyncResult.errors > 0 && (
                  <span className="text-[var(--color-danger)]"> {ts.syncErrors(r2oSyncResult.errors)}</span>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={r2oSync}
                disabled={r2oSyncing}
                className="btn btn-primary disabled:opacity-50"
              >
                {r2oSyncing ? ts.syncing : ts.sync}
              </button>
              <button
                type="button"
                onClick={r2oDisconnect}
                className="text-sm text-[var(--color-danger)] hover:underline"
              >
                {ts.disconnectPos}
              </button>
            </div>

            {!r2oConnection.webhook_registered && (
              <p className="text-xs text-[var(--color-warning)]">
                {ts.webhooksNotRegistered}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-textMuted)]">
              {ts.posConnectDesc}
            </p>

            {r2oError && (
              <div className="p-3 rounded-xl bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-sm">
                {r2oError}
              </div>
            )}

            <button
              type="button"
              onClick={r2oConnect}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00b341] text-white font-medium hover:opacity-90 transition-opacity"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {ts.connectPos}
            </button>
          </div>
        )}
      </div>

      {/* Telegram Integration — brand color #0088cc intentionally not theme-variable */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0088cc] flex items-center justify-center">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-3.083 11.783-3.083 11.783-.145.58-.515.748-.845.748-.511 0-.753-.342-1.258-.788l-3.255-2.548-.961.926c-.144.138-.264.254-.529.254-.294 0-.345-.108-.483-.365l-1.088-3.575-3.13-.972c-.567-.164-.575-.565.152-.851l12.178-4.688c.467-.182.9.114.751.676z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold">{ts.telegram}</h2>
            <p className="text-sm text-[var(--color-textMuted)]">
              {ts.telegramDesc}
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
                {ts.telegramConnected(telegramConnection.telegram_username || String(telegramConnection.telegram_user_id))}
              </span>
            </div>

            {/* Notification toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">{ts.telegramLowStock}</span>
                <button
                  type="button"
                  onClick={() => updateTelegramSettings({
                    low_stock_alerts: !telegramConnection.low_stock_alerts
                  })}
                  className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${
                    telegramConnection.low_stock_alerts ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    telegramConnection.low_stock_alerts ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">{ts.telegramSessions}</span>
                <button
                  type="button"
                  onClick={() => updateTelegramSettings({
                    session_reminders: !telegramConnection.session_reminders
                  })}
                  className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${
                    telegramConnection.session_reminders ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    telegramConnection.session_reminders ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">{ts.telegramDaily}</span>
                <button
                  type="button"
                  onClick={() => updateTelegramSettings({
                    daily_summary: !telegramConnection.daily_summary
                  })}
                  className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${
                    telegramConnection.daily_summary ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    telegramConnection.daily_summary ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={disconnectTelegram}
              className="text-sm text-[var(--color-danger)] hover:underline"
            >
              {ts.disconnectTelegram}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-textMuted)]">
              {ts.telegramConnectDesc}
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
                {ts.connectTelegram}
              </a>
            ) : (
              <p className="text-sm text-[var(--color-textMuted)] italic">
                {ts.telegramNotConfigured}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div id="account" className="card p-6 border-[var(--color-danger)]/30 scroll-mt-4">
        <h2 className="text-lg font-semibold text-[var(--color-danger)] mb-4">
          {ts.dangerZone}
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{ts.logoutTitle}</h3>
              <p className="text-sm text-[var(--color-textMuted)]">
                {ts.logoutDesc}
              </p>
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              className="btn btn-ghost border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
            >
              {ts.logout}
            </button>
          </div>

          <hr className="border-[var(--color-border)]" />

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{ts.deleteAccount}</h3>
              <p className="text-sm text-[var(--color-textMuted)]">
                {ts.deleteAccountDesc}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
              className="btn bg-[var(--color-danger)] text-white hover:opacity-80 disabled:opacity-50"
            >
              {deleteLoading ? tc.loading : ts.deleteAccount}
            </button>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={showDeleteConfirm}
        title={ts.deleteConfirm1}
        message={ts.deleteConfirm2}
        confirmLabel={tc.delete}
        cancelLabel={tc.cancel}
        danger
        onConfirm={confirmDeleteAccount}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}
