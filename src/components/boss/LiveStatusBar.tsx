'use client'

import Link from 'next/link'
import type { Shift, FloorTable, KdsOrder } from '@/types/database'

interface LiveStatusBarProps {
  activeShift: Shift | null
  tables: FloorTable[]
  kdsOrders: KdsOrder[]
  shiftDurationMs: number
  tm: Record<string, unknown>
}

function formatDurationShort(ms: number): string {
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

export function LiveStatusBar({ activeShift, tables, kdsOrders, shiftDurationMs, tm }: LiveStatusBarProps) {
  const occupied = tables.filter(t => t.status === 'occupied').length
  const totalTables = tables.length
  const activeOrders = kdsOrders.length

  return (
    <div className="grid grid-cols-3 gap-2">
      <Link href="/shifts" className="card p-3 flex items-center gap-2 hover:bg-[var(--color-bgHover)] transition-colors">
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${activeShift ? 'bg-[var(--color-success)] animate-pulse' : 'bg-[var(--color-textMuted)]'}`} />
        <div className="min-w-0">
          <div className="text-[10px] text-[var(--color-textMuted)] uppercase font-semibold truncate">
            {activeShift ? String(tm.bossShiftActive) : String(tm.bossShiftClosed)}
          </div>
          {activeShift && (
            <div className="text-sm font-bold">{formatDurationShort(shiftDurationMs)}</div>
          )}
        </div>
      </Link>

      <Link href="/floor" className="card p-3 flex items-center gap-2 hover:bg-[var(--color-bgHover)] transition-colors">
        <span className="text-base">🗺️</span>
        <div className="min-w-0">
          <div className="text-[10px] text-[var(--color-textMuted)] uppercase font-semibold truncate">{String(tm.bossFloorMap)}</div>
          <div className="text-sm font-bold">{(tm.bossFloorOccupancy as (o: number, t: number) => string)(occupied, totalTables)}</div>
        </div>
      </Link>

      <Link href="/kds" className="card p-3 flex items-center gap-2 hover:bg-[var(--color-bgHover)] transition-colors">
        <span className="text-base">📋</span>
        <div className="min-w-0">
          <div className="text-[10px] text-[var(--color-textMuted)] uppercase font-semibold truncate">{String(tm.bossKdsActive)}</div>
          <div className="text-sm font-bold">{(tm.bossActiveOrders as (n: number) => string)(activeOrders)}</div>
        </div>
      </Link>
    </div>
  )
}
