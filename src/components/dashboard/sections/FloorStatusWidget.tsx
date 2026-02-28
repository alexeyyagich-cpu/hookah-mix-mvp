'use client'

import Link from 'next/link'
import { useFloorPlan } from '@/lib/hooks/useFloorPlan'
import { useTranslation } from '@/lib/i18n'
import { STATUS_COLORS } from '@/components/floor/FloorPlan'

export function FloorStatusWidget() {
  const t = useTranslation('manage')
  const { tables, loading } = useFloorPlan()

  if (loading || tables.length === 0) return null

  const counts = tables.reduce((acc, t) => {
    if (t.status in acc) acc[t.status as keyof typeof acc]++
    return acc
  }, { available: 0, occupied: 0, reserved: 0, cleaning: 0 })

  const statuses = [
    { label: t.widgetAvailable, count: counts.available, color: STATUS_COLORS.available.bg },
    { label: t.widgetOccupied, count: counts.occupied, color: STATUS_COLORS.occupied.bg },
    { label: t.widgetReserved, count: counts.reserved, color: STATUS_COLORS.reserved.bg },
    { label: t.widgetCleaning, count: counts.cleaning, color: STATUS_COLORS.cleaning.bg },
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
