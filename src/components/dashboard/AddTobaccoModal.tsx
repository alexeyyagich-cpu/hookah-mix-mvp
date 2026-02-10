'use client'

import { useState, useEffect } from 'react'
import { TOBACCOS } from '@/data/tobaccos'
import type { TobaccoInventory } from '@/types/database'

interface AddTobaccoModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (tobacco: Omit<TobaccoInventory, 'id' | 'profile_id' | 'created_at' | 'updated_at'>) => Promise<void>
  editingItem?: TobaccoInventory | null
  canAddMore: boolean
}

export function AddTobaccoModal({ isOpen, onClose, onSave, editingItem, canAddMore }: AddTobaccoModalProps) {
  const [selectedTobacco, setSelectedTobacco] = useState<string>('')
  const [brand, setBrand] = useState('')
  const [flavor, setFlavor] = useState('')
  const [quantity, setQuantity] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCatalog, setShowCatalog] = useState(true)

  const isEditing = !!editingItem

  useEffect(() => {
    if (editingItem) {
      setSelectedTobacco(editingItem.tobacco_id)
      setBrand(editingItem.brand)
      setFlavor(editingItem.flavor)
      setQuantity(editingItem.quantity_grams.toString())
      setPurchasePrice(editingItem.purchase_price?.toString() || '')
      setNotes(editingItem.notes || '')
      setShowCatalog(false)
    } else {
      resetForm()
    }
  }, [editingItem, isOpen])

  const resetForm = () => {
    setSelectedTobacco('')
    setBrand('')
    setFlavor('')
    setQuantity('')
    setPurchasePrice('')
    setNotes('')
    setSearchQuery('')
    setShowCatalog(true)
  }

  const filteredTobaccos = TOBACCOS.filter(t =>
    t.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.flavor.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

    await onSave({
      tobacco_id: selectedTobacco || `custom-${Date.now()}`,
      brand,
      flavor,
      quantity_grams: parseFloat(quantity) || 0,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
      purchase_date: null,
      expiry_date: null,
      notes: notes || null,
    })

    setSaving(false)
    onClose()
    resetForm()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-2xl max-h-[90vh] bg-[var(--color-bgCard)] rounded-2xl border border-[var(--color-border)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {isEditing ? 'Редактировать табак' : 'Добавить табак'}
          </h2>
          <button
            onClick={onClose}
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
              <h3 className="text-lg font-semibold mb-2">Достигнут лимит</h3>
              <p className="text-[var(--color-textMuted)] mb-4">
                Обновите подписку до Pro для добавления неограниченного количества табаков
              </p>
              <a href="/pricing" className="btn btn-primary">
                Обновить подписку
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Catalog Selection */}
              {showCatalog && !isEditing && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Выберите из каталога</label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Поиск по бренду или вкусу..."
                      className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredTobaccos.slice(0, 20).map((tobacco) => (
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
                        <div>
                          <div className="font-medium">{tobacco.flavor}</div>
                          <div className="text-xs text-[var(--color-textMuted)]">{tobacco.brand}</div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowCatalog(false)}
                      className="text-sm text-[var(--color-primary)] hover:underline"
                    >
                      Или добавить вручную →
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
                      ← Выбрать из каталога
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Бренд *</label>
                      <select
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                        required
                      >
                        <option value="">Выберите бренд</option>
                        {brands.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                        <option value="other">Другой...</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Вкус *</label>
                      <input
                        type="text"
                        value={flavor}
                        onChange={(e) => setFlavor(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                        placeholder="Название вкуса"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Количество (г) *</label>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                        placeholder="0"
                        min="0"
                        step="1"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Цена закупки</label>
                      <input
                        type="number"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                        placeholder="₽"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Заметки</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none resize-none"
                      placeholder="Дополнительная информация..."
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
              onClick={onClose}
              className="btn btn-ghost"
            >
              Отмена
            </button>
            <button
              onClick={handleSubmit}
              disabled={!brand || !flavor || !quantity || saving}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Сохранение...' : isEditing ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
