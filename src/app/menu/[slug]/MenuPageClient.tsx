'use client'

import { use, useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { usePublicLounge, type PublicTobaccoGroup } from '@/lib/hooks/useLoungeProfile'
import { BrandLoader } from '@/components/BrandLoader'
import {
  IconSmoke,
  IconTarget,
  IconCocktail,
} from '@/components/Icons'
import { COCKTAIL_METHOD_EMOJI } from '@/data/bar-recipes'
import { useTranslation, useLocale, getLocaleName } from '@/lib/i18n'
import type { PublicBarRecipe } from '@/types/lounge'

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

// Cart item type
interface CartItem {
  name: string
  type: 'bar' | 'hookah'
  quantity: number
  details: string | null
}

function MenuPageInner({ slug }: { slug: string }) {
  const searchParams = useSearchParams()
  const tableId = searchParams.get('table')
  const t = useTranslation('hookah')
  const tb = useTranslation('bar')
  const { locale } = useLocale()

  const METHOD_LABELS: Record<string, string> = {
    build: tb.methodBuild, stir: tb.methodStir, shake: tb.methodShake,
    blend: tb.methodBlend, layer: tb.methodLayer, muddle: tb.methodMuddle,
  }
  const GLASS_LABELS: Record<string, string> = {
    highball: tb.glassHighball, rocks: tb.glassRocks, coupe: tb.glassCoupe,
    flute: tb.glassFlute, martini: tb.glassMartini, collins: tb.glassCollins,
    hurricane: tb.glassHurricane, shot: tb.glassShot, wine: tb.glassWine,
    beer: tb.glassBeer, copper_mug: tb.glassCopperMug, tiki: tb.glassTiki,
    other: tb.glassOther,
  }

  const { lounge, mixes, barRecipes, tobaccoMenu, tables, loading, error } = usePublicLounge(slug)
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Ordering mode state
  const table = useMemo(() => tables.find(t => t.id === tableId) || null, [tables, tableId])
  const isOrderingMode = !!tableId && !!table
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCartOverlay, setShowCartOverlay] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const submittingRef = useRef(false)

  // Hookah ordering
  const [selectedHookahFlavor, setSelectedHookahFlavor] = useState<{ brand: string; flavor: string } | null>(null)
  const [hookahStrength, setHookahStrength] = useState<'light' | 'medium' | 'strong'>('medium')

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

  const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart])

  // Cart operations
  const addBarItem = useCallback((recipe: PublicBarRecipe) => {
    const name = getLocaleName(recipe, locale)
    setCart(prev => {
      const existing = prev.find(i => i.name === name && i.type === 'bar')
      if (existing) {
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { name, type: 'bar', quantity: 1, details: null }]
    })
  }, [locale])

  const removeBarItem = useCallback((recipe: PublicBarRecipe) => {
    const name = getLocaleName(recipe, locale)
    setCart(prev => {
      const existing = prev.find(i => i.name === name && i.type === 'bar')
      if (!existing) return prev
      if (existing.quantity <= 1) return prev.filter(i => i !== existing)
      return prev.map(i => i === existing ? { ...i, quantity: i.quantity - 1 } : i)
    })
  }, [locale])

  const getBarItemCount = useCallback((recipe: PublicBarRecipe) => {
    const name = getLocaleName(recipe, locale)
    return cart.find(i => i.name === name && i.type === 'bar')?.quantity || 0
  }, [cart, locale])

  const addHookahItem = useCallback(() => {
    if (!selectedHookahFlavor) return
    const name = `${selectedHookahFlavor.brand} ${selectedHookahFlavor.flavor}`
    const strengthLabel = hookahStrength === 'light' ? t.strengthLight
      : hookahStrength === 'strong' ? t.strengthStrong : t.strengthMedium
    setCart(prev => [...prev, { name, type: 'hookah', quantity: 1, details: strengthLabel }])
    setSelectedHookahFlavor(null)
  }, [selectedHookahFlavor, hookahStrength, t])

  const removeCartItem = useCallback((index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index))
  }, [])

  // Escape key to close cart overlay
  const handleCartEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setShowCartOverlay(false)
  }, [])

  useEffect(() => {
    if (!showCartOverlay) return
    window.addEventListener('keydown', handleCartEscape)
    return () => window.removeEventListener('keydown', handleCartEscape)
  }, [showCartOverlay, handleCartEscape])

  const submitOrder = useCallback(async () => {
    if (cart.length === 0 || !tableId || submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    setOrderError(null)

    // Split cart into bar and hookah orders
    const barItems = cart.filter(i => i.type === 'bar')
    const hookahItems = cart.filter(i => i.type === 'hookah')

    const requests: Promise<Response>[] = []

    if (barItems.length > 0) {
      requests.push(
        fetch(`/api/public/order/${slug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table_id: tableId,
            guest_name: guestName || null,
            type: 'bar',
            items: barItems.map(i => ({ name: i.name, quantity: i.quantity, details: i.details })),
            notes: orderNotes || null,
          }),
        })
      )
    }

    if (hookahItems.length > 0) {
      requests.push(
        fetch(`/api/public/order/${slug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table_id: tableId,
            guest_name: guestName || null,
            type: 'hookah',
            items: hookahItems.map(i => ({ name: i.name, quantity: i.quantity, details: i.details })),
            notes: orderNotes || null,
          }),
        })
      )
    }

    try {
      const responses = await Promise.all(requests)
      for (const res of responses) {
        if (!res.ok) {
          let errorMessage = t.orderError
          if (res.status === 429) {
            errorMessage = t.orderRateLimit
          } else {
            try {
              const data = await res.json()
              if (data.error) errorMessage = data.error
            } catch {
              // Response body is not valid JSON — use default error message
            }
          }
          setOrderError(errorMessage)
          setSubmitting(false)
          submittingRef.current = false
          return
        }
      }
      setOrderSuccess(true)
      setCart([])
      setGuestName('')
      setOrderNotes('')
      setShowCartOverlay(false)
    } catch {
      setOrderError(t.orderError)
    }
    setSubmitting(false)
    submittingRef.current = false
  }, [cart, tableId, slug, guestName, orderNotes, t])

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
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <IconCocktail size={24} className="text-[var(--color-primary)]" />
              {t.menuCocktailCard}
            </h2>

            <div className="space-y-8">
              {Object.entries(cocktailGroups).map(([method, recipes]) => {
                const emoji = COCKTAIL_METHOD_EMOJI[method as keyof typeof COCKTAIL_METHOD_EMOJI] || '\u{1F379}'
                const label = METHOD_LABELS[method as keyof typeof METHOD_LABELS] || method

                return (
                  <div key={method}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span className="text-xl">{emoji}</span>
                      {label}
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recipes.map(recipe => {
                        const itemCount = isOrderingMode ? getBarItemCount(recipe) : 0
                        return (
                          <div
                            key={recipe.id}
                            className={`card p-5 transition-colors ${
                              itemCount > 0
                                ? 'border-emerald-500/50 bg-emerald-500/5'
                                : 'hover:border-[var(--color-borderAccent)]'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold">{getLocaleName(recipe, locale)}</h4>
                                {locale === 'ru' && recipe.name_en && (
                                  <span className="text-xs text-[var(--color-textMuted)]">{recipe.name_en}</span>
                                )}
                                {locale !== 'ru' && recipe.name_en && (
                                  <span className="text-xs text-[var(--color-textMuted)]">{recipe.name}</span>
                                )}
                              </div>
                              {lounge.show_prices && recipe.menu_price && (
                                <span className="text-lg font-bold text-[var(--color-primary)] whitespace-nowrap ml-2">
                                  {recipe.menu_price}{'\u20AC'}
                                </span>
                              )}
                            </div>

                            {recipe.description && (
                              <p className="text-sm text-[var(--color-textMuted)] mb-3">{recipe.description}</p>
                            )}

                            <div className="text-sm text-[var(--color-text)]">
                              {recipe.ingredients.join(' \u00B7 ')}
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-border)]">
                              <div className="flex items-center gap-3 text-xs text-[var(--color-textMuted)]">
                                {recipe.glass && (
                                  <span>{GLASS_LABELS[recipe.glass] || recipe.glass}</span>
                                )}
                                {recipe.garnish_description && (
                                  <span>{'\u{1F33F}'} {recipe.garnish_description}</span>
                                )}
                              </div>

                              {/* Ordering controls */}
                              {isOrderingMode && (
                                <div className="flex items-center gap-2">
                                  {itemCount > 0 && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => removeBarItem(recipe)}
                                        className="w-11 h-11 rounded-full bg-[var(--color-bgHover)] hover:bg-[var(--color-error)]/20 text-[var(--color-text)] flex items-center justify-center text-sm font-bold transition-colors"
                                        aria-label="Decrease quantity"
                                      >
                                        -
                                      </button>
                                      <span className="text-sm font-bold min-w-[20px] text-center">{itemCount}</span>
                                    </>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => addBarItem(recipe)}
                                    className="w-11 h-11 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 flex items-center justify-center text-sm font-bold transition-colors"
                                    aria-label="Add to order"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
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
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={() => setShowCartOverlay(false)}>
          <div
            role="dialog"
            aria-modal="true"
            className="bg-[var(--color-bgCard)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">{t.cartSummary}</h3>

              {/* Cart items */}
              <div className="space-y-3 mb-6">
                {cart.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--color-border)]">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-[var(--color-textMuted)]">
                        {item.type === 'hookah' ? t.hookahRequest : ''}{item.details ? ` \u2014 ${item.details}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">{'\u00D7'}{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => removeCartItem(i)}
                        className="text-[var(--color-error)] hover:brightness-110 text-sm"
                      >
                        {t.removeFromCart}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Guest name */}
              <div className="mb-4">
                <label className="block text-sm text-[var(--color-textMuted)] mb-1">{t.guestNameLabel}</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  placeholder={t.guestNamePlaceholder}
                  className="input w-full"
                />
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm text-[var(--color-textMuted)] mb-1">{t.orderNotesLabel}</label>
                <textarea
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  className="input w-full min-h-[60px] resize-none"
                  rows={2}
                />
              </div>

              {orderError && (
                <div role="alert" className="mb-4 p-3 rounded-xl bg-[var(--color-error)]/10 text-[var(--color-error)] text-sm">{orderError}</div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCartOverlay(false)}
                  className="btn btn-ghost flex-1"
                >
                  {t.backToMenu}
                </button>
                <button
                  type="button"
                  onClick={submitOrder}
                  disabled={submitting || cart.length === 0}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  {submitting ? t.orderSending : t.orderConfirm}
                </button>
              </div>
            </div>
          </div>
        </div>
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
