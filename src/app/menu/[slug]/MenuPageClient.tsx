'use client'

import { use, useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { usePublicLounge, type PublicTobaccoGroup } from '@/lib/hooks/useLoungeProfile'
import { BrandLoader } from '@/components/BrandLoader'
import {
  IconSmoke,
  IconTarget,
} from '@/components/Icons'
import { useTranslation, useLocale } from '@/lib/i18n'
import type { PublicBarRecipe } from '@/types/lounge'
import { CartOverlay } from './CartOverlay'
import { CocktailMenuSection } from './CocktailMenuSection'
import { useCart } from './useCart'

// Brand identity colors — intentionally not theme-variable
const BRAND_COLORS: Record<string, string> = {
  'Musthave': '#EC4899',
  'Darkside': '#6366F1',
  'Tangiers': '#F59E0B',
  'Al Fakher': '#10B981',
  'Fumari': '#06B6D4',
  'Starbuzz': '#EF4444',
}

// Group cocktails by method
function groupByMethod(recipes: PublicBarRecipe[]) {
  const groups: Record<string, PublicBarRecipe[]> = {}
  for (const recipe of recipes) {
    const method = recipe.method || 'other'
    if (!groups[method]) groups[method] = []
    groups[method].push(recipe)
  }
  return groups
}

function MenuPageInner({ slug }: { slug: string }) {
  const searchParams = useSearchParams()
  const tableId = searchParams.get('table')
  const t = useTranslation('hookah')
  const { locale } = useLocale()

  const { lounge, mixes, barRecipes, tobaccoMenu, tables, loading, error } = usePublicLounge(slug)
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Ordering mode state
  const table = useMemo(() => tables.find(t => t.id === tableId) || null, [tables, tableId])
  const isOrderingMode = !!tableId && !!table

  const {
    cart, setCart, showCartOverlay, setShowCartOverlay,
    guestName, setGuestName, orderNotes, setOrderNotes,
    submitting, orderSuccess, setOrderSuccess, orderError,
    selectedHookahFlavor, setSelectedHookahFlavor,
    hookahStrength, setHookahStrength,
    cartItemCount, addBarItem, removeBarItem, getBarItemCount,
    addHookahItem, removeCartItem, submitOrder,
  } = useCart(slug, tableId, locale)

  const hasTobaccoMenu = mixes.length > 0 || tobaccoMenu.length > 0
  const hasCocktailMenu = barRecipes.length > 0

  // Filter tobaccos by brand and search
  const filteredTobaccos = useMemo(() => {
    if (!hasTobaccoMenu || tobaccoMenu.length === 0) return []
    let result: PublicTobaccoGroup[] = tobaccoMenu

    if (selectedBrand) {
      result = result.filter(item => item.brand === selectedBrand)
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
  }, [selectedBrand, searchQuery, hasTobaccoMenu, tobaccoMenu])

  const allBrands = tobaccoMenu.map(item => item.brand)
  const signatureMixes = mixes.filter(m => m.is_signature)
  const popularMixes = mixes.filter(m => !m.is_signature).sort((a, b) => b.popularity - a.popularity)
  const cocktailGroups = useMemo(() => groupByMethod(barRecipes), [barRecipes])

  // Loading / error / hidden states
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <BrandLoader size="lg" text={t.menuLoading} />
      </div>
    )
  }

  if (error || !lounge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center">
          <div className="text-6xl mb-4">{'\u{1F50D}'}</div>
          <h1 className="text-2xl font-bold mb-2">{t.menuNotFound}</h1>
          <p className="text-[var(--color-textMuted)] mb-6">{t.menuNotFoundHint}</p>
          <Link href="/" className="btn btn-primary">{t.loungeGoHome}</Link>
        </div>
      </div>
    )
  }

  if (!lounge.show_menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center">
          <div className="text-6xl mb-4">{'\u{1F512}'}</div>
          <h1 className="text-2xl font-bold mb-2">{t.menuHidden}</h1>
          <p className="text-[var(--color-textMuted)] mb-6">{t.menuHiddenHint}</p>
          <Link href={`/lounge/${slug}`} className="btn btn-primary">{t.menuLoungePage}</Link>
        </div>
      </div>
    )
  }

  // Invalid table
  if (tableId && !table && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center">
          <div className="text-6xl mb-4">{'\u{1F6AB}'}</div>
          <h1 className="text-2xl font-bold mb-2">{t.invalidTable}</h1>
          <Link href={`/menu/${slug}`} className="btn btn-primary mt-4">{t.backToMenu}</Link>
        </div>
      </div>
    )
  }

  // Order success screen
  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">{'\u2705'}</div>
          <h1 className="text-2xl font-bold mb-2">{t.orderSent}</h1>
          <p className="text-[var(--color-textMuted)] mb-6">{t.orderSentHint}</p>
          <button
            type="button"
            onClick={() => setOrderSuccess(false)}
            className="btn btn-primary"
          >
            {t.backToMenu}
          </button>
        </div>
      </div>
    )
  }

  const pageTitle = hasTobaccoMenu && hasCocktailMenu
    ? t.menuTitleFull
    : hasCocktailMenu
      ? t.menuTitleCocktails
      : t.menuTitleTobacco

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--color-bg)]/80 border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/lounge/${slug}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {lounge.logo_url ? (
              <Image src={lounge.logo_url} alt={lounge.name} width={40} height={40} className="rounded-xl object-cover" unoptimized />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-purple-600 flex items-center justify-center text-lg text-white font-bold">
                {lounge.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="font-semibold">{lounge.name}</div>
              <div className="text-xs text-[var(--color-textMuted)]">{t.menuAboutVenue}</div>
            </div>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors"
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <video autoPlay loop muted playsInline preload="metadata" poster="/images/torus-logo.png" className="w-full h-full object-cover">
                <source src="/images/logo-animated.mp4" type="video/mp4" />
              </video>
            </div>
            <span className="hidden sm:inline">Hookah Torus</span>
          </Link>
        </div>
      </header>

      {/* Table banner for ordering mode */}
      {isOrderingMode && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-4 py-3">
          <div className="max-w-6xl mx-auto text-center text-sm font-medium text-emerald-400">
            {t.tableOrderBanner(table.name)}
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-8 pb-32">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{pageTitle}</h1>
          <p className="text-[var(--color-textMuted)]">
            {hasTobaccoMenu && hasCocktailMenu
              ? t.menuSubtitleFull
              : hasCocktailMenu
                ? t.menuSubtitleCocktails
                : t.menuSubtitleTobacco}
          </p>
        </div>

        {/* ===== COCKTAIL MENU SECTION ===== */}
        {hasCocktailMenu && (
          <CocktailMenuSection
            cocktailGroups={cocktailGroups}
            isOrderingMode={isOrderingMode}
            showPrices={lounge.show_prices}
            getBarItemCount={getBarItemCount}
            addBarItem={addBarItem}
            removeBarItem={removeBarItem}
            locale={locale}
          />
        )}

        {/* ===== HOOKAH MENU SECTION ===== */}
        {hasTobaccoMenu && (
          <>
            {hasCocktailMenu && (
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <IconSmoke size={24} className="text-[var(--color-primary)]" />
                {t.menuHookahMenu}
              </h2>
            )}

            {/* Signature Mixes Section */}
            {lounge.show_popular_mixes && signatureMixes.length > 0 && (
              <section className="mb-10">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">{'\u2B50'}</span>
                  {t.menuSignatureMixes}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {signatureMixes.map(mix => (
                    <div key={mix.id} className="card p-5 border-[var(--color-primary)]/30 hover:border-[var(--color-primary)] transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{mix.name}</h3>
                          {mix.description && (
                            <p className="text-sm text-[var(--color-textMuted)] mt-1">{mix.description}</p>
                          )}
                        </div>
                        {lounge.show_prices && mix.price && (
                          <span className="text-lg font-bold text-[var(--color-primary)] whitespace-nowrap ml-2">
                            {mix.price}{'\u20AC'}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {mix.tobaccos.map((tb, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded-lg text-xs"
                            style={{ backgroundColor: `${tb.color}20`, borderLeft: `3px solid ${tb.color}` }}
                          >
                            {tb.brand} \u2014 {tb.flavor} {tb.percent}%
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
                  {t.menuPopularMixes}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {popularMixes.map(mix => (
                    <div key={mix.id} className="card p-5 hover:border-[var(--color-border)] transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{mix.name}</h3>
                          {mix.description && (
                            <p className="text-sm text-[var(--color-textMuted)] mt-1">{mix.description}</p>
                          )}
                        </div>
                        {lounge.show_prices && mix.price && (
                          <span className="text-lg font-bold text-[var(--color-text)] whitespace-nowrap ml-2">
                            {mix.price}{'\u20AC'}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {mix.tobaccos.map((tb, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded-lg text-xs"
                            style={{ backgroundColor: `${tb.color}20`, borderLeft: `3px solid ${tb.color}` }}
                          >
                            {tb.flavor} {tb.percent}%
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center gap-2 text-xs text-[var(--color-textMuted)]">
                        <IconSmoke size={14} />
                        <span>{t.menuOrderedTimes(mix.popularity)}</span>
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
                  {isOrderingMode ? t.selectTobaccoToOrder : t.menuTobaccoCatalog}
                </h2>

                <div className="relative">
                  <input
                    type="text"
                    placeholder={t.menuSearchFlavor}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label={t.menuSearchFlavor}
                    className="input pl-10 w-full sm:w-64"
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-textMuted)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Strength selector for ordering mode */}
              {isOrderingMode && (
                <div className="mb-6 flex items-center gap-3">
                  <span className="text-sm text-[var(--color-textMuted)]">{t.strengthPreference}:</span>
                  {(['light', 'medium', 'strong'] as const).map(s => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setHookahStrength(s)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        hookahStrength === s
                          ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                          : 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
                      }`}
                    >
                      {s === 'light' ? t.strengthLight : s === 'medium' ? t.strengthMedium : t.strengthStrong}
                    </button>
                  ))}
                </div>
              )}

              {/* Brand Filter */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setSelectedBrand(null)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    !selectedBrand
                      ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                      : 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {t.menuAllBrands}
                </button>
                {allBrands.map(brand => (
                  <button
                    type="button"
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
                  <div key={brandGroup.brand} className="card p-5">
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
                      {brandGroup.flavors.map(flavor => {
                        const isSelected = selectedHookahFlavor?.brand === brandGroup.brand && selectedHookahFlavor?.flavor === flavor
                        return (
                          <button
                            type="button"
                            key={flavor}
                            onClick={isOrderingMode ? () => {
                              if (isSelected) {
                                setSelectedHookahFlavor(null)
                              } else {
                                setSelectedHookahFlavor({ brand: brandGroup.brand, flavor })
                              }
                            } : undefined}
                            className={`px-3 py-2 rounded-xl text-sm transition-colors ${
                              isOrderingMode
                                ? isSelected
                                  ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50'
                                  : 'bg-[var(--color-bgHover)] hover:bg-[var(--color-border)] cursor-pointer'
                                : 'bg-[var(--color-bgHover)] cursor-default'
                            }`}
                          >
                            {flavor}
                          </button>
                        )
                      })}
                    </div>

                    {/* Add hookah to cart inline */}
                    {isOrderingMode && selectedHookahFlavor?.brand === brandGroup.brand && (
                      <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
                        <span className="text-sm">
                          {selectedHookahFlavor.brand} {selectedHookahFlavor.flavor} \u2014 {
                            hookahStrength === 'light' ? t.strengthLight
                              : hookahStrength === 'strong' ? t.strengthStrong
                                : t.strengthMedium
                          }
                        </span>
                        <button
                          type="button"
                          onClick={addHookahItem}
                          className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                        >
                          {t.addToCart}
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {filteredTobaccos.length === 0 && (
                  <div className="text-center py-12 text-[var(--color-textMuted)]">
                    <div className="text-4xl mb-4">{'\u{1F50D}'}</div>
                    <p>{t.menuNothingFound}</p>
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setSelectedBrand(null) }}
                      className="text-[var(--color-primary)] hover:underline mt-2"
                    >
                      {t.menuResetFilters}
                    </button>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* CTA — only in browse mode */}
        {!isOrderingMode && (
          <section className="mt-12">
            <div className="card p-6 bg-gradient-to-r from-[var(--color-primary)]/10 to-purple-500/10 border-[var(--color-primary)]/30 text-center">
              <h3 className="text-xl font-bold mb-2">{t.menuCtaTitle}</h3>
              <p className="text-[var(--color-textMuted)] mb-4">
                {hasTobaccoMenu ? t.menuCtaHintTobacco : t.menuCtaHintCocktails}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {hasTobaccoMenu && (
                  <Link href={`/mix?from=menu&venue=${slug}`} className="btn btn-primary">{t.menuMixCalculator}</Link>
                )}
                {lounge.phone && (
                  <a href={`tel:${lounge.phone}`} className="btn btn-ghost">{t.menuCallBtn}</a>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-[var(--color-textMuted)]">
          <p>
            {t.menuFooter}{' '}
            <Link href="/" className="text-[var(--color-primary)] hover:underline">Hookah Torus</Link>
          </p>
        </div>
      </footer>

      {/* ===== FLOATING CART BAR ===== */}
      {isOrderingMode && cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-[var(--color-bg)]/95 backdrop-blur-xl border-t border-[var(--color-border)]">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCart([])}
              className="text-sm text-[var(--color-textMuted)] hover:text-[var(--color-error)] transition-colors"
            >
              {t.clearCart}
            </button>
            <button
              type="button"
              onClick={() => setShowCartOverlay(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <span>{t.cartItemCount(cartItemCount)}</span>
              <span>\u2014 {t.sendOrder}</span>
            </button>
          </div>
        </div>
      )}

      {/* ===== CART OVERLAY ===== */}
      {showCartOverlay && (
        <CartOverlay
          cart={cart}
          onClose={() => setShowCartOverlay(false)}
          onRemoveItem={removeCartItem}
          onSubmit={submitOrder}
          submitting={submitting}
          guestName={guestName}
          onGuestNameChange={setGuestName}
          orderNotes={orderNotes}
          onOrderNotesChange={setOrderNotes}
          orderError={orderError}
        />
      )}
    </div>
  )
}

export default function MenuPageClient({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <BrandLoader size="lg" />
      </div>
    }>
      <MenuPageInner slug={slug} />
    </Suspense>
  )
}
