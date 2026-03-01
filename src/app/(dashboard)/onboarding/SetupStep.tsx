'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n'
import { useBowls } from '@/lib/hooks/useBowls'
import { useInventory } from '@/lib/hooks/useInventory'
import { TOBACCOS, getBrandNames, getFlavorsByBrand } from '@/data/tobaccos'
import { getBowlBrands, getBowlsByBrand } from '@/data/bowls'
import type { BusinessType } from '@/lib/hooks/useOnboarding'

interface SetupStepProps {
  selectedType: BusinessType | null
  onPrevStep: () => void
  onFinish: () => void
}

export function SetupStep({ selectedType, onPrevStep, onFinish }: SetupStepProps) {
  const t = useTranslation('hookah')
  const tc = useTranslation('common')
  const { addBowl } = useBowls()
  const { addTobacco } = useInventory()

  // Bowl step state
  const [bowlBrand, setBowlBrand] = useState('Oblako')
  const [bowlModel, setBowlModel] = useState('')
  const [bowlCapacity, setBowlCapacity] = useState('18')
  const [isCustomBowl, setIsCustomBowl] = useState(false)

  // Tobacco step state — multi-select
  const [tobaccoBrand, setTobaccoBrand] = useState('Darkside')
  const [selectedFlavors, setSelectedFlavors] = useState<Set<string>>(new Set())
  const [tobaccoQuantity, setTobaccoQuantity] = useState('100')
  const [addedCount, setAddedCount] = useState(0)

  // Setup tab for hookah_bar
  const [setupTab, setSetupTab] = useState<'hookah' | 'bar'>('hookah')

  const [saving, setSaving] = useState(false)

  const needsHookah = selectedType === 'hookah' || selectedType === 'hookah_bar'
  const needsBar = selectedType === 'bar' || selectedType === 'hookah_bar' || selectedType === 'restaurant'

  const handleBowlSave = async () => {
    if (!bowlModel) return
    setSaving(true)
    await addBowl({
      name: bowlModel,
      capacity_grams: parseInt(bowlCapacity) || 18,
      is_default: true,
    })
    setSaving(false)
  }

  const toggleFlavor = (flavor: string) => {
    setSelectedFlavors(prev => {
      const next = new Set(prev)
      if (next.has(flavor)) next.delete(flavor)
      else next.add(flavor)
      return next
    })
  }

  const toggleAllFlavors = () => {
    const brandFlavors = getFlavorsByBrand(tobaccoBrand)
    const allSelected = brandFlavors.every(f => selectedFlavors.has(f))
    setSelectedFlavors(prev => {
      const next = new Set(prev)
      if (allSelected) {
        brandFlavors.forEach(f => next.delete(f))
      } else {
        brandFlavors.forEach(f => next.add(f))
      }
      return next
    })
  }

  const handleBulkTobaccoSave = async () => {
    if (selectedFlavors.size === 0) return
    setSaving(true)
    const qty = parseInt(tobaccoQuantity) || 100
    let added = 0
    for (const flavor of selectedFlavors) {
      const catalogItem = TOBACCOS.find(t => t.flavor === flavor)
      if (!catalogItem) continue
      await addTobacco({
        tobacco_id: catalogItem.id,
        brand: catalogItem.brand,
        flavor: catalogItem.flavor,
        quantity_grams: qty,
        purchase_price: null,
        package_grams: null,
        purchase_date: null,
        expiry_date: null,
        notes: null,
      })
      added++
    }
    setAddedCount(prev => prev + added)
    setSelectedFlavors(new Set())
    setSaving(false)
  }

  return (
    <div className="space-y-4 text-left">
      {/* Tab switch for hookah_bar */}
      {needsHookah && needsBar && (
        <div className="flex gap-1 p-1 rounded-xl bg-[var(--color-bgHover)]">
          <button type="button"
            onClick={() => setSetupTab('hookah')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              setupTab === 'hookah'
                ? 'bg-[var(--color-bgCard)] text-[var(--color-text)] shadow-sm'
                : 'text-[var(--color-textMuted)]'
            }`}
          >
            🔥 {t.hookahTab}
          </button>
          <button type="button"
            onClick={() => setSetupTab('bar')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              setupTab === 'bar'
                ? 'bg-[var(--color-bgCard)] text-[var(--color-text)] shadow-sm'
                : 'text-[var(--color-textMuted)]'
            }`}
          >
            🍸 {t.barTab}
          </button>
        </div>
      )}

      {/* Hookah setup */}
      {((needsHookah && !needsBar) || (needsHookah && needsBar && setupTab === 'hookah')) && (
        <div className="space-y-4">
          {/* Bowl section */}
          <div className="p-3 rounded-xl bg-[var(--color-bgHover)]">
            <p className="text-sm font-medium mb-1">{t.addBowlPrompt}</p>
            <p className="text-xs text-[var(--color-textMuted)]">{t.addBowlPromptDesc}</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t.brand}</label>
            <select
              value={bowlBrand}
              onChange={(e) => { setBowlBrand(e.target.value); setBowlModel(''); setIsCustomBowl(false); }}
              className="input"
            >
              {getBowlBrands().map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t.modelLabel}</label>
            {isCustomBowl ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={bowlModel}
                  onChange={(e) => setBowlModel(e.target.value)}
                  placeholder={t.enterBowlName}
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={() => { setIsCustomBowl(false); setBowlModel(''); }}
                  className="px-3 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] text-sm text-[var(--color-textMuted)] hover:text-[var(--color-text)]"
                >
                  ✕
                </button>
              </div>
            ) : (
              <select
                value={bowlModel}
                onChange={(e) => {
                  if (e.target.value === '__custom__') { setIsCustomBowl(true); setBowlModel(''); }
                  else {
                    setBowlModel(e.target.value);
                    const preset = getBowlsByBrand(bowlBrand).find(b => b.name === e.target.value);
                    if (preset) setBowlCapacity(String(preset.capacity));
                  }
                }}
                className="input"
              >
                <option value="">{t.selectModel}</option>
                {getBowlsByBrand(bowlBrand).map(b => (
                  <option key={b.id} value={b.name}>{b.name} ({b.capacity}{tc.grams})</option>
                ))}
                <option value="__custom__">{t.otherOption}</option>
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t.capacityGramsLabel}</label>
            <input
              type="number"
              inputMode="numeric"
              value={bowlCapacity}
              onChange={(e) => setBowlCapacity(e.target.value)}
              min="5"
              max="50"
              step="1"
              className="input"
            />
          </div>

          {bowlModel && (
            <button type="button"
              onClick={handleBowlSave}
              disabled={saving}
              className="btn btn-ghost w-full text-[var(--color-primary)] disabled:opacity-50"
            >
              {saving ? tc.saving : `+ ${t.addBowl}`}
            </button>
          )}

          <hr className="border-[var(--color-border)]" />

          {/* Tobacco section — multi-select */}
          <div className="p-3 rounded-xl bg-[var(--color-bgHover)]">
            <p className="text-sm font-medium mb-1">{t.addTobaccoPrompt}</p>
            <p className="text-xs text-[var(--color-textMuted)]">{t.addTobaccoPromptDesc}</p>
          </div>

          {addedCount > 0 && (
            <div className="p-2 rounded-lg bg-[var(--color-success)]/10 text-[var(--color-success)] text-sm text-center">
              {t.tobaccosAdded(addedCount)}
            </div>
          )}

          {/* Brand tabs */}
          <div className="flex flex-wrap gap-1.5">
            {getBrandNames().map(b => (
              <button type="button"
                key={b}
                onClick={() => setTobaccoBrand(b)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  tobaccoBrand === b
                    ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                    : 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          {/* Select all / flavor count */}
          <div className="flex items-center justify-between">
            <button type="button"
              onClick={toggleAllFlavors}
              className="text-xs text-[var(--color-primary)] hover:underline"
            >
              {getFlavorsByBrand(tobaccoBrand).every(f => selectedFlavors.has(f))
                ? t.deselectAll
                : t.selectAll}
            </button>
            {selectedFlavors.size > 0 && (
              <span className="text-xs text-[var(--color-textMuted)]">
                {t.selectedCount(selectedFlavors.size)}
              </span>
            )}
          </div>

          {/* Flavor chip grid */}
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {getFlavorsByBrand(tobaccoBrand).map(flavor => {
              const isSelected = selectedFlavors.has(flavor)
              return (
                <button type="button"
                  key={flavor}
                  onClick={() => toggleFlavor(flavor)}
                  className={`px-3 py-2 rounded-xl text-sm transition-colors ${
                    isSelected
                      ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/50'
                      : 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {isSelected && <span className="mr-1">{'\u2713'}</span>}
                  {flavor}
                </button>
              )
            })}
          </div>

          {/* Quantity per item */}
          <div>
            <label className="block text-sm font-medium mb-2">{t.quantityPerItemLabel}</label>
            <input
              type="number"
              inputMode="numeric"
              value={tobaccoQuantity}
              onChange={(e) => setTobaccoQuantity(e.target.value)}
              min="1"
              step="1"
              className="input"
            />
          </div>

          {selectedFlavors.size > 0 && (
            <button type="button"
              onClick={handleBulkTobaccoSave}
              disabled={saving}
              className="btn btn-primary w-full disabled:opacity-50"
            >
              {saving ? tc.saving : t.addSelectedTobaccos(selectedFlavors.size)}
            </button>
          )}
        </div>
      )}

      {/* Bar setup */}
      {((needsBar && !needsHookah) || (needsBar && needsHookah && setupTab === 'bar')) && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-[var(--color-bgHover)]">
            <p className="text-sm font-medium mb-1">{t.barStockTitle}</p>
            <p className="text-xs text-[var(--color-textMuted)]">
              {t.barStockDesc}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[t.barStockVodka, t.barStockGin, t.barStockWhiteRum, t.barStockWhiskey, t.barStockTequila, t.barStockTonic].map(name => (
              <div
                key={name}
                className="p-3 rounded-xl bg-[var(--color-bgHover)] flex items-center gap-2"
              >
                <span className="text-sm">🍶</span>
                <span className="text-sm">{name}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-[var(--color-textMuted)] text-center">
            {t.barStockNote}
          </p>

          {selectedType === 'restaurant' && (
            <div className="p-3 rounded-xl bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20">
              <p className="text-sm text-[var(--color-warning)]">
                {t.kitchenSoon}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onPrevStep} className="btn btn-ghost flex-1">
          {tc.back}
        </button>
        <button type="button"
          onClick={onFinish}
          className="btn btn-primary flex-1"
        >
          {t.finish}
        </button>
      </div>
    </div>
  )
}
