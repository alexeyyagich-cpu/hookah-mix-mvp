'use client'

import Link from 'next/link'
import { useFloorPlan } from '@/lib/hooks/useFloorPlan'
import { useTranslation } from '@/lib/i18n'

export function FloorStatusWidget() {
  const t = useTranslation('manage')
  const { tables, loading } = useFloorPlan()

  if (loading || tables.length === 0) return null

  const available = tables.filter(t => t.status === 'available').length
  const occupied = tables.filter(t => t.status === 'occupied').length
  const reserved = tables.filter(t => t.status === 'reserved').length
  const cleaning = tables.filter(t => t.status === 'cleaning').length

  const statuses = [
    { label: t.widgetAvailable, count: available, color: 'var(--color-success)' },
    { label: t.widgetOccupied, count: occupied, color: 'var(--color-danger)' },
    { label: t.widgetReserved, count: reserved, color: 'var(--color-primary)' },
    { label: t.widgetCleaning, count: cleaning, color: 'var(--color-textMuted)' },
  ]

  return (
    <Link href="/floor" className="card p-4 flex items-center justify-between hover:border-[var(--color-borderAccent)] transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-lg">🗺️</span>
        <span className="text-sm font-medium">{t.widgetFloor}</span>
      </div>
      <div className="flex items-center gap-4">
        {statuses.map(s => s.count > 0 && (
          <div key={s.label} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-sm font-medium" style={{ color: s.color }}>
              {s.count}
            </span>
            <span className="text-xs text-[var(--color-textMuted)] hidden sm:inline">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </Link>
  )
}
