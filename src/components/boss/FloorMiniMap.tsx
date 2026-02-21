'use client'

import Link from 'next/link'
import type { FloorTable } from '@/types/database'

interface FloorMiniMapProps {
  tables: FloorTable[]
  tm: Record<string, unknown>
}

const STATUS_COLORS: Record<string, string> = {
  available: 'var(--color-success)',
  occupied: 'var(--color-danger)',
  reserved: 'var(--color-primary)',
  cleaning: 'var(--color-textMuted)',
}

export function FloorMiniMap({ tables, tm }: FloorMiniMapProps) {
  if (tables.length === 0) return null

  return (
    <div className="card p-5">
      <div className="text-xs text-[var(--color-textMuted)] uppercase font-semibold mb-3">
        {String(tm.bossFloorMap)}
      </div>

      <Link href="/floor" className="block">
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {tables.map(table => (
            <div key={table.id} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[var(--color-bgHover)] transition-colors">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[table.status] || STATUS_COLORS.available }}
              />
              <span className="text-[10px] text-[var(--color-textMuted)] truncate max-w-full">
                {table.name}
              </span>
            </div>
          ))}
        </div>
      </Link>

      <div className="flex gap-3 mt-3 pt-3 border-t border-[var(--color-border)]">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-[var(--color-textMuted)] capitalize">{status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
