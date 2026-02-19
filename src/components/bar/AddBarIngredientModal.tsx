'use client'

import { useState, useEffect } from 'react'
import { useTranslation, useLocale, getLocaleName } from '@/lib/i18n'
import type { BarInventoryItem, BarIngredientCategory, BarUnitType } from '@/types/database'
import { BAR_INGREDIENT_PRESETS, BAR_CATEGORY_EMOJI } from '@/data/bar-ingredients'

interface AddBarIngredientModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (item: Omit<BarInventoryItem, 'id' | 'profile_id' | 'created_at' | 'updated_at'>) => Promise<void>
  editingItem?: BarInventoryItem | null
  canAddMore: boolean
}

const CATEGORIES: BarIngredientCategory[] = [
  'spirit', 'liqueur', 'wine', 'beer', 'mixer', 'syrup', 'juice', 'bitter', 'garnish', 'ice', 'other',
]

export function AddBarIngredientModal({ isOpen, onClose, onSave, editingItem, canAddMore }: AddBarIngredientModalProps) {
  const t = useTranslation('bar')
  const { locale } = useLocale()
  const CATEGORY_LABELS: Record<string, string> = {
    spirit: t.catSpirit, liqueur: t.catLiqueur, wine: t.catWine,
    beer: t.catBeer, mixer: t.catMixer, syrup: t.catSyrup,
    juice: t.catJuice, bitter: t.catBitter, garnish: t.catGarnish,
    ice: t.catIce, other: t.catOther,
  }
  const UNIT_LABELS: Record<string, string> = {
    ml: t.unitMl, g: t.unitG, pcs: t.unitPcs,
  }
  const [mode, setMode] = useState<'catalog' | 'custom'>('catalog')
  const [catalogFilter, setCatalogFilter] = useState('')
  const [catalogCategory, setCatalogCategory] = useState<BarIngredientCategory | 'all'>('all')

  // Form state
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState<BarIngredientCategory>('spirit')
  const [unitType, setUnitType] = useState<BarUnitType>('ml')
  const [quantity, setQuantity] = useState('')
  const [minQuantity, setMinQuantity] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [packageSize, setPackageSize] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Reset form when modal opens/closes or editing item changes
  useEffect(() => {
    if (editingItem) {
      setMode('custom')
      setName(editingItem.name)
      setBrand(editingItem.brand || '')
      setCategory(editingItem.category)
      setUnitType(editingItem.unit_type)
      setQuantity(editingItem.quantity.toString())
      setMinQuantity(editingItem.min_quantity.toString())
      setPurchasePrice(editingItem.purchase_price?.toString() || '')
      setPackageSize(editingItem.package_size.toString())
      setNotes(editingItem.notes || '')
    } else {
      setMode('catalog')
      setName('')
      setBrand('')
      setCategory('spirit')
      setUnitType('ml')
      setQuantity('')
      setMinQuantity('')
      setPurchasePrice('')
      setPackageSize('')
      setNotes('')
      setCatalogFilter('')
      setCatalogCategory('all')
    }
  }, [editingItem, isOpen])

  const selectFromCatalog = (preset: typeof BAR_INGREDIENT_PRESETS[0]) => {
    setMode('custom')
    setName(getLocaleName(preset, locale))
    setBrand(preset.brand)
    setCategory(preset.category)
    setUnitType(preset.defaultUnit)
    setPackageSize(preset.defaultPackageSize.toString())
  }

  const filteredPresets = BAR_INGREDIENT_PRESETS.filter(p => {
    if (catalogCategory !== 'all' && p.category !== catalogCategory) return false
    if (catalogFilter) {
      const q = catalogFilter.toLowerCase()
      if (!p.name.toLowerCase().includes(q) && !p.name_en.toLowerCase().includes(q)) return false
    }
    return true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)
    await onSave({
      name: name.trim(),
      brand: brand.trim() || null,
      category,
      unit_type: unitType,
      quantity: parseFloat(quantity) || 0,
      min_quantity: parseFloat(minQuantity) || 0,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
      package_size: parseFloat(packageSize) || 1000,
      supplier_name: null,
      barcode: null,
      notes: notes.trim() || null,
    })
    setSaving(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--color-bgCard)] border border-[var(--color-border)] shadow-xl">
        <div className="sticky top-0 z-10 bg-[var(--color-bgCard)] px-6 pt-6 pb-4 border-b border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {editingItem ? t.editLabel : t.addIngredientLabel}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--color-bgHover)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mode tabs */}
          {!editingItem && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setMode('catalog')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'catalog'
                    ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                    : 'text-[var(--color-textMuted)] hover:bg-[var(--color-bgHover)]'
                }`}
              >
                {t.fromCatalogTab}
              </button>
              <button
                onClick={() => setMode('custom')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'custom'
                    ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                    : 'text-[var(--color-textMuted)] hover:bg-[var(--color-bgHover)]'
                }`}
              >
                {t.customIngredient}
              </button>
            </div>
          )}
        </div>

        <div className="p-6">
          {mode === 'catalog' && !editingItem ? (
            <div className="space-y-4">
              <input
                type="text"
                value={catalogFilter}
                onChange={e => setCatalogFilter(e.target.value)}
                placeholder={t.searchIngredientPlaceholder}
                className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
              />

              {/* Category filter */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setCatalogCategory('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    catalogCategory === 'all'
                      ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                      : 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)]'
                  }`}
                >
                  {t.all}
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCatalogCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      catalogCategory === cat
                        ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                        : 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)]'
                    }`}
                  >
                    {BAR_CATEGORY_EMOJI[cat]} {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>

              {/* Preset list */}
              <div className="space-y-1 max-h-[40vh] overflow-y-auto">
                {filteredPresets.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => selectFromCatalog(preset)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-bgHover)] transition-colors text-left"
                  >
                    <span className="text-lg">{BAR_CATEGORY_EMOJI[preset.category]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{getLocaleName(preset, locale)}</div>
                      <div className="text-xs text-[var(--color-textMuted)]">
                        {CATEGORY_LABELS[preset.category]} · {preset.defaultPackageSize}{UNIT_LABELS[preset.defaultUnit]}
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-[var(--color-textMuted)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
                {filteredPresets.length === 0 && (
                  <p className="text-sm text-[var(--color-textMuted)] text-center py-4">
                    {t.nothingFound}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">{t.nameRequiredLabel}</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                  placeholder={t.namePlaceholderVodka}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t.brandLabel}</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                    placeholder="Absolut"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t.categoryLabel}</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as BarIngredientCategory)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {BAR_CATEGORY_EMOJI[cat]} {CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t.unitLabelField}</label>
                  <select
                    value={unitType}
                    onChange={e => setUnitType(e.target.value as BarUnitType)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                  >
                    <option value="ml">{t.mlUnit}</option>
                    <option value="g">{t.gUnit}</option>
                    <option value="pcs">{t.pcsUnitShort}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t.stockLeft}</label>
                  <input
                    type="number"
                    step="any"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t.minStock}</label>
                  <input
                    type="number"
                    step="any"
                    value={minQuantity}
                    onChange={e => setMinQuantity(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t.purchasePriceEur}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={purchasePrice}
                    onChange={e => setPurchasePrice(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t.packageVolume(UNIT_LABELS[unitType])}</label>
                  <input
                    type="number"
                    step="any"
                    value={packageSize}
                    onChange={e => setPackageSize(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                    placeholder="700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">{t.notesLabel}</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                  placeholder={t.notesPlaceholder}
                />
              </div>

              <div className="flex gap-3 pt-2">
                {!editingItem && (
                  <button
                    type="button"
                    onClick={() => setMode('catalog')}
                    className="btn btn-ghost"
                  >
                    {t.back}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving || !name.trim() || (!editingItem && !canAddMore)}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  {saving ? t.saving : editingItem ? t.save : t.addBtnFinal}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
