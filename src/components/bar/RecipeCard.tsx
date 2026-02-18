'use client'

import type { BarRecipeWithIngredients, RecipeCost } from '@/types/database'
import { COCKTAIL_METHOD_LABELS, COCKTAIL_METHOD_EMOJI, GLASS_LABELS, DIFFICULTY_LABELS } from '@/data/bar-recipes'
import { BAR_PORTION_LABELS } from '@/data/bar-ingredients'

interface RecipeCardProps {
  recipe: BarRecipeWithIngredients
  cost: RecipeCost
  onToggleMenu: () => void
  onToggleFavorite: () => void
  onEdit: () => void
  onDelete: () => void
}

export function RecipeCard({ recipe, cost, onToggleMenu, onToggleFavorite, onEdit, onDelete }: RecipeCardProps) {
  const marginColor = cost.margin !== null
    ? cost.margin >= 60 ? 'success' : cost.margin >= 40 ? 'warning' : 'danger'
    : 'textMuted'

  return (
    <div className="card p-5 hover:border-[var(--color-primary)]/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate">{recipe.name}</h3>
          {recipe.name_en && (
            <p className="text-xs text-[var(--color-textMuted)]">{recipe.name_en}</p>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={onToggleFavorite}
            className="p-1.5 rounded-lg hover:bg-[var(--color-bgHover)] transition-colors"
            title={recipe.is_favorite ? 'Убрать из избранного' : 'В избранное'}
          >
            <span className="text-sm">{recipe.is_favorite ? '\u2764\uFE0F' : '\u{1F90D}'}</span>
          </button>
        </div>
      </div>

      {/* Method + Glass + Difficulty */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {recipe.method && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--color-bgHover)] text-[var(--color-textMuted)]">
            {COCKTAIL_METHOD_EMOJI[recipe.method]} {COCKTAIL_METHOD_LABELS[recipe.method]}
          </span>
        )}
        {recipe.glass && GLASS_LABELS[recipe.glass] && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--color-bgHover)] text-[var(--color-textMuted)]">
            {GLASS_LABELS[recipe.glass]}
          </span>
        )}
        {recipe.difficulty && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--color-bgHover)] text-[var(--color-textMuted)]">
            {DIFFICULTY_LABELS[recipe.difficulty]}
          </span>
        )}
      </div>

      {/* Ingredients summary */}
      <div className="text-xs text-[var(--color-textMuted)] mb-3 line-clamp-2">
        {recipe.ingredients.map(ing =>
          `${ing.ingredient_name} ${ing.quantity}${BAR_PORTION_LABELS[ing.unit]}`
        ).join(' · ')}
      </div>

      {/* Cost + Price + Margin */}
      <div className="flex items-center gap-3 mb-3 pt-3 border-t border-[var(--color-border)]">
        <div className="flex-1">
          <div className="text-xs text-[var(--color-textMuted)]">Себестоимость</div>
          <div className="font-mono font-semibold text-sm">
            {cost.total_cost > 0 ? `${cost.total_cost.toFixed(2)}€` : '—'}
          </div>
        </div>
        {recipe.menu_price && (
          <div className="flex-1">
            <div className="text-xs text-[var(--color-textMuted)]">Цена</div>
            <div className="font-mono font-semibold text-sm">{recipe.menu_price.toFixed(2)}€</div>
          </div>
        )}
        {cost.margin !== null && (
          <div className="flex-1">
            <div className="text-xs text-[var(--color-textMuted)]">Маржа</div>
            <div className={`font-mono font-semibold text-sm text-[var(--color-${marginColor})]`}>
              {cost.margin.toFixed(0)}%
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleMenu}
          className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            recipe.is_on_menu
              ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
              : 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
          }`}
        >
          {recipe.is_on_menu ? 'В меню' : 'Добавить в меню'}
        </button>
        <button
          onClick={onEdit}
          className="px-3 py-1.5 rounded-lg text-xs text-[var(--color-textMuted)] hover:bg-[var(--color-bgHover)] transition-colors"
        >
          Изм.
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 rounded-lg text-xs text-[var(--color-textMuted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors"
        >
          Уд.
        </button>
      </div>
    </div>
  )
}
