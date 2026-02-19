'use client'

import { useEffect, useRef } from 'react'
import { useInventory } from '@/lib/hooks/useInventory'
import { useSessions } from '@/lib/hooks/useSessions'
import { useStatistics } from '@/lib/hooks/useStatistics'
import { useSavedMixes } from '@/lib/hooks/useSavedMixes'
import { useNotificationSettings } from '@/lib/hooks/useNotificationSettings'
import { triggerLowStockNotification } from '@/lib/hooks/usePushNotifications'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { ConsumptionChart } from '@/components/dashboard/Charts/ConsumptionChart'
import { PopularFlavorsChart } from '@/components/dashboard/Charts/PopularFlavorsChart'
import { formatForecastDays, getForecastColor } from '@/lib/utils/forecast'
import {
  IconSession,
  IconScale,
  IconStar,
  IconPercent,
  IconWarning,
  IconSmoke,
} from '@/components/Icons'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { useLocale } from '@/lib/i18n'

const LOCALE_MAP: Record<string, string> = { ru: 'ru-RU', en: 'en-US', de: 'de-DE' }

export function HookahSection() {
  const t = useTranslation('manage')
  const { locale } = useLocale()
  const { inventory } = useInventory()
  const { sessions } = useSessions()
  const { settings: notificationSettings } = useNotificationSettings()
  const lowStockThreshold = notificationSettings?.low_stock_threshold || 50
  const { statistics, loading } = useStatistics({ lowStockThreshold })
  const { savedMixes } = useSavedMixes()

  const lowStockItems = inventory.filter(item => item.quantity_grams < lowStockThreshold && item.quantity_grams > 0)
  const lowStockCount = lowStockItems.length
  const outOfStockCount = inventory.filter(item => item.quantity_grams <= 0).length

  // Trigger push notification for low stock (once per session)
  const notifiedRef = useRef(false)
  useEffect(() => {
    if (
      notifiedRef.current ||
      lowStockItems.length === 0 ||
      !notificationSettings?.low_stock_enabled
    ) return

    const timer = setTimeout(() => {
      triggerLowStockNotification(
        lowStockItems.map(item => ({
          brand: item.brand,
          flavor: item.flavor,
          quantity: item.quantity_grams,
        }))
      )
      notifiedRef.current = true
    }, 2000)

    return () => clearTimeout(timer)
  }, [lowStockItems, notificationSettings?.low_stock_enabled])

  const topMixes = [...savedMixes]
    .sort((a, b) => b.usage_count - a.usage_count)
    .slice(0, 3)

  const endingSoon = statistics?.forecasts
    ?.filter(item =>
      item.forecast.daysUntilEmpty !== null &&
      item.forecast.daysUntilEmpty > 0 &&
      item.forecast.daysUntilEmpty <= 14
    )
    .sort((a, b) => (a.forecast.daysUntilEmpty || 0) - (b.forecast.daysUntilEmpty || 0))
    .slice(0, 4) || []

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={<IconSession size={20} />}
          label={t.labelSessions}
          value={statistics?.totalSessions || 0}
          color="primary"
        />
        <StatsCard
          icon={<IconScale size={20} />}
          label={t.labelConsumption}
          value={`${statistics?.totalGramsUsed || 0}g`}
          subtext={t.subtextTobaccoUsed}
          color="success"
        />
        <StatsCard
          icon={<IconStar size={20} />}
          label={t.labelRating}
          value={statistics?.averageRating ? `${statistics.averageRating}/5` : '—'}
          subtext={t.subtextAvgRating}
          color="warning"
        />
        <StatsCard
          icon={<IconPercent size={20} />}
          label={t.labelCompatibility}
          value={statistics?.averageCompatibilityScore ? `${statistics.averageCompatibilityScore}%` : '—'}
          subtext={t.subtextAverage}
          color="primary"
        />
      </div>

      {/* Alerts */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="card p-4 border-[var(--color-warning)]/50 bg-[var(--color-warning)]/5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-warning)]/20 flex items-center justify-center text-[var(--color-warning)]">
              <IconWarning size={20} />
            </div>
            <div>
              <h3 className="font-semibold">{t.inventoryAlert}</h3>
              <p className="text-sm text-[var(--color-textMuted)]">
                {outOfStockCount > 0 && (
                  <span className="text-[var(--color-danger)]">{t.itemsOutOfStock(outOfStockCount)}</span>
                )}
                {lowStockCount > 0 && (
                  <span className="text-[var(--color-warning)]">{t.itemsLowStock(lowStockCount)}</span>
                )}
              </p>
              <Link href="/inventory" className="text-sm text-[var(--color-primary)] hover:underline mt-2 inline-block">
                {t.checkInventory}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">{t.tobaccoConsumption}</h2>
            <Link href="/statistics" className="text-sm text-[var(--color-primary)] hover:underline">
              {t.moreDetails}
            </Link>
          </div>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <ConsumptionChart data={statistics?.dailyConsumption || []} />
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">{t.popularFlavors}</h2>
            <Link href="/statistics" className="text-sm text-[var(--color-primary)] hover:underline">
              {t.moreDetails}
            </Link>
          </div>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <PopularFlavorsChart data={statistics?.consumptionByFlavor || []} />
          )}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{t.recentSessions}</h2>
          <Link href="/sessions" className="text-sm text-[var(--color-primary)] hover:underline">
            {t.allSessions}
          </Link>
        </div>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-[var(--color-textMuted)]">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[var(--color-bgHover)] flex items-center justify-center">
              <IconSmoke size={24} />
            </div>
            <p>{t.noSessionsYet}</p>
            <p className="text-sm mt-2">{t.createFirstMix}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-xl bg-[var(--color-bgHover)] flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                    <IconSmoke size={20} />
                  </div>
                  <div>
                    <div className="font-medium">
                      {session.session_items?.map(i => i.flavor).join(' + ') || t.mixFallback}
                    </div>
                    <div className="text-sm text-[var(--color-textMuted)]">
                      {new Date(session.session_date).toLocaleDateString(LOCALE_MAP[locale] || 'ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${
                    (session.compatibility_score || 0) >= 80 ? 'text-[var(--color-success)]' :
                    (session.compatibility_score || 0) >= 60 ? 'text-[var(--color-primary)]' :
                    'text-[var(--color-warning)]'
                  }`}>
                    {session.compatibility_score || '—'}%
                  </div>
                  <div className="text-sm text-[var(--color-textMuted)]">{session.total_grams}g</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ending Soon Widget */}
      {endingSoon.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">{t.endingSoon}</h2>
            <Link href="/inventory" className="text-sm text-[var(--color-primary)] hover:underline">
              {t.inventoryLink}
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {endingSoon.map((item) => {
              const color = getForecastColor(item.forecast.daysUntilEmpty)
              const colorVar = color === 'danger' ? 'var(--color-danger)' :
                               color === 'warning' ? 'var(--color-warning)' :
                               'var(--color-success)'
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-[var(--color-bgHover)]"
                  style={{ borderLeft: `3px solid ${colorVar}` }}
                >
                  <div className="font-medium">{item.flavor}</div>
                  <div className="text-xs text-[var(--color-textMuted)]">{item.brand}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-[var(--color-textMuted)]">
                      {item.quantity_grams.toFixed(0)}g
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: colorVar }}
                    >
                      {formatForecastDays(item.forecast.daysUntilEmpty)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Favorite Mixes Widget */}
      {topMixes.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">{t.popularMixes}</h2>
            <Link href="/mix" className="text-sm text-[var(--color-primary)] hover:underline">
              {t.allMixes}
            </Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {topMixes.map((mix) => (
              <Link
                key={mix.id}
                href="/mix"
                className="p-4 rounded-xl bg-[var(--color-bgHover)] hover:scale-[1.02] transition-transform"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{mix.name}</span>
                  {mix.is_favorite && <IconStar size={14} className="text-[var(--color-warning)]" />}
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {mix.tobaccos.slice(0, 3).map((t, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded text-xs"
                      style={{ border: `1px solid ${t.color}` }}
                    >
                      {t.flavor}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--color-textMuted)]">
                  <span>{t.usedCount(mix.usage_count)}</span>
                  {mix.compatibility_score && (
                    <span className={
                      mix.compatibility_score >= 80 ? 'text-[var(--color-success)]' :
                      mix.compatibility_score >= 60 ? 'text-[var(--color-primary)]' :
                      'text-[var(--color-warning)]'
                    }>
                      {mix.compatibility_score}%
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
