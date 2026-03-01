'use client'

import { useMemo } from 'react'
import { useTranslation, useLocale, getLocaleName, formatCurrency } from '@/lib/i18n'
import { IconPlus, IconMinus, IconClose } from '@/components/Icons'
import type { BarRecipeWithIngredients } from '@/types/database'
import type { BarItemEntry } from '@/types/shared'

export interface BarOrderTabProps {
  barItems: BarItemEntry[]
  setBarItems: React.Dispatch<React.SetStateAction<BarItemEntry[]>>
  recipes: BarRecipeWithIngredients[]
}

export default function BarOrderTab({
  barItems,
  setBarItems,
  recipes,
}: BarOrderTabProps) {
  const t = useTranslation('manage')
  const { locale } = useLocale()

  const menuRecipes = useMemo(
    () => recipes.filter(r => r.is_on_menu),
    [recipes]
  )

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
    setBarItems(prev =>
      prev
        .map(e =>
          e.recipe.id === recipeId
            ? { ...e, quantity: Math.max(0, e.quantity + delta) }
            : e
        )
        .filter(e => e.quantity > 0)
    )
  }

  const removeBarItem = (recipeId: string) => {
    setBarItems(prev => prev.filter(e => e.recipe.id !== recipeId))
  }

  return (
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
              <button type="button"
                key={recipe.id}
                onClick={() => addBarItem(recipe)}
                className={`p-3 rounded-xl text-left text-sm border transition-all active:scale-95 ${
                  inCart
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/30'
                }`}
              >
                <div className="font-medium truncate">{getLocaleName(recipe, locale)}</div>
                {recipe.menu_price && (
                  <div className="text-xs text-[var(--color-textMuted)] mt-0.5">{formatCurrency(recipe.menu_price, locale)}</div>
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
              <span className="text-sm font-medium truncate flex-1 mr-2">{getLocaleName(entry.recipe, locale)}</span>
              <div className="flex items-center gap-2">
                <button type="button"
                  onClick={() => updateBarItemQty(entry.recipe.id, -1)}
                  className="min-w-[44px] min-h-[44px] p-2.5 rounded-lg hover:bg-[var(--color-bgCard)] transition-colors flex items-center justify-center"
                  aria-label={t.decreaseQuantity}
                >
                  <IconMinus size={14} />
                </button>
                <span className="text-sm font-mono font-semibold w-6 text-center">{entry.quantity}</span>
                <button type="button"
                  onClick={() => updateBarItemQty(entry.recipe.id, 1)}
                  className="min-w-[44px] min-h-[44px] p-2.5 rounded-lg hover:bg-[var(--color-bgCard)] transition-colors flex items-center justify-center"
                  aria-label={t.increaseQuantity}
                >
                  <IconPlus size={14} />
                </button>
                <button type="button"
                  onClick={() => removeBarItem(entry.recipe.id)}
                  className="min-w-[44px] min-h-[44px] p-2.5 rounded-lg text-[var(--color-textMuted)] hover:text-[var(--color-danger)] transition-colors ml-1 flex items-center justify-center"
                  aria-label={t.removeItem}
                >
                  <IconClose size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
