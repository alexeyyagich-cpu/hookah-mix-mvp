'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import AnimatedSmokeBackground from '@/components/AnimatedSmokeBackground'
import { useAuth } from '@/lib/AuthContext'
import { useInventory } from '@/lib/hooks/useInventory'
import { useGuests, type NewGuest } from '@/lib/hooks/useGuests'
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
  type RecommendedTobacco,
  type RecommendedMix,
} from '@/logic/recommendationEngine'
import { TOBACCOS, CATEGORY_EMOJI, type Tobacco } from '@/data/tobaccos'
import { calculateMix, validateMix, type MixItem } from '@/logic/mixCalculator'
import { IconTarget } from '@/components/Icons'
import { useTranslation, useLocale } from '@/lib/i18n'

const LOCALE_MAP: Record<string, string> = { ru: 'ru-RU', en: 'en-US', de: 'de-DE' }

// Mix item for the builder
interface SelectedTobacco {
  tobacco: Tobacco
  percent: number
}

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
  const isPro = profile?.subscription_tier === 'pro'

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

      // Calculate percentages with special caps
      const SUPERNOVA_ID = 'ds1' // Darkside Supernova - max 2g per 20g bowl = 10%
      const supernovaCap = 10
      const mintCap = 25

      const hasSupernova = newTobaccos.some(t => t.tobacco.id === SUPERNOVA_ID)
      const mintTobaccos = newTobaccos.filter(t => t.tobacco.category === 'mint' && t.tobacco.id !== SUPERNOVA_ID)
      const nonMintTobaccos = newTobaccos.filter(t => t.tobacco.category !== 'mint' && t.tobacco.id !== SUPERNOVA_ID)

      // Calculate totals with caps
      const supernovaTotal = hasSupernova ? supernovaCap : 0
      const mintTotal = mintTobaccos.length * mintCap
      const nonMintTotal = 100 - supernovaTotal - mintTotal

      // Distribute remaining to non-mint tobaccos
      const nonMintPercent = nonMintTobaccos.length > 0
        ? Math.floor(nonMintTotal / nonMintTobaccos.length)
        : 0
      const remainder = nonMintTobaccos.length > 0
        ? nonMintTotal - nonMintPercent * nonMintTobaccos.length
        : 0

      let nonMintIndex = 0
      return newTobaccos.map((t) => {
        if (t.tobacco.id === SUPERNOVA_ID) {
          return { ...t, percent: supernovaCap }
        } else if (t.tobacco.category === 'mint') {
          return { ...t, percent: mintCap }
        } else {
          const percent = nonMintPercent + (nonMintIndex === 0 ? remainder : 0)
          nonMintIndex++
          return { ...t, percent }
        }
      })
    })
  }, [])

  // Remove tobacco from mix
  const removeFromMix = useCallback((tobaccoId: string) => {
    setSelectedTobaccos(prev => {
      const filtered = prev.filter(t => t.tobacco.id !== tobaccoId)
      if (filtered.length === 0) return []

      // Calculate percentages with special caps
      const SUPERNOVA_ID = 'ds1'
      const supernovaCap = 10
      const mintCap = 25

      const hasSupernova = filtered.some(t => t.tobacco.id === SUPERNOVA_ID)
      const mintTobaccos = filtered.filter(t => t.tobacco.category === 'mint' && t.tobacco.id !== SUPERNOVA_ID)
      const nonMintTobaccos = filtered.filter(t => t.tobacco.category !== 'mint' && t.tobacco.id !== SUPERNOVA_ID)

      // Calculate totals with caps
      const supernovaTotal = hasSupernova ? supernovaCap : 0
      const mintTotal = mintTobaccos.length * mintCap
      const nonMintTotal = 100 - supernovaTotal - mintTotal

      // Distribute remaining to non-mint tobaccos
      const nonMintPercent = nonMintTobaccos.length > 0
        ? Math.floor(nonMintTotal / nonMintTobaccos.length)
        : 0
      const remainder = nonMintTobaccos.length > 0
        ? nonMintTotal - nonMintPercent * nonMintTobaccos.length
        : 0

      let nonMintIndex = 0
      return filtered.map((t) => {
        if (t.tobacco.id === SUPERNOVA_ID) {
          return { ...t, percent: supernovaCap }
        } else if (t.tobacco.category === 'mint') {
          return { ...t, percent: mintCap }
        } else {
          const percent = nonMintPercent + (nonMintIndex === 0 ? remainder : 0)
          nonMintIndex++
          return { ...t, percent }
        }
      })
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
              href="/mix"
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
                        <> &middot; {new Date(selectedGuest.last_visit_at).toLocaleDateString(LOCALE_MAP[locale] || 'ru-RU')}</>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedGuest(null)
                    resetFilters()
                  }}
                  aria-label={t.recommendResetGuest}
                  className="icon-btn icon-btn-sm icon-btn-ghost"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
            )}

            {/* Guest List Toggle */}
            {!selectedGuest && guests.length > 0 && (
              <div>
                <button
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
                  light: { bg: '#22c55e', label: t.recommendStrengthLight },
                  medium: { bg: '#f59e0b', label: t.recommendStrengthMedium },
                  strong: { bg: '#ef4444', label: t.recommendStrengthStrong },
                }
                const colorInfo = strengthColors[strength as keyof typeof strengthColors]

                return (
                  <button
                    key={strength}
                    onClick={() => setSelectedStrength(isSelected ? null : strength)}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-[var(--color-primary)] shadow-lg scale-[1.02]'
                        : 'border-transparent hover:border-[var(--color-border)]'
                    }`}
                    style={{
                      background: isSelected
                        ? `linear-gradient(135deg, ${colorInfo.bg}20 0%, ${colorInfo.bg}10 100%)`
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
                // Color coding for each flavor type
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
                        onClick={() => removeFromMix(tobacco.id)}
                        aria-label={t.recommendRemoveFromMix(tobacco.flavor)}
                        className="icon-btn icon-btn-sm icon-btn-ghost icon-btn-danger"
                      >
                        <span aria-hidden="true">×</span>
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
  )
}

// Guest Modal Component
function GuestModal({
  onClose,
  onSave,
  initialData,
}: {
  onClose: () => void
  onSave: (guest: NewGuest) => void
  initialData?: Guest
}) {
  const t = useTranslation('hookah')

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
        className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--color-bg)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
            {initialData ? t.guestModalEditTitle : t.guestModalNewTitle}
          </h2>
          <button
            onClick={onClose}
            aria-label={t.guestModalClose}
            className="icon-btn icon-btn-sm icon-btn-ghost"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-textMuted)' }}>
              {t.guestModalNameLabel}
            </label>
            <input
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
            <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-textMuted)' }}>
              {t.guestModalPhoneLabel}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+48 512 345 678"
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
            <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-textMuted)' }}>
              {t.guestModalNotesLabel}
            </label>
            <textarea
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

// Tobacco Result Card Component
function TobaccoResultCard({
  result,
  isSelected,
  isDisabled,
  onSelect,
}: {
  result: RecommendedTobacco
  isSelected: boolean
  isDisabled: boolean
  onSelect: () => void
}) {
  const t = useTranslation('hookah')
  const { tobacco, matchScore, inStock, stockQuantity } = result
  const categoryEmoji = CATEGORY_EMOJI[tobacco.category] || '🔸'

  return (
    <button
      onClick={onSelect}
      disabled={isDisabled}
      className={`p-4 rounded-xl transition-all text-left w-full ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-lg cursor-pointer'
      } ${isSelected ? 'ring-2' : ''}`}
      style={{
        background: 'var(--color-bgHover)',
        borderLeft: `4px solid ${tobacco.color}`,
        ['--tw-ring-color' as string]: isSelected ? tobacco.color : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: tobacco.color }}
            />
            <span className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>
              {tobacco.flavor}
            </span>
            {isSelected && (
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: tobacco.color, color: 'white' }}>
                ✓
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
            {tobacco.brand}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: 'var(--color-bgAccent)' }}
            >
              {categoryEmoji} {tobacco.category}
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: 'var(--color-bgAccent)' }}
            >
              {t.recommendStrengthBadge(tobacco.strength)}
            </span>
          </div>
        </div>

        <div className="text-right">
          {inStock !== null && (
            <div
              className={`text-xs px-2 py-1 rounded-lg mb-1 ${
                inStock ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
              }`}
              style={{
                background: inStock
                  ? 'color-mix(in srgb, var(--color-success) 15%, transparent)'
                  : 'color-mix(in srgb, var(--color-danger) 15%, transparent)',
              }}
            >
              {inStock ? `${stockQuantity}${t.gramsShort}` : t.recommendOutOfStock}
            </div>
          )}
          <div
            className="text-xs font-medium"
            style={{ color: 'var(--color-primary)' }}
          >
            {t.matchPercent(matchScore)}
          </div>
        </div>
      </div>
    </button>
  )
}

// Mix Result Card Component
function MixResultCard({
  result,
  onApply,
}: {
  result: RecommendedMix
  onApply: () => void
}) {
  const t = useTranslation('hookah')
  const { mix, matchScore, matchReasons, availability, missingTobaccos, replacements } = result
  const [isExpanded, setIsExpanded] = useState(false)

  const availabilityBadge = availability && {
    full: { text: t.recommendAvailFull, color: 'var(--color-success)' },
    partial: { text: t.recommendAvailPartial, color: 'var(--color-warning)' },
    none: { text: t.recommendAvailNone, color: 'var(--color-danger)' },
  }[availability]

  return (
    <div
      className="p-4 rounded-xl transition-all hover:shadow-lg"
      style={{ background: 'var(--color-bgHover)' }}
    >
      <div
        className="flex items-start justify-between gap-3 cursor-pointer"
        onClick={() => setIsExpanded(prev => !prev)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
              {mix.name}
            </span>
            <div className="flex gap-0.5">
              {[...Array(mix.popularity)].map((_, i) => (
                <span key={i} className="text-xs" style={{ color: 'var(--color-warning)' }}>
                  ★
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs line-clamp-1" style={{ color: 'var(--color-textMuted)' }}>
            {mix.description}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {matchReasons.slice(0, 3).map((reason, i) => (
              <span
                key={i}
                className="text-xs px-1.5 py-0.5 rounded"
                style={{
                  background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
                  color: 'var(--color-primary)',
                }}
              >
                {reason}
              </span>
            ))}
          </div>
        </div>

        <div className="text-right flex flex-col items-end gap-1">
          {availabilityBadge && (
            <div
              className="text-xs px-2 py-1 rounded-lg"
              style={{
                background: `color-mix(in srgb, ${availabilityBadge.color} 15%, transparent)`,
                color: availabilityBadge.color,
              }}
            >
              {availabilityBadge.text}
            </div>
          )}
          <div
            className="text-xs font-medium"
            style={{ color: 'var(--color-primary)' }}
          >
            {t.matchPercent(matchScore)}
          </div>
          <span
            className={`text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            style={{ color: 'var(--color-textMuted)' }}
          >
            ▼
          </span>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <p
            className="text-xs font-medium mb-2"
            style={{ color: 'var(--color-textMuted)' }}
          >
            {t.recommendComposition}
          </p>
          <div className="space-y-1.5">
            {mix.ingredients.map((ing, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--color-text)' }}>
                  {ing.brand ? `${ing.brand} ` : ''}{ing.flavor}
                </span>
                <span style={{ color: 'var(--color-textMuted)' }}>{ing.percent}%</span>
              </div>
            ))}
          </div>

          {/* Missing tobaccos & replacements */}
          {missingTobaccos.length > 0 && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <p
                className="text-xs font-medium mb-2"
                style={{ color: 'var(--color-warning)' }}
              >
                {t.recommendMissing}
              </p>
              <ul className="text-xs space-y-1" style={{ color: 'var(--color-textMuted)' }}>
                {missingTobaccos.map((t, i) => (
                  <li key={i}>• {t}</li>
                ))}
              </ul>

              {replacements.length > 0 && (
                <div className="mt-2">
                  <p
                    className="text-xs font-medium mb-1"
                    style={{ color: 'var(--color-success)' }}
                  >
                    {t.recommendReplacements}
                  </p>
                  <ul className="text-xs space-y-1" style={{ color: 'var(--color-textMuted)' }}>
                    {replacements.map((r, i) => (
                      <li key={i}>
                        {r.originalFlavor} → {r.replacement.brand} {r.replacement.flavor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Apply button */}
          <div className="mt-4">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onApply()
              }}
              className="btn btn-primary w-full text-sm"
            >
              {t.recommendUseMix}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
