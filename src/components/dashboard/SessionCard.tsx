'use client'

import { useTranslation, useLocale } from '@/lib/i18n'
import type { SessionWithItems } from '@/types/database'

interface SessionCardProps {
  session: SessionWithItems
  onView: (session: SessionWithItems) => void
  onDelete: (id: string) => void
  onRate: (id: string, rating: number) => void
}

export function SessionCard({ session, onView, onDelete, onRate }: SessionCardProps) {
  const t = useTranslation('hookah')
  const { locale } = useLocale()
  const date = new Date(session.session_date)
  const formattedDate = date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-[var(--color-textMuted)]'
    if (score >= 80) return 'text-[var(--color-success)]'
    if (score >= 60) return 'text-[var(--color-primary)]'
    if (score >= 40) return 'text-[var(--color-warning)]'
    return 'text-[var(--color-danger)]'
  }

  return (
    <div className="card p-5 hover:border-[var(--color-borderAccent)] transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm text-[var(--color-textMuted)]">{formattedDate}</div>
          {session.bowl_type && (
            <div className="text-xs text-[var(--color-textMuted)] mt-1">
              🥣 {session.bowl_type.name}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${getScoreColor(session.compatibility_score)}`}>
            {session.compatibility_score || '—'}%
          </span>
        </div>
      </div>

      {/* Mix Items */}
      <div className="space-y-2 mb-4">
        {session.session_items?.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.brand}</span>
              <span className="text-[var(--color-textMuted)]">{item.flavor}</span>
            </div>
            <div className="text-[var(--color-textMuted)]">
              {item.grams_used}g ({item.percentage}%)
            </div>
          </div>
        ))}
      </div>

      {/* Total & Rating */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
        <div className="text-sm">
          <span className="text-[var(--color-textMuted)]">{t.totalSessionLabel}</span>{' '}
          <span className="font-medium">{session.total_grams}g</span>
        </div>

        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => onRate(session.id, star)}
              className={`text-lg transition-colors ${
                (session.rating || 0) >= star
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-border)] hover:text-[var(--color-primary)]'
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      {session.notes && (
        <div className="mt-3 p-3 rounded-lg bg-[var(--color-bgHover)] text-sm text-[var(--color-textMuted)]">
          {session.notes}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          onClick={() => onView(session)}
          className="text-sm text-[var(--color-primary)] hover:underline"
        >
          {t.viewDetails}
        </button>
        <button
          onClick={() => onDelete(session.id)}
          className="text-sm text-[var(--color-danger)] hover:underline"
        >
          {t.deleteItem}
        </button>
      </div>
    </div>
  )
}
