import { ReactNode } from 'react'

interface StatsCardProps {
  icon: ReactNode
  label: string
  value: string | number
  subtext?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'primary' | 'success' | 'warning' | 'danger'
}

const borderColors = {
  primary: 'var(--color-primary)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
}

export function StatsCard({ icon, label, value, subtext, trend, color = 'primary' }: StatsCardProps) {
  const colorClasses = {
    primary: 'text-[var(--color-primary)]',
    success: 'text-[var(--color-success)]',
    warning: 'text-[var(--color-warning)]',
    danger: 'text-[var(--color-danger)]',
  }

  const bgClasses = {
    primary: 'bg-[var(--color-primary)]/10',
    success: 'bg-[var(--color-success)]/10',
    warning: 'bg-[var(--color-warning)]/10',
    danger: 'bg-[var(--color-danger)]/10',
  }

  return (
    <div
      className="card p-5 overflow-hidden hover:border-[var(--color-borderAccent)] transition-colors"
      style={{ borderLeft: `3px solid ${borderColors[color]}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 shrink-0 rounded-lg ${bgClasses[color]} ${colorClasses[color]} flex items-center justify-center`}>
            {icon}
          </div>
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-textMuted)] truncate">{label}</span>
        </div>
        {trend && (
          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${
            trend.isPositive
              ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
              : 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
          }`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div className={`mt-3 text-3xl font-bold tabular-nums ${colorClasses[color]}`}>
        {value}
      </div>
      {subtext && (
        <div className="mt-1 text-xs text-[var(--color-textMuted)]">
          {subtext}
        </div>
      )}
    </div>
  )
}
