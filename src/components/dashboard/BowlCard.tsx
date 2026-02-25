'use client'

import { useTranslation } from '@/lib/i18n'
import { IconBowl, IconStar, IconEdit, IconTrash } from '@/components/Icons'
import type { BowlType } from '@/types/database'

interface BowlCardProps {
  bowl: BowlType
  onEdit: (bowl: BowlType) => void
  onDelete: (id: string) => void
  onSetDefault: (id: string) => void
}

export function BowlCard({ bowl, onEdit, onDelete, onSetDefault }: BowlCardProps) {
  const t = useTranslation('hookah')
  return (
    <div className={`card p-5 ${bowl.is_default ? 'border-[var(--color-primary)]' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
            <IconBowl size={24} />
          </div>
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              {bowl.name}
              {bowl.is_default && (
                <span className="badge badge-primary text-[10px]">{t.defaultBowl}</span>
              )}
            </h3>
            <p className="text-sm text-[var(--color-textMuted)]">
              {t.bowlCapacityLabel}: <span className="text-[var(--color-text)]">{bowl.capacity_grams}g</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!bowl.is_default && (
            <button type="button"
              onClick={() => onSetDefault(bowl.id)}
              className="p-2 rounded-lg hover:bg-[var(--color-bgHover)] text-[var(--color-textMuted)] hover:text-[var(--color-warning)] transition-colors"
              title={t.setDefault}
            >
              <IconStar size={18} />
            </button>
          )}
          <button type="button"
            onClick={() => onEdit(bowl)}
            className="p-2 rounded-lg hover:bg-[var(--color-bgHover)] text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors"
            title={t.editItem}
          >
            <IconEdit size={18} />
          </button>
          <button type="button"
            onClick={() => onDelete(bowl.id)}
            className="p-2 rounded-lg hover:bg-[var(--color-danger)]/10 text-[var(--color-textMuted)] hover:text-[var(--color-danger)] transition-colors"
            title={t.deleteItem}
          >
            <IconTrash size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
