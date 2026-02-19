'use client'

import { useTranslation } from '@/lib/i18n'
import type { RecipeCost } from '@/types/database'

interface CostCalculatorProps {
  cost: RecipeCost
}

export function CostCalculator({ cost }: CostCalculatorProps) {
  const t = useTranslation('bar')
  const marginColor = cost.margin !== null
    ? cost.margin >= 60 ? 'success' : cost.margin >= 40 ? 'warning' : 'danger'
    : 'textMuted'

  return (
    <div className="card p-5 space-y-4">
      <h3 className="font-semibold">{t.costCalculatorTitle}</h3>

      {/* Ingredients breakdown */}
      <div className="space-y-2">
        {cost.ingredients.map((ing, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                ing.in_stock ? 'bg-[var(--color-success)]' : 'bg-[var(--color-danger)]'
              }`} />
              <span className="truncate">{ing.ingredient_name}</span>
              <span className="text-xs text-[var(--color-textMuted)]">
                {ing.quantity} {ing.unit}
              </span>
            </div>
            <span className="font-mono text-xs ml-2">
              {ing.total_cost > 0 ? `${ing.total_cost.toFixed(2)}€` : '—'}
            </span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="pt-3 border-t border-[var(--color-border)] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t.costTotal}</span>
          <span className="font-mono font-semibold">
            {cost.total_cost > 0 ? `${cost.total_cost.toFixed(2)}€` : '—'}
          </span>
        </div>
        {cost.menu_price !== null && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t.sellingPrice}</span>
            <span className="font-mono font-semibold">{cost.menu_price.toFixed(2)}€</span>
          </div>
        )}
        {cost.margin !== null && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t.marginality}</span>
            <span className={`font-mono font-bold text-[var(--color-${marginColor})]`}>
              {cost.margin.toFixed(1)}%
            </span>
          </div>
        )}
        {cost.menu_price !== null && cost.total_cost > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t.profitPerServing}</span>
            <span className="font-mono font-semibold text-[var(--color-success)]">
              {(cost.menu_price - cost.total_cost).toFixed(2)}€
            </span>
          </div>
        )}
      </div>

      {/* Stock status */}
      {!cost.all_in_stock && (
        <div className="p-3 rounded-xl bg-[var(--color-warning)]/10 text-sm text-[var(--color-warning)]">
          {t.someIngredientsOutOfStock}
        </div>
      )}
    </div>
  )
}
