'use client'

import { useState, useCallback } from 'react'
import { useLoungeProfile } from '@/lib/hooks/useLoungeProfile'
import { useTranslation } from '@/lib/i18n'
import { TOAST_TIMEOUT } from '@/lib/constants'
import { LOUNGE_FEATURES } from '@/types/lounge'
import type { LoungeFeature, WorkingHours, DayHours } from '@/types/lounge'

const DAYS: (keyof WorkingHours)[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
]

export default function LoungeProfileSettings() {
  const ts = useTranslation('settings')
  const { lounge, loading, updateLounge } = useLoungeProfile()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

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

  const toggleFeature = useCallback((feature: LoungeFeature) => {
    setFeatures(prev =>
      prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
    )
  }, [])

  const updateDayHours = useCallback((day: keyof WorkingHours, field: keyof DayHours, value: string | boolean) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      } as DayHours,
    }))
  }, [])

  const handleSave = useCallback(async () => {
    if (!lounge) return
    setSaving(true)
    setMessage('')
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
    setMessage(ts.loungeSaved)
    setSaving(false)
    setTimeout(() => setMessage(''), TOAST_TIMEOUT)
  }, [lounge, updateLounge, description, city, instagram, telegram, website, coverImageUrl, logoUrl, features, workingHours, isPublished, ts])

  const handlePublishToggle = useCallback(async () => {
    const next = !isPublished
    setIsPublished(next)
    if (lounge) {
      await updateLounge({ is_published: next })
    }
  }, [isPublished, lounge, updateLounge])

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
          onChange={e => setDescription(e.target.value)}
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
          onChange={e => setCity(e.target.value)}
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
            onChange={e => setCoverImageUrl(e.target.value)}
            placeholder={ts.placeholderUrl}
            className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bgCard)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{ts.loungeLogoImage}</label>
          <input
            type="url"
            value={logoUrl}
            onChange={e => setLogoUrl(e.target.value)}
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
                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
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
              onChange={e => setInstagram(e.target.value)}
              placeholder={ts.placeholderUsername}
              className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bgCard)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-textMuted)] mb-1">{ts.loungeTelegram}</label>
            <input
              type="text"
              value={telegram}
              onChange={e => setTelegram(e.target.value)}
              placeholder={ts.placeholderChannel}
              className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bgCard)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-textMuted)] mb-1">{ts.loungeWebsite}</label>
            <input
              type="url"
              value={website}
              onChange={e => setWebsite(e.target.value)}
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

      {/* Save */}
      <div className="flex items-center gap-4">
        <button type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? '...' : ts.saveSlug}
        </button>
        {message && (
          <span className="text-sm text-[var(--color-success)]">{message}</span>
        )}
      </div>
    </div>
  )
}
