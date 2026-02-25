'use client'

import type { FloorTable } from '@/types/database'

interface TableSelectorProps {
  tables: FloorTable[]
  selectedId: string | null
  onSelect: (id: string) => void
  tm: Record<string, unknown>
}

const STATUS_DOT: Record<string, string> = {
  available: 'bg-[var(--color-success)]',
  occupied: 'bg-[var(--color-primary)]',
  reserved: 'bg-[var(--color-warning)]',
  cleaning: 'bg-[var(--color-textMuted)]',
}

export function TableSelector({ tables, selectedId, onSelect, tm }: TableSelectorProps) {
  if (tables.length === 0) {
    return (
      <div className="text-sm text-[var(--color-textMuted)] p-4 text-center">
        {String(tm.waiterNoTables)}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto pb-2 -mx-4 px-4">
      <div className="flex gap-2 min-w-max">
        {tables.map(table => {
          const isSelected = table.id === selectedId
          return (
            <button type="button"
              key={table.id}
              onClick={() => onSelect(table.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-[var(--color-primary)] text-white shadow-lg'
                  : 'bg-[var(--color-bgCard)] border border-[var(--color-border)] text-[var(--color-text)]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isSelected ? 'bg-white' : STATUS_DOT[table.status] || STATUS_DOT.available}`} />
              <span>{table.name}</span>
              {table.current_guest_name && (
                <span className={`text-xs ${isSelected ? 'text-white/70' : 'text-[var(--color-textMuted)]'}`}>
                  ({table.current_guest_name})
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
