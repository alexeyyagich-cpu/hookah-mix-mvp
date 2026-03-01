'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { useLoungeProfile } from '@/lib/hooks/useLoungeProfile'
import { useTranslation } from '@/lib/i18n'
import { TOAST_TIMEOUT } from '@/lib/constants'
import { LOUNGE_FEATURES } from '@/types/lounge'
import type { LoungeFeature, WorkingHours, DayHours } from '@/types/lounge'
import { LazyQRCodeSVG as QRCodeSVG } from '@/components/ui/LazyQRCode'

const DAYS: (keyof WorkingHours)[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
]

export default function LoungeProfileSettings() {
  const ts = useTranslation('settings')
  const tc = useTranslation('common')
  const { lounge, loading, updateLounge } = useLoungeProfile()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)
  const messageTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [isDirty, setIsDirty] = useState(false)

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout(messageTimerRef.current)
      clearTimeout(copyTimerRef.current)
    }
  }, [])

  // Warn on navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // Local form state
  const [description, setDescription] = useState(lounge?.description || '')
  const [city, setCity] = useState(lounge?.city || '')
  const [instagram, setInstagram] = useState(lounge?.instagram || '')
  const [telegram, setTelegram] = useState(lounge?.telegram || '')
  const [website, setWebsite] = useState(lounge?.website || '')
  const [coverImageUrl, setCoverImageUrl] = useState(lounge?.cover_image_url || '')
  const [logoUrl, setLogoUrl] = useState(lounge?.logo_url || '')
  const [features, setFeatures] = useState<LoungeFeature[]>(lounge?.features || [])
  const [workingHours, setWorkingHours] = useState<WorkingHours>(
    lounge?.working_hours || {
      monday: { open: '18:00', close: '02:00' },
      tuesday: { open: '18:00', close: '02:00' },
      wednesday: { open: '18:00', close: '02:00' },
      thursday: { open: '18:00', close: '02:00' },
      friday: { open: '18:00', close: '02:00' },
      saturday: { open: '16:00', close: '05:00' },
      sunday: { open: '16:00', close: '00:00' },
    }
  )
  const [isPublished, setIsPublished] = useState(lounge?.is_published ?? false)

  // Sync local state when lounge loads
  const [initialized, setInitialized] = useState(false)
  useEffect(() => {
    if (lounge && !initialized) {
      setDescription(lounge.description || '')
      setCity(lounge.city || '')
      setInstagram(lounge.instagram || '')
      setTelegram(lounge.telegram || '')
      setWebsite(lounge.website || '')
      setCoverImageUrl(lounge.cover_image_url || '')
      setLogoUrl(lounge.logo_url || '')
      setFeatures(lounge.features || [])
      if (lounge.working_hours) setWorkingHours(lounge.working_hours)
      setIsPublished(lounge.is_published ?? false)
      setInitialized(true)
    }
  }, [lounge, initialized])

  const toggleFeature = useCallback((feature: LoungeFeature) => {
    setFeatures(prev =>
      prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
    )
    setIsDirty(true)
  }, [])

  const updateDayHours = useCallback((day: keyof WorkingHours, field: keyof DayHours, value: string | boolean) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      } as DayHours,
    }))
    setIsDirty(true)
  }, [])

  const handleSave = useCallback(async () => {
    if (!lounge) return

    // Validate URL fields before saving
    const urlFields = [
      { value: website, name: 'website' },
      { value: coverImageUrl, name: 'cover_image_url' },
      { value: logoUrl, name: 'logo_url' },
    ]
    for (const { value } of urlFields) {
      if (value) {
        try {
          new URL(value)
        } catch {
          toast.error(ts.invalidUrl)
          return
        }
      }
    }

    setSaving(true)
    setMessage('')
    try {
      await updateLounge({
        description: description || null,
        city: city || null,
        instagram: instagram || null,
        telegram: telegram || null,
        website: website || null,
        cover_image_url: coverImageUrl || null,
        logo_url: logoUrl || null,
        features,
        working_hours: workingHours,
        is_published: isPublished,
      })
      setIsDirty(false)
      setMessage(ts.loungeSaved)
      clearTimeout(messageTimerRef.current)
      messageTimerRef.current = setTimeout(() => setMessage(''), TOAST_TIMEOUT)
    } catch {
      toast.error(tc.errorSaving)
    } finally {
      setSaving(false)
    }
  }, [lounge, updateLounge, description, city, instagram, telegram, website, coverImageUrl, logoUrl, features, workingHours, isPublished, ts])

  const handlePublishToggle = useCallback(async () => {
    const next = !isPublished
    setIsPublished(next)
    if (lounge) {
      await updateLounge({ is_published: next })
    }
  }, [isPublished, lounge, updateLounge])

  const menuUrl = lounge?.slug
    ? `https://hookahtorus.com/menu/${lounge.slug}`
    : ''

  const handleCopyLink = useCallback(() => {
    if (!menuUrl) return
    navigator.clipboard.writeText(menuUrl)
    setLinkCopied(true)
    clearTimeout(copyTimerRef.current)
    copyTimerRef.current = setTimeout(() => setLinkCopied(false), TOAST_TIMEOUT)
  }, [menuUrl])

  const handleDownloadQR = useCallback(() => {
    if (!qrRef.current) return
    const svg = qrRef.current.querySelector('svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      const link = document.createElement('a')
      link.download = `menu-qr-${lounge?.slug}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }

    img.onerror = () => {
      setMessage(ts.qrDownloadError || tc.errorGeneric)
      clearTimeout(messageTimerRef.current)
      messageTimerRef.current = setTimeout(() => setMessage(''), TOAST_TIMEOUT)
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }, [lounge?.slug, ts.qrDownloadError, tc.errorGeneric])

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-[var(--color-bgHover)] rounded w-1/3" />
          <div className="h-20 bg-[var(--color-bgHover)] rounded" />
        </div>
      </div>
    )
  }

  if (!lounge) {
    return (
      <div className="card p-6 space-y-3">
        <h2 className="text-lg font-semibold">{ts.loungeProfile}</h2>
        <p className="text-sm text-[var(--color-textMuted)]">{ts.loungeNoProfile}</p>
      </div>
    )
  }

  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{ts.loungeProfile}</h2>
          <p className="text-sm text-[var(--color-textMuted)]">{ts.loungeProfileDesc}</p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
          isPublished
            ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
            : 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]'
        }`}>
          {isPublished ? ts.loungePublished : ts.loungeDraft}
        </span>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">{ts.loungeDescription}</label>
        <textarea
          value={description}
          onChange={e => { setDescription(e.target.value); setIsDirty(true) }}
          placeholder={ts.loungeDescriptionHint}
          rows={3}
          className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bgCard)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      {/* City */}
      <div>
        <label className="block text-sm font-medium mb-1">{ts.loungeCity}</label>
        <input
          type="text"
          value={city}
          onChange={e => { setCity(e.target.value); setIsDirty(true) }}
          className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bgCard)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      {/* Images */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{ts.loungeCoverImage}</label>
          <input
            type="url"
            value={coverImageUrl}
            onChange={e => { setCoverImageUrl(e.target.value); setIsDirty(true) }}
            placeholder={ts.placeholderUrl}
            className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bgCard)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{ts.loungeLogoImage}</label>
          <input
            type="url"
            value={logoUrl}
            onChange={e => { setLogoUrl(e.target.value); setIsDirty(true) }}
            placeholder={ts.placeholderUrl}
            className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bgCard)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      {/* Working Hours */}
      <div>
        <label className="block text-sm font-medium mb-3">{ts.loungeWorkingHours}</label>
        <div className="space-y-2">
          {DAYS.map(key => {
            const day = workingHours[key]
            const isClosed = day?.is_closed ?? false
            const dayLabels: Record<keyof WorkingHours, string> = {
              monday: ts.loungeMonday, tuesday: ts.loungeTuesday, wednesday: ts.loungeWednesday,
              thursday: ts.loungeThursday, friday: ts.loungeFriday, saturday: ts.loungeSaturday, sunday: ts.loungeSunday,
            }
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="w-28 text-sm shrink-0">{dayLabels[key]}</span>
                <button
                  type="button"
                  onClick={() => updateDayHours(key, 'is_closed', !isClosed)}
                  className={`shrink-0 text-xs px-2 py-1 rounded-lg border transition-colors ${
                    isClosed
                      ? 'bg-[var(--color-error)]/10 border-[var(--color-error)]/30 text-[var(--color-error)]'
                      : 'bg-[var(--color-success)]/10 border-[var(--color-success)]/30 text-[var(--color-success)]'
                  }`}
                >
                  {isClosed ? ts.loungeClosed : ts.loungeOpen}
                </button>
                {!isClosed && (
                  <>
                    <input
                      type="time"
                      value={day?.open || '18:00'}
                      onChange={e => updateDayHours(key, 'open', e.target.value)}
                      className="px-2 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bgCard)] text-sm"
                    />
                    <span className="text-sm text-[var(--color-textMuted)]">—</span>
                    <input
                      type="time"
                      value={day?.close || '02:00'}
                      onChange={e => updateDayHours(key, 'close', e.target.value)}
                      className="px-2 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bgCard)] text-sm"
                    />
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Features */}
      <div>
        <label className="block text-sm font-medium mb-3">{ts.loungeFeatures}</label>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(LOUNGE_FEATURES) as [LoungeFeature, { label: string; icon: string }][]).map(
            ([key, { label, icon }]) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleFeature(key)}
                className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${
                  features.includes(key)
                    ? 'bg-[var(--color-primary)] text-[var(--color-bg)] border-[var(--color-primary)]'
                    : 'bg-[var(--color-bgCard)] border-[var(--color-border)] hover:bg-[var(--color-bgHover)]'
                }`}
              >
                {icon} {label}
              </button>
            )
          )}
        </div>
      </div>

      {/* Social Links */}
      <div>
        <label className="block text-sm font-medium mb-3">{ts.loungeSocialLinks}</label>
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-[var(--color-textMuted)] mb-1">{ts.loungeInstagram}</label>
            <input
              type="text"
              value={instagram}
              onChange={e => { setInstagram(e.target.value); setIsDirty(true) }}
              placeholder={ts.placeholderUsername}
              className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bgCard)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-textMuted)] mb-1">{ts.loungeTelegram}</label>
            <input
              type="text"
              value={telegram}
              onChange={e => { setTelegram(e.target.value); setIsDirty(true) }}
              placeholder={ts.placeholderChannel}
              className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bgCard)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-textMuted)] mb-1">{ts.loungeWebsite}</label>
            <input
              type="url"
              value={website}
              onChange={e => { setWebsite(e.target.value); setIsDirty(true) }}
              placeholder={ts.placeholderUrl}
              className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bgCard)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>
      </div>

      {/* Publish Toggle */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
        <div>
          <h3 className="font-medium">{ts.loungePublish}</h3>
          <p className="text-sm text-[var(--color-textMuted)]">{ts.loungePublishDesc}</p>
        </div>
        <button type="button"
          onClick={handlePublishToggle}
          className={`relative shrink-0 w-12 h-6 rounded-full transition-colors ${
            isPublished ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
          }`}
        >
          <span
            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
              isPublished ? 'translate-x-6' : ''
            }`}
          />
        </button>
      </div>

      {/* Public Menu Link */}
      {lounge?.slug && isPublished && (
        <div className="pt-4 border-t border-[var(--color-border)]">
          <h3 className="font-semibold mb-4">{ts.publicMenuLink}</h3>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div ref={qrRef} className="shrink-0 w-32 h-32 bg-white p-2 rounded-lg flex items-center justify-center">
              <QRCodeSVG value={menuUrl} size={112} level="M" />
            </div>
            <div className="flex-1 space-y-3 min-w-0">
              <p className="text-sm text-[var(--color-textMuted)]">{ts.publicMenuLinkDesc}</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={menuUrl}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bgCard)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] flex-1 min-w-0"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="btn btn-primary px-4 shrink-0"
                >
                  {linkCopied ? ts.copiedLink : ts.copyLink}
                </button>
              </div>
              <div className="flex gap-3">
                <a
                  href={`/menu/${lounge.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--color-primary)] hover:underline"
                >
                  {ts.openInNewTab} &rarr;
                </a>
                <button
                  type="button"
                  onClick={handleDownloadQR}
                  className="text-sm text-[var(--color-primary)] hover:underline"
                >
                  {ts.downloadQr}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save */}
      <div className="flex items-center gap-4">
        <button type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary flex items-center gap-2"
        >
          {saving && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
          {saving ? tc.saving : ts.saveSlug}
        </button>
        {message && (
          <span role="status" aria-live="polite" className="text-sm text-[var(--color-success)]">{message}</span>
        )}
      </div>
    </div>
  )
}
