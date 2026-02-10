'use client'

import { useState, useEffect } from 'react'
import type { TobaccoInventory, SupplierProduct, Supplier } from '@/types/database'
import { IconClose, IconRefresh, IconCheck } from '@/components/Icons'

interface AutoReorderModalProps {
  isOpen: boolean
  onClose: () => void
  tobacco: TobaccoInventory
  suppliers: Supplier[]
  products: SupplierProduct[]
  onSave: (data: {
    supplier_product_id: string
    threshold_grams: number
    reorder_quantity: number
  }) => Promise<boolean>
}

export function AutoReorderModal({
  isOpen,
  onClose,
  tobacco,
  suppliers,
  products,
  onSave,
}: AutoReorderModalProps) {
  const [selectedProductId, setSelectedProductId] = useState('')
  const [threshold, setThreshold] = useState(50)
  const [quantity, setQuantity] = useState(3)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Filter products that match the tobacco
  const matchingProducts = products.filter(p =>
    p.brand.toLowerCase() === tobacco.brand.toLowerCase() &&
    p.flavor.toLowerCase() === tobacco.flavor.toLowerCase() &&
    p.in_stock
  )

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedProductId(matchingProducts[0]?.id || '')
      setThreshold(50)
      setQuantity(3)
      setLoading(false)
      setSuccess(false)
    }
  }, [isOpen, matchingProducts])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose, loading])

  const handleSave = async () => {
    if (!selectedProductId) return

    setLoading(true)
    const result = await onSave({
      supplier_product_id: selectedProductId,
      threshold_grams: threshold,
      reorder_quantity: quantity,
    })
    setLoading(false)

    if (result) {
      setSuccess(true)
      setTimeout(onClose, 2000)
    }
  }

  const selectedProduct = products.find(p => p.id === selectedProductId)
  const selectedSupplier = selectedProduct
    ? suppliers.find(s => s.id === selectedProduct.supplier_id)
    : null

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => !loading && onClose()}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[var(--color-bgCard)] rounded-2xl shadow-xl animate-fadeInUp">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <IconRefresh size={20} className="text-[var(--color-primary)]" />
              Авто-заказ
            </h2>
            {!loading && !success && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--color-bgHover)] transition-colors"
              >
                <IconClose size={20} />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {success ? (
              <div className="py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center mx-auto mb-4">
                  <IconCheck size={32} className="text-[var(--color-success)]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Правило создано!</h3>
                <p className="text-[var(--color-textMuted)]">
                  Заказ будет автоматически создан при достижении порога
                </p>
              </div>
            ) : (
              <>
                {/* Tobacco info */}
                <div className="card p-4 bg-[var(--color-bgHover)]">
                  <div className="text-xs text-[var(--color-textMuted)]">{tobacco.brand}</div>
                  <div className="font-medium">{tobacco.flavor}</div>
                  <div className="text-sm text-[var(--color-textMuted)] mt-1">
                    Текущий остаток: {tobacco.quantity_grams.toFixed(0)}г
                  </div>
                </div>

                {/* Product selection */}
                {matchingProducts.length === 0 ? (
                  <div className="card p-4 border-[var(--color-warning)]/50 bg-[var(--color-warning)]/5 text-sm">
                    Не найдено товаров от поставщиков, соответствующих этому табаку.
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Товар для заказа
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="input w-full"
                    >
                      {matchingProducts.map(product => {
                        const supplier = suppliers.find(s => s.id === product.supplier_id)
                        return (
                          <option key={product.id} value={product.id}>
                            {supplier?.name} - {product.package_grams}г за {product.price}€
                          </option>
                        )
                      })}
                    </select>
                  </div>
                )}

                {/* Threshold */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Порог заказа (граммы)
                  </label>
                  <input
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(Math.max(0, parseInt(e.target.value) || 0))}
                    className="input w-full"
                    min="0"
                    step="10"
                  />
                  <p className="text-xs text-[var(--color-textMuted)] mt-1">
                    Заказ будет создан, когда остаток опустится ниже {threshold}г
                  </p>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Количество к заказу
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="input w-full"
                    min="1"
                  />
                  {selectedProduct && (
                    <p className="text-xs text-[var(--color-textMuted)] mt-1">
                      {quantity} × {selectedProduct.package_grams}г = {quantity * selectedProduct.package_grams}г
                      ({(quantity * selectedProduct.price).toFixed(2)}€)
                    </p>
                  )}
                </div>

                {/* Supplier info */}
                {selectedSupplier && (
                  <div className="text-sm text-[var(--color-textMuted)]">
                    Поставщик: {selectedSupplier.name}
                    <br />
                    Доставка: {selectedSupplier.delivery_days_min}-{selectedSupplier.delivery_days_max} дней
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {!success && (
            <div className="p-4 border-t border-[var(--color-border)] flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="btn btn-ghost flex-1"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={loading || matchingProducts.length === 0 || !selectedProductId}
                className="btn btn-primary flex-1"
              >
                {loading ? 'Сохраняем...' : 'Создать правило'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
