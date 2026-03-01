'use client'

import { useTranslation } from '@/lib/i18n'
import { CATEGORY_EMOJI } from '@/data/tobaccos'
import type { RecommendedTobacco } from '@/logic/recommendationEngine'

export function TobaccoResultCard({
  result,
  isSelected,
  isDisabled,
  onSelect,
}: {
  result: RecommendedTobacco
  isSelected: boolean
  isDisabled: boolean
  onSelect: () => void
}) {
  const t = useTranslation('hookah')
  const { tobacco, matchScore, inStock, stockQuantity } = result
  const categoryEmoji = CATEGORY_EMOJI[tobacco.category] || '🔸'

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isDisabled}
      className={`p-4 rounded-xl transition-all text-left w-full ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-lg cursor-pointer'
      } ${isSelected ? 'ring-2' : ''}`}
      style={{
        background: 'var(--color-bgHover)',
        borderLeft: `4px solid ${tobacco.color}`,
        ['--tw-ring-color' as string]: isSelected ? tobacco.color : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: tobacco.color }}
            />
            <span className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>
              {tobacco.flavor}
            </span>
            {isSelected && (
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: tobacco.color, color: 'var(--color-bg)' }}>
                ✓
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
            {tobacco.brand}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: 'var(--color-bgAccent)' }}
            >
              {categoryEmoji} {tobacco.category}
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: 'var(--color-bgAccent)' }}
            >
              {t.recommendStrengthBadge(tobacco.strength)}
            </span>
          </div>
        </div>

        <div className="text-right">
          {inStock !== null && (
            <div
              className={`text-xs px-2 py-1 rounded-lg mb-1 ${
                inStock ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
              }`}
              style={{
                background: inStock
                  ? 'color-mix(in srgb, var(--color-success) 15%, transparent)'
                  : 'color-mix(in srgb, var(--color-danger) 15%, transparent)',
              }}
            >
              {inStock ? `${stockQuantity}${t.gramsShort}` : t.recommendOutOfStock}
            </div>
          )}
          <div
            className="text-xs font-medium"
            style={{ color: 'var(--color-primary)' }}
          >
            {t.matchPercent(matchScore)}
          </div>
        </div>
      </div>
    </button>
  )
}
