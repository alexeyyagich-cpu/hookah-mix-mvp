'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useTranslation } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { TOAST_TIMEOUT } from '@/lib/constants'
import { LazyQRCode as QRCodeCanvas } from '@/components/ui/LazyQRCode'
import LoungeProfileSettings from '@/components/settings/LoungeProfileSettings'

export default function VenueSection() {
  const { user, profile, refreshProfile } = useAuth()
  const ts = useTranslation('settings')
  const tc = useTranslation('common')

  const supabase = useMemo(() => createClient(), [])

  const [venueSlug, setVenueSlug] = useState<string>(profile?.venue_slug ?? '')
  const [slugSaving, setSlugSaving] = useState(false)
  const [slugMessage, setSlugMessage] = useState('')
  const qrRef = useRef<HTMLCanvasElement>(null)
  const slugMsgTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => { clearTimeout(slugMsgTimerRef.current) }, [])

  const menuUrl = venueSlug
    ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://hookahtorus.com'}/menu/${venueSlug}`
    : ''

  const handleSaveSlug = useCallback(async () => {
    if (!user) return
    setSlugSaving(true)
    setSlugMessage('')
    const slug = venueSlug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    setVenueSlug(slug)
    if (!slug) {
      setSlugMessage(ts.slugEmpty)
      setSlugSaving(false)
      return
    }
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ venue_slug: slug })
        .eq('id', user.id)
      if (error) {
        setSlugMessage(
          error.message.includes('unique')
            ? ts.slugTaken
            : tc.error + ': ' + error.message
        )
      } else {
        setSlugMessage(ts.slugSaved)
        await refreshProfile()
      }
      slugMsgTimerRef.current = setTimeout(() => setSlugMessage(''), TOAST_TIMEOUT)
    } finally {
      setSlugSaving(false)
    }
  }, [user, venueSlug, supabase, refreshProfile, ts, tc])

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(menuUrl)
      setSlugMessage(ts.slugCopied)
    } catch {
      setSlugMessage(tc.error)
    }
    slugMsgTimerRef.current = setTimeout(() => setSlugMessage(''), 2000)
  }, [menuUrl, ts, tc])

  const handleDownloadQR = useCallback(() => {
    const canvas = qrRef.current
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `qr-menu-${venueSlug}.png`
    link.href = url
    link.click()
  }, [venueSlug])

  return (
    <>
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
            <p className="text-sm text-[var(--color-textMuted)]">{ts.qrMenuDesc}</p>
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
              <p
                className={`text-sm ${
                  slugMessage === ts.slugSaved || slugMessage === ts.slugCopied
                    ? 'text-[var(--color-success)]'
                    : 'text-[var(--color-danger)]'
                }`}
              >
                {slugMessage}
              </p>
            )}
            <p className="text-xs text-[var(--color-textMuted)]">{ts.slugHint}</p>
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
              <p className="text-xs text-[var(--color-textMuted)] text-center">{ts.qrPrintHint}</p>
            </div>
          )}
        </div>
      </div>

      {/* Lounge Profile */}
      <LoungeProfileSettings />
    </>
  )
}
