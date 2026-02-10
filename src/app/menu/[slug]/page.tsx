'use client'

import { use, useState, useMemo } from 'react'
import Link from 'next/link'
import { usePublicLounge } from '@/lib/hooks/useLoungeProfile'
import { BrandLoader } from '@/components/BrandLoader'
import {
  IconSmoke,
  IconStar,
  IconTarget,
} from '@/components/Icons'

// Demo tobacco inventory for menu
const DEMO_MENU_TOBACCOS = [
  { brand: 'Musthave', flavors: ['Pinkman', 'Blueberry', 'Banana Mama', 'Milky Rice', 'Lemon-Lime', 'Grapefruit'] },
  { brand: 'Darkside', flavors: ['Supernova', 'Falling Star', 'Wild Forest', 'Dark Mint', 'Kalee Grap', 'Safari Melon'] },
  { brand: 'Tangiers', flavors: ['Cane Mint', 'Pineapple', 'Kashmir Peach', 'Orange Soda', 'Horchata', 'Maraschino Cherry'] },
  { brand: 'Al Fakher', flavors: ['Double Apple', 'Grape', 'Mint', 'Watermelon', 'Peach'] },
  { brand: 'Fumari', flavors: ['White Gummy Bear', 'Tropical Punch', 'Blueberry Muffin', 'Spiced Chai'] },
]

const BRAND_COLORS: Record<string, string> = {
  'Musthave': '#EC4899',
  'Darkside': '#6366F1',
  'Tangiers': '#F59E0B',
  'Al Fakher': '#10B981',
  'Fumari': '#06B6D4',
  'Starbuzz': '#EF4444',
}

