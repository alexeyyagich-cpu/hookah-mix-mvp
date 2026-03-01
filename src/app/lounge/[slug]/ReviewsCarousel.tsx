'use client'

import { useRef, useState } from 'react'
import { useTranslation } from '@/lib/i18n'

export function ReviewsCarousel({ reviews, reviewsCount }: { reviews: { id: string; author_name: string; rating: number; text: string | null }[]; reviewsCount: number }) {
  const t = useTranslation('hookah')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [showLeftFade, setShowLeftFade] = useState(false)
  const [showRightFade, setShowRightFade] = useState(true)

  const handleScroll = () => {
    if (!scrollRef.current) return
    const container = scrollRef.current
    const { scrollLeft, scrollWidth, clientWidth } = container

    const cardWidth = 316
    const maxScroll = scrollWidth - clientWidth
    const scrollPercent = maxScroll > 0 ? scrollLeft / maxScroll : 0
    const newIndex = Math.round(scrollPercent * (reviews.length - 1))
    setActiveIndex(Math.max(0, Math.min(newIndex, reviews.length - 1)))

    setShowLeftFade(scrollLeft > 20)
    setShowRightFade(scrollLeft < maxScroll - 20)
  }

  const scrollToIndex = (index: number) => {
    if (!scrollRef.current) return
    const container = scrollRef.current
    const { scrollWidth, clientWidth } = container
    const maxScroll = scrollWidth - clientWidth
    const targetScroll = (index / (reviews.length - 1)) * maxScroll
    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    })
  }

  return (
    <div className="mb-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">
          {t.reviewsTitle} <span className="text-[var(--color-warning)]">{t.reviewsHighlight}</span>
        </h2>
        <p className="text-[var(--color-textMuted)]">
          {t.reviewsSubtitle(reviewsCount)}
        </p>
      </div>

      {/* Reviews Carousel */}
      <div className="relative overflow-hidden -mx-4">
        {/* Left fade gradient */}
        <div
          className={`absolute left-0 top-0 bottom-4 w-20 z-10 pointer-events-none transition-opacity duration-300 ${
            showLeftFade ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: 'linear-gradient(to right, var(--color-bg) 0%, var(--color-bg) 20%, transparent 100%)'
          }}
        />

        {/* Right fade gradient */}
        <div
          className={`absolute right-0 top-0 bottom-4 w-20 z-10 pointer-events-none transition-opacity duration-300 ${
            showRightFade ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: 'linear-gradient(to left, var(--color-bg) 0%, var(--color-bg) 20%, transparent 100%)'
          }}
        />

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide px-4"
        >
          {reviews.map((review) => (
            <div
              key={review.id}
              className="flex-shrink-0 w-[300px] sm:w-[350px] snap-center"
            >
              <div className="card p-5 h-full border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 transition-colors">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-warning)] flex items-center justify-center text-lg font-bold text-[var(--color-bg)] flex-shrink-0">
                    {review.author_name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{review.author_name}</p>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-sm ${i < review.rating ? 'text-[var(--color-warning)]' : 'text-[var(--color-border)]'}`}
                    >
                      {'\u2605'}
                    </span>
                  ))}
                </div>

                {/* Text */}
                {review.text && (
                  <p className="text-sm text-[var(--color-textMuted)] leading-relaxed">
                    &ldquo;{review.text}&rdquo;
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Scroll indicators - clickable dots */}
        <div className="flex justify-center gap-2 mt-4">
          {reviews.map((_, i) => (
            <button
              type="button"
              key={i}
              onClick={() => scrollToIndex(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? 'bg-[var(--color-primary)] w-6'
                  : 'bg-[var(--color-border)] hover:bg-[var(--color-textMuted)] w-2.5'
              }`}
              aria-label={t.reviewsGoTo(i + 1)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
