'use client'

import { ReactNode } from 'react'
import { useTranslation } from '@/lib/i18n'

interface ComparisonCardProps {
  icon: ReactNode
  label: string
  periodAValue: string | number
  periodBValue: string | number
  change: number
  isPercentChange?: boolean
  invertColor?: boolean  // For cases where negative is good
}

export function ComparisonCard({
  icon,
  label,
  periodAValue,
  periodBValue,
  change,
  isPercentChange = true,
  invertColor = false,
}: ComparisonCardProps) {
  const t = useTranslation('manage')
  const isPositive = invertColor ? change < 0 : change > 0
  const isNegative = invertColor ? change > 0 : change < 0

  const changeColor = isPositive
    ? 'var(--color-success)'
    : isNegative
    ? 'var(--color-danger)'
    : 'var(--color-textMuted)'

  const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '='
  const changeText = isPercentChange
    ? `${arrow}${Math.abs(change)}%`
    : `${change >= 0 ? '+' : ''}${change}`

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
          {icon}
        </div>
        <span className="text-sm font-medium text-[var(--color-textMuted)]">{label}</span>
      </div>

      <div className="flex items-end justify-between gap-4">
        {/* Period A (Current) */}
        <div>
          <div className="text-2xl font-bold">{periodAValue}</div>
          <div className="text-xs text-[var(--color-textMuted)]">{t.periodCurrent}</div>
        </div>

        {/* Change indicator */}
        <div
          className="px-2 py-1 rounded-lg text-sm font-bold"
          style={{
            background: `color-mix(in srgb, ${changeColor} 15%, transparent)`,
            color: changeColor,
          }}
        >
          {changeText}
        </div>

        {/* Period B (Previous) */}
        <div className="text-right">
          <div className="text-lg text-[var(--color-textMuted)]">{periodBValue}</div>
          <div className="text-xs text-[var(--color-textMuted)]">{t.periodPrevious}</div>
        </div>
      </div>
    </div>
  )
}
