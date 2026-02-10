'use client'

import type { BowlType } from '@/types/database'

interface BowlCardProps {
  bowl: BowlType
  onEdit: (bowl: BowlType) => void
  onDelete: (id: string) => void
  onSetDefault: (id: string) => void
}

export function BowlCard({ bowl, onEdit, onDelete, onSetDefault }: BowlCardProps) {
  return (
    <div className={`card p-5 ${bowl.is_default ? 'border-[var(--color-primary)]' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🥣</span>
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              {bowl.name}
              {bowl.is_default && (
                <span className="badge badge-primary text-[10px]">По умолчанию</span>
              )}
            </h3>
            <p className="text-sm text-[var(--color-textMuted)]">
              Вместимость: <span className="text-[var(--color-text)]">{bowl.capacity_grams}г</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!bowl.is_default && (
            <button
              onClick={() => onSetDefault(bowl.id)}
              className="p-2 rounded-lg hover:bg-[var(--color-bgHover)] text-[var(--color-textMuted)] hover:text-[var(--color-primary)] transition-colors"
              title="Сделать по умолчанию"
            >
              ⭐
            </button>
          )}
          <button
            onClick={() => onEdit(bowl)}
            className="p-2 rounded-lg hover:bg-[var(--color-bgHover)] text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors"
            title="Редактировать"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(bowl.id)}
            className="p-2 rounded-lg hover:bg-[var(--color-danger)]/10 text-[var(--color-textMuted)] hover:text-[var(--color-danger)] transition-colors"
            title="Удалить"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}
