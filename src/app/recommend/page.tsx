'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ThemeSwitcher from '@/components/ThemeSwitcher'
const AnimatedSmokeBackground = dynamic(() => import('@/components/AnimatedSmokeBackground'), { ssr: false })
import { useAuth } from '@/lib/AuthContext'
import { useInventory } from '@/lib/hooks/useInventory'
import { useGuests } from '@/lib/hooks/useGuests'
import type { Guest } from '@/types/database'
import {
  getRecommendations,
  getAllFlavorProfiles,
  getAllStrengthOptions,
  FLAVOR_PROFILE_LABELS,
  STRENGTH_LABELS,
  type GuestPreferences,
  type StrengthPreference,
  type FlavorProfile,
  type RecommendedMix,
} from '@/logic/recommendationEngine'
import { TOBACCOS, type Tobacco } from '@/data/tobaccos'
import { calculateMix, validateMix, type MixItem } from '@/logic/mixCalculator'
import { distributePercents } from '@/logic/percentDistribution'
import { IconTarget, IconClose } from '@/components/Icons'
import { useTranslation, useLocale, formatDate } from '@/lib/i18n'
import type { SelectedTobacco } from '@/types/shared'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { GuestModal } from './GuestModal'
import { TobaccoResultCard } from './TobaccoResultCard'
import { MixResultCard } from './MixResultCard'

