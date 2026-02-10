'use client'

import { useMemo, useState } from 'react'
import type { Tobacco } from '@/data/tobaccos'
import type { TobaccoInventory } from '@/types/database'
import {
  calculateMixCost,
  calculateProfit,
  getSuggestedPrices,
  formatPrice,
} from '@/logic/costCalculator'

interface Props {
  items: { tobacco: Tobacco; percent: number }[]
  totalGrams: number
  inventory: TobaccoInventory[]
  currency?: string
}

export function MixCostBreakdown({ items, totalGrams, inventory, currency = '€' }: Props) {
  const [sellingPrice, setSellingPrice] = useState<string>('')

  const costResult = useMemo(
    () => calculateMixCost(items, totalGrams, inventory),
    [items, totalGrams, inventory]
  )

  const profit = useMemo(() => {
    if (costResult.totalCost === null) return null
    const price = parseFloat(sellingPrice)
    if (isNaN(price) || price <= 0) return null
    return calculateProfit(costResult.totalCost, price)
  }, [costResult.totalCost, sellingPrice])

  const suggestedPrices = useMemo(() => {
    if (costResult.totalCost === null) return []
    return getSuggestedPrices(costResult.totalCost)
  }, [costResult.totalCost])

  // Don't render if no inventory data
  if (inventory.length === 0) {
    return null
  }

  // Don't render if no items can be priced
  if (!costResult.hasPricing) {
    return (
      <div
        className="p-4 rounded-xl text-sm"
        style={{
          background: 'color-mix(in srgb, var(--color-warning) 10%, transparent)',
          color: 'var(--color-textMuted)',
        }}
      >
        <p className="flex items-center gap-2">
          <span>💰</span>
          <span>Укажите цены закупки в инвентаре для расчёта себестоимости</span>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-lg">💰</span>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          Себестоимость
        </h3>
      </div>

      {/* Cost breakdown per tobacco */}
      <div className="space-y-2">
        {costResult.items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between text-sm p-2 rounded-lg"
            style={{ background: 'var(--color-bgHover)' }}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ background: item.tobacco.color }}
              />
              <span style={{ color: 'var(--color-text)' }}>
                {item.tobacco.flavor}
              </span>
              <span style={{ color: 'var(--color-textMuted)' }}>
                ({item.grams.toFixed(1)}г)
              </span>
            </div>
            <span
              className="font-medium"
              style={{ color: item.cost !== null ? 'var(--color-text)' : 'var(--color-textMuted)' }}
            >
              {formatPrice(item.cost, currency)}
            </span>
          </div>
        ))}
      </div>

      {/* Total cost */}
      {costResult.totalCost !== null && (
        <div
          className="flex items-center justify-between p-3 rounded-xl"
          style={{
            background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
          }}
        >
          <span className="font-medium" style={{ color: 'var(--color-text)' }}>
            Итого себестоимость:
          </span>
          <span
            className="text-xl font-bold"
            style={{ color: 'var(--color-primary)' }}
          >
            {formatPrice(costResult.totalCost, currency)}
          </span>
        </div>
      )}

      {/* Missing prices warning */}
      {costResult.missingPrices.length > 0 && (
        <div
          className="text-xs p-2 rounded-lg"
          style={{
            background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)',
            color: 'var(--color-warning)',
          }}
        >
          Нет цен: {costResult.missingPrices.join(', ')}
        </div>
      )}

      {/* Pricing calculator */}
      {costResult.totalCost !== null && (
        <div className="space-y-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
          {/* Suggested prices */}
          <div className="flex flex-wrap gap-2">
            {suggestedPrices.map((suggestion) => (
              <button
                key={suggestion.label}
                onClick={() => setSellingPrice(suggestion.price.toString())}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
                style={{
                  background: 'var(--color-bgAccent)',
                  color: 'var(--color-text)',
                }}
              >
                {suggestion.label} = {formatPrice(suggestion.price, currency)}
              </button>
            ))}
          </div>

          {/* Custom price input */}
          <div className="flex items-center gap-3">
            <label className="text-sm" style={{ color: 'var(--color-textMuted)' }}>
              Цена продажи:
            </label>
            <div className="relative flex-1 max-w-[150px]">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: 'var(--color-textMuted)' }}
              >
                {currency}
              </span>
              <input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0.00"
                step="0.50"
                min="0"
                className="w-full pl-7 pr-3 py-2 rounded-lg text-sm"
                style={{
                  background: 'var(--color-bgHover)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
            </div>
          </div>

          {/* Profit display */}
          {profit && (
            <div
              className="flex items-center justify-between p-3 rounded-xl"
              style={{
                background: profit.profit > 0
                  ? 'color-mix(in srgb, var(--color-success) 15%, transparent)'
                  : 'color-mix(in srgb, var(--color-danger) 15%, transparent)',
              }}
            >
              <div>
                <p className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
                  Прибыль
                </p>
                <p
                  className="text-lg font-bold"
                  style={{
                    color: profit.profit > 0 ? 'var(--color-success)' : 'var(--color-danger)',
                  }}
                >
                  {formatPrice(profit.profit, currency)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
                  Маржа
                </p>
                <p
                  className="text-lg font-bold"
                  style={{
                    color: profit.marginPercent >= 50 ? 'var(--color-success)' : 'var(--color-warning)',
                  }}
                >
                  {profit.marginPercent.toFixed(0)}%
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
