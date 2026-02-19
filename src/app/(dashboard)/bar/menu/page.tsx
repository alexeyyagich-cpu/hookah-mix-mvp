'use client'

import { useState, useMemo } from 'react'
import { useBarRecipes } from '@/lib/hooks/useBarRecipes'
import { COCKTAIL_METHOD_LABELS, COCKTAIL_METHOD_EMOJI, GLASS_LABELS, DIFFICULTY_LABELS } from '@/data/bar-recipes'
import { BAR_PORTION_LABELS } from '@/data/bar-ingredients'
import { useTranslation } from '@/lib/i18n'

export default function BarMenuPage() {
  const tb = useTranslation('bar')
  const {
    recipes,
    loading,
    updateRecipe,
    toggleOnMenu,
    calculateCost,
  } = useBarRecipes()

  const [editingPrice, setEditingPrice] = useState<string | null>(null)
  const [priceValue, setPriceValue] = useState('')
  const [groupBy, setGroupBy] = useState<'method' | 'none'>('method')

  const menuRecipes = useMemo(
    () => recipes.filter(r => r.is_on_menu),
    [recipes]
  )

  // Group by method
  const grouped = useMemo(() => {
    if (groupBy === 'none') return { all: menuRecipes }
    const groups: Record<string, typeof menuRecipes> = {}
    for (const r of menuRecipes) {
      const key = r.method || 'other'
      if (!groups[key]) groups[key] = []
      groups[key].push(r)
    }
    return groups
  }, [menuRecipes, groupBy])

  const handlePriceSave = async (recipeId: string) => {
    const price = parseFloat(priceValue)
    if (!isNaN(price) && price >= 0) {
      await updateRecipe(recipeId, { menu_price: price })
    }
    setEditingPrice(null)
  }

  // Stats
  const avgPrice = useMemo(() => {
    const prices = menuRecipes
      .map(r => r.menu_price)
      .filter((p): p is number => p !== null && p > 0)
    if (prices.length === 0) return null
    return prices.reduce((a, b) => a + b, 0) / prices.length
  }, [menuRecipes])

  const avgMargin = useMemo(() => {
    const margins = menuRecipes
      .map(r => calculateCost(r).margin)
      .filter((m): m is number => m !== null)
    if (margins.length === 0) return null
    return margins.reduce((a, b) => a + b, 0) / margins.length
  }, [menuRecipes, calculateCost])

  const totalRevenuePotential = useMemo(() => {
    return menuRecipes.reduce((sum, r) => sum + (r.menu_price || 0), 0)
  }, [menuRecipes])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{tb.menuTitle}</h1>
          <p className="text-[var(--color-textMuted)]">
            {menuRecipes.length} позиций в меню
            {avgPrice !== null && ` · средняя цена ${avgPrice.toFixed(0)}€`}
          </p>
        </div>
        <select
          value={groupBy}
          onChange={e => setGroupBy(e.target.value as 'method' | 'none')}
          className="px-4 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-sm"
        >
          <option value="method">По методу</option>
          <option value="none">Без группировки</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">В меню</div>
          <div className="text-2xl font-bold mt-1">{menuRecipes.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">Средняя цена</div>
          <div className="text-2xl font-bold mt-1">
            {avgPrice !== null ? `${avgPrice.toFixed(0)}€` : '—'}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">Средняя маржа</div>
          <div className={`text-2xl font-bold mt-1 ${
            avgMargin !== null
              ? avgMargin >= 60 ? 'text-[var(--color-success)]' : avgMargin >= 40 ? 'text-[var(--color-warning)]' : 'text-[var(--color-danger)]'
              : ''
          }`}>
            {avgMargin !== null ? `${avgMargin.toFixed(0)}%` : '—'}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">Потенциал выручки</div>
          <div className="text-2xl font-bold mt-1">
            {totalRevenuePotential > 0 ? `${totalRevenuePotential.toFixed(0)}€` : '—'}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="card p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto" />
        </div>
      ) : menuRecipes.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-lg font-semibold mb-2">{tb.menuEmpty}</h3>
          <p className="text-[var(--color-textMuted)] max-w-md mx-auto">
            Перейдите в раздел &laquo;Рецепты&raquo; и добавьте коктейли в меню, нажав кнопку &laquo;Добавить в меню&raquo;.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([method, items]) => (
            <div key={method} className="space-y-3">
              {groupBy === 'method' && (
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  {method !== 'other' && COCKTAIL_METHOD_EMOJI[method as keyof typeof COCKTAIL_METHOD_EMOJI]}
                  {method !== 'other'
                    ? COCKTAIL_METHOD_LABELS[method as keyof typeof COCKTAIL_METHOD_LABELS]
                    : 'Другие'
                  }
                  <span className="text-sm font-normal text-[var(--color-textMuted)]">
                    ({items.length})
                  </span>
                </h2>
              )}

              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-textMuted)] uppercase">Название</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-textMuted)] uppercase hidden sm:table-cell">Состав</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-[var(--color-textMuted)] uppercase">Себестоимость</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-[var(--color-textMuted)] uppercase">Цена</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-[var(--color-textMuted)] uppercase">Маржа</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-[var(--color-textMuted)] uppercase w-20">Убрать</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(recipe => {
                      const cost = calculateCost(recipe)
                      const marginColor = cost.margin !== null
                        ? cost.margin >= 60 ? 'success' : cost.margin >= 40 ? 'warning' : 'danger'
                        : 'textMuted'

                      return (
                        <tr key={recipe.id} className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-bgHover)] transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-sm">{recipe.name}</div>
                            {recipe.name_en && (
                              <div className="text-xs text-[var(--color-textMuted)]">{recipe.name_en}</div>
                            )}
                            {recipe.glass && GLASS_LABELS[recipe.glass] && (
                              <div className="text-xs text-[var(--color-textMuted)]">{GLASS_LABELS[recipe.glass]}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <div className="text-xs text-[var(--color-textMuted)] line-clamp-2">
                              {recipe.ingredients.map(ing =>
                                `${ing.ingredient_name} ${ing.quantity}${BAR_PORTION_LABELS[ing.unit]}`
                              ).join(', ')}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-mono text-sm">
                              {cost.total_cost > 0 ? `${cost.total_cost.toFixed(2)}€` : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {editingPrice === recipe.id ? (
                              <div className="flex items-center justify-end gap-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={priceValue}
                                  onChange={e => setPriceValue(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handlePriceSave(recipe.id)
                                    if (e.key === 'Escape') setEditingPrice(null)
                                  }}
                                  autoFocus
                                  className="w-20 px-2 py-1 rounded-lg bg-[var(--color-bgCard)] border border-[var(--color-primary)] text-sm text-right focus:outline-none"
                                />
                                <button
                                  onClick={() => handlePriceSave(recipe.id)}
                                  className="text-xs text-[var(--color-primary)] hover:underline"
                                >
                                  OK
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingPrice(recipe.id)
                                  setPriceValue(recipe.menu_price?.toString() || '')
                                }}
                                className="font-mono text-sm font-semibold hover:text-[var(--color-primary)] transition-colors"
                                title="Нажмите для редактирования"
                              >
                                {recipe.menu_price ? `${recipe.menu_price.toFixed(2)}€` : 'Задать'}
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-mono text-sm font-semibold text-[var(--color-${marginColor})]`}>
                              {cost.margin !== null ? `${cost.margin.toFixed(0)}%` : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => toggleOnMenu(recipe.id)}
                              className="text-xs text-[var(--color-textMuted)] hover:text-[var(--color-danger)] transition-colors"
                              title="Убрать из меню"
                            >
                              <svg className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