export default function RecommendPage() {
  const t = useTranslation('hookah')
  const { locale } = useLocale()
  const router = useRouter()

  const STRENGTH_LABEL_I18N: Record<StrengthPreference, string> = {
    light: t.strengthLight, medium: t.strengthMedium, strong: t.strengthStrong,
  }
  const FLAVOR_LABEL_I18N: Record<FlavorProfile, string> = {
    fresh: t.flavorFresh, fruity: t.flavorFruity, sweet: t.flavorSweet,
    citrus: t.flavorCitrus, spicy: t.flavorSpicy, soda: t.flavorSoda,
  }
  const { user, profile } = useAuth()
  const { inventory, loading: inventoryLoading } = useInventory()
  const { guests, loading: guestsLoading, addGuest, updateGuest, deleteGuest, recordVisit } = useGuests()
  const isPro = profile?.subscription_tier !== 'trial'

  // Selected preferences
  const [selectedStrength, setSelectedStrength] = useState<StrengthPreference | null>(null)
  const [selectedProfiles, setSelectedProfiles] = useState<FlavorProfile[]>([])
  const [useInventoryFilter, setUseInventoryFilter] = useState(false)

  // Guest state
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [showGuestModal, setShowGuestModal] = useState(false)
  const [showGuestList, setShowGuestList] = useState(false)

  // Mix builder state
  const [selectedTobaccos, setSelectedTobaccos] = useState<SelectedTobacco[]>([])
  const mixBuilderRef = useRef<HTMLDivElement>(null)
  const isInitialMount = useRef(true)

  // Toggle a flavor profile
  const toggleProfile = useCallback((profile: FlavorProfile) => {
    setSelectedProfiles(prev =>
      prev.includes(profile)
        ? prev.filter(p => p !== profile)
        : [...prev, profile]
    )
  }, [])

  // Check if we have valid preferences
  const hasValidPreferences = selectedStrength !== null && selectedProfiles.length > 0

  // Check if guest preferences have changed
  const guestPreferencesChanged = useMemo(() => {
    if (!selectedGuest) return false
    const strengthChanged = selectedStrength !== selectedGuest.strength_preference
    const profilesChanged =
      selectedProfiles.length !== selectedGuest.flavor_profiles.length ||
      selectedProfiles.some(p => !selectedGuest.flavor_profiles.includes(p))
    return strengthChanged || profilesChanged
  }, [selectedGuest, selectedStrength, selectedProfiles])

  // Get recommendations based on preferences
  const recommendations = useMemo(() => {
    if (!hasValidPreferences) return null

    const preferences: GuestPreferences = {
      strength: selectedStrength!,
      flavorProfiles: selectedProfiles,
    }

    const inv = useInventoryFilter && isPro ? inventory : null
    return getRecommendations(preferences, inv)
  }, [selectedStrength, selectedProfiles, hasValidPreferences, useInventoryFilter, isPro, inventory])

  // Select a guest and apply their preferences
  const selectGuest = useCallback((guest: Guest) => {
    setSelectedGuest(guest)
    if (guest.strength_preference) {
      setSelectedStrength(guest.strength_preference)
    }
    if (guest.flavor_profiles && guest.flavor_profiles.length > 0) {
      setSelectedProfiles(guest.flavor_profiles)
    }
    setShowGuestList(false)
  }, [])

  // Reset filters
  const resetFilters = useCallback(() => {
    setSelectedStrength(null)
    setSelectedProfiles([])
    setSelectedTobaccos([])
    setSelectedGuest(null)
  }, [])

  // Add tobacco to mix
  // Mint/fresh tobaccos are capped at 25% to preserve flavor balance
  const addToMix = useCallback((tobacco: Tobacco) => {
    setSelectedTobaccos(prev => {
      if (prev.length >= 3) return prev
      if (prev.some(t => t.tobacco.id === tobacco.id)) return prev

      const newTobaccos = [...prev, { tobacco, percent: 0 }]
      const distribution = distributePercents(newTobaccos.map(t => t.tobacco))
      return newTobaccos.map(t => ({ ...t, percent: distribution[t.tobacco.id] ?? 0 }))
    })
  }, [])

  // Remove tobacco from mix
  const removeFromMix = useCallback((tobaccoId: string) => {
    setSelectedTobaccos(prev => {
      const filtered = prev.filter(t => t.tobacco.id !== tobaccoId)
      if (filtered.length === 0) return []
      const distribution = distributePercents(filtered.map(t => t.tobacco))
      return filtered.map(t => ({ ...t, percent: distribution[t.tobacco.id] ?? 0 }))
    })
  }, [])

  // Update tobacco percentage
  const updatePercent = useCallback((tobaccoId: string, newPercent: number) => {
    setSelectedTobaccos(prev => {
      const idx = prev.findIndex(t => t.tobacco.id === tobaccoId)
      if (idx === -1) return prev

      const clampedPercent = Math.max(0, Math.min(100, Math.round(newPercent)))
      const others = prev.filter((_, i) => i !== idx)
      const remaining = 100 - clampedPercent

      if (others.length === 0) {
        return [{ ...prev[idx], percent: 100 }]
      }

      if (others.length === 1) {
        return prev.map((t, i) =>
          i === idx ? { ...t, percent: clampedPercent } : { ...t, percent: remaining }
        )
      }

      // Distribute remaining among others proportionally
      const othersSum = others.reduce((sum, t) => sum + t.percent, 0) || 1
      return prev.map((t, i) => {
        if (i === idx) return { ...t, percent: clampedPercent }
        const proportion = t.percent / othersSum
        return { ...t, percent: Math.round(remaining * proportion) }
      })
    })
  }, [])

  // Apply a preset mix
  const applyMix = useCallback((mix: RecommendedMix['mix']) => {
    const newTobaccos: SelectedTobacco[] = []

    for (const ingredient of mix.ingredients) {
      // Find matching tobacco
      let tobacco = TOBACCOS.find(
        t => t.flavor.toLowerCase() === ingredient.flavor.toLowerCase() &&
             t.brand.toLowerCase() === (ingredient.brand || '').toLowerCase()
      )
      if (!tobacco) {
        tobacco = TOBACCOS.find(
          t => t.flavor.toLowerCase() === ingredient.flavor.toLowerCase()
        )
      }

      if (tobacco && newTobaccos.length < 3) {
        newTobaccos.push({ tobacco, percent: ingredient.percent })
      }
    }

    if (newTobaccos.length >= 2) {
      setSelectedTobaccos(newTobaccos)
      // Scroll to mix builder after a short delay (only on user action, not on mount)
      if (!isInitialMount.current) {
        setTimeout(() => {
          mixBuilderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    }
  }, [])

  // Save preferences to selected guest
  const saveGuestPreferences = useCallback(async () => {
    if (!selectedGuest || !selectedStrength || selectedProfiles.length === 0) return

    await updateGuest(selectedGuest.id, {
      strength_preference: selectedStrength,
      flavor_profiles: selectedProfiles,
    })
  }, [selectedGuest, selectedStrength, selectedProfiles, updateGuest])

  // Calculate mix result
  const mixItems: MixItem[] = useMemo(() => {
    return selectedTobaccos.map(t => ({
      tobacco: t.tobacco,
      percent: t.percent,
    }))
  }, [selectedTobaccos])

  const validation = useMemo(() => validateMix(mixItems), [mixItems])
  const mixResult = useMemo(() => validation.ok ? calculateMix(mixItems) : null, [mixItems, validation.ok])

  // Mark initial mount complete
  useEffect(() => {
    isInitialMount.current = false
  }, [])

  // Open mix in calculator
  const openInCalculator = useCallback(() => {
    // Store mix data in localStorage for the calculator to pick up
    if (mixResult) {
      localStorage.setItem('hookah-mix-data', JSON.stringify({
        items: mixItems.map(it => ({
          flavor: it.tobacco.flavor,
          brand: it.tobacco.brand,
          percent: it.percent,
          color: it.tobacco.color,
        })),
        result: mixResult,
      }))
      router.push('/mix')
    }
  }, [mixResult, mixItems, router])

  return (
    <ErrorBoundary sectionName="Recommend">
    <div
      className="min-h-screen transition-theme relative overflow-hidden"
      style={{ background: 'var(--color-bg)' }}
    >
      <AnimatedSmokeBackground />

      {/* Header */}
      <header
        className="sticky top-0 z-50 glass border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"
            >
              <video
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                poster="/images/torus-logo.png"
                className="w-full h-full object-cover"
              >
                <source src="/images/logo-animated.mp4" type="video/mp4" />
              </video>
            </Link>
            <div className="hidden sm:block">
              <h1 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                {t.recommendTitle}
              </h1>
              <p className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
                {t.recommendSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/mix"
              className="btn text-sm flex items-center gap-2"
              style={{
                background: 'var(--color-bgHover)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              <span>🎨</span>
              <span className="hidden sm:inline">{t.recommendCalculator}</span>
            </Link>
            <ThemeSwitcher />
            {user ? (
              <Link href="/dashboard" className="btn btn-primary text-sm">
                {t.mixNavDashboard}
              </Link>
            ) : (
              <Link href="/login" className="btn btn-primary text-sm">
                {t.mixNavLogin}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 relative z-10">
        {/* Guest Selection Section */}
        {user && (
          <section className="card card-elevated mb-8 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                  {t.recommendGuestTitle}
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--color-textMuted)' }}>
                  {t.recommendGuestHint}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuestModal(true)}
                className="btn btn-primary text-sm flex items-center gap-2"
              >
                <span>+</span>
                <span className="hidden sm:inline">{t.recommendNewGuest}</span>
              </button>
            </div>

            {/* Selected Guest Badge */}
            {selectedGuest && (
              <div
                className="p-3 rounded-xl mb-4 flex items-center justify-between"
                style={{ background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}
                  >
                    {selectedGuest.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                      {selectedGuest.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
                      {t.recommendVisits(selectedGuest.visit_count)}
                      {selectedGuest.last_visit_at && (
                        <> &middot; {formatDate(selectedGuest.last_visit_at, locale)}</>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGuest(null)
                    resetFilters()
                  }}
                  aria-label={t.recommendResetGuest}
                  className="icon-btn icon-btn-sm icon-btn-ghost"
                >
                  <IconClose size={18} aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Guest List Toggle */}
            {!selectedGuest && guests.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowGuestList(!showGuestList)}
                  className="w-full flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-[var(--color-bgHover)]"
                  style={{ background: 'var(--color-bgAccent)' }}
                >
                  <span className="text-sm" style={{ color: 'var(--color-text)' }}>
                    {t.recommendRegularGuests(guests.length)}
                  </span>
                  <span
                    className={`text-xs transition-transform ${showGuestList ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--color-textMuted)' }}
                  >
                    ▼
                  </span>
                </button>

                {/* Guest List */}
                {showGuestList && (
                  <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                    {guests.map(guest => (
                      <button
                        type="button"
                        key={guest.id}
                        onClick={() => selectGuest(guest)}
                        className="w-full p-3 rounded-xl text-left transition-colors hover:bg-[var(--color-bgHover)] flex items-center gap-3"
                        style={{ background: 'var(--color-bgAccent)' }}
                      >
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}
                        >
                          {guest.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate" style={{ color: 'var(--color-text)' }}>
                            {guest.name}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {guest.strength_preference && (
                              <span
                                className="text-xs px-1.5 py-0.5 rounded"
                                style={{ background: 'var(--color-bgHover)' }}
                              >
                                {STRENGTH_LABELS[guest.strength_preference].emoji} {STRENGTH_LABEL_I18N[guest.strength_preference]}
                              </span>
                            )}
                            {guest.flavor_profiles?.slice(0, 2).map(fp => (
                              <span
                                key={fp}
                                className="text-xs px-1.5 py-0.5 rounded"
                                style={{ background: 'var(--color-bgHover)' }}
                              >
                                {FLAVOR_PROFILE_LABELS[fp].emoji}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
                          {guest.visit_count}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!selectedGuest && guests.length === 0 && !guestsLoading && (
              <p className="text-sm text-center py-4" style={{ color: 'var(--color-textMuted)' }}>
                {t.recommendNoGuests}
              </p>
            )}
          </section>
        )}

        {/* Filter Panel */}
        <section className="card card-elevated mb-8 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                {t.recommendPreferencesTitle}
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--color-textMuted)' }}>
                {t.recommendPreferencesHint}
              </p>
            </div>
            {(hasValidPreferences || selectedTobaccos.length > 0) && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm px-4 py-2 rounded-xl transition-all hover:scale-105"
                style={{
                  background: 'var(--color-bgHover)',
                  color: 'var(--color-textMuted)',
                }}
              >
                {t.recommendReset}
              </button>
            )}
          </div>

          {/* Strength Selection - Visual Meter Style */}
          <div className="mb-6">
            <label
              className="text-sm font-medium mb-3 block"
              style={{ color: 'var(--color-textMuted)' }}
            >
              {t.recommendStrength}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {getAllStrengthOptions().map((strength, index) => {
                const info = STRENGTH_LABELS[strength]
                const isSelected = selectedStrength === strength
                const strengthColors = {
                  light: { bg: 'var(--color-success)', label: t.recommendStrengthLight },
                  medium: { bg: 'var(--color-warning)', label: t.recommendStrengthMedium },
                  strong: { bg: 'var(--color-danger)', label: t.recommendStrengthStrong },
                }
                const colorInfo = strengthColors[strength as keyof typeof strengthColors]

                return (
                  <button
                    type="button"
                    key={strength}
                    onClick={() => setSelectedStrength(isSelected ? null : strength)}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-[var(--color-primary)] shadow-lg scale-[1.02]'
                        : 'border-transparent hover:border-[var(--color-border)]'
                    }`}
                    style={{
                      background: isSelected
                        ? `linear-gradient(135deg, color-mix(in srgb, ${colorInfo.bg} 12%, transparent) 0%, color-mix(in srgb, ${colorInfo.bg} 6%, transparent) 100%)`
                        : 'var(--color-bgHover)',
                    }}
                  >
                    <div className="text-center">
                      <span className="text-2xl mb-2 block">{info.emoji}</span>
                      <span className="font-semibold text-sm block" style={{ color: 'var(--color-text)' }}>
                        {STRENGTH_LABEL_I18N[strength]}
                      </span>
                      <span className="text-xs mt-1 block" style={{ color: 'var(--color-textMuted)' }}>
                        {colorInfo.label}
                      </span>
                      {/* Strength bar indicator */}
                      <div className="flex gap-1 justify-center mt-3">
                        {[1, 2, 3].map(level => (
                          <div
                            key={level}
                            className="w-3 h-1.5 rounded-full transition-all"
                            style={{
                              background: level <= index + 1 ? colorInfo.bg : 'var(--color-border)',
                              opacity: isSelected ? 1 : 0.6,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    {isSelected && (
                      <div
                        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                        style={{ background: 'var(--color-primary)' }}
                      >
                        ✓
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Flavor Profile Selection - Color-coded grid */}
          <div className="mb-6">
            <label
              className="text-sm font-medium mb-3 block"
              style={{ color: 'var(--color-textMuted)' }}
            >
              {t.recommendFlavorProfile} <span className="font-normal">{t.recommendFlavorMultiple}</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {getAllFlavorProfiles().map(profile => {
                const info = FLAVOR_PROFILE_LABELS[profile]
                const isSelected = selectedProfiles.includes(profile)
                // Flavor identity colors — intentionally not theme-variable
                const flavorColors: Record<string, string> = {
                  fresh: '#06b6d4',   // cyan
                  fruity: '#f43f5e',  // rose
                  sweet: '#ec4899',   // pink
                  citrus: '#fbbf24',  // amber
                  spicy: '#84cc16',   // lime
                  soda: '#a855f7',    // purple
                }
                const color = flavorColors[profile] || 'var(--color-primary)'

                return (
                  <button
                    type="button"
                    key={profile}
                    onClick={() => toggleProfile(profile)}
                    className={`relative flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-current shadow-md'
                        : 'border-transparent hover:border-[var(--color-border)]'
                    }`}
                    style={{
                      background: isSelected
                        ? `linear-gradient(135deg, ${color}25 0%, ${color}10 100%)`
                        : 'var(--color-bgHover)',
                      color: isSelected ? color : 'var(--color-text)',
                    }}
                  >
                    <span className="text-lg">{info.emoji}</span>
                    <span className="font-medium text-sm">{FLAVOR_LABEL_I18N[profile]}</span>
                    {isSelected && (
                      <span
                        className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px]"
                        style={{ background: color }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Inventory Toggle (Pro only) */}
          {user && isPro && (
            <div
              className="pt-5 mt-1 border-t"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                    style={{
                      background: useInventoryFilter
                        ? 'color-mix(in srgb, var(--color-success) 15%, transparent)'
                        : 'var(--color-bgHover)',
                    }}
                  >
                    <span className="text-lg">📦</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      {t.recommendInventoryToggle}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
                      {t.recommendInventoryHint}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUseInventoryFilter(prev => !prev)}
                  className={`relative w-12 h-7 rounded-full transition-all flex-shrink-0 ${
                    useInventoryFilter
                      ? 'bg-[var(--color-success)]'
                      : 'bg-[var(--color-bgAccent)] border border-[var(--color-border)]'
                  }`}
                  disabled={inventoryLoading}
                  aria-label={t.recommendInventoryToggleLabel}
                >
                  <span
                    className={`absolute top-1 left-1 w-5 h-5 rounded-full shadow-md transition-transform ${
                      useInventoryFilter
                        ? 'translate-x-5 bg-white'
                        : 'translate-x-0 bg-[var(--color-textMuted)]'
                    }`}
                  />
                </button>
              </label>
            </div>
          )}

          {user && !isPro && profile && (
            <div
              className="pt-4 border-t"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div
                className="p-3 rounded-xl flex items-center gap-3"
                style={{ background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }}
              >
                <span className="text-xl">💎</span>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    {t.recommendProInventory}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
                    {t.recommendProInventoryHint}
                  </p>
                </div>
                <Link
                  href="/settings"
                  className="btn btn-primary text-xs px-3 py-1.5"
                >
                  {t.recommendGoToPro}
                </Link>
              </div>
            </div>
          )}

          {/* Save Guest Preferences Button */}
          {selectedGuest && guestPreferencesChanged && hasValidPreferences && (
            <div
              className="pt-4 border-t"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <button
                type="button"
                onClick={saveGuestPreferences}
                className="w-full btn text-sm flex items-center justify-center gap-2"
                style={{
                  background: 'color-mix(in srgb, var(--color-success) 15%, transparent)',
                  color: 'var(--color-success)',
                }}
              >
                <span>💾</span>
                <span>{t.recommendSavePrefs(selectedGuest.name)}</span>
              </button>
            </div>
          )}
        </section>

        {/* Mix Builder - shows when tobaccos are selected */}
        {selectedTobaccos.length > 0 && (
          <section ref={mixBuilderRef} className="card card-elevated p-5 mb-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                  {t.recommendBuiltMix}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-textMuted)' }}>
                  {t.recommendAdjustSliders}
                </p>
              </div>
              <span
                className="text-2xl font-bold tabular-nums"
                style={{ color: selectedTobaccos.length >= 3 ? 'var(--color-warning)' : 'var(--color-textMuted)' }}
              >
                {selectedTobaccos.length}/3
              </span>
            </div>

            <div className="space-y-6">
              {selectedTobaccos.map(({ tobacco, percent }) => (
                <div key={tobacco.id}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-5 h-5 rounded-full shadow-lg"
                        style={{ background: tobacco.color, boxShadow: `0 0 12px ${tobacco.color}` }}
                      />
                      <div>
                        <p className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                          {tobacco.flavor}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
                          {tobacco.brand}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-3xl font-bold tabular-nums"
                        style={{ color: tobacco.color }}
                      >
                        {percent}%
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromMix(tobacco.id)}
                        aria-label={t.recommendRemoveFromMix(tobacco.flavor)}
                        className="icon-btn icon-btn-sm icon-btn-ghost icon-btn-danger"
                      >
                        <IconClose size={18} aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {/* Slider */}
                  <div className="relative">
                    <div
                      className="absolute top-1/2 -translate-y-1/2 left-0 h-2 rounded-full pointer-events-none"
                      style={{
                        width: `${percent}%`,
                        background: `linear-gradient(90deg, ${tobacco.color} 0%, color-mix(in srgb, ${tobacco.color} 60%, transparent) 100%)`,
                      }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={percent}
                      onChange={(e) => updatePercent(tobacco.id, Number(e.target.value))}
                      aria-label={tobacco.flavor}
                      style={{ ['--slider-color' as string]: tobacco.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Mix Result */}
            {mixResult && (
              <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 rounded-xl" style={{ background: 'var(--color-bgHover)' }}>
                    <p className="text-xs" style={{ color: 'var(--color-textMuted)' }}>{t.recommendCompatibility}</p>
                    <p
                      className="text-2xl font-bold"
                      style={{
                        color: mixResult.compatibility.level === 'perfect' ? 'var(--color-success)' :
                               mixResult.compatibility.level === 'good' ? 'var(--color-primary)' :
                               mixResult.compatibility.level === 'okay' ? 'var(--color-warning)' : 'var(--color-danger)'
                      }}
                    >
                      {mixResult.compatibility.score}%
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-xl" style={{ background: 'var(--color-bgHover)' }}>
                    <p className="text-xs" style={{ color: 'var(--color-textMuted)' }}>{t.recommendStrengthLabel}</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                      {mixResult.finalStrength}
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-xl" style={{ background: 'var(--color-bgHover)' }}>
                    <p className="text-xs" style={{ color: 'var(--color-textMuted)' }}>{t.recommendHeatLabel}</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                      {mixResult.finalHeatLoad}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openInCalculator}
                  className="btn btn-primary w-full text-sm"
                >
                  {t.recommendOpenCalc}
                </button>
              </div>
            )}

            {!validation.ok && selectedTobaccos.length < 2 && (
              <p className="mt-4 text-sm text-center" style={{ color: 'var(--color-textMuted)' }}>
                {t.recommendMinTobaccos}
              </p>
            )}
          </section>
        )}

        {/* Loading state */}
        {useInventoryFilter && inventoryLoading && (
          <div
            className="card card-elevated text-center p-5 py-8 mb-6"
            style={{ color: 'var(--color-textMuted)' }}
          >
            <div className="animate-spin text-2xl mb-3">⏳</div>
            <p className="text-sm">{t.recommendLoadingInventory}</p>
          </div>
        )}

        {/* Results */}
        {!hasValidPreferences ? (
          <div
            className="card card-elevated text-center p-5 py-16"
            style={{ color: 'var(--color-textMuted)' }}
          >
            {/* Animated gradient icon */}
            <div
              className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center relative overflow-hidden"
              style={{
                // Decorative gradient — pink endpoint intentionally not theme-variable
                background: 'linear-gradient(135deg, var(--color-primary) 0%, #ec4899 100%)',
                opacity: 0.9
              }}
            >
              <IconTarget size={40} className="text-white relative z-10" />
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, white 0%, transparent 60%)',
                }}
              />
            </div>
            <p className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              {t.recommendSelectPrefs}
            </p>
            <p className="text-sm max-w-xs mx-auto mb-6">
              {t.recommendSelectPrefsHint}
            </p>
            {/* Quick hint badges */}
            <div className="flex flex-wrap justify-center gap-2">
              <span className="text-xs px-3 py-1.5 rounded-full" style={{ background: 'var(--color-bgHover)' }}>
                {t.recommendHintStrength}
              </span>
              <span className="text-xs px-3 py-1.5 rounded-full" style={{ background: 'var(--color-bgHover)' }}>
                {t.recommendHintProfiles}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Single Tobaccos */}
            {recommendations && recommendations.tobaccos.length > 0 && (
              <section className="card card-elevated p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                    {t.recommendTobaccosTitle}
                  </h3>
                  <span
                    className="text-xs px-2 py-1 rounded-lg"
                    style={{
                      background: 'var(--color-bgHover)',
                      color: 'var(--color-textMuted)',
                    }}
                  >
                    {t.recommendFound(recommendations.tobaccos.length)}
                  </span>
                </div>

                <p className="text-xs mb-4" style={{ color: 'var(--color-textMuted)' }}>
                  {t.recommendClickToAdd}
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {recommendations.tobaccos.map((rec) => (
                    <TobaccoResultCard
                      key={rec.tobacco.id}
                      result={rec}
                      isSelected={selectedTobaccos.some(t => t.tobacco.id === rec.tobacco.id)}
                      isDisabled={selectedTobaccos.length >= 3 && !selectedTobaccos.some(t => t.tobacco.id === rec.tobacco.id)}
                      onSelect={() => {
                        if (selectedTobaccos.some(t => t.tobacco.id === rec.tobacco.id)) {
                          removeFromMix(rec.tobacco.id)
                        } else {
                          addToMix(rec.tobacco)
                        }
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Mixes */}
            {recommendations && recommendations.mixes.length > 0 && (
              <section className="card card-elevated p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                    {t.recommendMixesTitle}
                  </h3>
                  <span
                    className="text-xs px-2 py-1 rounded-lg"
                    style={{
                      background: 'var(--color-bgHover)',
                      color: 'var(--color-textMuted)',
                    }}
                  >
                    {t.recommendFound(recommendations.mixes.length)}
                  </span>
                </div>

                <div className="space-y-3">
                  {recommendations.mixes.map((rec) => (
                    <MixResultCard
                      key={rec.mix.id}
                      result={rec}
                      onApply={() => applyMix(rec.mix)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* No results */}
            {recommendations &&
              recommendations.tobaccos.length === 0 &&
              recommendations.mixes.length === 0 && (
                <div
                  className="card card-elevated text-center p-5 py-12"
                  style={{ color: 'var(--color-textMuted)' }}
                >
                  <div className="text-4xl mb-4">😔</div>
                  <p className="text-lg font-medium" style={{ color: 'var(--color-text)' }}>
                    {t.recommendNoResults}
                  </p>
                  <p className="text-sm mt-1">
                    {t.recommendNoResultsHint}
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-4 btn text-sm"
                    style={{
                      background: 'var(--color-bgHover)',
                      color: 'var(--color-text)',
                    }}
                  >
                    {t.recommendResetFilters}
                  </button>
                </div>
              )}
          </div>
        )}
      </main>

      {/* Guest Creation Modal */}
      {showGuestModal && (
        <GuestModal
          onClose={() => setShowGuestModal(false)}
          onSave={async (guest) => {
            const newGuest = await addGuest(guest)
            if (newGuest) {
              selectGuest(newGuest)
            }
            setShowGuestModal(false)
          }}
        />
      )}
    </div>
    </ErrorBoundary>
  )
}
