'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n'

export function ReviewForm({
  profileId,
  onSubmit,
  submitting,
}: {
  profileId: string
  onSubmit: (review: { author_name: string; rating: number; text?: string }) => Promise<boolean>
  submitting: boolean
}) {
  const t = useTranslation('hookah')
  const [name, setName] = useState('')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || rating === 0) return

    const success = await onSubmit({
      author_name: name.trim(),
      rating,
      text: text.trim() || undefined,
    })

    if (success) {
      setSubmitted(true)
      setName('')
      setRating(0)
      setText('')
    }
  }

  if (submitted) {
    return (
      <div className="card p-6 mb-8 text-center">
        <div className="text-4xl mb-3">{'\u{1F389}'}</div>
        <h3 className="text-lg font-bold mb-1">{t.reviewThankYou}</h3>
        <p className="text-[var(--color-textMuted)] text-sm">{t.reviewAfterModeration}</p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-4 text-sm text-[var(--color-primary)] hover:underline"
        >
          {t.reviewLeaveAnother}
        </button>
      </div>
    )
  }

  return (
    <div className="card p-6 mb-8">
      <h3 className="text-lg font-bold mb-4">{t.reviewFormTitle}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t.reviewNameLabel}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.reviewNamePlaceholder}
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t.reviewRatingLabel}</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="text-2xl transition-transform hover:scale-110"
              >
                <span className={star <= (hoverRating || rating) ? 'text-[var(--color-warning)]' : 'text-[var(--color-border)]'}>
                  {'\u2605'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t.reviewTextLabel}</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.reviewTextPlaceholder}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none transition-colors resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={!name.trim() || rating === 0 || submitting}
          className="btn btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? t.reviewSubmitting : t.reviewSubmitBtn}
        </button>
      </form>
    </div>
  )
}
