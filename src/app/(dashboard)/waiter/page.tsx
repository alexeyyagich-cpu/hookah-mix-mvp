'use client'

import { useState, useCallback, useRef } from 'react'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { useFloorPlan } from '@/lib/hooks/useFloorPlan'
import { useKDS } from '@/lib/hooks/useKDS'
import { useBarRecipes } from '@/lib/hooks/useBarRecipes'
import { useBarSales } from '@/lib/hooks/useBarSales'
import { useBowls } from '@/lib/hooks/useBowls'
import { useInventory } from '@/lib/hooks/useInventory'
import { useModules } from '@/lib/hooks/useModules'
import { useTranslation, useLocale, formatCurrency } from '@/lib/i18n'
import type { Tobacco } from '@/data/tobaccos'
import { getHeatRecommendation } from '@/logic/quickRepeatEngine'
import { IconWaiter, IconLock } from '@/components/Icons'
import { EmptyState } from '@/components/ui/EmptyState'
import type { BarRecipeWithIngredients, KdsOrderItem, KdsHookahData, StrengthPreference } from '@/types/database'
import type { BarItemEntry, SelectedTobacco } from '@/types/shared'
import { ErrorBoundary } from '@/components/ErrorBoundary'

import { TableSelector } from '@/components/waiter/TableSelector'
import { MenuSection } from '@/components/waiter/MenuSection'
import { WaiterCart } from '@/components/waiter/WaiterCart'

function getStrengthFromAvg(avgStrength: number): StrengthPreference {
  if (avgStrength <= 4) return 'light'
  if (avgStrength <= 7) return 'medium'
  return 'strong'
}

