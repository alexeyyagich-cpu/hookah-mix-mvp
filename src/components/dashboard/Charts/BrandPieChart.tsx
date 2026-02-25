'use client'

import { useTranslation } from '@/lib/i18n'

interface BrandData {
  brand: string
  grams: number
  sessions: number
}

interface BrandPieChartProps {
  data: BrandData[]
}

// Chart data-series palette — intentionally not theme-variable
const COLORS = [
  '#F59E0B', // primary
  '#22C55E', // success
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#84CC16', // lime
]

export function BrandPieChart({ data }: BrandPieChartProps) {
  const t = useTranslation('manage')

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-[var(--color-textMuted)]">
        {t.noChartData}
      </div>
    )
  }

  const total = data.reduce((sum, d) => sum + d.grams, 0)

  // Calculate segments
  let currentAngle = 0
  const segments = data.map((item, index) => {
    const percentage = (item.grams / total) * 100
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

  // Create SVG paths
  const createArcPath = (startAngle: number, endAngle: number, radius: number) => {
    const start = polarToCartesian(50, 50, radius, endAngle)
    const end = polarToCartesian(50, 50, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1

    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      'L', 50, 50,
      'Z'
    ].join(' ')
  }

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const radians = ((angle - 90) * Math.PI) / 180
    return {
      x: cx + r * Math.cos(radians),
      y: cy + r * Math.sin(radians),
    }
  }

  return (
    <div className="flex items-center gap-6">
      {/* Pie Chart */}
      <div className="relative w-40 h-40 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {segments.map((segment, index) => (
            <path
              key={segment.brand}
              d={createArcPath(segment.startAngle, segment.endAngle, 40)}
              fill={segment.color}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            />
          ))}
          {/* Center circle */}
          <circle cx="50" cy="50" r="20" fill="var(--color-bgCard)" />
          <text
            x="50"
            y="48"
            textAnchor="middle"
            className="fill-[var(--color-text)] text-[8px] font-bold"
          >
            {total.toFixed(0)}g
          </text>
          <text
            x="50"
            y="56"
            textAnchor="middle"
            className="fill-[var(--color-textMuted)] text-[5px]"
          >
            {t.chartTotal}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2">
        {segments.slice(0, 6).map((segment) => (
          <div key={segment.brand} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="font-medium">{segment.brand}</span>
            </div>
            <span className="text-[var(--color-textMuted)]">
              {segment.percentage.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
