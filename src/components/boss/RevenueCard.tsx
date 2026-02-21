'use client'

import type { Session, BarSale } from '@/types/database'

interface RevenueCardProps {
  sessions: Session[]
  sales: BarSale[]
  todayStr: string
  yesterdayStr: string
  tm: Record<string, unknown>
}

export function RevenueCard({ sessions, sales, todayStr, yesterdayStr, tm }: RevenueCardProps) {
  const todayHookah = sessions
    .filter(s => s.session_date.startsWith(todayStr) && s.selling_price)
    .reduce((sum, s) => sum + (s.selling_price || 0), 0)

  const todayBar = sales
    .filter(s => s.sold_at.startsWith(todayStr))
    .reduce((sum, s) => sum + s.total_revenue, 0)

  const todayTotal = Math.round((todayHookah + todayBar) * 100) / 100

  const yesterdayHookah = sessions
    .filter(s => s.session_date.startsWith(yesterdayStr) && s.selling_price)
    .reduce((sum, s) => sum + (s.selling_price || 0), 0)

  const yesterdayBar = sales
    .filter(s => s.sold_at.startsWith(yesterdayStr))
    .reduce((sum, s) => sum + s.total_revenue, 0)

  const yesterdayTotal = yesterdayHookah + yesterdayBar

  const change = yesterdayTotal > 0
    ? Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100)
    : null

  return (
    <div className="card p-5">
      <div className="text-xs text-[var(--color-textMuted)] uppercase font-semibold mb-2">
        {String(tm.bossTodayRevenue)}
      </div>

      {todayTotal > 0 ? (
        <>
          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-3xl font-bold">{todayTotal}€</span>
            {change !== null && (
              <span className={`text-sm font-semibold ${change >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% {String(tm.bossVsYesterday)}
              </span>
            )}
          </div>

          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-[var(--color-textMuted)]">{String(tm.bossHookahRevenue)}: </span>
              <span className="font-semibold">{Math.round(todayHookah * 100) / 100}€</span>
            </div>
            <div>
              <span className="text-[var(--color-textMuted)]">{String(tm.bossBarRevenue)}: </span>
              <span className="font-semibold">{Math.round(todayBar * 100) / 100}€</span>
            </div>
          </div>
        </>
      ) : (
        <p className="text-[var(--color-textMuted)]">{String(tm.bossNoRevenue)}</p>
      )}
    </div>
  )
}
