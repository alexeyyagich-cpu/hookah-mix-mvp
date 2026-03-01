'use client'

import { IconCocktail } from '@/components/Icons'
import { COCKTAIL_METHOD_EMOJI } from '@/data/bar-recipes'
import { useTranslation, getLocaleName } from '@/lib/i18n'
import type { PublicBarRecipe } from '@/types/lounge'

interface CocktailMenuSectionProps {
  cocktailGroups: Record<string, PublicBarRecipe[]>
  isOrderingMode: boolean
  showPrices: boolean
  getBarItemCount: (recipe: PublicBarRecipe) => number
  addBarItem: (recipe: PublicBarRecipe) => void
  removeBarItem: (recipe: PublicBarRecipe) => void
  locale: string
}

export function CocktailMenuSection({
  cocktailGroups,
  isOrderingMode,
  showPrices,
  getBarItemCount,
  addBarItem,
  removeBarItem,
  locale,
}: CocktailMenuSectionProps) {
  const t = useTranslation('hookah')
  const tb = useTranslation('bar')

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

  return (
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
                        {showPrices && recipe.menu_price && (
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
  )
}
