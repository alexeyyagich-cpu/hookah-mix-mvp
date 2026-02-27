'use client'

import { use, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePublicLounge } from '@/lib/hooks/useLoungeProfile'
import { usePublicReviews } from '@/lib/hooks/useReviews'
import { usePublicReservation } from '@/lib/hooks/useReservations'
import { BrandLoader } from '@/components/BrandLoader'
import {
  IconStar,
  IconTarget,
  IconCalendar,
} from '@/components/Icons'
import { useTranslation, useLocale } from '@/lib/i18n'
import type { LoungeFeature } from '@/types/lounge'

// Fallback demo reviews (used when no real reviews loaded)
const DEMO_REVIEWS = [
  {
    id: '1',
    author_name: 'Piotr Kowalski',
    rating: 5,
    text: 'Best hookah lounge in the city! Amazing atmosphere, always friendly staff. Signature mixes are fire, especially Signature Pink.',
  },
  {
    id: '2',
    author_name: 'Lena Schmidt',
    rating: 5,
    text: 'Love this place! Cozy interior, great hookahs and excellent music. Highly recommend to everyone.',
  },
  {
    id: '3',
    author_name: 'Jakub Nowak',
    rating: 4,
    text: 'Great tobacco selection and professional hookah masters. Tropical Storm is my favorite. Will come again!',
  },
  {
    id: '4',
    author_name: 'Sophie M\u00FCller',
    rating: 5,
    text: 'Celebrated a birthday here \u2014 everything was perfect! VIP room is very cozy, service is top-notch.',
  },
  {
    id: '5',
    author_name: 'Marek Zielinski',
    rating: 5,
    text: 'Bowl packing quality and service at the highest level. The terrace in summer is amazing. A must visit!',
  },
]

// Feature icon lookup (static, no translation needed)
const FEATURE_ICONS: Record<LoungeFeature, string> = {
  wifi: '\u{1F4F6}',
  parking: '\u{1F17F}\uFE0F',
  terrace: '\u{1F33F}',
  vip_rooms: '\u{1F451}',
  food: '\u{1F37D}\uFE0F',
  alcohol: '\u{1F378}',
  live_music: '\u{1F3B5}',
  dj: '\u{1F3A7}',
  karaoke: '\u{1F3A4}',
  board_games: '\u{1F3B2}',
  playstation: '\u{1F3AE}',
  hookah_delivery: '\u{1F697}',
  reservations: '\u{1F4C5}',
}

