'use client'

import { IconPlus, IconMinus, IconClose } from '@/components/Icons'
import type { Dictionary } from '@/lib/i18n'
import type { BarItemEntry, SelectedTobacco } from '@/types/shared'

interface WaiterCartProps {
  barItems: BarItemEntry[]
  hookahTobaccos: SelectedTobacco[]
  hookahDescription: string
  hookahMode: 'structured' | 'freetext'
  expanded: boolean
  onToggle: () => void
  onUpdateBarQty: (recipeId: string, delta: number) => void
  onRemoveBarItem: (recipeId: string) => void
  onSubmit: () => Promise<void>
  notes: string
  onSetNotes: (notes: string) => void
  guestName: string
  onSetGuestName: (name: string) => void
  tableName: string | null
  submitting: boolean
  sent: boolean
  tm: Dictionary['manage']
}

export function WaiterCart({
  barItems,
  hookahTobaccos,
  hookahDescription,
  hookahMode,
  expanded,
  onToggle,
  onUpdateBarQty,
  onRemoveBarItem,
  onSubmit,
  notes,
  onSetNotes,
  guestName,
  onSetGuestName,
  tableName,
  submitting,
  sent,
  tm,
}: WaiterCartProps) {
  const hasBar = barItems.length > 0
  const hasHookah = hookahMode === 'freetext' ? hookahDescription.trim().length > 0 : hookahTobaccos.length >= 2
  const totalItems = barItems.reduce((sum, b) => sum + b.quantity, 0) + (hasHookah ? 1 : 0)
  const isEmpty = totalItems === 0

  if (isEmpty) return null

  // Success toast
  if (sent) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4">
        <div className="max-w-lg mx-auto p-4 rounded-2xl bg-[var(--color-success)] text-white text-center font-semibold shadow-lg animate-fadeInUp">
          {String(tm.waiterOrderSent)}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Expanded details */}
      {expanded && (
        <div className="bg-[var(--color-bgCard)] border-t border-[var(--color-border)] max-h-[60vh] overflow-y-auto p-4 space-y-3 shadow-2xl">
          {/* Bar items */}
          {barItems.map(item => (
            <div key={item.recipe.id} className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-bgHover)]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm">🍸</span>
                <span className="text-sm font-medium truncate">{item.recipe.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button type="button" onClick={() => onUpdateBarQty(item.recipe.id, -1)} className="w-7 h-7 rounded-lg bg-[var(--color-bgCard)] flex items-center justify-center" aria-label="Decrease quantity">
                  <IconMinus size={12} />
                </button>
                <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                <button type="button" onClick={() => onUpdateBarQty(item.recipe.id, 1)} className="w-7 h-7 rounded-lg bg-[var(--color-bgCard)] flex items-center justify-center" aria-label="Increase quantity">
                  <IconPlus size={12} />
                </button>
                <button type="button" onClick={() => onRemoveBarItem(item.recipe.id)} className="w-7 h-7 rounded-lg text-[var(--color-danger)] flex items-center justify-center" aria-label="Remove item">
                  <IconClose size={12} />
                </button>
              </div>
            </div>
          ))}

          {/* Hookah summary */}
          {hasHookah && (
            <div className="p-2 rounded-lg bg-[var(--color-bgHover)]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">🔥</span>
                <span className="text-sm font-medium">Hookah</span>
              </div>
              {hookahMode === 'freetext' ? (
                <p className="text-xs text-[var(--color-textMuted)]">{hookahDescription}</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {hookahTobaccos.map(t => (
                    <span key={t.tobacco.id} className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bgCard)]" style={{ borderLeft: `3px solid ${t.tobacco.color}` }}>
                      {t.tobacco.flavor} {t.percent}%
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Guest name */}
          <input
            type="text"
            value={guestName}
            onChange={e => onSetGuestName(e.target.value)}
            placeholder={String(tm.waiterGuestName)}
            className="w-full px-3 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] text-sm focus:border-[var(--color-primary)] focus:outline-none"
          />

          {/* Notes */}
          <input
            type="text"
            value={notes}
            onChange={e => onSetNotes(e.target.value)}
            placeholder={String(tm.waiterNotes)}
            className="w-full px-3 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] text-sm focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>
      )}

      {/* Bottom bar */}
      <div className="bg-[var(--color-bgCard)] border-t border-[var(--color-border)] p-3 shadow-xl">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button type="button"
            onClick={onToggle}
            className="flex items-center gap-2 flex-1 min-w-0"
          >
            <span className="w-7 h-7 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold flex items-center justify-center">
              {totalItems}
            </span>
            <div className="text-left min-w-0">
              <div className="text-sm font-medium truncate">
                {String(tm.waiterCart)}
                {tableName && <span className="text-[var(--color-textMuted)]"> · {tableName}</span>}
              </div>
            </div>
            <span className={`text-xs transition-transform ${expanded ? 'rotate-180' : ''}`}>▲</span>
          </button>
          <button type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold transition-all disabled:opacity-50 active:scale-95"
          >
            {submitting ? '...' : String(tm.waiterSendToKds)}
          </button>
        </div>
      </div>
    </div>
  )
}
