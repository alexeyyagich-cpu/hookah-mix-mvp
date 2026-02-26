'use client'

import type { CostCategory } from '@/lib/hooks/usePnL'
import { useTranslation, useLocale, formatCurrency } from '@/lib/i18n'

interface CostBreakdownChartProps {
  data: CostCategory[]
}

// Chart data-series palette — intentionally not theme-variable
const COLORS = [
  '#EF4444', // red
  '#F59E0B', // amber
  '#22C55E', // green
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#84CC16', // lime
  '#6366F1', // indigo
  '#14B8A6', // teal
]


function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(radians),
    y: cy + r * Math.sin(radians),
  }
}

function createArcPath(startAngle: number, endAngle: number, radius: number) {
  const start = polarToCartesian(50, 50, radius, endAngle)
  const end = polarToCartesian(50, 50, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1
  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    'L', 50, 50,
    'Z',
  ].join(' ')
}

export function CostBreakdownChart({ data }: CostBreakdownChartProps) {
  const t = useTranslation('manage')
  const { locale } = useLocale()

  const categoryLabels: Record<string, string> = {
    spirit: t.categorySpirit,
    liqueur: t.categoryLiqueur,
    syrup: t.categorySyrup,
    mixer: t.categoryMixer,
    juice: t.categoryJuice,
    garnish: t.categoryGarnish,
    bitter: t.categoryBitter,
    cocktails: t.categoryCocktails,
  }

  function getCategoryLabel(category: string): string {
    return categoryLabels[category] || category
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-[var(--color-textMuted)]">
        {t.noChartData}
      </div>
    )
  }

  const total = data.reduce((sum, d) => sum + d.cost, 0)

  let currentAngle = 0
  const segments = data.map((item, index) => {
    const percentage = total > 0 ? (item.cost / total) * 100 : 0
    const angle = (percentage / 100) * 360
    const segment = {
      ...item,
      percentage,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
      color: COLORS[index % COLORS.length],
    }
    currentAngle += angle
    return segment
  })

  return (
    <div className="flex items-center gap-6" role="img" aria-label={`${formatCurrency(total, locale)} total: ${segments.slice(0, 3).map(s => `${categoryLabels[s.category] || s.category} ${s.percentage.toFixed(0)}%`).join(', ')}`}>
      {/* Donut */}
      <div className="relative w-40 h-40 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
          {segments.map((segment) => (
            segment.percentage > 0.5 && (
              <path
                key={`${segment.module}:${segment.category}`}
                d={createArcPath(segment.startAngle, segment.endAngle, 40)}
                fill={segment.color}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
            )
          ))}
          <circle cx="50" cy="50" r="20" fill="var(--color-bgCard)" />
          <text
            x="50"
            y="48"
            textAnchor="middle"
            className="fill-[var(--color-text)] text-[8px] font-bold"
          >
            {formatCurrency(total, locale)}
          </text>
          <text
            x="50"
            y="56"
            textAnchor="middle"
            className="fill-[var(--color-textMuted)] text-[5px]"
          >
            {t.chartExpenses}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2">
        {segments.slice(0, 8).map((segment) => (
          <div key={`${segment.module}:${segment.category}`} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: segment.color }}
              />
              <span className="font-medium truncate">
                {getCategoryLabel(segment.category)}
              </span>
              <span className="text-[10px] text-[var(--color-textMuted)]">
                {segment.module === 'hookah' ? '🔥' : '🍸'}
              </span>
            </div>
            <span className="text-[var(--color-textMuted)] whitespace-nowrap ml-2">
              {formatCurrency(segment.cost, locale)} ({segment.percentage.toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
