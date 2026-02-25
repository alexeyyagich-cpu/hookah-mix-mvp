'use client'

import { useTranslation, useLocale, formatCurrency, LOCALE_MAP } from '@/lib/i18n'

interface DayRevenue {
  date: string
  revenue: number
  cost: number
}

interface BarRevenueChartProps {
  data: DayRevenue[]
}

export function BarRevenueChart({ data }: BarRevenueChartProps) {
  const t = useTranslation('manage')
  const { locale } = useLocale()

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-[var(--color-textMuted)]">
        {t.noChartData}
      </div>
    )
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1)
  const chartHeight = 140

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2 px-1" style={{ height: chartHeight }}>
        {data.map((day) => {
          const revenueHeight = Math.max((day.revenue / maxRevenue) * chartHeight, 4)
          const costHeight = Math.max((day.cost / maxRevenue) * chartHeight, 2)

          return (
            <div
              key={day.date}
              className="flex-1 flex flex-col justify-end items-center group relative"
              style={{ height: chartHeight }}
            >
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-center whitespace-nowrap z-10 bg-[var(--color-bgCard)] px-2 py-1 rounded-lg shadow-lg border border-[var(--color-border)]">
                <div className="font-medium text-[var(--color-success)]">{formatCurrency(day.revenue, locale)}</div>
                <div className="text-[var(--color-textMuted)]">{t.costShort} {formatCurrency(day.cost, locale)}</div>
              </div>

              <div className="w-full relative">
                <div
                  className="w-full rounded-t-md bg-[var(--color-success)] hover:opacity-80 transition-all cursor-pointer"
                  style={{ height: revenueHeight }}
                />
                <div
                  className="w-full bg-[var(--color-danger)]/30 absolute bottom-0 left-0 rounded-t-md pointer-events-none"
                  style={{ height: costHeight }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-2 px-1">
        {data.map((day, index) => (
          <div key={day.date} className="flex-1 text-center">
            {(data.length <= 7 || index === 0 || index === data.length - 1) && (
              <div className="text-[10px] text-[var(--color-textMuted)]">
                {new Date(day.date).toLocaleDateString(LOCALE_MAP[locale] || 'ru-RU', { day: 'numeric', month: 'short' })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-6 text-sm text-[var(--color-textMuted)]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[var(--color-success)]" />
          {t.chartRevenue}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[var(--color-danger)]/30" />
          {t.chartCostPrice}
        </div>
      </div>
    </div>
  )
}
