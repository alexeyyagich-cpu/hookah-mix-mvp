'use client'

import type { SessionWithItems, BarSale, KdsOrder, Tip } from '@/types/database'
import type { Dictionary } from '@/lib/i18n'
import { useLocale, formatCurrency } from '@/lib/i18n'

interface Review {
  id: string
  author_name: string | null
  rating: number
  text: string | null
  created_at: string
}

interface ActivityFeedProps {
  sessions: SessionWithItems[]
  sales: BarSale[]
  kdsOrders: KdsOrder[]
  reviews: Review[]
  tips: Tip[]
  tm: Dictionary['manage']
}

interface ActivityEvent {
  id: string
  emoji: string
  title: string
  subtitle: string
  timestamp: string
}

function timeAgo(isoDate: string, tm: Dictionary['manage']): string {
  const date = new Date(isoDate)
  if (isNaN(date.getTime())) return '—'
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return tm.bossTimeAgo(0, 'm')
  if (minutes < 60) return tm.bossTimeAgo(minutes, 'm')
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return tm.bossTimeAgo(hours, 'h')
  const days = Math.floor(hours / 24)
  return tm.bossTimeAgo(days, 'd')
}

export function ActivityFeed({ sessions, sales, kdsOrders, reviews, tips, tm }: ActivityFeedProps) {
  const { locale } = useLocale()
  const events: ActivityEvent[] = []

  // Sessions (last 10)
  for (const s of sessions.slice(0, 10)) {
    const mixStr = s.session_items?.map(i => `${i.brand} ${i.flavor}`).join(', ') || `${s.total_grams}g`
    events.push({
      id: `s-${s.id}`,
      emoji: '🔥',
      title: tm.bossActivityHookah,
      subtitle: mixStr.length > 40 ? mixStr.slice(0, 40) + '…' : mixStr,
      timestamp: s.session_date,
    })
  }

  // Bar sales (last 10)
  for (const s of sales.slice(0, 10)) {
    events.push({
      id: `b-${s.id}`,
      emoji: '🍸',
      title: s.recipe_name,
      subtitle: `x${s.quantity} · ${formatCurrency(s.total_revenue, locale)}`,
      timestamp: s.sold_at,
    })
  }

  // KDS orders (last 10)
  for (const o of kdsOrders.slice(0, 10)) {
    events.push({
      id: `k-${o.id}`,
      emoji: '📋',
      title: `${tm.bossActivityKds}: ${o.table_name || tm.bossActivityOrder}`,
      subtitle: o.status,
      timestamp: o.created_at,
    })
  }

  // Reviews (last 5)
  for (const r of reviews.slice(0, 5)) {
    events.push({
      id: `r-${r.id}`,
      emoji: '⭐',
      title: r.author_name || tm.bossActivityGuest,
      subtitle: `${'★'.repeat(r.rating)}${r.text ? ` — ${r.text.slice(0, 30)}` : ''}`,
      timestamp: r.created_at,
    })
  }

  // Tips (last 5)
  for (const t of tips.slice(0, 5)) {
    events.push({
      id: `t-${t.id}`,
      emoji: '💰',
      title: tm.bossActivityTip,
      subtitle: `${formatCurrency(t.amount, locale)}${t.payer_name ? ` ${tm.bossActivityFrom(t.payer_name)}` : ''}`,
      timestamp: t.created_at,
    })
  }

  // Sort by timestamp desc, take top 5
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  const top5 = events.slice(0, 5)

  return (
    <div className="card p-5">
      <div className="text-xs text-[var(--color-textMuted)] uppercase font-semibold mb-3">
        {tm.bossRecentActivity}
      </div>

      {top5.length === 0 ? (
        <p className="text-sm text-[var(--color-textMuted)]">{tm.bossNoActivity}</p>
      ) : (
        <div className="space-y-2">
          {top5.map(event => (
            <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg">
              <span className="text-base flex-shrink-0">{event.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{event.title}</div>
                <div className="text-xs text-[var(--color-textMuted)] truncate">{event.subtitle}</div>
              </div>
              <div className="text-[10px] text-[var(--color-textMuted)] flex-shrink-0">
                {timeAgo(event.timestamp, tm)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