export default function MenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { lounge, mixes, loading, error } = usePublicLounge(slug)
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter tobaccos by brand and search
  const filteredTobaccos = useMemo(() => {
    let result = DEMO_MENU_TOBACCOS

    if (selectedBrand) {
      result = result.filter(t => t.brand === selectedBrand)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.map(brandGroup => ({
        ...brandGroup,
        flavors: brandGroup.flavors.filter(f =>
          f.toLowerCase().includes(query) ||
          brandGroup.brand.toLowerCase().includes(query)
        )
      })).filter(brandGroup => brandGroup.flavors.length > 0)
    }

    return result
  }, [selectedBrand, searchQuery])

  const allBrands = DEMO_MENU_TOBACCOS.map(t => t.brand)
  const signatureMixes = mixes.filter(m => m.is_signature)
  const popularMixes = mixes.filter(m => !m.is_signature).sort((a, b) => b.popularity - a.popularity)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <BrandLoader size="lg" text="Загрузка меню..." />
      </div>
    )
  }

  if (error || !lounge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold mb-2">Меню не найдено</h1>
          <p className="text-[var(--color-textMuted)] mb-6">
            Возможно, ссылка устарела или заведение скрыло меню
          </p>
          <Link href="/mix" className="btn btn-primary">
            На главную
          </Link>
        </div>
      </div>
    )
  }

  if (!lounge.show_menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2">Меню скрыто</h1>
          <p className="text-[var(--color-textMuted)] mb-6">
            Заведение не публикует меню табаков
          </p>
          <Link href={`/lounge/${slug}`} className="btn btn-primary">
            Страница заведения
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--color-bg)]/80 border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/lounge/${slug}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {lounge.logo_url ? (
              <img
                src={lounge.logo_url}
                alt={lounge.name}
                className="w-10 h-10 rounded-xl object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-purple-600 flex items-center justify-center text-lg text-white font-bold">
                {lounge.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="font-semibold">{lounge.name}</div>
              <div className="text-xs text-[var(--color-textMuted)]">← О заведении</div>
            </div>
          </Link>
          <Link
            href="/mix"
            className="flex items-center gap-2 text-sm text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors"
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                <source src="/images/logo-animated.mp4" type="video/mp4" />
              </video>
            </div>
            <span className="hidden sm:inline">Hookah Torus</span>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Меню табаков</h1>
          <p className="text-[var(--color-textMuted)]">
            Выбирайте вкусы и создавайте идеальный микс
          </p>
        </div>

        {/* Signature Mixes Section */}
        {lounge.show_popular_mixes && signatureMixes.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              Фирменные миксы от шефа
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {signatureMixes.map(mix => (
                <div key={mix.id} className="card border-[var(--color-primary)]/30 hover:border-[var(--color-primary)] transition-colors">
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
                      <span className="text-lg font-bold text-[var(--color-primary)] whitespace-nowrap ml-2">
                        ${mix.price}
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
                        {t.brand} — {t.flavor} {t.percent}%
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Popular Mixes */}
        {lounge.show_popular_mixes && popularMixes.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <IconTarget size={24} className="text-[var(--color-primary)]" />
              Популярные миксы
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularMixes.map(mix => (
                <div key={mix.id} className="card hover:border-[var(--color-border)] transition-colors">
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
                      <span className="text-lg font-bold text-[var(--color-text)] whitespace-nowrap ml-2">
                        ${mix.price}
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
                  <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center gap-2 text-xs text-[var(--color-textMuted)]">
                    <IconSmoke size={14} />
                    <span>Заказали {mix.popularity} раз</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tobacco Catalog */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <IconSmoke size={24} className="text-[var(--color-primary)]" />
              Каталог табаков
            </h2>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск вкуса..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-full sm:w-64"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-textMuted)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Brand Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedBrand(null)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                !selectedBrand
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
              }`}
            >
              Все бренды
            </button>
            {allBrands.map(brand => (
              <button
                key={brand}
                onClick={() => setSelectedBrand(brand === selectedBrand ? null : brand)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedBrand === brand
                    ? 'text-white'
                    : 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
                }`}
                style={selectedBrand === brand ? { backgroundColor: BRAND_COLORS[brand] } : {}}
              >
                {brand}
              </button>
            ))}
          </div>

          {/* Tobacco List */}
          <div className="space-y-6">
            {filteredTobaccos.map(brandGroup => (
              <div key={brandGroup.brand} className="card">
                <h3
                  className="text-lg font-bold mb-4 flex items-center gap-2"
                  style={{ color: BRAND_COLORS[brandGroup.brand] }}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: BRAND_COLORS[brandGroup.brand] }}
                  />
                  {brandGroup.brand}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {brandGroup.flavors.map(flavor => (
                    <span
                      key={flavor}
                      className="px-3 py-2 rounded-xl text-sm bg-[var(--color-bgHover)] hover:bg-[var(--color-border)] transition-colors cursor-default"
                    >
                      {flavor}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {filteredTobaccos.length === 0 && (
              <div className="text-center py-12 text-[var(--color-textMuted)]">
                <div className="text-4xl mb-4">🔍</div>
                <p>Ничего не найдено</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedBrand(null) }}
                  className="text-[var(--color-primary)] hover:underline mt-2"
                >
                  Сбросить фильтры
                </button>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-12">
          <div className="card bg-gradient-to-r from-[var(--color-primary)]/10 to-purple-500/10 border-[var(--color-primary)]/30 text-center">
            <h3 className="text-xl font-bold mb-2">Не можете выбрать?</h3>
            <p className="text-[var(--color-textMuted)] mb-4">
              Попробуйте наш калькулятор миксов или спросите у кальянщика
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/mix" className="btn btn-primary">
                Калькулятор миксов
              </Link>
              {lounge.phone && (
                <a href={`tel:${lounge.phone}`} className="btn btn-ghost">
                  Позвонить
                </a>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-[var(--color-textMuted)]">
          <p>
            Меню создано на платформе{' '}
            <Link href="/mix" className="text-[var(--color-primary)] hover:underline">
              Hookah Torus
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
