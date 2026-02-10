'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/lib/AuthContext'
import { useInventory } from '@/lib/hooks/useInventory'
import { useSessions } from '@/lib/hooks/useSessions'
import { useStatistics } from '@/lib/hooks/useStatistics'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { useSavedMixes } from '@/lib/hooks/useSavedMixes'
import { useNotificationSettings } from '@/lib/hooks/useNotificationSettings'
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
  IconCalculator,
  IconArrowRight,
} from '@/components/Icons'
import Link from 'next/link'

export default function DashboardPage() {
  const { profile } = useAuth()
  const { inventory } = useInventory()
  const { sessions } = useSessions()
  const { settings: notificationSettings } = useNotificationSettings()
  const lowStockThreshold = notificationSettings?.low_stock_threshold || 50
  const { statistics, loading } = useStatistics({ lowStockThreshold })
  const { isFreeTier, tier } = useSubscription()
  const { savedMixes } = useSavedMixes()

  const lowStockCount = inventory.filter(item => item.quantity_grams < lowStockThreshold && item.quantity_grams > 0).length
  const outOfStockCount = inventory.filter(item => item.quantity_grams <= 0).length

  // Background portal
  const [bgContainer, setBgContainer] = useState<HTMLElement | null>(null)
  useEffect(() => {
    setBgContainer(document.getElementById('page-background'))
    return () => setBgContainer(null)
  }, [])

  // Get top 3 saved mixes by usage
  const topMixes = [...savedMixes]
    .sort((a, b) => b.usage_count - a.usage_count)
    .slice(0, 3)

  // Get items that will run out soon (within 14 days)
  const endingSoon = statistics?.forecasts
    ?.filter(item =>
      item.forecast.daysUntilEmpty !== null &&
      item.forecast.daysUntilEmpty > 0 &&
      item.forecast.daysUntilEmpty <= 14
    )
    .sort((a, b) => (a.forecast.daysUntilEmpty || 0) - (b.forecast.daysUntilEmpty || 0))
    .slice(0, 4) || []

  return (
    <div className="space-y-8 relative">
      {/* Background Image via Portal */}
      {bgContainer && createPortal(
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: 'url(/images/dashboard-bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }}
        />,
        bgContainer
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Привет, {profile?.owner_name || 'Владелец'}!
          </h1>
          <p className="text-[var(--color-textMuted)]">
            {profile?.business_name || 'Мое заведение'} — обзор за последние 30 дней
          </p>
        </div>
        <Link href="/mix" className="btn btn-primary flex items-center gap-2">
          <IconCalculator size={18} />
          Калькулятор миксов
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={<IconSession size={20} />}
          label="Сессий"
          value={statistics?.totalSessions || 0}
          color="primary"
        />
        <StatsCard
          icon={<IconScale size={20} />}
          label="Расход"
          value={`${statistics?.totalGramsUsed || 0}г`}
          subtext="табака использовано"
          color="success"
        />
        <StatsCard
          icon={<IconStar size={20} />}
          label="Рейтинг"
          value={statistics?.averageRating ? `${statistics.averageRating}/5` : '—'}
          subtext="средняя оценка"
          color="warning"
        />
        <StatsCard
          icon={<IconPercent size={20} />}
          label="Совместимость"
          value={statistics?.averageCompatibilityScore ? `${statistics.averageCompatibilityScore}%` : '—'}
          subtext="в среднем"
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
              <h3 className="font-semibold">Внимание к инвентарю</h3>
              <p className="text-sm text-[var(--color-textMuted)]">
                {outOfStockCount > 0 && (
                  <span className="text-[var(--color-danger)]">{outOfStockCount} позиций закончились. </span>
                )}
                {lowStockCount > 0 && (
                  <span className="text-[var(--color-warning)]">{lowStockCount} позиций на исходе.</span>
                )}
              </p>
              <Link href="/inventory" className="text-sm text-[var(--color-primary)] hover:underline mt-2 inline-block">
                Проверить инвентарь →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Consumption Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Расход табака</h2>
            <Link href="/statistics" className="text-sm text-[var(--color-primary)] hover:underline">
              Подробнее →
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

        {/* Popular Flavors */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Популярные вкусы</h2>
            <Link href="/statistics" className="text-sm text-[var(--color-primary)] hover:underline">
              Подробнее →
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
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Последние сессии</h2>
          <Link href="/sessions" className="text-sm text-[var(--color-primary)] hover:underline">
            Все сессии →
          </Link>
        </div>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-[var(--color-textMuted)]">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[var(--color-bgHover)] flex items-center justify-center">
              <IconSmoke size={24} />
            </div>
            <p>Пока нет сессий</p>
            <p className="text-sm mt-2">Создайте первую забивку в калькуляторе миксов</p>
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
                      {session.session_items?.map(i => i.flavor).join(' + ') || 'Микс'}
                    </div>
                    <div className="text-sm text-[var(--color-textMuted)]">
                      {new Date(session.session_date).toLocaleDateString('ru-RU', {
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
                  <div className="text-sm text-[var(--color-textMuted)]">{session.total_grams}г</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ending Soon Widget */}
      {endingSoon.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Скоро закончится</h2>
            <Link href="/inventory" className="text-sm text-[var(--color-primary)] hover:underline">
              Инвентарь →
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
                      {item.quantity_grams.toFixed(0)}г
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
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Популярные миксы</h2>
            <Link href="/mix" className="text-sm text-[var(--color-primary)] hover:underline">
              Все миксы →
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
                  <span>Использован {mix.usage_count}×</span>
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

      {/* Upgrade Banner */}
      {isFreeTier && (
        <div className="card p-6 bg-gradient-to-r from-[var(--color-primary)]/10 to-purple-500/10 border-[var(--color-primary)]/30">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2">Перейдите на Pro</h3>
              <p className="text-[var(--color-textMuted)]">
                Получите безлимитный инвентарь, полную статистику, экспорт данных и многое другое
              </p>
            </div>
            <Link href="/pricing" className="btn btn-primary whitespace-nowrap">
              Улучшить тариф
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
