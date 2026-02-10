'use client'

import React, { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import AnimatedSmokeBackground from '@/components/AnimatedSmokeBackground'
import { useAuth } from '@/lib/AuthContext'
import { useInventory } from '@/lib/hooks/useInventory'
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
import { CATEGORY_EMOJI } from '@/data/tobaccos'

export default function RecommendPage() {
  const { user, profile } = useAuth()
  const { inventory, loading: inventoryLoading } = useInventory()
  const isPro = profile?.subscription_tier === 'pro'

  // Selected preferences
  const [selectedStrength, setSelectedStrength] = useState<StrengthPreference | null>(null)
  const [selectedProfiles, setSelectedProfiles] = useState<FlavorProfile[]>([])
  const [useInventoryFilter, setUseInventoryFilter] = useState(false)

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

  // Reset filters
  const resetFilters = useCallback(() => {
    setSelectedStrength(null)
    setSelectedProfiles([])
  }, [])

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
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
              style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}
            >
              HM
            </Link>
            <div className="hidden sm:block">
              <h1 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                Подбор микса
              </h1>
              <p className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
                По предпочтениям гостя
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
              <span className="hidden sm:inline">Калькулятор</span>
            </Link>
            <ThemeSwitcher />
            {user ? (
              <Link href="/dashboard" className="btn btn-primary text-sm">
                Кабинет
              </Link>
            ) : (
              <Link href="/login" className="btn btn-primary text-sm">
                Войти
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 relative z-10">
        {/* Filter Panel */}
        <section className="card card-elevated mb-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                Предпочтения гостя
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-textMuted)' }}>
                Выберите крепость и вкусовой профиль
              </p>
            </div>
            {hasValidPreferences && (
              <button
                onClick={resetFilters}
                className="text-sm px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  background: 'var(--color-bgHover)',
                  color: 'var(--color-textMuted)',
                }}
              >
                Сбросить
              </button>
            )}
          </div>

          {/* Strength Selection */}
          <div className="mb-5">
            <label
              className="text-sm font-medium mb-3 block"
              style={{ color: 'var(--color-textMuted)' }}
            >
              Крепость
            </label>
            <div className="flex flex-wrap gap-2">
              {getAllStrengthOptions().map(strength => {
                const info = STRENGTH_LABELS[strength]
                const isSelected = selectedStrength === strength
                return (
                  <button
                    key={strength}
                    onClick={() => setSelectedStrength(isSelected ? null : strength)}
                    className={`pill ${isSelected ? 'pill-active' : ''}`}
                    style={
                      isSelected
                        ? { background: 'var(--color-primary)', color: 'var(--color-bg)' }
                        : {}
                    }
                  >
                    <span>{info.emoji}</span>
                    <span>{info.labelRu}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Flavor Profile Selection */}
          <div className="mb-5">
            <label
              className="text-sm font-medium mb-3 block"
              style={{ color: 'var(--color-textMuted)' }}
            >
              Вкусовой профиль (можно несколько)
            </label>
            <div className="flex flex-wrap gap-2">
              {getAllFlavorProfiles().map(profile => {
                const info = FLAVOR_PROFILE_LABELS[profile]
                const isSelected = selectedProfiles.includes(profile)
                return (
                  <button
                    key={profile}
                    onClick={() => toggleProfile(profile)}
                    className={`pill ${isSelected ? 'pill-active' : ''}`}
                    style={
                      isSelected
                        ? { background: 'var(--color-primary)', color: 'var(--color-bg)' }
                        : {}
                    }
                  >
                    <span>{info.emoji}</span>
                    <span>{info.labelRu}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Inventory Toggle (Pro only) */}
          {user && isPro && (
            <div
              className="pt-4 border-t flex items-center justify-between"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  Учитывать инвентарь
                </p>
                <p className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
                  Показывать только то, что есть в наличии
                </p>
              </div>
              <button
                onClick={() => setUseInventoryFilter(prev => !prev)}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  useInventoryFilter ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-bgHover)]'
                }`}
                disabled={inventoryLoading}
              >
                <span
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    useInventoryFilter ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
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
                    Pro: Учёт инвентаря
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
                    Рекомендации с учётом наличия на складе
                  </p>
                </div>
                <Link
                  href="/settings"
                  className="btn btn-primary text-xs px-3 py-1.5"
                >
                  Перейти на Pro
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Loading state */}
        {useInventoryFilter && inventoryLoading && (
          <div
            className="card card-elevated text-center py-8 mb-6"
            style={{ color: 'var(--color-textMuted)' }}
          >
            <div className="animate-spin text-2xl mb-3">⏳</div>
            <p className="text-sm">Загрузка инвентаря...</p>
          </div>
        )}

        {/* Results */}
        {!hasValidPreferences ? (
          <div
            className="card card-elevated text-center py-12"
            style={{ color: 'var(--color-textMuted)' }}
          >
            <div className="text-4xl mb-4">🎯</div>
            <p className="text-lg font-medium" style={{ color: 'var(--color-text)' }}>
              Выберите предпочтения
            </p>
            <p className="text-sm mt-1">
              Укажите крепость и хотя бы один вкусовой профиль
            </p>
          </div>
        ) : (
          <div className="space-y-6 animate-fadeInUp">
            {/* Single Tobaccos */}
            {recommendations && recommendations.tobaccos.length > 0 && (
              <section className="card card-elevated">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                    Рекомендуемые табаки
                  </h3>
                  <span
                    className="text-xs px-2 py-1 rounded-lg"
                    style={{
                      background: 'var(--color-bgHover)',
                      color: 'var(--color-textMuted)',
                    }}
                  >
                    {recommendations.tobaccos.length} найдено
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {recommendations.tobaccos.map((rec, idx) => (
                    <TobaccoResultCard
                      key={rec.tobacco.id}
                      result={rec}
                      style={{ animationDelay: `${idx * 50}ms` }}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Mixes */}
            {recommendations && recommendations.mixes.length > 0 && (
              <section className="card card-elevated">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                    Рекомендуемые миксы
                  </h3>
                  <span
                    className="text-xs px-2 py-1 rounded-lg"
                    style={{
                      background: 'var(--color-bgHover)',
                      color: 'var(--color-textMuted)',
                    }}
                  >
                    {recommendations.mixes.length} найдено
                  </span>
                </div>

                <div className="space-y-3">
                  {recommendations.mixes.map((rec, idx) => (
                    <MixResultCard
                      key={rec.mix.id}
                      result={rec}
                      style={{ animationDelay: `${idx * 50}ms` }}
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
                  className="card card-elevated text-center py-12"
                  style={{ color: 'var(--color-textMuted)' }}
                >
                  <div className="text-4xl mb-4">😔</div>
                  <p className="text-lg font-medium" style={{ color: 'var(--color-text)' }}>
                    Ничего не найдено
                  </p>
                  <p className="text-sm mt-1">
                    Попробуйте изменить параметры поиска
                  </p>
                  <button
                    onClick={resetFilters}
                    className="mt-4 btn text-sm"
                    style={{
                      background: 'var(--color-bgHover)',
                      color: 'var(--color-text)',
                    }}
                  >
                    Сбросить фильтры
                  </button>
                </div>
              )}
          </div>
        )}
      </main>
    </div>
  )
}

// Tobacco Result Card Component
function TobaccoResultCard({
  result,
  style,
}: {
  result: RecommendedTobacco
  style?: React.CSSProperties
}) {
  const { tobacco, matchScore, matchReasons, inStock, stockQuantity } = result
  const categoryEmoji = CATEGORY_EMOJI[tobacco.category] || '🔸'

  return (
    <div
      className="p-4 rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg animate-fadeInUp"
      style={{
        background: 'var(--color-bgHover)',
        borderLeft: `4px solid ${tobacco.color}`,
        ...style,
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
              Сила: {tobacco.strength}/10
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
              {inStock ? `${stockQuantity}г` : 'Нет в наличии'}
            </div>
          )}
          <div
            className="text-xs font-medium"
            style={{ color: 'var(--color-primary)' }}
          >
            {matchScore}% match
          </div>
        </div>
      </div>
    </div>
  )
}

// Mix Result Card Component
function MixResultCard({
  result,
  style,
}: {
  result: RecommendedMix
  style?: React.CSSProperties
}) {
  const { mix, matchScore, matchReasons, availability, missingTobaccos, replacements } = result
  const [isExpanded, setIsExpanded] = useState(false)

  const availabilityBadge = availability && {
    full: { text: 'Всё в наличии', color: 'var(--color-success)' },
    partial: { text: 'Частично', color: 'var(--color-warning)' },
    none: { text: 'Нет в наличии', color: 'var(--color-danger)' },
  }[availability]

  return (
    <div
      className="p-4 rounded-xl transition-all hover:shadow-lg animate-fadeInUp"
      style={{ background: 'var(--color-bgHover)', ...style }}
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
            {matchScore}% match
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
            Состав:
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
                Отсутствует:
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
                    Замены:
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

          {/* Apply button - link to calculator */}
          <div className="mt-4">
            <Link
              href={`/mix?recipe=${mix.id}`}
              className="btn btn-primary w-full text-sm"
            >
              Открыть в калькуляторе
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
