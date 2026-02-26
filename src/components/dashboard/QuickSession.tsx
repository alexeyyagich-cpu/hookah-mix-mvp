'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslation, useLocale, formatCurrency } from '@/lib/i18n'
import { TOBACCOS } from '@/data/tobaccos'
import { useBowls } from '@/lib/hooks/useBowls'
import { useInventory } from '@/lib/hooks/useInventory'
import { useGuests } from '@/lib/hooks/useGuests'
import { useLoyalty } from '@/lib/hooks/useLoyalty'
import { IconSmoke, IconTimer, IconUsers, IconClose } from '@/components/Icons'
import { SessionTimer } from '@/components/session/SessionTimer'
import type { Session, SessionItem, Guest } from '@/types/database'

interface MixItem {
  tobacco: typeof TOBACCOS[0]
  percent: number
  inventoryId?: string
}

interface QuickSessionProps {
  isOpen: boolean
  onClose: () => void
  onSave: (
    session: Omit<Session, 'id' | 'profile_id'>,
    items: Omit<SessionItem, 'id' | 'session_id'>[],
    deductFromInventory: boolean
  ) => Promise<void>
  initialMix?: MixItem[]
}

export function QuickSession({ isOpen, onClose, onSave, initialMix }: QuickSessionProps) {
  const t = useTranslation('hookah')
  const tc = useTranslation('common')
  const { locale } = useLocale()
  const { bowls, defaultBowl } = useBowls()
  const { inventory } = useInventory()
  const { guests, searchGuests, recordVisit } = useGuests()
  const { settings: loyaltySettings, accrueBonus, redeemBonus } = useLoyalty()
  const [selectedBowl, setSelectedBowl] = useState<string>('')
  const [totalGrams, setTotalGrams] = useState<string>('20')
  const [notes, setNotes] = useState('')
  const [deductInventory, setDeductInventory] = useState(true)
  const [mixItems, setMixItems] = useState<MixItem[]>([])
  const [saving, setSaving] = useState(false)
  const [compatibilityScore, setCompatibilityScore] = useState<number | null>(null)
  const [sellingPrice, setSellingPrice] = useState<string>('')
  const [durationMinutes, setDurationMinutes] = useState<number>(0)
  const [showTimer, setShowTimer] = useState(false)

  // Guest & loyalty state
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [guestSearch, setGuestSearch] = useState('')
  const [showGuestPicker, setShowGuestPicker] = useState(false)
  const [useBonus, setUseBonus] = useState(false)
  const [bonusAmount, setBonusAmount] = useState('')

  const guestResults = useMemo(() => {
    if (!guestSearch.trim()) return guests.slice(0, 8)
    return searchGuests(guestSearch)
  }, [guestSearch, guests, searchGuests])

  const maxBonusRedemption = selectedGuest && sellingPrice
    ? Math.min(
        selectedGuest.bonus_balance,
        parseFloat(sellingPrice) * (loyaltySettings.bonus_max_redemption_percent / 100)
      )
    : 0

  useEffect(() => {
    if (defaultBowl) {
      setSelectedBowl(defaultBowl.id)
      setTotalGrams(defaultBowl.capacity_grams.toString())
    }
  }, [defaultBowl])

  useEffect(() => {
    if (initialMix) {
      // Match initialMix tobaccos with inventory items
      const itemsWithInventory = initialMix.map(item => {
        const inventoryItem = inventory.find(
          inv => inv.tobacco_id === item.tobacco.id ||
                 (inv.brand === item.tobacco.brand && inv.flavor === item.tobacco.flavor)
        )
        return {
          ...item,
          inventoryId: inventoryItem?.id,
        }
      })
      setMixItems(itemsWithInventory)

      // Calculate simple compatibility score based on categories
      if (initialMix.length >= 2) {
        const categories = initialMix.map(item => item.tobacco.category)
        const uniqueCategories = new Set(categories)
        // Simple scoring: more diversity = higher score, mint bonus
        let score = 60 + (uniqueCategories.size - 1) * 10
        if (categories.includes('mint')) score += 10
        setCompatibilityScore(Math.min(100, Math.max(30, score)))
      }
    }
  }, [initialMix, inventory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mixItems.length < 2) return

    setSaving(true)

    const total = parseFloat(totalGrams) || 20

    const sessionData: Omit<Session, 'id' | 'profile_id'> = {
      created_by: null,
      guest_id: selectedGuest?.id || null,
      bowl_type_id: selectedBowl || null,
      session_date: new Date().toISOString(),
      total_grams: total,
      compatibility_score: compatibilityScore,
      notes: notes || null,
      rating: null,
      duration_minutes: durationMinutes > 0 ? durationMinutes : null,
      selling_price: sellingPrice ? parseFloat(sellingPrice) : null,
    }

    const sessionItems: Omit<SessionItem, 'id' | 'session_id'>[] = mixItems.map(item => ({
      tobacco_inventory_id: item.inventoryId || null,
      tobacco_id: item.tobacco.id,
      brand: item.tobacco.brand,
      flavor: item.tobacco.flavor,
      grams_used: Math.round((total * item.percent) / 100 * 10) / 10,
      percentage: item.percent,
    }))

    await onSave(sessionData, sessionItems, deductInventory)

    // Loyalty: accrue bonus, redeem if used, record visit
    if (selectedGuest) {
      const price = sellingPrice ? parseFloat(sellingPrice) : 0
      if (price > 0 && loyaltySettings.is_enabled) {
        await accrueBonus(selectedGuest.id, price)
      }
      if (useBonus && bonusAmount) {
        const redeem = parseFloat(bonusAmount)
        if (redeem > 0) await redeemBonus(selectedGuest.id, redeem)
      }
      await recordVisit(selectedGuest.id)
    }

    setSaving(false)
    onClose()
  }

  if (!isOpen) return null

  const canSubmit = mixItems.length >= 2 && parseFloat(totalGrams) > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-lg max-h-[90vh] bg-[var(--color-bgCard)] rounded-2xl border border-[var(--color-border)] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[var(--color-border)] flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <IconSmoke size={22} className="text-[var(--color-primary)]" />
            {t.saveSession}
          </h2>
          <button type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--color-bgHover)] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content - scrollable */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Mix Preview */}
          <div className="space-y-3">
            <label className="block text-sm font-medium">{t.mixLabel}</label>
            {mixItems.length === 0 ? (
              <div className="p-4 rounded-xl bg-[var(--color-bgHover)] text-center text-[var(--color-textMuted)]">
                {t.selectTobaccosInCalc}
              </div>
            ) : (
              <div className="space-y-2">
                {mixItems.map((item, index) => {
                  const hasInventory = !!item.inventoryId
                  const invItem = inventory.find(i => i.id === item.inventoryId)
                  const gramsNeeded = Math.round((parseFloat(totalGrams) || 20) * item.percent / 100 * 10) / 10

                  return (
                    <div
                      key={index}
                      className="p-3 rounded-xl bg-[var(--color-bgHover)] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.tobacco.color }}
                        />
                        <div>
                          <div className="font-medium">{item.tobacco.flavor}</div>
                          <div className="text-xs text-[var(--color-textMuted)]">{item.tobacco.brand}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{item.percent}%</div>
                        <div className="text-xs text-[var(--color-textMuted)]">
                          {gramsNeeded}g
                          {hasInventory && invItem && (
                            <span className={invItem.quantity_grams >= gramsNeeded ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}>
                              {' '}{t.inStockLabel(invItem.quantity_grams)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {compatibilityScore && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[var(--color-textMuted)]">{t.compatibilityLabel}:</span>
                <span className={`font-bold ${
                  compatibilityScore >= 80 ? 'text-[var(--color-success)]' :
                  compatibilityScore >= 60 ? 'text-[var(--color-primary)]' :
                  'text-[var(--color-warning)]'
                }`}>
                  {compatibilityScore}%
                </span>
              </div>
            )}
          </div>

          {/* Guest & Loyalty */}
          <div className="space-y-2">
            {!selectedGuest ? (
              <div>
                <button
                  type="button"
                  onClick={() => setShowGuestPicker(!showGuestPicker)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] text-sm text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors w-full"
                >
                  <IconUsers size={16} />
                  {t.loyaltyLinkGuest}
                </button>
                {showGuestPicker && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      value={guestSearch}
                      onChange={(e) => setGuestSearch(e.target.value)}
                      placeholder={t.loyaltySearchGuest}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      autoFocus
                    />
                    <div className="max-h-32 overflow-y-auto rounded-xl border border-[var(--color-border)]">
                      {guestResults.map(guest => (
                        <button
                          key={guest.id}
                          type="button"
                          onClick={() => {
                            setSelectedGuest(guest)
                            setShowGuestPicker(false)
                            setGuestSearch('')
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-bgHover)] flex items-center justify-between"
                        >
                          <span className="font-medium">{guest.name}</span>
                          <span className="text-xs text-[var(--color-textMuted)]">
                            {guest.loyalty_tier && <span className="mr-2 px-1.5 py-0.5 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)]">{guest.loyalty_tier}</span>}
                            {guest.bonus_balance > 0 && formatCurrency(guest.bonus_balance, locale)}
                          </span>
                        </button>
                      ))}
                      {guestResults.length === 0 && (
                        <div className="px-3 py-2 text-sm text-[var(--color-textMuted)] text-center">—</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[var(--color-bgHover)] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconUsers size={16} className="text-[var(--color-primary)]" />
                    <span className="font-medium text-sm">{selectedGuest.name}</span>
                    {selectedGuest.loyalty_tier && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)]">{selectedGuest.loyalty_tier}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedGuest(null); setUseBonus(false); setBonusAmount('') }}
                    className="min-w-[44px] min-h-[44px] p-2.5 rounded-lg hover:bg-[var(--color-bgCard)] transition-colors text-[var(--color-textMuted)] flex items-center justify-center"
                    title={t.loyaltyRemoveGuest}
                    aria-label={t.loyaltyRemoveGuest}
                  >
                    <IconClose size={14} />
                  </button>
                </div>

                {selectedGuest.discount_percent > 0 && (
                  <div className="text-xs text-[var(--color-success)] font-medium">
                    {t.loyaltyDiscountApplied(selectedGuest.discount_percent)}
                  </div>
                )}

                {selectedGuest.bonus_balance > 0 && loyaltySettings.is_enabled && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-[var(--color-textMuted)]">
                      <span>{t.loyaltyBonusBalance}: {formatCurrency(selectedGuest.bonus_balance, locale)}</span>
                      {maxBonusRedemption > 0 && <span>{t.loyaltyMaxRedemption}: {formatCurrency(maxBonusRedemption, locale)}</span>}
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useBonus}
                        onChange={(e) => {
                          setUseBonus(e.target.checked)
                          if (!e.target.checked) setBonusAmount('')
                        }}
                        className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)]"
                      />
                      <span className="text-sm">{t.loyaltyUseBonus}</span>
                    </label>
                    {useBonus && (
                      <input
                        type="number"
                        inputMode="decimal"
                        value={bonusAmount}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value)
                          if (!isNaN(val) && val > maxBonusRedemption) {
                            setBonusAmount(String(maxBonusRedemption))
                          } else {
                            setBonusAmount(e.target.value)
                          }
                        }}
                        placeholder={`max ${formatCurrency(maxBonusRedemption, locale)}`}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--color-bgCard)] border border-[var(--color-border)] text-sm focus:border-[var(--color-primary)] focus:outline-none"
                        min="0"
                        max={maxBonusRedemption}
                        step="0.5"
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bowl Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">{t.selectBowlLabel}</label>
            <select
              value={selectedBowl}
              onChange={(e) => {
                setSelectedBowl(e.target.value)
                const bowl = bowls.find(b => b.id === e.target.value)
                if (bowl) setTotalGrams(bowl.capacity_grams.toString())
              }}
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
            >
              <option value="">{t.noBowlOption}</option>
              {bowls.map(bowl => (
                <option key={bowl.id} value={bowl.id}>
                  {bowl.name} ({bowl.capacity_grams}g)
                </option>
              ))}
            </select>
          </div>

          {/* Total Grams */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">{t.totalGrams}</label>
            <input
              type="number"
              inputMode="decimal"
              value={totalGrams}
              onChange={(e) => setTotalGrams(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
              min="1"
              max="100"
            />
          </div>

          {/* Selling Price */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">{t.sellingPrice} (€)</label>
            <input
              type="number"
              inputMode="decimal"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
              placeholder={t.sellingPricePlaceholder}
              min="0"
              step="0.5"
            />
            <div className="flex flex-wrap gap-1.5">
              {[10, 15, 20, 25, 30].map(price => (
                <button
                  key={price}
                  type="button"
                  onClick={() => setSellingPrice(String(price))}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    sellingPrice === String(price)
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {formatCurrency(price, locale)}
                </button>
              ))}
            </div>
          </div>

          {/* Deduct Inventory */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={deductInventory}
              onChange={(e) => setDeductInventory(e.target.checked)}
              className="w-5 h-5 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            />
            <span className="text-sm">{t.deductFromInventory}</span>
          </label>

          {/* Session Timer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium">{t.sessionTimerLabel}</label>
              <button
                type="button"
                onClick={() => setShowTimer(!showTimer)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: showTimer ? 'var(--color-primary)' : 'var(--color-bgHover)',
                  color: showTimer ? 'var(--color-bg)' : 'var(--color-textMuted)',
                }}
              >
                <IconTimer size={14} />
                {showTimer ? t.hideTimer : t.showTimer}
              </button>
            </div>
            {showTimer && (
              <SessionTimer
                onDurationChange={setDurationMinutes}
                notificationMinutes={45}
                autoStart={false}
              />
            )}
            {!showTimer && durationMinutes > 0 && (
              <div className="text-sm text-[var(--color-textMuted)]">
                {t.durationMinutes(durationMinutes)}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">{t.notesLabel}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none resize-none"
              placeholder={t.sessionNotePlaceholder}
              rows={2}
            />
          </div>
        </form>

        {/* Footer - fixed at bottom */}
        <div className="p-4 sm:p-6 border-t border-[var(--color-border)] flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
          >
            {tc.cancel}
          </button>
          <button type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || saving}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? tc.saving : t.saveSession}
          </button>
        </div>
      </div>
    </div>
  )
}
