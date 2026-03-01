'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useModules } from '@/lib/hooks/useModules'
import { useLocale, useTranslation, LOCALES, LOCALE_LABELS } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { TOAST_TIMEOUT } from '@/lib/constants'

export default function GeneralSection() {
  const { user, profile, refreshProfile, isDemoMode } = useAuth()
  const { isHookahActive, isBarActive, toggleModule, loading: modulesLoading } = useModules()
  const { locale, setLocale } = useLocale()
  const ts = useTranslation('settings')
  const tc = useTranslation('common')
  const supabase = useMemo(() => createClient(), [])

  const [businessName, setBusinessName] = useState(profile?.business_name || '')
  const [ownerName, setOwnerName] = useState(profile?.owner_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [address, setAddress] = useState(profile?.address || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const msgTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => { clearTimeout(msgTimerRef.current) }, [])

  const handleLocaleChange = useCallback(async (newLocale: Locale) => {
    setLocale(newLocale)
    if (user && !isDemoMode) {
      try {
        await supabase.from('profiles').update({ locale: newLocale }).eq('id', user.id)
      } catch {
        // Best-effort locale persist
      }
    }
  }, [user, isDemoMode, supabase, setLocale])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setMessage('')

    try {
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
      msgTimerRef.current = setTimeout(() => setMessage(''), TOAST_TIMEOUT)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
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
    </>
  )
}
