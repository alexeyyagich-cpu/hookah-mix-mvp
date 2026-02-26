'use client'

import { useState } from 'react'
import { useReviews } from '@/lib/hooks/useReviews'
import { IconStar, IconTrash } from '@/components/Icons'
import { useTranslation, useLocale, formatDate } from '@/lib/i18n'
import { EmptyState } from '@/components/ui/EmptyState'

type Filter = 'all' | 'published' | 'hidden'

export default function ReviewsPage() {
  const tm = useTranslation('manage')
  const { locale } = useLocale()
  const { reviews, loading, averageRating, totalCount, togglePublished, deleteReview } = useReviews()
  const [filter, setFilter] = useState<Filter>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredReviews = reviews.filter(r => {
    if (filter === 'published') return r.is_published
    if (filter === 'hidden') return !r.is_published
    return true
  })

  const publishedCount = reviews.filter(r => r.is_published).length
  const hiddenCount = reviews.filter(r => !r.is_published).length

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await deleteReview(id)
    setDeletingId(null)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[var(--color-bgHover)] rounded animate-pulse" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-6 h-32 animate-pulse bg-[var(--color-bgHover)]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{tm.reviewsTitle}</h1>
          <div className="flex items-center gap-3 text-[var(--color-textMuted)] mt-1">
            {totalCount > 0 && (
              <>
                <span className="flex items-center gap-1">
                  <IconStar size={16} className="text-[var(--color-warning)]" />
                  {averageRating}
                </span>
                <span>{tm.reviewsCountLabel(totalCount)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {([
          ['all', tm.filterAllReviews(totalCount)],
          ['published', tm.filterPublished(publishedCount)],
          ['hidden', tm.filterHidden(hiddenCount)],
        ] as [Filter, string][]).map(([key, label]) => (
          <button type="button"
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              filter === key
                ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                : 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <EmptyState
          icon={<IconStar size={32} />}
          title={filter === 'all' ? tm.noReviewsYet : filter === 'published' ? tm.noPublishedReviews : tm.noHiddenReviews}
          description={tm.sharePageHint}
        />
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className={`card p-5 transition-opacity ${!review.is_published ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-[var(--color-warning)] flex items-center justify-center text-lg font-bold text-black flex-shrink-0">
                  {review.author_name.charAt(0)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{review.author_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-sm ${i < review.rating ? 'text-[var(--color-warning)]' : 'text-[var(--color-border)]'}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-[var(--color-textMuted)]">
                          {formatDate(review.created_at, locale)}
                        </span>
                        {!review.is_published && (
                          <span className="px-2 py-0.5 rounded text-xs bg-[var(--color-bgHover)] text-[var(--color-textMuted)]">
                            {tm.hiddenBadge}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button type="button"
                        onClick={() => togglePublished(review.id, !review.is_published)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-[var(--color-bgHover)] hover:bg-[var(--color-primary)]/20 text-[var(--color-textMuted)] hover:text-[var(--color-primary)]"
                      >
                        {review.is_published ? tm.actionHide : tm.actionPublish}
                      </button>
                      <button type="button"
                        onClick={() => handleDelete(review.id)}
                        disabled={deletingId === review.id}
                        className="p-1.5 rounded-lg text-[var(--color-textMuted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors disabled:opacity-50"
                        aria-label={tm.deleteReview}
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>

                  {review.text && (
                    <p className="mt-2 text-sm text-[var(--color-textMuted)]">
                      {review.text}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
