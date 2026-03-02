'use client'

import { useState, useRef } from 'react'
import { useTranslation } from '@/lib/i18n'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'
import { IconClose } from '@/components/Icons'
import {
  getAllFlavorProfiles,
  getAllStrengthOptions,
  FLAVOR_PROFILE_LABELS,
  STRENGTH_LABELS,
  type StrengthPreference,
  type FlavorProfile,
} from '@/logic/recommendationEngine'
import type { NewGuest } from '@/lib/hooks/useGuests'
import type { Guest } from '@/types/database'

export function GuestModal({
  onClose,
  onSave,
  initialData,
}: {
  onClose: () => void
  onSave: (guest: NewGuest) => void
  initialData?: Guest
}) {
  const t = useTranslation('hookah')
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(dialogRef, true, onClose)

  const STRENGTH_LABEL_I18N: Record<StrengthPreference, string> = {
    light: t.strengthLight, medium: t.strengthMedium, strong: t.strengthStrong,
  }
  const FLAVOR_LABEL_I18N: Record<FlavorProfile, string> = {
    fresh: t.flavorFresh, fruity: t.flavorFruity, sweet: t.flavorSweet,
    citrus: t.flavorCitrus, spicy: t.flavorSpicy, soda: t.flavorSoda,
  }

  const [name, setName] = useState(initialData?.name || '')
  const [phone, setPhone] = useState(initialData?.phone || '')
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [strength, setStrength] = useState<StrengthPreference | null>(initialData?.strength_preference || null)
  const [profiles, setProfiles] = useState<FlavorProfile[]>(initialData?.flavor_profiles || [])

  const toggleProfile = (profile: FlavorProfile) => {
    setProfiles(prev =>
      prev.includes(profile)
        ? prev.filter(p => p !== profile)
        : [...prev, profile]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    onSave({
      name: name.trim(),
      phone: phone.trim() || null,
      notes: notes.trim() || null,
      strength_preference: strength,
      flavor_profiles: profiles,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.6)' }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-modal-title"
        className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--color-bg)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 id="guest-modal-title" className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
            {initialData ? t.guestModalEditTitle : t.guestModalNewTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.guestModalClose}
            className="icon-btn icon-btn-sm icon-btn-ghost"
          >
            <IconClose size={20} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="guest-name" className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-textMuted)' }}>
              {t.guestModalNameLabel}
            </label>
            <input
              id="guest-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t.guestModalNamePlaceholder}
              required
              className="w-full p-3 rounded-xl border text-sm"
              style={{
                background: 'var(--color-bgHover)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="guest-phone" className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-textMuted)' }}>
              {t.guestModalPhoneLabel}
            </label>
            <input
              id="guest-phone"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder={t.guestModalPhonePlaceholder}
              className="w-full p-3 rounded-xl border text-sm"
              style={{
                background: 'var(--color-bgHover)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          {/* Strength Preference */}
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-textMuted)' }}>
              {t.guestModalStrengthLabel}
            </label>
            <div className="flex flex-wrap gap-2">
              {getAllStrengthOptions().map(s => {
                const info = STRENGTH_LABELS[s]
                const isSelected = strength === s
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStrength(isSelected ? null : s)}
                    className={`pill ${isSelected ? 'pill-active' : ''}`}
                    style={
                      isSelected
                        ? { background: 'var(--color-primary)', color: 'var(--color-bg)' }
                        : {}
                    }
                  >
                    <span>{info.emoji}</span>
                    <span>{STRENGTH_LABEL_I18N[s]}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Flavor Profiles */}
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-textMuted)' }}>
              {t.guestModalFlavorsLabel}
            </label>
            <div className="flex flex-wrap gap-2">
              {getAllFlavorProfiles().map(fp => {
                const info = FLAVOR_PROFILE_LABELS[fp]
                const isSelected = profiles.includes(fp)
                return (
                  <button
                    key={fp}
                    type="button"
                    onClick={() => toggleProfile(fp)}
                    className={`pill ${isSelected ? 'pill-active' : ''}`}
                    style={
                      isSelected
                        ? { background: 'var(--color-primary)', color: 'var(--color-bg)' }
                        : {}
                    }
                  >
                    <span>{info.emoji}</span>
                    <span>{FLAVOR_LABEL_I18N[fp]}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="guest-notes" className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-textMuted)' }}>
              {t.guestModalNotesLabel}
            </label>
            <textarea
              id="guest-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t.guestModalNotesPlaceholder}
              rows={3}
              className="w-full p-3 rounded-xl border text-sm resize-none"
              style={{
                background: 'var(--color-bgHover)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn text-sm"
              style={{
                background: 'var(--color-bgHover)',
                color: 'var(--color-text)',
              }}
            >
              {t.guestModalCancel}
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 btn btn-primary text-sm disabled:opacity-50"
            >
              {t.guestModalSave}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
