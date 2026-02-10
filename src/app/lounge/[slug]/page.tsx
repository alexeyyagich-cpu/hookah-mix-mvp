'use client'

import { use } from 'react'
import Link from 'next/link'
import { usePublicLounge } from '@/lib/hooks/useLoungeProfile'
import { LOUNGE_FEATURES } from '@/types/lounge'
import { BrandLoader } from '@/components/BrandLoader'
import {
  IconSmoke,
  IconStar,
  IconTarget,
  IconCalendar,
} from '@/components/Icons'

const DAY_NAMES: Record<string, string> = {
  monday: 'Пн',
  tuesday: 'Вт',
  wednesday: 'Ср',
  thursday: 'Чт',
  friday: 'Пт',
  saturday: 'Сб',
  sunday: 'Вс',
}

export default function LoungePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { lounge, mixes, loading, error } = usePublicLounge(slug)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <BrandLoader size="lg" text="Загрузка..." />
      </div>
    )
  }

  if (error || !lounge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold mb-2">Заведение не найдено</h1>
          <p className="text-[var(--color-textMuted)] mb-6">
            Возможно, ссылка устарела или заведение скрыто
          </p>
          <Link href="/mix" className="btn btn-primary">
            На главную
          </Link>
        </div>
      </div>
    )
  }

  const signatureMixes = mixes.filter(m => m.is_signature)
  const regularMixes = mixes.filter(m => !m.is_signature)

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--color-bg)]/80 border-b border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/mix" className="flex items-center gap-2 text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                <source src="/images/logo-animated.mp4" type="video/mp4" />
              </video>
            </div>
            <span className="font-semibold">Hookah Torus</span>
          </Link>
          <Link
            href={`/menu/${slug}`}
            className="btn btn-primary text-sm"
          >
            Меню табаков
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
        <div className="card mb-8">
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
                      {LOUNGE_FEATURES[feature].icon} {LOUNGE_FEATURES[feature].label}
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
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <IconTarget size={18} className="text-[var(--color-primary)]" />
              Адрес и время работы
            </h3>

            {lounge.address && (
              <p className="text-sm mb-4">
                📍 {lounge.address}
              </p>
            )}

            {lounge.working_hours && (
              <div className="space-y-1 text-sm">
                {Object.entries(lounge.working_hours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between">
                    <span className="text-[var(--color-textMuted)]">{DAY_NAMES[day]}</span>
                    <span>
                      {hours?.is_closed ? 'Закрыто' : `${hours?.open} — ${hours?.close}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contacts */}
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <IconCalendar size={18} className="text-[var(--color-primary)]" />
              Контакты
            </h3>

            <div className="space-y-3 text-sm">
              {lounge.phone && (
                <a href={`tel:${lounge.phone}`} className="flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors">
                  📞 {lounge.phone}
                </a>
              )}
              {lounge.instagram && (
                <a href={`https://instagram.com/${lounge.instagram}`} target="_blank" rel="noopener" className="flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors">
                  📸 @{lounge.instagram}
                </a>
              )}
              {lounge.telegram && (
                <a href={`https://t.me/${lounge.telegram}`} target="_blank" rel="noopener" className="flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors">
                  ✈️ @{lounge.telegram}
                </a>
              )}
              {lounge.website && (
                <a href={lounge.website} target="_blank" rel="noopener" className="flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors">
                  🌐 {lounge.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Signature Mixes */}
        {lounge.show_popular_mixes && signatureMixes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              Фирменные миксы
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {signatureMixes.map(mix => (
                <div key={mix.id} className="card border-[var(--color-primary)]/30">
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
                        {mix.price}₽
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mix.tobaccos.map((t, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-lg text-xs"
                        style={{
                          backgroundColor: `${t.color}20`,
                          borderLeft: `3px solid ${t.color}`,
                        }}
                      >
                        {t.flavor} {t.percent}%
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="card bg-gradient-to-r from-[var(--color-primary)]/10 to-purple-500/10 border-[var(--color-primary)]/30 text-center">
          <h3 className="text-xl font-bold mb-2">Хотите попробовать?</h3>
          <p className="text-[var(--color-textMuted)] mb-4">
            Посмотрите полное меню табаков или забронируйте столик
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/menu/${slug}`} className="btn btn-primary">
              Меню табаков
            </Link>
            {lounge.phone && (
              <a href={`tel:${lounge.phone}`} className="btn btn-ghost">
                Позвонить
              </a>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-[var(--color-textMuted)]">
          <p>Страница создана на платформе <Link href="/mix" className="text-[var(--color-primary)] hover:underline">Hookah Torus</Link></p>
        </div>
      </footer>
    </div>
  )
}
