'use client'

import { useTranslation } from '@/lib/i18n'

interface FlavorData {
  brand: string
  flavor: string
  grams: number
  sessions: number
}

interface PopularFlavorsChartProps {
  data: FlavorData[]
}

export function PopularFlavorsChart({ data }: PopularFlavorsChartProps) {
  const t = useTranslation('manage')

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-[var(--color-textMuted)]">
        {t.noChartData}
      </div>
    )
  }

  const maxGrams = Math.max(...data.map(d => d.grams), 1)
  const colors = [
    'var(--color-primary)',
    'var(--color-success)',
    '#8B5CF6',
    '#EC4899',
    '#06B6D4',
    '#F97316',
    '#84CC16',
  ]

  return (
    <div className="space-y-3">
      {data.slice(0, 7).map((item, index) => {
        const barWidth = (item.grams / maxGrams) * 100

        return (
          <div key={`${item.brand}-${item.flavor}`} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="font-medium">{item.flavor}</span>
                <span className="text-[var(--color-textMuted)]">{item.brand}</span>
              </div>
              <span className="text-[var(--color-textMuted)]">{item.grams}g</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--color-bgHover)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: colors[index % colors.length],
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
