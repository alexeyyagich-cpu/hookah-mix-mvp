'use client'

import { useState, useMemo } from 'react'
import { IconSearch, IconPlus, IconMinus } from '@/components/Icons'
import { TOBACCOS, type Tobacco } from '@/data/tobaccos'
import { getLocaleName, useLocale } from '@/lib/i18n'
import type { BarRecipeWithIngredients, BowlType, TobaccoInventory } from '@/types/database'

interface BarItemEntry {
  recipe: BarRecipeWithIngredients
  quantity: number
}

interface SelectedTobacco {
  tobacco: Tobacco
  percent: number
}

interface MenuSectionProps {
  activeTab: 'bar' | 'hookah'
  recipes: BarRecipeWithIngredients[]
  barItems: BarItemEntry[]
  onAddBarItem: (recipe: BarRecipeWithIngredients) => void
  onUpdateBarItemQty: (recipeId: string, delta: number) => void
  tobaccos: SelectedTobacco[]
  onAddTobacco: (tobacco: Tobacco) => void
  onRemoveTobacco: (id: string) => void
  bowls: BowlType[]
  selectedBowlId: string | null
  onSelectBowl: (id: string | null) => void
  totalGrams: number
  onSetTotalGrams: (g: number) => void
  inventory: TobaccoInventory[]
  hookahMode: 'structured' | 'freetext'
  hookahDescription: string
  onSetHookahMode: (mode: 'structured' | 'freetext') => void
  onSetHookahDescription: (desc: string) => void
  tm: Record<string, unknown>
}

export function MenuSection({
  activeTab,
  recipes,
  barItems,
  onAddBarItem,
  onUpdateBarItemQty,
  tobaccos,
  onAddTobacco,
  onRemoveTobacco,
  bowls,
  selectedBowlId,
  onSelectBowl,
  totalGrams,
  onSetTotalGrams,
  inventory,
  hookahMode,
  hookahDescription,
  onSetHookahMode,
  onSetHookahDescription,
  tm,
}: MenuSectionProps) {
  const [search, setSearch] = useState('')
  const { locale } = useLocale()

  // Bar tab
  if (activeTab === 'bar') {
    const menuRecipes = recipes.filter(r => r.is_on_menu)
    const filtered = search
      ? menuRecipes.filter(r =>
          (r.name + (r.name_en || '')).toLowerCase().includes(search.toLowerCase())
        )
      : menuRecipes

    return (
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-textMuted)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={String(tm.waiterSearch)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] text-sm focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>

        {/* Recipes grid */}
        <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto">
          {filtered.map(recipe => {
            const inCart = barItems.find(b => b.recipe.id === recipe.id)
            const displayName = getLocaleName(recipe, locale)

            return (
              <div
                key={recipe.id}
                className={`p-3 rounded-xl border transition-all ${
                  inCart
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                    : 'border-[var(--color-border)] bg-[var(--color-bgCard)]'
                }`}
              >
                <div className="text-sm font-medium truncate mb-1">{displayName}</div>
                {recipe.menu_price && (
                  <div className="text-xs text-[var(--color-textMuted)] mb-2">{recipe.menu_price}€</div>
                )}

                {inCart ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateBarItemQty(recipe.id, -1)}
                      className="w-8 h-8 rounded-lg bg-[var(--color-bgHover)] flex items-center justify-center"
                    >
                      <IconMinus size={14} />
                    </button>
                    <span className="text-sm font-bold min-w-[20px] text-center">{inCart.quantity}</span>
                    <button
                      onClick={() => onUpdateBarItemQty(recipe.id, 1)}
                      className="w-8 h-8 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center"
                    >
                      <IconPlus size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onAddBarItem(recipe)}
                    className="w-full py-1.5 rounded-lg bg-[var(--color-bgHover)] text-xs font-medium hover:bg-[var(--color-primary)] hover:text-white transition-colors"
                  >
                    <IconPlus size={14} className="inline mr-1" />
                    Add
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Hookah tab
  const filteredTobaccos = useMemo(() => {
    if (!search) return TOBACCOS.slice(0, 50)
    return TOBACCOS.filter(t =>
      (t.flavor + t.brand).toLowerCase().includes(search.toLowerCase())
    )
  }, [search])

  const selectedIds = tobaccos.map(t => t.tobacco.id)

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => onSetHookahMode('structured')}
          className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${
            hookahMode === 'structured'
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)]'
          }`}
        >
          {String(tm.waiterStructured)}
        </button>
        <button
          onClick={() => onSetHookahMode('freetext')}
          className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${
            hookahMode === 'freetext'
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)]'
          }`}
        >
          {String(tm.waiterFreetext)}
        </button>
      </div>

      {hookahMode === 'freetext' ? (
        <div className="space-y-2">
          <textarea
            value={hookahDescription}
            onChange={e => onSetHookahDescription(e.target.value)}
            placeholder={String(tm.waiterHookahDescPlaceholder)}
            className="w-full p-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] text-sm resize-none focus:border-[var(--color-primary)] focus:outline-none"
            rows={3}
          />
        </div>
      ) : (
        <>
          {/* Selected tobaccos */}
          {tobaccos.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tobaccos.map(t => (
                <button
                  key={t.tobacco.id}
                  onClick={() => onRemoveTobacco(t.tobacco.id)}
                  className="pill group cursor-pointer"
                  style={{ borderColor: t.tobacco.color, borderWidth: '2px' }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.tobacco.color }} />
                  <span className="text-xs">{t.tobacco.flavor}</span>
                  <span className="opacity-40 group-hover:opacity-100 ml-0.5">×</span>
                </button>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-textMuted)]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={String(tm.waiterSearch)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] text-sm focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          {/* Tobacco grid */}
          <div className="grid grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto">
            {filteredTobaccos.map(tobacco => {
              const isSelected = selectedIds.includes(tobacco.id)
              const isDisabled = tobaccos.length >= 5 && !isSelected
              const invItem = inventory.find(i => i.tobacco_id === tobacco.id)

              return (
                <button
                  key={tobacco.id}
                  onClick={() => !isDisabled && (isSelected ? onRemoveTobacco(tobacco.id) : onAddTobacco(tobacco))}
                  disabled={isDisabled}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                      : isDisabled
                      ? 'border-[var(--color-border)] opacity-40'
                      : 'border-[var(--color-border)] bg-[var(--color-bgCard)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: tobacco.color }} />
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">{tobacco.flavor}</div>
                      <div className="text-[10px] text-[var(--color-textMuted)]">{tobacco.brand}</div>
                    </div>
                  </div>
                  {invItem && (
                    <div className="text-[10px] text-[var(--color-textMuted)] mt-1">{invItem.quantity_grams}g</div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Bowl & grams */}
          {tobaccos.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedBowlId || ''}
                onChange={e => onSelectBowl(e.target.value || null)}
                className="px-3 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] text-sm"
              >
                <option value="">{String(tm.waiterBowl)}</option>
                {bowls.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.capacity_grams}g)</option>
                ))}
              </select>
              <input
                type="number"
                value={totalGrams}
                onChange={e => onSetTotalGrams(parseInt(e.target.value) || 20)}
                className="px-3 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] text-sm"
                min={5}
                max={50}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
