'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n'
import type { RecommendedMix } from '@/logic/recommendationEngine'

export function MixResultCard({
  result,
  onApply,
}: {
  result: RecommendedMix
  onApply: () => void
}) {
  const t = useTranslation('hookah')
  const { mix, matchScore, matchReasons, availability, missingTobaccos, replacements } = result
  const [isExpanded, setIsExpanded] = useState(false)

  const availabilityBadge = availability && {
    full: { text: t.recommendAvailFull, color: 'var(--color-success)' },
    partial: { text: t.recommendAvailPartial, color: 'var(--color-warning)' },
    none: { text: t.recommendAvailNone, color: 'var(--color-danger)' },
  }[availability]

  return (
    <div
      className="p-4 rounded-xl transition-all hover:shadow-lg"
      style={{ background: 'var(--color-bgHover)' }}
    >
      <div
        className="flex items-start justify-between gap-3 cursor-pointer"
        onClick={() => setIsExpanded(prev => !prev)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
              {mix.name}
            </span>
            <div className="flex gap-0.5">
              {[...Array(mix.popularity)].map((_, i) => (
                <span key={i} className="text-xs" style={{ color: 'var(--color-warning)' }}>
                  ★
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs line-clamp-1" style={{ color: 'var(--color-textMuted)' }}>
            {mix.description}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {matchReasons.slice(0, 3).map((reason, i) => (
              <span
                key={`${reason}-${i}`}
                className="text-xs px-1.5 py-0.5 rounded"
                style={{
                  background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
                  color: 'var(--color-primary)',
                }}
              >
                {reason}
              </span>
            ))}
          </div>
        </div>

        <div className="text-right flex flex-col items-end gap-1">
          {availabilityBadge && (
            <div
              className="text-xs px-2 py-1 rounded-lg"
              style={{
                background: `color-mix(in srgb, ${availabilityBadge.color} 15%, transparent)`,
                color: availabilityBadge.color,
              }}
            >
              {availabilityBadge.text}
            </div>
          )}
          <div
            className="text-xs font-medium"
            style={{ color: 'var(--color-primary)' }}
          >
            {t.matchPercent(matchScore)}
          </div>
          <span
            className={`text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            style={{ color: 'var(--color-textMuted)' }}
          >
            ▼
          </span>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <p
            className="text-xs font-medium mb-2"
            style={{ color: 'var(--color-textMuted)' }}
          >
            {t.recommendComposition}
          </p>
          <div className="space-y-1.5">
            {mix.ingredients.map((ing) => (
              <div key={`${ing.brand ?? ''}-${ing.flavor}`} className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--color-text)' }}>
                  {ing.brand ? `${ing.brand} ` : ''}{ing.flavor}
                </span>
                <span style={{ color: 'var(--color-textMuted)' }}>{ing.percent}%</span>
              </div>
            ))}
          </div>

          {/* Missing tobaccos & replacements */}
          {missingTobaccos.length > 0 && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <p
                className="text-xs font-medium mb-2"
                style={{ color: 'var(--color-warning)' }}
              >
                {t.recommendMissing}
              </p>
              <ul className="text-xs space-y-1" style={{ color: 'var(--color-textMuted)' }}>
                {missingTobaccos.map((tobacco) => (
                  <li key={tobacco}>• {tobacco}</li>
                ))}
              </ul>

              {replacements.length > 0 && (
                <div className="mt-2">
                  <p
                    className="text-xs font-medium mb-1"
                    style={{ color: 'var(--color-success)' }}
                  >
                    {t.recommendReplacements}
                  </p>
                  <ul className="text-xs space-y-1" style={{ color: 'var(--color-textMuted)' }}>
                    {replacements.map((r) => (
                      <li key={`${r.originalFlavor}-${r.replacement.flavor}`}>
                        {r.originalFlavor} → {r.replacement.brand} {r.replacement.flavor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Apply button */}
          <div className="mt-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onApply()
              }}
              className="btn btn-primary w-full text-sm"
            >
              {t.recommendUseMix}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
