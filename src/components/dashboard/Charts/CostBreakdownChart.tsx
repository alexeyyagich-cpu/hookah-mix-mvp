'use client'

import type { CostCategory } from '@/lib/hooks/usePnL'

interface CostBreakdownChartProps {
  data: CostCategory[]
}

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

const CATEGORY_LABELS: Record<string, string> = {
  spirit: 'Крепкий алкоголь',
  liqueur: 'Ликёры',
  syrup: 'Сиропы',
  mixer: 'Миксеры',
  juice: 'Соки',
  garnish: 'Гарниш',
  bitter: 'Биттеры',
  cocktails: 'Коктейли',
  // Tobacco brands are used as-is
}

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category
}

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
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-[var(--color-textMuted)]">
        Нет данных для отображения
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
    <div className="flex items-center gap-6">
      {/* Donut */}
      <div className="relative w-40 h-40 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full">
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
            {total.toFixed(0)}€
          </text>
          <text
            x="50"
            y="56"
            textAnchor="middle"
            className="fill-[var(--color-textMuted)] text-[5px]"
          >
            расходы
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
              {segment.cost.toFixed(0)}€ ({segment.percentage.toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
