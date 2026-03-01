'use client'

import { useState, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import { useTranslation, useLocale, getLocaleName } from '@/lib/i18n'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock'
import { IconClose, IconCocktail, IconBowl } from '@/components/Icons'
import { getHeatRecommendation } from '@/logic/quickRepeatEngine'
import { calculateCompatibility, type MixItem } from '@/logic/mixCalculator'
import type { FloorTable, BarRecipeWithIngredients, KdsOrderItem, BowlType, TobaccoInventory, Guest, KdsHookahData, StrengthPreference } from '@/types/database'
import type { BarItemEntry, SelectedTobacco } from '@/types/shared'
import type { CreateKdsOrderInput } from '@/lib/hooks/useKDS'
import HookahOrderTab from './HookahOrderTab'
import BarOrderTab from './BarOrderTab'

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
  const tc = useTranslation('common')
  const { locale } = useLocale()
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'bar' | 'hookah'>(isBarActive ? 'bar' : 'hookah')
  const [barItems, setBarItems] = useState<BarItemEntry[]>([])
  const [hookahDescription, setHookahDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(dialogRef, isOpen, onClose)
  useBodyScrollLock(isOpen)

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

  const guestName = selectedTable?.current_guest_name || null

  // Selected bowl — needed by handleSubmit
  const selectedBowl = useMemo(
    () => bowls.find(b => b.id === selectedBowlId) || null,
    [bowls, selectedBowlId]
  )

  // Auto heat recommendation — needed by handleSubmit
  const heatSetup = useMemo(() => {
    if (selectedTobaccos.length === 0) return null
    const avgStrength = selectedTobaccos.reduce((sum, st) => {
      return sum + st.tobacco.strength * (st.percent / 100)
    }, 0)
    const strength = getStrengthFromAvg(avgStrength)
    return getHeatRecommendation(strength, totalGrams)
  }, [selectedTobaccos, totalGrams])

  // Strength — needed by handleSubmit
  const mixStrength = useMemo((): StrengthPreference | null => {
    if (selectedTobaccos.length === 0) return null
    const avg = selectedTobaccos.reduce((sum, st) => sum + st.tobacco.strength * (st.percent / 100), 0)
    return getStrengthFromAvg(avg)
  }, [selectedTobaccos])

  // Compatibility score — needed by handleSubmit
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
    } catch {
      toast.error(tc.errorGeneric)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div ref={dialogRef} className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="new-order-title">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--color-bgCard)] border border-[var(--color-border)] shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--color-bgCard)] px-6 pt-6 pb-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 id="new-order-title" className="text-xl font-bold">{t.newOrderHeader}</h2>
          <button type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--color-bgHover)] transition-colors"
            aria-label={tc.close}
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
            <BarOrderTab
              barItems={barItems}
              setBarItems={setBarItems}
              recipes={recipes}
            />
          )}

          {/* Hookah tab content */}
          {activeTab === 'hookah' && isHookahActive && (
            <HookahOrderTab
              hookahMode={hookahMode}
              setHookahMode={setHookahMode}
              hookahDescription={hookahDescription}
              setHookahDescription={setHookahDescription}
              selectedTobaccos={selectedTobaccos}
              setSelectedTobaccos={setSelectedTobaccos}
              selectedBowlId={selectedBowlId}
              setSelectedBowlId={setSelectedBowlId}
              totalGrams={totalGrams}
              setTotalGrams={setTotalGrams}
              tobaccoSearch={tobaccoSearch}
              setTobaccoSearch={setTobaccoSearch}
              bowls={bowls}
              inventory={inventory}
              guests={guests}
              selectedTableId={selectedTableId}
              tables={tables}
              selectedBowl={selectedBowl}
              heatSetup={heatSetup}
              mixStrength={mixStrength}
              compatibilityScore={compatibilityScore}
            />
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
              aria-label={t.sectionNotes}
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
                ? 'bg-[var(--color-primary)] text-[var(--color-bg)] hover:opacity-90'
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
