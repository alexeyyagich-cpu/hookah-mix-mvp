'use client'

import { useState, useMemo } from 'react'
import { useBarRecipes } from '@/lib/hooks/useBarRecipes'
import { COCKTAIL_METHOD_EMOJI } from '@/data/bar-recipes'
import { useTranslation, useLocale, getLocaleName, formatCurrency } from '@/lib/i18n'

export default function BarMenuPage() {
  const tb = useTranslation('bar')
  const { locale } = useLocale()

  const METHOD_LABELS: Record<string, string> = {
    build: tb.methodBuild, stir: tb.methodStir, shake: tb.methodShake,
    blend: tb.methodBlend, layer: tb.methodLayer, muddle: tb.methodMuddle,
  }
  const GLASS_LABELS: Record<string, string> = {
    highball: tb.glassHighball, rocks: tb.glassRocks, coupe: tb.glassCoupe,
    flute: tb.glassFlute, martini: tb.glassMartini, collins: tb.glassCollins,
    hurricane: tb.glassHurricane, shot: tb.glassShot, wine: tb.glassWine,
    beer: tb.glassBeer, copper_mug: tb.glassCopperMug, tiki: tb.glassTiki,
    other: tb.glassOther,
  }
  const DIFFICULTY_LABELS: Record<number, string> = { 1: tb.easy, 2: tb.medium, 3: tb.hard }
  const PORTION_LABELS: Record<string, string> = {
    ml: tb.portionMl, g: tb.portionG, pcs: tb.portionPcs,
    oz: tb.portionOz, cl: tb.portionCl, dash: tb.portionDash,
    barspoon: tb.portionBarspoon, drop: tb.portionDrop, slice: tb.portionSlice,
    sprig: tb.portionSprig, wedge: tb.portionWedge, twist: tb.portionTwist,
  }

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
            {tb.menuItemsInMenu(menuRecipes.length)}
            {avgPrice !== null && ` · ${tb.avgPriceLabel(avgPrice.toFixed(0))}`}
          </p>
        </div>
        <select
          value={groupBy}
          onChange={e => setGroupBy(e.target.value as 'method' | 'none')}
          className="px-4 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-sm"
        >
          <option value="method">{tb.byMethod}</option>
          <option value="none">{tb.noGrouping}</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">{tb.onMenu}</div>
          <div className="text-2xl font-bold mt-1">{menuRecipes.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">{tb.avgPriceCard}</div>
          <div className="text-2xl font-bold mt-1">
            {avgPrice !== null ? formatCurrency(avgPrice, locale) : '—'}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">{tb.avgMargin}</div>
          <div className={`text-2xl font-bold mt-1 ${
            avgMargin !== null
              ? avgMargin >= 60 ? 'text-[var(--color-success)]' : avgMargin >= 40 ? 'text-[var(--color-warning)]' : 'text-[var(--color-danger)]'
              : ''
          }`}>
            {avgMargin !== null ? `${avgMargin.toFixed(0)}%` : '—'}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">{tb.revenuePotential}</div>
          <div className="text-2xl font-bold mt-1">
            {totalRevenuePotential > 0 ? formatCurrency(totalRevenuePotential, locale) : '—'}
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
            {tb.menuEmptyGoToRecipes}
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
                    ? METHOD_LABELS[method as keyof typeof METHOD_LABELS]
                    : tb.others
                  }
                  <span className="text-sm font-normal text-[var(--color-textMuted)]">
                    ({items.length})
                  </span>
                </h2>
              )}

              <div className="card overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-textMuted)] uppercase">{tb.thName}</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-textMuted)] uppercase hidden sm:table-cell">{tb.thComposition}</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-[var(--color-textMuted)] uppercase">{tb.thCostPrice}</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-[var(--color-textMuted)] uppercase">{tb.thPrice}</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-[var(--color-textMuted)] uppercase">{tb.thMargin}</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-[var(--color-textMuted)] uppercase w-20">{tb.thRemove}</th>
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
                            <div className="font-medium text-sm">{getLocaleName(recipe, locale)}</div>
                            {locale === 'ru' && recipe.name_en && (
                              <div className="text-xs text-[var(--color-textMuted)]">{recipe.name_en}</div>
                            )}
                            {locale !== 'ru' && recipe.name_en && (
                              <div className="text-xs text-[var(--color-textMuted)]">{recipe.name}</div>
                            )}
                            {recipe.glass && GLASS_LABELS[recipe.glass] && (
                              <div className="text-xs text-[var(--color-textMuted)]">{GLASS_LABELS[recipe.glass]}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <div className="text-xs text-[var(--color-textMuted)] line-clamp-2">
                              {recipe.ingredients.map(ing =>
                                `${ing.ingredient_name} ${ing.quantity}${PORTION_LABELS[ing.unit]}`
                              ).join(', ')}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-mono text-sm">
                              {cost.total_cost > 0 ? formatCurrency(cost.total_cost, locale) : '—'}
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
                                <button type="button"
                                  onClick={() => handlePriceSave(recipe.id)}
                                  className="text-xs text-[var(--color-primary)] hover:underline"
                                >
                                  OK
                                </button>
                              </div>
                            ) : (
                              <button type="button"
                                onClick={() => {
                                  setEditingPrice(recipe.id)
                                  setPriceValue(recipe.menu_price?.toString() || '')
                                }}
                                className="font-mono text-sm font-semibold hover:text-[var(--color-primary)] transition-colors"
                                title={tb.clickToEdit}
                              >
                                {recipe.menu_price ? formatCurrency(recipe.menu_price, locale) : tb.setPrice}
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-mono text-sm font-semibold text-[var(--color-${marginColor})]`}>
                              {cost.margin !== null ? `${cost.margin.toFixed(0)}%` : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button type="button"
                              onClick={() => toggleOnMenu(recipe.id)}
                              className="text-xs text-[var(--color-textMuted)] hover:text-[var(--color-danger)] transition-colors"
                              title={tb.removeFromMenuTitle}
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
