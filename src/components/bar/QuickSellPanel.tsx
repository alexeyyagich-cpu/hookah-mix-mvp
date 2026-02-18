'use client'

import { useState } from 'react'
import type { BarRecipeWithIngredients, RecipeCost } from '@/types/database'

interface QuickSellPanelProps {
  recipes: BarRecipeWithIngredients[]
  calculateCost: (recipe: BarRecipeWithIngredients) => RecipeCost
  onSell: (recipe: BarRecipeWithIngredients) => Promise<void>
}

export function QuickSellPanel({ recipes, calculateCost, onSell }: QuickSellPanelProps) {
  const [sellingId, setSellingId] = useState<string | null>(null)
  const [soldId, setSoldId] = useState<string | null>(null)

  const menuRecipes = recipes.filter(r => r.is_on_menu)

  const handleSell = async (recipe: BarRecipeWithIngredients) => {
    setSellingId(recipe.id)
    try {
      await onSell(recipe)
      setSoldId(recipe.id)
      setTimeout(() => setSoldId(null), 1500)
    } finally {
      setSellingId(null)
    }
  }

  if (menuRecipes.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm text-[var(--color-textMuted)]">
          Добавьте рецепты в меню для быстрой продажи
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm text-[var(--color-textMuted)] uppercase tracking-wide">
        Быстрая продажа
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {menuRecipes.map(recipe => {
          const cost = calculateCost(recipe)
          const isSelling = sellingId === recipe.id
          const justSold = soldId === recipe.id

          return (
            <button
              key={recipe.id}
              onClick={() => handleSell(recipe)}
              disabled={isSelling}
              className={`card p-4 text-left transition-all active:scale-95 ${
                justSold
                  ? 'border-[var(--color-success)] bg-[var(--color-success)]/10'
                  : 'hover:border-[var(--color-primary)]/30'
              } ${isSelling ? 'opacity-60' : ''}`}
            >
              <div className="font-medium text-sm truncate">{recipe.name}</div>
              {recipe.name_en && (
                <div className="text-xs text-[var(--color-textMuted)] truncate">{recipe.name_en}</div>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="font-mono font-bold text-base">
                  {recipe.menu_price ? `${recipe.menu_price}€` : '—'}
                </span>
                {cost.margin !== null && (
                  <span className={`text-xs font-mono ${
                    cost.margin >= 60 ? 'text-[var(--color-success)]' : cost.margin >= 40 ? 'text-[var(--color-warning)]' : 'text-[var(--color-danger)]'
                  }`}>
                    {cost.margin.toFixed(0)}%
                  </span>
                )}
              </div>
              {justSold && (
                <div className="text-xs text-[var(--color-success)] font-medium mt-1">
                  Продано!
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
