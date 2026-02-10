interface StatsCardProps {
  icon: string
  label: string
  value: string | number
  subtext?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'primary' | 'success' | 'warning' | 'danger'
}

export function StatsCard({ icon, label, value, subtext, trend, color = 'primary' }: StatsCardProps) {
  const colorClasses = {
    primary: 'text-[var(--color-primary)]',
    success: 'text-[var(--color-success)]',
    warning: 'text-[var(--color-warning)]',
    danger: 'text-[var(--color-danger)]',
  }

  return (
    <div className="card p-5 hover:border-[var(--color-borderAccent)] transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <span className="text-sm text-[var(--color-textMuted)]">{label}</span>
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trend.isPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div className={`mt-3 text-3xl font-bold ${colorClasses[color]}`}>
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
