'use client'

import { useTranslation, useLocale } from '@/lib/i18n'

const LOCALE_MAP: Record<string, string> = { ru: 'ru-RU', en: 'en-US', de: 'de-DE' }

interface DailyData {
  date: string
  grams: number
  sessions: number
}

interface ConsumptionChartProps {
  data: DailyData[]
}

export function ConsumptionChart({ data }: ConsumptionChartProps) {
  const t = useTranslation('manage')
  const { locale } = useLocale()

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-[var(--color-textMuted)]">
        {t.noChartData}
      </div>
    )
  }

  const maxGrams = Math.max(...data.map(d => d.grams), 1)
  const chartHeight = 140 // Fixed height in pixels

  return (
    <div className="space-y-2">
      {/* Chart */}
      <div className="flex items-end gap-2 px-1" style={{ height: chartHeight }}>
        {data.map((day) => {
          const barHeight = Math.max((day.grams / maxGrams) * chartHeight, 4)

          return (
            <div
              key={day.date}
              className="flex-1 flex flex-col justify-end items-center group relative"
              style={{ height: chartHeight }}
            >
              {/* Tooltip - absolute positioned */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-center whitespace-nowrap z-10 bg-[var(--color-bgCard)] px-2 py-1 rounded-lg shadow-lg border border-[var(--color-border)]">
                <div className="font-medium">{day.grams}g</div>
                <div className="text-[var(--color-textMuted)]">{t.chartSessions(day.sessions)}</div>
              </div>

              {/* Bar */}
              <div
                className="w-full rounded-t-md bg-[var(--color-primary)] hover:bg-[var(--color-primaryHover)] transition-all cursor-pointer"
                style={{ height: barHeight }}
              />
            </div>
          )
        })}
      </div>

      {/* Date Labels */}
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

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm text-[var(--color-textMuted)]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[var(--color-primary)]" />
          {t.chartConsumptionG}
        </div>
      </div>
    </div>
  )
}
