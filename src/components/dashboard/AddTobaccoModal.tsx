'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n'
import { TOBACCOS } from '@/data/tobaccos'
import type { TobaccoInventory } from '@/types/database'
import type { TobaccoBarcode } from '@/lib/data/tobaccoBarcodes'

interface AddTobaccoModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (tobacco: Omit<TobaccoInventory, 'id' | 'profile_id' | 'created_at' | 'updated_at'>) => Promise<void>
  editingItem?: TobaccoInventory | null
  canAddMore: boolean
  scannedTobacco?: TobaccoBarcode | null
}

export function AddTobaccoModal({ isOpen, onClose, onSave, editingItem, canAddMore, scannedTobacco }: AddTobaccoModalProps) {
  const t = useTranslation('hookah')
  const tc = useTranslation('common')
  const [selectedTobacco, setSelectedTobacco] = useState<string>('')
  const [brand, setBrand] = useState('')
  const [flavor, setFlavor] = useState('')
  const [packageCount, setPackageCount] = useState('1')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [packageGrams, setPackageGrams] = useState('100')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCatalog, setShowCatalog] = useState(true)
  const [brandFilter, setBrandFilter] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  const isEditing = !!editingItem

  useEffect(() => {
    if (isOpen) {
      setVisible(true)
      setIsClosing(false)
    }
  }, [isOpen])

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      setVisible(false)
      setIsClosing(false)
      onClose()
    }, 200)
  }, [onClose])

  // Escape key to close
  useEffect(() => {
    if (!visible) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [visible, handleClose])

  useEffect(() => {
    if (editingItem) {
      setSelectedTobacco(editingItem.tobacco_id)
      setBrand(editingItem.brand)
      setFlavor(editingItem.flavor)
      const pkgGrams = editingItem.package_grams || 100
      setPackageGrams(pkgGrams.toString())
      // Calculate package count from total grams
      const pkgCount = Math.round(editingItem.quantity_grams / pkgGrams * 10) / 10
      setPackageCount(pkgCount.toString())
      setPurchasePrice(editingItem.purchase_price?.toString() || '')
      setNotes(editingItem.notes || '')
      setShowCatalog(false)
    } else if (scannedTobacco) {
      // Pre-fill from barcode scan
      const catalogItem = TOBACCOS.find(
        t => t.brand.toLowerCase() === scannedTobacco.brand.toLowerCase() &&
             t.flavor.toLowerCase() === scannedTobacco.flavor.toLowerCase()
      )
      setSelectedTobacco(catalogItem?.id || `${scannedTobacco.brand}-${scannedTobacco.flavor}`)
      setBrand(scannedTobacco.brand)
      setFlavor(scannedTobacco.flavor)
      setPackageGrams(scannedTobacco.packageGrams.toString())
      setPackageCount('1')
      setPurchasePrice('')
      setNotes(t.addedByScanning)
      setShowCatalog(false)
    } else {
      resetForm()
    }
  }, [editingItem, scannedTobacco, isOpen])

  const resetForm = () => {
    setSelectedTobacco('')
    setBrand('')
    setFlavor('')
    setPackageCount('1')
    setPurchasePrice('')
    setPackageGrams('100')
    setNotes('')
    setSearchQuery('')
    setBrandFilter(null)
    setShowCatalog(true)
  }

  const filteredTobaccos = TOBACCOS.filter(t => {
    if (brandFilter && t.brand !== brandFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return t.brand.toLowerCase().includes(q) || t.flavor.toLowerCase().includes(q)
    }
    return true
  })

  const brands = Array.from(new Set(TOBACCOS.map(t => t.brand)))

  const handleSelectFromCatalog = (tobacco: typeof TOBACCOS[0]) => {
    setSelectedTobacco(tobacco.id)
    setBrand(tobacco.brand)
    setFlavor(tobacco.flavor)
    setShowCatalog(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const pkgGrams = parseFloat(packageGrams) || 100
    const totalGrams = (parseFloat(packageCount) || 0) * pkgGrams

    await onSave({
      tobacco_id: selectedTobacco || `custom-${Date.now()}`,
      brand,
      flavor,
      quantity_grams: totalGrams,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
      package_grams: pkgGrams,
      purchase_date: null,
      expiry_date: null,
      notes: notes || null,
    })

    setSaving(false)
    handleClose()
    resetForm()
  }

  if (!visible) return null

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm ${isClosing ? 'animate-backdropFadeOut' : ''}`}>
      <div className={`w-full max-w-2xl max-h-[90vh] bg-[var(--color-bgCard)] rounded-2xl border border-[var(--color-border)] overflow-hidden flex flex-col ${isClosing ? 'animate-fadeOutDown' : 'animate-scaleIn'}`}>
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {isEditing ? t.editTobaccoTitle : t.addTobaccoTitle}
          </h2>
          <button type="button"
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-[var(--color-bgHover)] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!canAddMore && !isEditing ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-lg font-semibold mb-2">{t.limitReachedTitle}</h3>
              <p className="text-[var(--color-textMuted)] mb-4">
                {t.upgradeForUnlimited}
              </p>
              <a href="/pricing" className="btn btn-primary">
                {t.upgradeSubscription}
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Catalog Selection */}
              {showCatalog && !isEditing && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t.selectFromCatalog}</label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.searchPlaceholder}
                      className="input"
                    />
                  </div>

                  {/* Brand filter pills */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBrandFilter(null)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        brandFilter === null
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
                      }`}
                    >
                      {t.allBrands}
                    </button>
                    {brands.map(b => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBrandFilter(prev => prev === b ? null : b)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          brandFilter === b
                            ? 'bg-[var(--color-primary)] text-white'
                            : 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>

                  {/* Tobacco list */}
                  <div className="max-h-60 overflow-y-auto space-y-1.5">
                    {filteredTobaccos.slice(0, brandFilter ? 50 : 30).map((tobacco) => (
                      <button
                        key={tobacco.id}
                        type="button"
                        onClick={() => handleSelectFromCatalog(tobacco)}
                        className="w-full p-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] hover:border-[var(--color-primary)] text-left flex items-center gap-3 transition-colors"
                      >
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tobacco.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{tobacco.flavor}</div>
                          {!brandFilter && <div className="text-xs text-[var(--color-textMuted)]">{tobacco.brand}</div>}
                        </div>
                      </button>
                    ))}
                    {filteredTobaccos.length === 0 && (
                      <div className="text-center py-4 text-sm text-[var(--color-textMuted)]">
                        {t.noResults}
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowCatalog(false)}
                      className="text-sm text-[var(--color-primary)] hover:underline"
                    >
                      {t.addManually}
                    </button>
                  </div>
                </div>
              )}

              {/* Manual Input */}
              {(!showCatalog || isEditing) && (
                <>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setShowCatalog(true)}
                      className="text-sm text-[var(--color-primary)] hover:underline mb-4"
                    >
                      {t.backToCatalog}
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">{t.brandRequired}</label>
                      <select
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="input"
                        required
                      >
                        <option value="">{t.selectBrandOption}</option>
                        {brands.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                        <option value="other">{t.otherBrand}</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium">{t.flavorRequired}</label>
                      <input
                        type="text"
                        value={flavor}
                        onChange={(e) => setFlavor(e.target.value)}
                        className="input"
                        placeholder={t.flavorPlaceholder}
                        required
                        maxLength={80}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">{t.packageSize}</label>
                      <select
                        value={packageGrams}
                        onChange={(e) => setPackageGrams(e.target.value)}
                        className="input"
                      >
                        <option value="25">25g</option>
                        <option value="100">100g</option>
                        <option value="200">200g</option>
                        <option value="250">250g</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium">{t.packageCount}</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={packageCount}
                        onChange={(e) => setPackageCount(e.target.value)}
                        className="input"
                        placeholder="1"
                        min="0.1"
                        step="0.5"
                        required
                      />
                      <p className="text-xs text-[var(--color-textMuted)]">
                        {t.totalGramsLabel(((parseFloat(packageCount) || 0) * (parseFloat(packageGrams) || 100)).toFixed(0))}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium">{t.purchasePricePerPackage}</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      className="input"
                      placeholder={t.purchasePricePlaceholder}
                      min="0"
                      step="0.01"
                    />
                    <p className="text-xs text-[var(--color-textMuted)]">
                      {t.purchasePriceHint(packageGrams)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium">{t.notesLabel}</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="input resize-none"
                      placeholder={t.notesPlaceholder}
                      rows={3}
                    />
                  </div>
                </>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        {(canAddMore || isEditing) && (!showCatalog || isEditing) && (
          <div className="p-6 border-t border-[var(--color-border)] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-ghost"
            >
              {tc.cancel}
            </button>
            <button type="button"
              onClick={handleSubmit}
              disabled={!brand || !flavor || !packageCount || saving}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? tc.saving : isEditing ? t.mixSaveButton : tc.add}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
