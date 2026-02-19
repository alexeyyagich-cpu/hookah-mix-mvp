'use client'

import { useState, useMemo } from 'react'
import { useTranslation } from '@/lib/i18n'
import { IconPlus, IconMinus, IconClose, IconCocktail, IconBowl } from '@/components/Icons'
import type { FloorTable, BarRecipeWithIngredients, KdsOrderItem } from '@/types/database'
import type { CreateKdsOrderInput } from '@/lib/hooks/useKDS'

interface NewOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateOrder: (order: CreateKdsOrderInput) => Promise<unknown>
  tables: FloorTable[]
  recipes: BarRecipeWithIngredients[]
  isBarActive: boolean
  isHookahActive: boolean
}

interface BarItemEntry {
  recipe: BarRecipeWithIngredients
  quantity: number
}

const TABLE_STATUS_DOTS: Record<string, string> = {
  available: 'bg-[var(--color-success)]',
  occupied: 'bg-[var(--color-primary)]',
  reserved: 'bg-[var(--color-warning)]',
  cleaning: 'bg-[var(--color-textMuted)]',
}

export function NewOrderModal({
  isOpen,
  onClose,
  onCreateOrder,
  tables,
  recipes,
  isBarActive,
  isHookahActive,
}: NewOrderModalProps) {
  const t = useTranslation('manage')
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'bar' | 'hookah'>(isBarActive ? 'bar' : 'hookah')
  const [barItems, setBarItems] = useState<BarItemEntry[]>([])
  const [hookahDescription, setHookahDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const selectedTable = useMemo(
    () => tables.find(t => t.id === selectedTableId) || null,
    [tables, selectedTableId]
  )

  const menuRecipes = useMemo(
    () => recipes.filter(r => r.is_on_menu),
    [recipes]
  )

  const guestName = selectedTable?.current_guest_name || null

  const hasBarItems = barItems.length > 0
  const hasHookahItem = hookahDescription.trim().length > 0
  const canSubmit = (hasBarItems || hasHookahItem) && !saving

  const addBarItem = (recipe: BarRecipeWithIngredients) => {
    setBarItems(prev => {
      const existing = prev.find(e => e.recipe.id === recipe.id)
      if (existing) {
        return prev.map(e =>
          e.recipe.id === recipe.id
            ? { ...e, quantity: e.quantity + 1 }
            : e
        )
      }
      return [...prev, { recipe, quantity: 1 }]
    })
  }

  const updateBarItemQty = (recipeId: string, delta: number) => {
    setBarItems(prev => {
      return prev
        .map(e =>
          e.recipe.id === recipeId
            ? { ...e, quantity: Math.max(0, e.quantity + delta) }
            : e
        )
        .filter(e => e.quantity > 0)
    })
  }

  const removeBarItem = (recipeId: string) => {
    setBarItems(prev => prev.filter(e => e.recipe.id !== recipeId))
  }

  const resetForm = () => {
    setSelectedTableId(null)
    setBarItems([])
    setHookahDescription('')
    setNotes('')
    setActiveTab(isBarActive ? 'bar' : 'hookah')
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const base = {
        table_id: selectedTableId,
        table_name: selectedTable?.name || null,
        guest_name: guestName,
        notes: notes.trim() || null,
      }

      // Create bar order
      if (hasBarItems) {
        const items: KdsOrderItem[] = barItems.map(e => ({
          name: e.recipe.name,
          quantity: e.quantity,
          details: e.recipe.name_en || null,
        }))
        await onCreateOrder({ ...base, type: 'bar', items })
      }

      // Create hookah order
      if (hasHookahItem) {
        const items: KdsOrderItem[] = [{
          name: hookahDescription.trim(),
          quantity: 1,
          details: null,
        }]
        await onCreateOrder({ ...base, type: 'hookah', items })
      }

      resetForm()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--color-bgCard)] border border-[var(--color-border)] shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--color-bgCard)] px-6 pt-6 pb-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="text-xl font-bold">{t.newOrderHeader}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--color-bgHover)] transition-colors"
          >
            <IconClose size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Table picker */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-textMuted)] uppercase tracking-wide mb-3">
              {t.sectionTable}
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              <button
                onClick={() => setSelectedTableId(null)}
                className={`p-3 rounded-xl text-sm font-medium border transition-all ${
                  selectedTableId === null
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/30'
                }`}
              >
                {t.noTableBtn}
              </button>
              {tables.map(table => (
                <button
                  key={table.id}
                  onClick={() => setSelectedTableId(table.id)}
                  className={`p-3 rounded-xl text-sm font-medium border transition-all text-left ${
                    selectedTableId === table.id
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                      : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${TABLE_STATUS_DOTS[table.status]}`} />
                    <span className="truncate">{table.name}</span>
                  </div>
                  {table.current_guest_name && (
                    <div className="text-xs text-[var(--color-textMuted)] mt-0.5 truncate">
                      {table.current_guest_name}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Type tabs */}
          {isBarActive && isHookahActive && (
            <div className="flex gap-2 border-b border-[var(--color-border)]">
              <button
                onClick={() => setActiveTab('bar')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'bar'
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-transparent text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
                }`}
              >
                <IconCocktail size={16} />
                {t.tabBar}
              </button>
              <button
                onClick={() => setActiveTab('hookah')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'hookah'
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-transparent text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
                }`}
              >
                <IconBowl size={16} />
                {t.tabHookah}
              </button>
            </div>
          )}

          {/* Bar tab content */}
          {activeTab === 'bar' && isBarActive && (
            <div className="space-y-4">
              {menuRecipes.length === 0 ? (
                <div className="text-center py-6 text-[var(--color-textMuted)] text-sm">
                  {t.noMenuRecipesLong}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {menuRecipes.map(recipe => {
                    const inCart = barItems.find(e => e.recipe.id === recipe.id)
                    return (
                      <button
                        key={recipe.id}
                        onClick={() => addBarItem(recipe)}
                        className={`p-3 rounded-xl text-left text-sm border transition-all active:scale-95 ${
                          inCart
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                            : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/30'
                        }`}
                      >
                        <div className="font-medium truncate">{recipe.name}</div>
                        {recipe.menu_price && (
                          <div className="text-xs text-[var(--color-textMuted)] mt-0.5">{recipe.menu_price}€</div>
                        )}
                        {inCart && (
                          <div className="text-xs font-semibold text-[var(--color-primary)] mt-1">
                            x{inCart.quantity}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Selected bar items */}
              {barItems.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
                  <h4 className="text-xs font-semibold text-[var(--color-textMuted)] uppercase">{t.selectedItems}</h4>
                  {barItems.map(entry => (
                    <div
                      key={entry.recipe.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--color-bgHover)]"
                    >
                      <span className="text-sm font-medium truncate flex-1 mr-2">{entry.recipe.name}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateBarItemQty(entry.recipe.id, -1)}
                          className="p-1 rounded-lg hover:bg-[var(--color-bgCard)] transition-colors"
                        >
                          <IconMinus size={14} />
                        </button>
                        <span className="text-sm font-mono font-semibold w-6 text-center">{entry.quantity}</span>
                        <button
                          onClick={() => updateBarItemQty(entry.recipe.id, 1)}
                          className="p-1 rounded-lg hover:bg-[var(--color-bgCard)] transition-colors"
                        >
                          <IconPlus size={14} />
                        </button>
                        <button
                          onClick={() => removeBarItem(entry.recipe.id)}
                          className="p-1 rounded-lg text-[var(--color-textMuted)] hover:text-[var(--color-danger)] transition-colors ml-1"
                        >
                          <IconClose size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Hookah tab content */}
          {activeTab === 'hookah' && isHookahActive && (
            <div>
              <textarea
                value={hookahDescription}
                onChange={e => setHookahDescription(e.target.value)}
                placeholder={t.placeholderHookahMix}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-sm resize-none"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-textMuted)] uppercase tracking-wide mb-2">
              {t.sectionNotes}
            </h3>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t.placeholderSpecialRequests}
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-sm resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[var(--color-bgCard)] px-6 py-4 border-t border-[var(--color-border)] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--color-textMuted)] hover:bg-[var(--color-bgHover)] transition-colors"
          >
            {t.cancelBtn}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              canSubmit
                ? 'bg-[var(--color-primary)] text-white hover:opacity-90'
                : 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)] cursor-not-allowed'
            }`}
          >
            {saving ? t.creatingOrder : t.createOrderBtn}
          </button>
        </div>
      </div>
    </div>
  )
}
