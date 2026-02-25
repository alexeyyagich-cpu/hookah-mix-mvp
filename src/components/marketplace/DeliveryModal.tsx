'use client'

import { useState, useEffect } from 'react'
import type { MarketplaceOrderWithItems } from '@/types/database'
import { IconClose, IconCheck, IconInventory } from '@/components/Icons'
import { useTranslation } from '@/lib/i18n'

interface DeliveryModalProps {
  isOpen: boolean
  onClose: () => void
  order: MarketplaceOrderWithItems
  onConfirmDelivery: () => Promise<boolean>
  onAddToInventory?: (items: { tobacco_id: string; brand: string; flavor: string; quantity: number; package_grams: number }[]) => Promise<boolean>
}

export function DeliveryModal({
  isOpen,
  onClose,
  order,
  onConfirmDelivery,
  onAddToInventory,
}: DeliveryModalProps) {
  const t = useTranslation('market')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'confirm' | 'inventory' | 'success'>('confirm')

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedItems(new Set(order.order_items.map(item => item.id)))
      setLoading(false)
      setStep('confirm')
    }
  }, [isOpen, order.order_items])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose, loading])

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const handleConfirmDelivery = async () => {
    setLoading(true)
    const result = await onConfirmDelivery()
    setLoading(false)

    if (result) {
      if (onAddToInventory && selectedItems.size > 0) {
        setStep('inventory')
      } else {
        setStep('success')
        setTimeout(onClose, 2000)
      }
    }
  }

  const handleAddToInventory = async () => {
    if (!onAddToInventory) return

    setLoading(true)

    const itemsToAdd = order.order_items
      .filter(item => selectedItems.has(item.id))
      .map(item => ({
        tobacco_id: item.tobacco_id,
        brand: item.brand,
        flavor: item.flavor,
        quantity: item.quantity,
        package_grams: item.package_grams,
      }))

    await onAddToInventory(itemsToAdd)
    setLoading(false)
    setStep('success')
    setTimeout(onClose, 2000)
  }

  const handleSkipInventory = () => {
    setStep('success')
    setTimeout(onClose, 2000)
  }

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
            <h2 className="font-semibold text-lg">
              {step === 'confirm' && t.confirmDeliveryTitle}
              {step === 'inventory' && t.addToInventory}
              {step === 'success' && t.doneLabel}
            </h2>
            {!loading && step !== 'success' && (
              <button type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--color-bgHover)] transition-colors"
                aria-label="Close"
              >
                <IconClose size={20} />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {step === 'success' ? (
              <div className="py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center mx-auto mb-4">
                  <IconCheck size={32} className="text-[var(--color-success)]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t.deliveryConfirmed}</h3>
                <p className="text-[var(--color-textMuted)]">
                  {t.orderStatusUpdated}
                </p>
              </div>
            ) : step === 'confirm' ? (
              <>
                <p className="text-[var(--color-textMuted)]">
                  {t.confirmReceivedOrder(order.order_number)}
                </p>

                {/* Order items */}
                <div className="space-y-2">
                  {order.order_items.map(item => (
                    <div key={item.id} className="card p-3 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-[var(--color-textMuted)]">{item.brand}</div>
                        <div className="font-medium">{item.flavor}</div>
                        <div className="text-sm text-[var(--color-textMuted)]">
                          {item.quantity} × {item.package_grams}g
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => toggleItem(item.id)}
                          className="w-5 h-5 rounded border-[var(--color-border)]"
                        />
                      </label>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-[var(--color-textMuted)]">
                  {t.markReceivedItems}
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--color-primary)]/10">
                  <IconInventory size={24} className="text-[var(--color-primary)]" />
                  <div>
                    <div className="font-medium">{t.addItemsToInventory}</div>
                    <div className="text-sm text-[var(--color-textMuted)]">
                      {t.itemsWillBeAdded(selectedItems.size)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {order.order_items
                    .filter(item => selectedItems.has(item.id))
                    .map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.brand} {item.flavor}</span>
                        <span className="text-[var(--color-textMuted)]">
                          +{item.quantity * item.package_grams}g
                        </span>
                      </div>
                    ))
                  }
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {step !== 'success' && (
            <div className="p-4 border-t border-[var(--color-border)] flex gap-3">
              {step === 'confirm' ? (
                <>
                  <button type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="btn btn-ghost flex-1"
                  >
                    {t.cancelBtn}
                  </button>
                  <button type="button"
                    onClick={handleConfirmDelivery}
                    disabled={loading}
                    className="btn btn-primary flex-1"
                  >
                    {loading ? t.confirming : t.confirmDeliveryBtn}
                  </button>
                </>
              ) : (
                <>
                  <button type="button"
                    onClick={handleSkipInventory}
                    disabled={loading}
                    className="btn btn-ghost flex-1"
                  >
                    {t.skip}
                  </button>
                  <button type="button"
                    onClick={handleAddToInventory}
                    disabled={loading}
                    className="btn btn-primary flex-1"
                  >
                    {loading ? t.adding : t.addToInventoryBtn}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
