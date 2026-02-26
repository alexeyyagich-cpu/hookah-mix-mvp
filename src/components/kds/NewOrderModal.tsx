'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTranslation, useLocale, getLocaleName, formatCurrency } from '@/lib/i18n'
import { IconPlus, IconMinus, IconClose, IconCocktail, IconBowl, IconSearch } from '@/components/Icons'
import { TOBACCOS, type Tobacco } from '@/data/tobaccos'
import { getHeatRecommendation } from '@/logic/quickRepeatEngine'
import { calculateCompatibility, type MixItem } from '@/logic/mixCalculator'
import type { FloorTable, BarRecipeWithIngredients, KdsOrderItem, BowlType, TobaccoInventory, Guest, KdsHookahData, StrengthPreference } from '@/types/database'
import type { CreateKdsOrderInput } from '@/lib/hooks/useKDS'

interface NewOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateOrder: (order: CreateKdsOrderInput) => Promise<unknown>
  tables: FloorTable[]
  recipes: BarRecipeWithIngredients[]
  isBarActive: boolean
  isHookahActive: boolean
  bowls: BowlType[]
  inventory: TobaccoInventory[]
  guests: Guest[]
}

interface BarItemEntry {
  recipe: BarRecipeWithIngredients
  quantity: number
}

interface SelectedTobacco {
  tobacco: Tobacco
  percent: number
}

const TABLE_STATUS_DOTS: Record<string, string> = {
  available: 'bg-[var(--color-success)]',
  occupied: 'bg-[var(--color-primary)]',
  reserved: 'bg-[var(--color-warning)]',
  cleaning: 'bg-[var(--color-textMuted)]',
}

function getStrengthFromAvg(avgStrength: number): StrengthPreference {
  if (avgStrength <= 4) return 'light'
  if (avgStrength <= 7) return 'medium'
  return 'strong'
}

