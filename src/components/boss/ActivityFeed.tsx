'use client'

import type { Session, BarSale, KdsOrder, Tip } from '@/types/database'
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
  sessions: Session[]
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
  const diff = Date.now() - new Date(isoDate).getTime()
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
    const items = (s as unknown as { session_items?: { brand: string; flavor: string }[] }).session_items
    const mixStr = items?.map(i => `${i.brand} ${i.flavor}`).join(', ') || `${s.total_grams}g`
    events.push({
      id: `s-${s.id}`,
      emoji: '🔥',
      title: 'Hookah session',
      subtitle: mixStr.length > 40 ? mixStr.slice(0, 40) + '...' : mixStr,
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
      title: `KDS: ${o.table_name || 'Order'}`,
      subtitle: o.status,
      timestamp: o.created_at,
    })
  }

  // Reviews (last 5)
  for (const r of reviews.slice(0, 5)) {
    events.push({
      id: `r-${r.id}`,
      emoji: '⭐',
      title: r.author_name || 'Guest',
      subtitle: `${'★'.repeat(r.rating)}${r.text ? ` — ${r.text.slice(0, 30)}` : ''}`,
      timestamp: r.created_at,
    })
  }

  // Tips (last 5)
  for (const t of tips.slice(0, 5)) {
    events.push({
      id: `t-${t.id}`,
      emoji: '💰',
      title: 'Tip',
      subtitle: `${formatCurrency(t.amount, locale)}${t.payer_name ? ` from ${t.payer_name}` : ''}`,
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
