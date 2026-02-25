'use client'

import type { Session, KdsOrder, Tip } from '@/types/database'
import { useLocale, formatCurrency } from '@/lib/i18n'
import type { Dictionary } from '@/lib/i18n'

interface QuickStatsRowProps {
  sessions: Session[]
  avgRating: number
  tips: Tip[]
  kdsOrders: KdsOrder[]
  todayStr: string
  tm: Dictionary['manage']
}

export function QuickStatsRow({ sessions, avgRating, tips, kdsOrders, todayStr, tm }: QuickStatsRowProps) {
  const { locale } = useLocale()
  const todaySessions = sessions.filter(s => s.session_date.startsWith(todayStr)).length
  const todayTips = tips
    .filter(t => t.created_at.startsWith(todayStr) && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)
  const activeKds = kdsOrders.length

  const stats = [
    { label: tm.bossTodaySessions, value: String(todaySessions), color: 'var(--color-primary)' },
    { label: tm.bossAvgRating, value: avgRating > 0 ? avgRating.toFixed(1) : '—', color: 'var(--color-warning)' },
    { label: tm.bossTipsToday, value: todayTips > 0 ? formatCurrency(Math.round(todayTips), locale) : '—', color: 'var(--color-success)' },
    { label: tm.bossKdsActive, value: String(activeKds), color: 'var(--color-info, var(--color-primary))' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      {stats.map((s) => (
        <div key={s.label} className="card p-3 text-center">
          <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
          <div className="text-[10px] text-[var(--color-textMuted)] uppercase font-semibold mt-1 truncate">{s.label}</div>
        </div>
      ))}
    </div>
  )
}
