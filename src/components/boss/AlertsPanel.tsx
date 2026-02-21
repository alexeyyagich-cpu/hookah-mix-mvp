'use client'

import Link from 'next/link'
import type { TobaccoInventory, KdsOrder, Shift, ShiftReconciliation } from '@/types/database'

interface Review {
  created_at: string
}

interface AlertsPanelProps {
  inventory: TobaccoInventory[]
  lowStockThreshold: number
  kdsOrders: KdsOrder[]
  reviews: Review[]
  shifts: Shift[]
  getReconciliation: (shift: Shift) => ShiftReconciliation
  tm: Record<string, unknown>
}

interface Alert {
  id: string
  text: string
  severity: 'danger' | 'warning' | 'info'
  href: string
  emoji: string
}

export function AlertsPanel({ inventory, lowStockThreshold, kdsOrders, reviews, shifts, getReconciliation, tm }: AlertsPanelProps) {
  const alerts: Alert[] = []

  // Out of stock
  const outOfStock = inventory.filter(i => i.quantity_grams <= 0)
  if (outOfStock.length > 0) {
    alerts.push({
      id: 'out-of-stock',
      text: (tm.bossOutOfStock as (n: number) => string)(outOfStock.length),
      severity: 'danger',
      href: '/inventory',
      emoji: '🚨',
    })
  }

  // Low stock
  const lowStock = inventory.filter(i => i.quantity_grams > 0 && i.quantity_grams < lowStockThreshold)
  if (lowStock.length > 0) {
    alerts.push({
      id: 'low-stock',
      text: (tm.bossLowStock as (n: number) => string)(lowStock.length),
      severity: 'warning',
      href: '/inventory',
      emoji: '⚠️',
    })
  }

  // Overdue KDS orders (>10 min)
  const now = Date.now()
  const overdue = kdsOrders.filter(o =>
    (o.status === 'new' || o.status === 'preparing') &&
    (now - new Date(o.created_at).getTime()) > 10 * 60 * 1000
  )
  if (overdue.length > 0) {
    alerts.push({
      id: 'overdue-kds',
      text: (tm.bossOverdueOrders as (n: number) => string)(overdue.length),
      severity: 'danger',
      href: '/kds',
      emoji: '🕐',
    })
  }

  // New reviews (last 24h)
  const oneDayAgo = now - 24 * 60 * 60 * 1000
  const newReviews = reviews.filter(r => new Date(r.created_at).getTime() > oneDayAgo)
  if (newReviews.length > 0) {
    alerts.push({
      id: 'new-reviews',
      text: (tm.bossNewReviews as (n: number) => string)(newReviews.length),
      severity: 'info',
      href: '/reviews',
      emoji: '⭐',
    })
  }

  // Cash shortage from last closed shift
  const lastClosed = shifts.find(s => s.status === 'closed')
  if (lastClosed) {
    const recon = getReconciliation(lastClosed)
    if (recon.cash.difference !== null && recon.cash.difference < 0) {
      alerts.push({
        id: 'cash-shortage',
        text: (tm.bossCashShortage as (a: string) => string)(`${Math.abs(recon.cash.difference)}€`),
        severity: 'warning',
        href: '/shifts',
        emoji: '💰',
      })
    }
  }

  return (
    <div className="card p-5">
      <div className="text-xs text-[var(--color-textMuted)] uppercase font-semibold mb-3">
        {String(tm.bossAlerts)}
      </div>

      {alerts.length === 0 ? (
        <div className="flex items-center gap-2 text-[var(--color-success)]">
          <span>✅</span>
          <span className="text-sm font-medium">{String(tm.bossAllClear)}</span>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => (
            <Link
              key={alert.id}
              href={alert.href}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-[var(--color-bgHover)] ${
                alert.severity === 'danger'
                  ? 'bg-[var(--color-danger)]/10'
                  : alert.severity === 'warning'
                  ? 'bg-[var(--color-warning)]/10'
                  : 'bg-[var(--color-primary)]/10'
              }`}
            >
              <span className="text-base">{alert.emoji}</span>
              <span className={`text-sm font-medium ${
                alert.severity === 'danger'
                  ? 'text-[var(--color-danger)]'
                  : alert.severity === 'warning'
                  ? 'text-[var(--color-warning)]'
                  : 'text-[var(--color-primary)]'
              }`}>
                {alert.text}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
