'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n'
import { TOBACCOS } from '@/data/tobaccos'
import { useBowls } from '@/lib/hooks/useBowls'
import { useInventory } from '@/lib/hooks/useInventory'
import { IconSmoke, IconTimer } from '@/components/Icons'
import { SessionTimer } from '@/components/session/SessionTimer'
import type { Session, SessionItem, TobaccoInventory } from '@/types/database'

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
  const { bowls, defaultBowl } = useBowls()
  const { inventory } = useInventory()
  const [selectedBowl, setSelectedBowl] = useState<string>('')
  const [totalGrams, setTotalGrams] = useState<string>('20')
  const [notes, setNotes] = useState('')
  const [deductInventory, setDeductInventory] = useState(true)
  const [mixItems, setMixItems] = useState<MixItem[]>([])
  const [saving, setSaving] = useState(false)
  const [compatibilityScore, setCompatibilityScore] = useState<number | null>(null)
  const [durationMinutes, setDurationMinutes] = useState<number>(0)
  const [showTimer, setShowTimer] = useState(false)

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
      bowl_type_id: selectedBowl || null,
      session_date: new Date().toISOString(),
      total_grams: total,
      compatibility_score: compatibilityScore,
      notes: notes || null,
      rating: null,
      duration_minutes: durationMinutes > 0 ? durationMinutes : null,
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
          <button
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
              value={totalGrams}
              onChange={(e) => setTotalGrams(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
              min="1"
              max="100"
            />
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
          <button
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