export default function LoungePageClient({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const t = useTranslation('hookah')
  const { locale } = useLocale()
  const { lounge, mixes, loading, error } = usePublicLounge(slug)
  const { reviews: realReviews, submitReview, submitting: reviewSubmitting } = usePublicReviews(lounge?.profile_id)

  const DAY_NAMES: Record<string, string> = useMemo(() => ({
    monday: t.loungeDayMon,
    tuesday: t.loungeDayTue,
    wednesday: t.loungeDayWed,
    thursday: t.loungeDayThu,
    friday: t.loungeDayFri,
    saturday: t.loungeDaySat,
    sunday: t.loungeDaySun,
  }), [t, locale])

  const FEATURE_LABELS: Record<LoungeFeature, string> = useMemo(() => ({
    wifi: t.featureWifi,
    parking: t.featureParking,
    terrace: t.featureTerrace,
    vip_rooms: t.featureVipRooms,
    food: t.featureFood,
    alcohol: t.featureAlcohol,
    live_music: t.featureLiveMusic,
    dj: t.featureDj,
    karaoke: t.featureKaraoke,
    board_games: t.featureBoardGames,
    playstation: t.featurePlaystation,
    hookah_delivery: t.featureHookahDelivery,
    reservations: t.featureReservations,
  }), [t, locale])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <BrandLoader size="lg" text={t.loungeLoading} />
      </div>
    )
  }

  if (error || !lounge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center">
          <div className="text-6xl mb-4">{'\u{1F50D}'}</div>
          <h1 className="text-2xl font-bold mb-2">{t.loungeNotFound}</h1>
          <p className="text-[var(--color-textMuted)] mb-6">
            {t.loungeNotFoundHint}
          </p>
          <Link href="/mix" className="btn btn-primary">
            {t.loungeGoHome}
          </Link>
        </div>
      </div>
    )
  }

  const signatureMixes = mixes.filter(m => m.is_signature)
  const isDemo = slug === 'demo-lounge'
  const displayReviews = realReviews.length > 0
    ? realReviews.map(r => ({ id: r.id, author_name: r.author_name, rating: r.rating, text: r.text || '' }))
    : isDemo ? DEMO_REVIEWS : []
  const showReservationForm = lounge.features.includes('reservations')

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--color-bg)]/80 border-b border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <video autoPlay loop muted playsInline preload="metadata" poster="/images/torus-logo.png" className="w-full h-full object-cover">
                <source src="/images/logo-animated.mp4" type="video/mp4" />
              </video>
            </div>
            <span className="font-semibold">Hookah Torus</span>
          </Link>
          <Link
            href={`/menu/${slug}`}
            className="btn btn-primary text-sm"
          >
            {t.loungeTobaccoMenu}
          </Link>
        </div>
      </header>

      {/* Cover Image */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        {lounge.cover_image_url ? (
          <img
            src={lounge.cover_image_url}
            alt={lounge.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--color-primary)] to-purple-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-transparent to-transparent" />
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 -mt-20 relative z-10 pb-12">
        {/* Lounge Info Card */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Logo */}
            <div className="flex-shrink-0">
              {lounge.logo_url ? (
                <img
                  src={lounge.logo_url}
                  alt={lounge.name}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-[var(--color-bg)]"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-purple-600 flex items-center justify-center text-4xl text-white font-bold border-4 border-[var(--color-bg)]">
                  {lounge.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-1">{lounge.name}</h1>
                  <div className="flex items-center gap-3 text-sm text-[var(--color-textMuted)]">
                    {lounge.city && <span>{lounge.city}</span>}
                    {lounge.rating && (
                      <span className="flex items-center gap-1">
                        <IconStar size={14} className="text-[var(--color-warning)]" />
                        {lounge.rating} ({lounge.reviews_count})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {lounge.description && (
                <p className="mt-4 text-[var(--color-textMuted)]">
                  {lounge.description}
                </p>
              )}

              {/* Features */}
              {lounge.features.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {lounge.features.map(feature => (
                    <span
                      key={feature}
                      className="px-3 py-1 rounded-full text-xs bg-[var(--color-bgHover)] text-[var(--color-textMuted)]"
                    >
                      {FEATURE_ICONS[feature]} {FEATURE_LABELS[feature]}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {/* Address & Hours */}
          <div className="card p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <IconTarget size={18} className="text-[var(--color-primary)]" />
              {t.loungeAddressHours}
            </h3>

            {lounge.address && (
              <p className="text-sm mb-4">
                {'\u{1F4CD}'} {lounge.address}
              </p>
            )}

            {lounge.working_hours && (
              <div className="space-y-1 text-sm">
                {Object.entries(lounge.working_hours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between">
                    <span className="text-[var(--color-textMuted)]">{DAY_NAMES[day]}</span>
                    <span>
                      {hours?.is_closed ? t.loungeClosed : `${hours?.open} \u2014 ${hours?.close}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contacts */}
          <div className="card p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <IconCalendar size={18} className="text-[var(--color-primary)]" />
              {t.loungeContacts}
            </h3>

            <div className="space-y-3 text-sm">
              {lounge.phone && (
                <a href={`tel:${lounge.phone}`} className="flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors">
                  {'\u{1F4DE}'} {lounge.phone}
                </a>
              )}
              {lounge.instagram && (
                <a href={`https://instagram.com/${lounge.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors">
                  {'\u{1F4F8}'} @{lounge.instagram}
                </a>
              )}
              {lounge.telegram && (
                <a href={`https://t.me/${lounge.telegram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors">
                  {'\u2708\uFE0F'} @{lounge.telegram}
                </a>
              )}
              {lounge.website && /^https?:\/\//i.test(lounge.website) && (
                <a href={lounge.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors">
                  {'\u{1F310}'} {lounge.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Signature Mixes */}
        {lounge.show_popular_mixes && signatureMixes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">{'\u2B50'}</span>
              {t.loungeSignatureMixes}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {signatureMixes.map(mix => (
                <div key={mix.id} className="card p-5 border-[var(--color-primary)]/30">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{mix.name}</h3>
                      {mix.description && (
                        <p className="text-sm text-[var(--color-textMuted)] mt-1">
                          {mix.description}
                        </p>
                      )}
                    </div>
                    {lounge.show_prices && mix.price && (
                      <span className="text-lg font-bold text-[var(--color-primary)]">
                        ${mix.price}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mix.tobaccos.map((tb) => (
                      <span
                        key={`${tb.flavor}-${tb.percent}`}
                        className="px-2 py-1 rounded-lg text-xs"
                        style={{
                          backgroundColor: `${tb.color}20`,
                          borderLeft: `3px solid ${tb.color}`,
                        }}
                      >
                        {tb.flavor} {tb.percent}%
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        {displayReviews.length > 0 && (
          <ReviewsCarousel reviews={displayReviews} reviewsCount={lounge.reviews_count} />
        )}

        {/* Review Submission Form */}
        <ReviewForm
          profileId={lounge.profile_id}
          onSubmit={submitReview}
          submitting={reviewSubmitting}
        />

        {/* Reservation Form */}
        {showReservationForm && (
          <ReservationForm profileId={lounge.profile_id} />
        )}

        {/* CTA */}
        <div className="card p-6 bg-gradient-to-r from-[var(--color-primary)]/10 to-purple-500/10 border-[var(--color-primary)]/30 text-center">
          <h3 className="text-xl font-bold mb-2">{t.loungeCtaTitle}</h3>
          <p className="text-[var(--color-textMuted)] mb-4">
            {t.loungeCtaHint}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/menu/${slug}`} className="btn btn-primary">
              {t.loungeTobaccoMenu}
            </Link>
            {lounge.phone && (
              <a href={`tel:${lounge.phone}`} className="btn btn-ghost">
                {t.loungeCallBtn}
              </a>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-[var(--color-textMuted)]">
          <p>{t.loungeFooter} <Link href="/mix" className="text-[var(--color-primary)] hover:underline">Hookah Torus</Link></p>
        </div>
      </footer>
    </div>
  )
}

// ============================================================================
// Review Submission Form
// ============================================================================

function ReviewForm({
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

// ============================================================================
// Reservation Form
// ============================================================================

function ReservationForm({ profileId }: { profileId: string }) {
  const t = useTranslation('hookah')
  const { submitReservation, submitting, fetchSlots, occupiedSlots } = usePublicReservation(profileId)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [guestCount, setGuestCount] = useState(2)
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const timeSlots = [
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
    '21:00', '21:30', '22:00', '22:30', '23:00', '23:30',
  ]

  const occupiedTimes = new Set(
    occupiedSlots.filter(s => s.date === date).map(s => s.time?.slice(0, 5))
  )
  const availableSlots = timeSlots.filter(ts => !occupiedTimes.has(ts))

  const handleDateChange = (newDate: string) => {
    setDate(newDate)
    setTime('')
    fetchSlots(newDate)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !date || !time) return

    const success = await submitReservation({
      guest_name: name.trim(),
      guest_phone: phone.trim() || undefined,
      guest_count: guestCount,
      reservation_date: date,
      reservation_time: time,
      notes: notes.trim() || undefined,
    })

    if (success) {
      setSubmitted(true)
      setName('')
      setPhone('')
      setDate('')
      setTime('')
      setGuestCount(2)
      setNotes('')
    }
  }

  if (submitted) {
    return (
      <div className="card p-6 mb-8 text-center">
        <div className="text-4xl mb-3">{'\u{1F4C5}'}</div>
        <h3 className="text-lg font-bold mb-1">{t.reservationSent}</h3>
        <p className="text-[var(--color-textMuted)] text-sm">{t.reservationAwaitConfirm}</p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-4 text-sm text-[var(--color-primary)] hover:underline"
        >
          {t.reservationCreateAnother}
        </button>
      </div>
    )
  }

  return (
    <div className="card p-6 mb-8">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <IconCalendar size={20} className="text-[var(--color-primary)]" />
        {t.reservationTitle}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t.reservationDateLabel}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              min={today}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t.reservationTimeLabel}</label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
              required
              disabled={!date}
            >
              <option value="">{t.reservationSelectTime}</option>
              {availableSlots.map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t.reservationNameLabel}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.reservationNamePlaceholder}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t.reservationGuestCount}</label>
            <input
              type="number"
              inputMode="numeric"
              value={guestCount}
              onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={20}
              step="1"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t.reservationPhoneLabel}</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t.reservationPhonePlaceholder}
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t.reservationCommentLabel}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t.reservationCommentPlaceholder}
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none transition-colors resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={!name.trim() || !date || !time || submitting}
          className="btn btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? t.reservationSubmitting : t.reservationSubmitBtn}
        </button>
      </form>
    </div>
  )
}

// ============================================================================
// Reviews Carousel Component with scroll tracking
// ============================================================================

function ReviewsCarousel({ reviews, reviewsCount }: { reviews: { id: string; author_name: string; rating: number; text: string | null }[]; reviewsCount: number }) {
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
                  <div className="w-12 h-12 rounded-full bg-[var(--color-warning)] flex items-center justify-center text-lg font-bold text-black flex-shrink-0">
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