export default function WaiterPage() {
  const tm = useTranslation('manage')
  const th = useTranslation('hookah')
  const { locale } = useLocale()
  const { canUseWaiterTablet } = useSubscription()
  const { tables } = useFloorPlan()
  const { createOrder } = useKDS()
  const { recipes } = useBarRecipes()
  const { recordSale } = useBarSales()
  const { bowls } = useBowls()
  const { inventory } = useInventory()
  const { isBarActive, isHookahActive } = useModules()

  // State
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'bar' | 'hookah'>(isBarActive ? 'bar' : 'hookah')
  const [barItems, setBarItems] = useState<BarItemEntry[]>([])
  const [selectedTobaccos, setSelectedTobaccos] = useState<SelectedTobacco[]>([])
  const [hookahMode, setHookahMode] = useState<'structured' | 'freetext'>('structured')
  const [hookahDescription, setHookahDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [guestName, setGuestName] = useState('')
  const [cartExpanded, setCartExpanded] = useState(false)
  const [selectedBowlId, setSelectedBowlId] = useState<string | null>(null)
  const [totalGrams, setTotalGrams] = useState(20)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const errorTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const selectedTable = tables.find(t => t.id === selectedTableId)

  // Bar item handlers
  const handleAddBarItem = useCallback((recipe: BarRecipeWithIngredients) => {
    setBarItems(prev => {
      const existing = prev.find(b => b.recipe.id === recipe.id)
      if (existing) {
        return prev.map(b => b.recipe.id === recipe.id ? { ...b, quantity: b.quantity + 1 } : b)
      }
      return [...prev, { recipe, quantity: 1 }]
    })
  }, [])

  const handleUpdateBarItemQty = useCallback((recipeId: string, delta: number) => {
    setBarItems(prev =>
      prev
        .map(b => b.recipe.id === recipeId ? { ...b, quantity: b.quantity + delta } : b)
        .filter(b => b.quantity > 0)
    )
  }, [])

  const handleRemoveBarItem = useCallback((recipeId: string) => {
    setBarItems(prev => prev.filter(b => b.recipe.id !== recipeId))
  }, [])

  // Tobacco handlers
  const handleAddTobacco = useCallback((tobacco: Tobacco) => {
    setSelectedTobaccos(prev => {
      if (prev.length >= 5) return prev
      if (prev.some(t => t.tobacco.id === tobacco.id)) return prev
      const newList = [...prev, { tobacco, percent: 0 }]
      // Redistribute evenly
      const each = Math.floor(100 / newList.length)
      const remainder = 100 - each * newList.length
      return newList.map((t, i) => ({ ...t, percent: each + (i === 0 ? remainder : 0) }))
    })
  }, [])

  const handleRemoveTobacco = useCallback((id: string) => {
    setSelectedTobaccos(prev => {
      const newList = prev.filter(t => t.tobacco.id !== id)
      if (newList.length === 0) return []
      const each = Math.floor(100 / newList.length)
      const remainder = 100 - each * newList.length
      return newList.map((t, i) => ({ ...t, percent: each + (i === 0 ? remainder : 0) }))
    })
  }, [])

  // Submit order to KDS
  const handleSubmit = useCallback(async () => {
    if (!selectedTableId) return
    setSubmitting(true)

    setSubmitError(null)

    try {
      const table = tables.find(t => t.id === selectedTableId)

      // Create bar order
      if (barItems.length > 0) {
        const barOrderItems: KdsOrderItem[] = barItems.map(b => ({
          name: b.recipe.name,
          quantity: b.quantity,
          details: b.recipe.menu_price ? formatCurrency(b.recipe.menu_price, locale) : null,
        }))

        await createOrder({
          table_id: selectedTableId,
          table_name: table?.name || null,
          guest_name: guestName || null,
          type: 'bar',
          items: barOrderItems,
          notes: notes || null,
        })

        // Record sales for bar items
        for (const item of barItems) {
          await recordSale(item.recipe, item.quantity, notes || undefined)
        }
      }

      // Create hookah order
      const hasHookah = hookahMode === 'freetext'
        ? hookahDescription.trim().length > 0
        : selectedTobaccos.length >= 2

      if (hasHookah) {
        let hookahItems: KdsOrderItem[]
        let hookahData: KdsHookahData | undefined

        if (hookahMode === 'freetext') {
          hookahItems = [{
            name: tm.waiterHookahTab,
            quantity: 1,
            details: hookahDescription,
          }]
        } else {
          const bowl = bowls.find(b => b.id === selectedBowlId)
          const avgStrength = selectedTobaccos.length > 0
            ? selectedTobaccos.reduce((sum, t) => sum + t.tobacco.strength, 0) / selectedTobaccos.length
            : 5
          const strengthPref = getStrengthFromAvg(avgStrength)
          const heat = getHeatRecommendation(strengthPref, totalGrams)

          hookahData = {
            tobaccos: selectedTobaccos.map(t => ({
              tobacco_id: t.tobacco.id,
              brand: t.tobacco.brand,
              flavor: t.tobacco.flavor,
              percent: t.percent,
              color: t.tobacco.color,
            })),
            total_grams: totalGrams,
            bowl_name: bowl?.name || null,
            bowl_id: selectedBowlId,
            heat_setup: { coals: heat.coals, packing: heat.packing },
            strength: getStrengthFromAvg(avgStrength),
            compatibility_score: null,
          }

          hookahItems = [{
            name: selectedTobaccos.map(t => t.tobacco.flavor).join(' + '),
            quantity: 1,
            details: `${totalGrams}g${bowl ? ` · ${bowl.name}` : ''}`,
            hookah_data: hookahData,
          }]
        }

        await createOrder({
          table_id: selectedTableId,
          table_name: table?.name || null,
          guest_name: guestName || null,
          type: 'hookah',
          items: hookahItems,
          notes: notes || null,
        })
      }

      // Reset cart
      setBarItems([])
      setSelectedTobaccos([])
      setHookahDescription('')
      setNotes('')
      setGuestName('')
      setCartExpanded(false)
      setSent(true)
      setTimeout(() => setSent(false), 2000)
    } catch {
      setSubmitError(th.orderError)
      clearTimeout(errorTimerRef.current ?? undefined)
      errorTimerRef.current = setTimeout(() => setSubmitError(null), 4000)
    } finally {
      setSubmitting(false)
    }
  }, [selectedTableId, barItems, selectedTobaccos, hookahMode, hookahDescription, notes, guestName, tables, createOrder, recordSale, bowls, selectedBowlId, totalGrams, th.orderError, locale])

  // Multi guard — waiter mode requires Multi or Enterprise
  if (!canUseWaiterTablet) {
    return (
      <ErrorBoundary sectionName="Waiter Form">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{tm.waiterProRequired}</h1>
        <EmptyState
          icon={<IconLock size={32} />}
          title={tm.waiterProRequired}
          description={tm.waiterProRequiredDesc}
          action={{ label: tm.upgradePlan, href: '/pricing' }}
        />
      </div>
      </ErrorBoundary>
    )
  }

  const showTabs = isBarActive && isHookahActive

  return (
    <ErrorBoundary sectionName="Waiter">
    <div className="max-w-lg mx-auto pb-32">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <IconWaiter size={22} className="text-[var(--color-primary)]" />
          {tm.waiterTitle}
        </h1>
        <p className="text-sm text-[var(--color-textMuted)]">{tm.waiterSubtitle}</p>
      </div>

      {/* Table selector */}
      <div className="mb-4">
        <label className="block text-xs font-semibold uppercase text-[var(--color-textMuted)] mb-2">
          {tm.waiterSelectTable}
        </label>
        <TableSelector
          tables={tables}
          selectedId={selectedTableId}
          onSelect={setSelectedTableId}
          tm={tm}
        />
      </div>

      {selectedTableId && (
        <>
          {/* Tabs */}
          {showTabs && (
            <div className="flex gap-2 mb-4">
              <button type="button"
                onClick={() => setActiveTab('bar')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === 'bar'
                    ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                    : 'bg-[var(--color-bgCard)] border border-[var(--color-border)] text-[var(--color-textMuted)]'
                }`}
              >
                🍸 {tm.waiterBarTab}
              </button>
              <button type="button"
                onClick={() => setActiveTab('hookah')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === 'hookah'
                    ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                    : 'bg-[var(--color-bgCard)] border border-[var(--color-border)] text-[var(--color-textMuted)]'
                }`}
              >
                🔥 {tm.waiterHookahTab}
              </button>
            </div>
          )}

          {/* Menu */}
          <MenuSection
            activeTab={activeTab}
            recipes={recipes}
            barItems={barItems}
            onAddBarItem={handleAddBarItem}
            onUpdateBarItemQty={handleUpdateBarItemQty}
            tobaccos={selectedTobaccos}
            onAddTobacco={handleAddTobacco}
            onRemoveTobacco={handleRemoveTobacco}
            bowls={bowls}
            selectedBowlId={selectedBowlId}
            onSelectBowl={setSelectedBowlId}
            totalGrams={totalGrams}
            onSetTotalGrams={setTotalGrams}
            inventory={inventory}
            hookahMode={hookahMode}
            hookahDescription={hookahDescription}
            onSetHookahMode={setHookahMode}
            onSetHookahDescription={setHookahDescription}
            tm={tm}
          />
        </>
      )}

      {/* Error toast */}
      {submitError && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[var(--color-danger)] text-[var(--color-bg)] text-sm font-medium shadow-lg animate-fadeInUp">
          {submitError}
        </div>
      )}

      {/* Cart */}
      <WaiterCart
        barItems={barItems}
        hookahTobaccos={selectedTobaccos}
        hookahDescription={hookahDescription}
        hookahMode={hookahMode}
        expanded={cartExpanded}
        onToggle={() => setCartExpanded(!cartExpanded)}
        onUpdateBarQty={handleUpdateBarItemQty}
        onRemoveBarItem={handleRemoveBarItem}
        onSubmit={handleSubmit}
        notes={notes}
        onSetNotes={setNotes}
        guestName={guestName}
        onSetGuestName={setGuestName}
        tableName={selectedTable?.name || null}
        submitting={submitting}
        sent={sent}
        tm={tm}
      />
    </div>
    </ErrorBoundary>
  )
}
