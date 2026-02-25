'use client'

import { useDashboardControl } from '@/lib/hooks/useDashboardControl'
import { useModules } from '@/lib/hooks/useModules'
import { useTranslation, useLocale, formatCurrency } from '@/lib/i18n'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { StaffComparisonTable } from './StaffComparisonTable'
import { LowStockAlertPanel } from './LowStockAlertPanel'
import {
  IconScale,
  IconCoin,
  IconTarget,
  IconTrendUp,
} from '@/components/Icons'

export function ControlDashboard() {
  const { data, staffEnriched, loading, error } = useDashboardControl()
  const { isHookahActive, isBarActive } = useModules()
  const t = useTranslation('manage')
  const { locale } = useLocale()

  if (loading) {
    return (
      <div className="card p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return null
  }

  const { tobacco_usage, avg_grams_per_bowl, revenue_snapshot } = data

  const gramsTrend = tobacco_usage.yesterday_grams > 0
    ? Math.round(((tobacco_usage.total_grams_today - tobacco_usage.yesterday_grams) / tobacco_usage.yesterday_grams) * 100)
    : null

  const combinedRevTrend = revenue_snapshot.combined_revenue_yesterday > 0
    ? Math.round(((revenue_snapshot.combined_revenue_today - revenue_snapshot.combined_revenue_yesterday) / revenue_snapshot.combined_revenue_yesterday) * 100)
    : null

  const bowlColorMap = { green: 'success', yellow: 'warning', red: 'danger', no_data: 'primary' } as const

  return (
    <div className="space-y-6">
      {/* Row 1: Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={<IconScale size={20} />}
          label={t.controlTobaccoUsage}
          value={`${tobacco_usage.total_grams_today}g`}
          subtext={`${formatCurrency(tobacco_usage.cost_today, locale)} ${t.controlCostLabel}`}
          trend={gramsTrend !== null ? {
            value: Math.abs(gramsTrend),
            isPositive: gramsTrend <= 0,
          } : undefined}
          color="primary"
        />

        <StatsCard
          icon={<IconTarget size={20} />}
          label={t.controlAvgPerBowl}
          value={avg_grams_per_bowl.sessions_count > 0
            ? `${avg_grams_per_bowl.actual_avg}g`
            : '—'
          }
          subtext={avg_grams_per_bowl.sessions_count > 0
            ? `${t.controlTarget}: ${avg_grams_per_bowl.target_grams}g (${avg_grams_per_bowl.overuse_pct > 0 ? '+' : ''}${avg_grams_per_bowl.overuse_pct}%)`
            : t.controlNoSessions
          }
          color={bowlColorMap[avg_grams_per_bowl.status]}
        />

        <StatsCard
          icon={<IconCoin size={20} />}
          label={t.controlRevenueToday}
          value={formatCurrency(revenue_snapshot.combined_revenue_today, locale)}
          subtext={revenue_snapshot.combined_margin_pct !== null
            ? `${t.controlMargin}: ${revenue_snapshot.combined_margin_pct}%`
            : undefined
          }
          trend={combinedRevTrend !== null ? {
            value: Math.abs(combinedRevTrend),
            isPositive: combinedRevTrend >= 0,
          } : undefined}
          color="success"
        />

        <StatsCard
          icon={<IconTrendUp size={20} />}
          label={t.controlVsWeekAvg}
          value={tobacco_usage.week_pct_diff !== null
            ? `${tobacco_usage.week_pct_diff > 0 ? '+' : ''}${tobacco_usage.week_pct_diff}%`
            : '—'
          }
          subtext={`${t.controlWeekAvg}: ${tobacco_usage.week_avg_daily_grams}g/${t.controlDay}`}
          color={tobacco_usage.week_pct_diff !== null
            ? (tobacco_usage.week_pct_diff <= 0 ? 'success' : (tobacco_usage.week_pct_diff <= 15 ? 'warning' : 'danger'))
            : 'primary'
          }
        />
      </div>

      {/* Row 2: Revenue breakdown */}
      {isHookahActive && isBarActive && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4">
            <div className="text-sm text-[var(--color-textMuted)] mb-1">{t.controlHookahRevenue}</div>
            <div className="text-2xl font-bold">{formatCurrency(revenue_snapshot.hookah_revenue_today, locale)}</div>
            <div className="text-xs text-[var(--color-textMuted)]">
              {t.controlCostLabel}: {formatCurrency(revenue_snapshot.hookah_cost_today, locale)}
              {revenue_snapshot.hookah_margin_pct !== null && ` · ${t.controlMargin}: ${revenue_snapshot.hookah_margin_pct}%`}
            </div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-[var(--color-textMuted)] mb-1">{t.controlBarRevenue}</div>
            <div className="text-2xl font-bold">{formatCurrency(revenue_snapshot.bar_revenue_today, locale)}</div>
            <div className="text-xs text-[var(--color-textMuted)]">
              {t.controlCostLabel}: {formatCurrency(revenue_snapshot.bar_cost_today, locale)}
              {revenue_snapshot.bar_margin_pct !== null && ` · ${t.controlMargin}: ${revenue_snapshot.bar_margin_pct}%`}
            </div>
          </div>
        </div>
      )}

      {/* Block 3: Staff Comparison */}
      {staffEnriched.length > 0 && (
        <StaffComparisonTable rows={staffEnriched} />
      )}

      {/* Block 4: Low Stock Alerts */}
      {data.low_stock_alerts.length > 0 && (
        <LowStockAlertPanel items={data.low_stock_alerts} />
      )}
    </div>
  )
}