export function NewOrderModal({
  isOpen,
  onClose,
  onCreateOrder,
  tables,
  recipes,
  isBarActive,
  isHookahActive,
  bowls,
  inventory,
  guests,
}: NewOrderModalProps) {
  const t = useTranslation('manage')
  const { locale } = useLocale()
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'bar' | 'hookah'>(isBarActive ? 'bar' : 'hookah')
  const [barItems, setBarItems] = useState<BarItemEntry[]>([])
  const [hookahDescription, setHookahDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Structured hookah builder state
  const [hookahMode, setHookahMode] = useState<'structured' | 'freetext'>('structured')
  const [tobaccoSearch, setTobaccoSearch] = useState('')
  const [selectedTobaccos, setSelectedTobaccos] = useState<SelectedTobacco[]>([])
  const [selectedBowlId, setSelectedBowlId] = useState<string | null>(
    bowls.find(b => b.is_default)?.id || bowls[0]?.id || null
  )
  const [totalGrams, setTotalGrams] = useState<number>(
    bowls.find(b => b.is_default)?.capacity_grams || bowls[0]?.capacity_grams || 20
  )

  const selectedTable = useMemo(
    () => tables.find(t => t.id === selectedTableId) || null,
    [tables, selectedTableId]
  )

  const menuRecipes = useMemo(
    () => recipes.filter(r => r.is_on_menu),
    [recipes]
  )

  const guestName = selectedTable?.current_guest_name || null

  // Find guest for selected table (for "use last mix" feature)
  const tableGuest = useMemo(() => {
    if (!guestName) return null
    return guests.find(g => g.name === guestName) || null
  }, [guestName, guests])

  // Tobacco search results
  const tobaccoResults = useMemo(() => {
    if (!tobaccoSearch.trim()) return TOBACCOS.slice(0, 20)
    const q = tobaccoSearch.toLowerCase()
    return TOBACCOS.filter(
      t => t.flavor.toLowerCase().includes(q) || t.brand.toLowerCase().includes(q)
    ).slice(0, 20)
  }, [tobaccoSearch])

  // Inventory lookup for stock display
  const getStock = (tobacco: Tobacco): number | null => {
    const inv = inventory.find(
      i => i.tobacco_id === tobacco.id ||
        (i.brand.toLowerCase() === tobacco.brand.toLowerCase() && i.flavor.toLowerCase() === tobacco.flavor.toLowerCase())
    )
    return inv ? inv.quantity_grams : null
  }

  // Selected bowl
  const selectedBowl = useMemo(
    () => bowls.find(b => b.id === selectedBowlId) || null,
    [bowls, selectedBowlId]
  )

  // Auto heat recommendation
  const heatSetup = useMemo(() => {
    if (selectedTobaccos.length === 0) return null
    const avgStrength = selectedTobaccos.reduce((sum, st) => {
      return sum + st.tobacco.strength * (st.percent / 100)
    }, 0)
    const strength = getStrengthFromAvg(avgStrength)
    return getHeatRecommendation(strength, totalGrams)
  }, [selectedTobaccos, totalGrams])

  // Strength
  const mixStrength = useMemo((): StrengthPreference | null => {
    if (selectedTobaccos.length === 0) return null
    const avg = selectedTobaccos.reduce((sum, st) => sum + st.tobacco.strength * (st.percent / 100), 0)
    return getStrengthFromAvg(avg)
  }, [selectedTobaccos])

  // Compatibility score
  const compatibilityScore = useMemo(() => {
    if (selectedTobaccos.length < 2) return null
    const items: MixItem[] = selectedTobaccos.map(st => ({ tobacco: st.tobacco, percent: st.percent }))
    try {
      const result = calculateCompatibility(items)
      return result.score
    } catch {
      return null
    }
  }, [selectedTobaccos])

  const hasBarItems = barItems.length > 0
  const hasHookahItem = hookahMode === 'freetext'
    ? hookahDescription.trim().length > 0
    : selectedTobaccos.length > 0
  const canSubmit = (hasBarItems || hasHookahItem) && !saving

  const addTobacco = (tobacco: Tobacco) => {
    if (selectedTobaccos.find(st => st.tobacco.id === tobacco.id)) return
    if (selectedTobaccos.length >= 5) return

    setSelectedTobaccos(prev => {
      const newCount = prev.length + 1
      const equalPercent = Math.floor(100 / newCount)
      const remainder = 100 - equalPercent * newCount

      return [
        ...prev.map((st, i) => ({ ...st, percent: equalPercent + (i === 0 ? remainder : 0) })),
        { tobacco, percent: equalPercent },
      ]
    })
    setTobaccoSearch('')
  }

  const removeTobacco = (tobaccoId: string) => {
    setSelectedTobaccos(prev => {
      const filtered = prev.filter(st => st.tobacco.id !== tobaccoId)
      if (filtered.length === 0) return []
      const equalPercent = Math.floor(100 / filtered.length)
      const remainder = 100 - equalPercent * filtered.length
      return filtered.map((st, i) => ({ ...st, percent: equalPercent + (i === 0 ? remainder : 0) }))
    })
  }

  const updatePercent = (tobaccoId: string, newPercent: number) => {
    setSelectedTobaccos(prev => {
      const idx = prev.findIndex(st => st.tobacco.id === tobaccoId)
      if (idx === -1) return prev

      newPercent = Math.max(5, Math.min(95, newPercent))
      const oldPercent = prev[idx].percent
      const delta = newPercent - oldPercent
      const othersTotal = 100 - oldPercent
      if (othersTotal === 0) return prev

      return prev.map((st, i) => {
        if (i === idx) return { ...st, percent: newPercent }
        const share = st.percent / othersTotal
        const adjusted = Math.max(5, Math.round(st.percent - delta * share))
        return { ...st, percent: adjusted }
      })
    })
  }

  const useLastMix = () => {
    if (!tableGuest?.last_mix_snapshot) return
    const snap = tableGuest.last_mix_snapshot

    const tobaccos: SelectedTobacco[] = snap.tobaccos
      .map(st => {
        const tobacco = TOBACCOS.find(t => t.id === st.tobacco_id)
        if (!tobacco) return null
        return { tobacco, percent: st.percent }
      })
      .filter((st): st is SelectedTobacco => st !== null)

    if (tobaccos.length > 0) {
      setSelectedTobaccos(tobaccos)
      setTotalGrams(snap.total_grams)
      if (snap.bowl_type) {
        const bowl = bowls.find(b => b.name === snap.bowl_type)
        if (bowl) setSelectedBowlId(bowl.id)
      }
      setHookahMode('structured')
    }
  }

  const addBarItem = (recipe: BarRecipeWithIngredients) => {
    setBarItems(prev => {
      const existing = prev.find(e => e.recipe.id === recipe.id)
      if (existing) {
        return prev.map(e =>
          e.recipe.id === recipe.id
            ? { ...e, quantity: e.quantity + 1 }
            : e
        )
      }
      return [...prev, { recipe, quantity: 1 }]
    })
  }

  const updateBarItemQty = (recipeId: string, delta: number) => {
    setBarItems(prev => {
      return prev
        .map(e =>
          e.recipe.id === recipeId
            ? { ...e, quantity: Math.max(0, e.quantity + delta) }
            : e
        )
        .filter(e => e.quantity > 0)
    })
  }

  const removeBarItem = (recipeId: string) => {
    setBarItems(prev => prev.filter(e => e.recipe.id !== recipeId))
  }

  const resetForm = () => {
    setSelectedTableId(null)
    setBarItems([])
    setHookahDescription('')
    setNotes('')
    setActiveTab(isBarActive ? 'bar' : 'hookah')
    setHookahMode('structured')
    setTobaccoSearch('')
    setSelectedTobaccos([])
    setSelectedBowlId(bowls.find(b => b.is_default)?.id || bowls[0]?.id || null)
    setTotalGrams(bowls.find(b => b.is_default)?.capacity_grams || bowls[0]?.capacity_grams || 20)
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const base = {
        table_id: selectedTableId,
        table_name: selectedTable?.name || null,
        guest_name: guestName,
        notes: notes.trim() || null,
      }

      // Create bar order
      if (hasBarItems) {
        const items: KdsOrderItem[] = barItems.map(e => ({
          name: getLocaleName(e.recipe, locale),
          quantity: e.quantity,
          details: locale === 'ru' ? (e.recipe.name_en || null) : e.recipe.name,
        }))
        await onCreateOrder({ ...base, type: 'bar', items })
      }

      // Create hookah order
      if (hasHookahItem) {
        if (hookahMode === 'structured' && selectedTobaccos.length > 0) {
          const hookahData: KdsHookahData = {
            tobaccos: selectedTobaccos.map(st => ({
              tobacco_id: st.tobacco.id,
              brand: st.tobacco.brand,
              flavor: st.tobacco.flavor,
              percent: st.percent,
              color: st.tobacco.color,
            })),
            total_grams: totalGrams,
            bowl_name: selectedBowl?.name || null,
            bowl_id: selectedBowl?.id || null,
            heat_setup: heatSetup,
            strength: mixStrength,
            compatibility_score: compatibilityScore,
          }

          const displayName = selectedTobaccos.map(st => `${st.tobacco.flavor} (${st.percent}%)`).join(' + ')
          const items: KdsOrderItem[] = [{
            name: displayName,
            quantity: 1,
            details: `${totalGrams}g, ${selectedBowl?.name || ''}`,
            hookah_data: hookahData,
          }]
          await onCreateOrder({ ...base, type: 'hookah', items })
        } else {
          // Free text mode
          const items: KdsOrderItem[] = [{
            name: hookahDescription.trim(),
            quantity: 1,
            details: null,
          }]
          await onCreateOrder({ ...base, type: 'hookah', items })
        }
      }

      resetForm()
      onClose()
    } catch (err) {
      console.error('Order creation failed:', err)
    } finally {
      setSaving(false)
    }
  }

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, saving, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--color-bgCard)] border border-[var(--color-border)] shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--color-bgCard)] px-6 pt-6 pb-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="text-xl font-bold">{t.newOrderHeader}</h2>
          <button type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--color-bgHover)] transition-colors"
            aria-label="Close"
          >
            <IconClose size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Table picker */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-textMuted)] uppercase tracking-wide mb-3">
              {t.sectionTable}
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              <button type="button"
                onClick={() => setSelectedTableId(null)}
                className={`p-3 rounded-xl text-sm font-medium border transition-all ${
                  selectedTableId === null
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/30'
                }`}
              >
                {t.noTableBtn}
              </button>
              {tables.map(table => (
                <button type="button"
                  key={table.id}
                  onClick={() => setSelectedTableId(table.id)}
                  className={`p-3 rounded-xl text-sm font-medium border transition-all text-left ${
                    selectedTableId === table.id
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                      : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${TABLE_STATUS_DOTS[table.status]}`} />
                    <span className="truncate">{table.name}</span>
                  </div>
                  {table.current_guest_name && (
                    <div className="text-xs text-[var(--color-textMuted)] mt-0.5 truncate">
                      {table.current_guest_name}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Type tabs */}
          {isBarActive && isHookahActive && (
            <div className="flex gap-2 border-b border-[var(--color-border)]">
              <button type="button"
                onClick={() => setActiveTab('bar')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'bar'
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-transparent text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
                }`}
              >
                <IconCocktail size={16} />
                {t.tabBar}
              </button>
              <button type="button"
                onClick={() => setActiveTab('hookah')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'hookah'
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-transparent text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
                }`}
              >
                <IconBowl size={16} />
                {t.tabHookah}
              </button>
            </div>
          )}

          {/* Bar tab content */}
          {activeTab === 'bar' && isBarActive && (
            <div className="space-y-4">
              {menuRecipes.length === 0 ? (
                <div className="text-center py-6 text-[var(--color-textMuted)] text-sm">
                  {t.noMenuRecipesLong}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {menuRecipes.map(recipe => {
                    const inCart = barItems.find(e => e.recipe.id === recipe.id)
                    return (
                      <button type="button"
                        key={recipe.id}
                        onClick={() => addBarItem(recipe)}
                        className={`p-3 rounded-xl text-left text-sm border transition-all active:scale-95 ${
                          inCart
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                            : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/30'
                        }`}
                      >
                        <div className="font-medium truncate">{getLocaleName(recipe, locale)}</div>
                        {recipe.menu_price && (
                          <div className="text-xs text-[var(--color-textMuted)] mt-0.5">{formatCurrency(recipe.menu_price, locale)}</div>
                        )}
                        {inCart && (
                          <div className="text-xs font-semibold text-[var(--color-primary)] mt-1">
                            x{inCart.quantity}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Selected bar items */}
              {barItems.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
                  <h4 className="text-xs font-semibold text-[var(--color-textMuted)] uppercase">{t.selectedItems}</h4>
                  {barItems.map(entry => (
                    <div
                      key={entry.recipe.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--color-bgHover)]"
                    >
                      <span className="text-sm font-medium truncate flex-1 mr-2">{getLocaleName(entry.recipe, locale)}</span>
                      <div className="flex items-center gap-2">
                        <button type="button"
                          onClick={() => updateBarItemQty(entry.recipe.id, -1)}
                          className="min-w-[44px] min-h-[44px] p-2.5 rounded-lg hover:bg-[var(--color-bgCard)] transition-colors flex items-center justify-center"
                          aria-label={t.decreaseQuantity}
                        >
                          <IconMinus size={14} />
                        </button>
                        <span className="text-sm font-mono font-semibold w-6 text-center">{entry.quantity}</span>
                        <button type="button"
                          onClick={() => updateBarItemQty(entry.recipe.id, 1)}
                          className="min-w-[44px] min-h-[44px] p-2.5 rounded-lg hover:bg-[var(--color-bgCard)] transition-colors flex items-center justify-center"
                          aria-label={t.increaseQuantity}
                        >
                          <IconPlus size={14} />
                        </button>
                        <button type="button"
                          onClick={() => removeBarItem(entry.recipe.id)}
                          className="min-w-[44px] min-h-[44px] p-2.5 rounded-lg text-[var(--color-textMuted)] hover:text-[var(--color-danger)] transition-colors ml-1 flex items-center justify-center"
                          aria-label={t.removeItem}
                        >
                          <IconClose size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Hookah tab content */}
          {activeTab === 'hookah' && isHookahActive && (
            <div className="space-y-4">
              {/* Mode toggle */}
              <div className="flex bg-[var(--color-bgHover)] rounded-xl p-1 w-fit">
                <button type="button"
                  onClick={() => setHookahMode('structured')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    hookahMode === 'structured'
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {t.hookahModeStructured}
                </button>
                <button type="button"
                  onClick={() => setHookahMode('freetext')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    hookahMode === 'freetext'
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {t.hookahModeFreetext}
                </button>
              </div>

              {hookahMode === 'freetext' ? (
                <textarea
                  value={hookahDescription}
                  onChange={e => setHookahDescription(e.target.value)}
                  placeholder={t.placeholderHookahMix}
                  rows={3}
                  className="input text-sm resize-none"
                />
              ) : (
                <div className="space-y-4">
                  {/* Use last mix button */}
                  {tableGuest?.last_mix_snapshot && (
                    <button type="button"
                      onClick={useLastMix}
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-medium border border-dashed border-[var(--color-success)] text-[var(--color-success)] hover:bg-[var(--color-success)]/10 transition-colors"
                    >
                      {t.useLastMix(tableGuest.name)}
                    </button>
                  )}

                  {/* Tobacco search */}
                  <div className="relative">
                    <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-textMuted)]" />
                    <input
                      type="text"
                      value={tobaccoSearch}
                      onChange={e => setTobaccoSearch(e.target.value)}
                      placeholder={t.tobaccoSearch}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-sm"
                    />
                  </div>

                  {/* Tobacco results */}
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {tobaccoResults.length === 0 ? (
                      <p className="text-sm text-[var(--color-textMuted)] py-2">{t.noTobaccoResults}</p>
                    ) : (
                      tobaccoResults.map(tobacco => {
                        const isSelected = selectedTobaccos.some(st => st.tobacco.id === tobacco.id)
                        const stock = getStock(tobacco)
                        return (
                          <button type="button"
                            key={tobacco.id}
                            onClick={() => addTobacco(tobacco)}
                            disabled={isSelected || selectedTobaccos.length >= 5}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                              isSelected
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:scale-105 active:scale-95 cursor-pointer'
                            }`}
                            style={{
                              background: tobacco.color + '15',
                              color: tobacco.color,
                              border: `1px solid ${tobacco.color}${isSelected ? '20' : '40'}`,
                            }}
                          >
                            <span className="truncate max-w-[120px]">{tobacco.brand} {tobacco.flavor}</span>
                            {stock !== null && (
                              <span className="opacity-60 text-[10px]">{stock}g</span>
                            )}
                          </button>
                        )
                      })
                    )}
                  </div>

                  {/* Selected tobaccos with sliders */}
                  {selectedTobaccos.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-[var(--color-border)]">
                      <h4 className="text-xs font-semibold text-[var(--color-textMuted)] uppercase">
                        {t.selectedTobaccosLabel}
                      </h4>
                      {selectedTobaccos.map(st => (
                        <div
                          key={st.tobacco.id}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--color-bgHover)]"
                        >
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ background: st.tobacco.color }}
                          />
                          <span className="text-sm font-medium truncate flex-1 min-w-0">
                            {st.tobacco.flavor}
                          </span>
                          <input
                            type="range"
                            min={5}
                            max={95}
                            value={st.percent}
                            onChange={e => updatePercent(st.tobacco.id, Number(e.target.value))}
                            className="w-20 sm:w-28 accent-[var(--color-primary)]"
                          />
                          <span className="text-sm font-mono font-semibold w-10 text-right">
                            {st.percent}%
                          </span>
                          <button type="button"
                            onClick={() => removeTobacco(st.tobacco.id)}
                            className="min-w-[44px] min-h-[44px] p-2.5 rounded-lg text-[var(--color-textMuted)] hover:text-[var(--color-danger)] transition-colors flex items-center justify-center"
                            aria-label={t.removeTobacco}
                          >
                            <IconClose size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bowl + Grams row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[var(--color-textMuted)] uppercase block mb-1.5">
                        {t.bowlLabel}
                      </label>
                      <select
                        value={selectedBowlId || ''}
                        onChange={e => {
                          const id = e.target.value || null
                          setSelectedBowlId(id)
                          const bowl = bowls.find(b => b.id === id)
                          if (bowl) setTotalGrams(bowl.capacity_grams)
                        }}
                        className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-sm"
                      >
                        <option value="">{t.noBowlSelected}</option>
                        {bowls.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.capacity_grams}g)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[var(--color-textMuted)] uppercase block mb-1.5">
                        {t.totalGramsLabel}
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={totalGrams}
                        onChange={e => setTotalGrams(Math.max(5, Math.min(40, Number(e.target.value) || 0)))}
                        min={5}
                        max={40}
                        step="1"
                        className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-sm"
                      />
                    </div>
                  </div>

                  {/* Heat recommendation */}
                  {heatSetup && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-bgHover)] text-xs text-[var(--color-textMuted)]">
                      <span className="font-medium">{t.autoHeatSetup}:</span>
                      <span>
                        {t.coalsLabel(heatSetup.coals)},{' '}
                        {heatSetup.packing === 'fluffy' ? t.packingFluffy :
                         heatSetup.packing === 'semi-dense' ? t.packingSemiDense :
                         t.packingDense}
                      </span>
                      {compatibilityScore !== null && (
                        <span className="ml-auto font-mono font-medium" style={{
                          color: compatibilityScore >= 80 ? 'var(--color-success)' :
                                 compatibilityScore >= 60 ? 'var(--color-warning)' :
                                 'var(--color-danger)',
                        }}>
                          {compatibilityScore}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-textMuted)] uppercase tracking-wide mb-2">
              {t.sectionNotes}
            </h3>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t.placeholderSpecialRequests}
              rows={2}
              className="input text-sm resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[var(--color-bgCard)] px-6 py-4 border-t border-[var(--color-border)] flex items-center justify-between">
          <button type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--color-textMuted)] hover:bg-[var(--color-bgHover)] transition-colors"
          >
            {t.cancelBtn}
          </button>
          <button type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              canSubmit
                ? 'bg-[var(--color-primary)] text-white hover:opacity-90'
                : 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)] cursor-not-allowed'
            }`}
          >
            {saving && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
            {saving ? t.creatingOrder : t.createOrderBtn}
          </button>
        </div>
      </div>
    </div>
  )
}
