'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { LoyaltySettings } from '@/types/database'
import { useTranslation } from '@/lib/i18n'
import { IconClose } from '@/components/Icons'

interface LoyaltySettingsPanelProps {
  settings: LoyaltySettings
  onUpdate: (updates: Partial<LoyaltySettings>) => Promise<boolean>
  onClose: () => void
}

export function LoyaltySettingsPanel({ settings, onUpdate, onClose }: LoyaltySettingsPanelProps) {
  const tm = useTranslation('manage')
  const tc = useTranslation('common')
  const [accrualPercent, setAccrualPercent] = useState(settings.bonus_accrual_percent.toString())
  const [maxRedemption, setMaxRedemption] = useState(settings.bonus_max_redemption_percent.toString())
  const [silverThreshold, setSilverThreshold] = useState(settings.tier_silver_threshold.toString())
  const [goldThreshold, setGoldThreshold] = useState(settings.tier_gold_threshold.toString())
  const [silverDiscount, setSilverDiscount] = useState(settings.tier_silver_discount.toString())
  const [goldDiscount, setGoldDiscount] = useState(settings.tier_gold_discount.toString())
  const [isEnabled, setIsEnabled] = useState(settings.is_enabled)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onUpdate({
        bonus_accrual_percent: parseFloat(accrualPercent) || 0,
        bonus_max_redemption_percent: parseFloat(maxRedemption) || 0,
        tier_silver_threshold: parseFloat(silverThreshold) || 0,
        tier_gold_threshold: parseFloat(goldThreshold) || 0,
        tier_silver_discount: parseFloat(silverDiscount) || 0,
        tier_gold_discount: parseFloat(goldDiscount) || 0,
        is_enabled: isEnabled,
      })
      onClose()
    } catch (err) {
      console.error('Loyalty settings save failed:', err)
      toast.error(tc.errorSaving)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{tm.loyaltySettings}</h3>
        <button type="button" onClick={onClose} className="btn btn-ghost p-2" aria-label={tc.close}>
          <IconClose size={18} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Enable toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={e => setIsEnabled(e.target.checked)}
            className="w-5 h-5 accent-[var(--color-primary)]"
          />
          <span className="font-medium">{tm.loyaltyEnabled}</span>
        </label>

        {/* Bonus */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">{tm.bonusAccrualPercent}</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                inputMode="decimal"
                value={accrualPercent}
                onChange={e => setAccrualPercent(e.target.value)}
                className="input w-24"
                min="0"
                max="50"
                step="0.5"
              />
              <span className="text-sm text-[var(--color-textMuted)]">%</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">{tm.maxRedemptionPercent}</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                inputMode="decimal"
                value={maxRedemption}
                onChange={e => setMaxRedemption(e.target.value)}
                className="input w-24"
                min="0"
                max="100"
                step="5"
              />
              <span className="text-sm text-[var(--color-textMuted)]">%</span>
            </div>
          </div>
        </div>

        {/* Tiers */}
        <div>
          <h4 className="font-medium mb-2">{tm.tierThresholds}</h4>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[var(--color-textMuted)]">{tm.tierSilver}</label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm">€</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={silverThreshold}
                  onChange={e => setSilverThreshold(e.target.value)}
                  className="input w-28"
                  min="0"
                />
                <span className="text-sm text-[var(--color-textMuted)]">→ {silverDiscount}%</span>
              </div>
              <input
                type="number"
                inputMode="decimal"
                value={silverDiscount}
                onChange={e => setSilverDiscount(e.target.value)}
                className="input w-20 mt-1"
                min="0"
                max="50"
                step="1"
                placeholder="%"
              />
            </div>
            <div>
              <label className="text-sm text-[var(--color-textMuted)]">{tm.tierGold}</label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm">€</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={goldThreshold}
                  onChange={e => setGoldThreshold(e.target.value)}
                  className="input w-28"
                  min="0"
                />
                <span className="text-sm text-[var(--color-textMuted)]">→ {goldDiscount}%</span>
              </div>
              <input
                type="number"
                inputMode="decimal"
                value={goldDiscount}
                onChange={e => setGoldDiscount(e.target.value)}
                className="input w-20 mt-1"
                min="0"
                max="50"
                step="1"
                placeholder="%"
              />
            </div>
          </div>
        </div>

        <button type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary w-full"
        >
          {saving ? tm.saving : tm.save}
        </button>
      </div>
    </div>
  )
}
