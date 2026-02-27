'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useMarketplaceOrders } from '@/lib/hooks/useMarketplaceOrders'
import { useInventory } from '@/lib/hooks/useInventory'
import { OrderTimeline } from '@/components/marketplace/OrderTimeline'
import { DeliveryModal } from '@/components/marketplace/DeliveryModal'
import {
  IconChevronLeft,
  IconPackage,
  IconTruck,
  IconCheck,
  IconClose,
} from '@/components/Icons'
import { useTranslation, useLocale, formatCurrency, formatDate, formatDateTime } from '@/lib/i18n'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { MarketplaceOrderWithItems, OrderStatus } from '@/types/database'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function OrderDetailPage() {
  const t = useTranslation('market')
  const tc = useTranslation('common')
  const { locale } = useLocale()
  const params = useParams()
  const orderId = params.id as string

  const STATUS_ACTIONS: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
    pending: { next: 'confirmed', label: t.confirmOrderAction },
    confirmed: { next: 'shipped', label: t.markShipped },
    shipped: { next: 'delivered', label: t.confirmDelivery },
  }

  const { orders, loading, error, updateOrderStatus, getOrder } = useMarketplaceOrders()
  const { addTobacco, adjustQuantity, inventory } = useInventory()

  const [order, setOrder] = useState<MarketplaceOrderWithItems | null>(null)
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!loading) {
      const o = getOrder(orderId)
      setOrder(o || null)
    }
  }, [loading, orderId, getOrder, orders])

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order) return

    // For delivery, open modal
    if (newStatus === 'delivered') {
      setDeliveryModalOpen(true)
      return
    }

    setUpdating(true)
    try {
      await updateOrderStatus(order.id, newStatus)
    } finally {
      setUpdating(false)
    }
  }

  const handleConfirmDelivery = async (): Promise<boolean> => {
    if (!order) return false
    return await updateOrderStatus(order.id, 'delivered')
  }

  const handleAddToInventory = async (items: {
    tobacco_id: string
    brand: string
    flavor: string
    quantity: number
    package_grams: number
  }[]): Promise<boolean> => {
    try {
      for (const item of items) {
        const totalGrams = item.quantity * item.package_grams

        // Check if tobacco already exists in inventory
        const existingItem = inventory.find(inv =>
          inv.brand.toLowerCase() === item.brand.toLowerCase() &&
          inv.flavor.toLowerCase() === item.flavor.toLowerCase()
        )

        if (existingItem) {
          // Add to existing
          await adjustQuantity(existingItem.id, totalGrams, 'purchase', t.supplyNote(order?.order_number || ''))
        } else {
          // Create new inventory item
          await addTobacco({
            tobacco_id: item.tobacco_id,
            brand: item.brand,
            flavor: item.flavor,
            quantity_grams: totalGrams,
            purchase_price: null,
            package_grams: item.package_grams,
            purchase_date: new Date().toISOString().slice(0, 10),
            expiry_date: null,
            notes: t.addedFromOrder(order?.order_number || ''),
          })
        }
      }
      return true
    } catch {
      return false
    }
  }

  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const handleCancelOrder = () => {
    if (!order) return
    setShowCancelConfirm(true)
  }

  const confirmCancelOrder = async () => {
    setShowCancelConfirm(false)
    if (!order) return
    setUpdating(true)
    try {
      await updateOrderStatus(order.id, 'cancelled')
    } finally {
      setUpdating(false)
    }
  }

  const fmtDateTime = (dateStr: string) => formatDateTime(dateStr, locale)

  if (loading) {
    return (
      <ErrorBoundary sectionName="Order Items">
      <div className="space-y-6">
        <div className="h-6 bg-[var(--color-bgHover)] rounded w-32 animate-pulse" />
        <div className="card p-6 animate-pulse">
          <div className="h-8 bg-[var(--color-bgHover)] rounded w-1/3 mb-4" />
          <div className="h-4 bg-[var(--color-bgHover)] rounded w-1/4" />
        </div>
      </div>
      </ErrorBoundary>
    )
  }

  if (!order) {
    return (
      <ErrorBoundary sectionName="Order Status">
      <div className="space-y-6">
        <Link
          href="/marketplace/orders"
          className="inline-flex items-center gap-2 text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors"
        >
          <IconChevronLeft size={20} />
          {t.backToOrders}
        </Link>

        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">{t.orderNotFound}</h2>
          <p className="text-[var(--color-textMuted)]">
            {t.orderMaybeDeleted}
          </p>
        </div>
      </div>
      </ErrorBoundary>
    )
  }

  const statusAction = STATUS_ACTIONS[order.status]

  return (
    <ErrorBoundary sectionName="Order Detail">
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/marketplace/orders"
        className="inline-flex items-center gap-2 text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors"
      >
        <IconChevronLeft size={20} />
        {t.backToOrders}
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <IconPackage size={28} className="text-[var(--color-primary)]" />
            <h1 className="text-2xl font-bold">#{order.order_number}</h1>
            {order.is_auto_order && (
              <span className="badge badge-info">{t.autoOrder}</span>
            )}
          </div>
          <p className="text-[var(--color-textMuted)] mt-1">
            {fmtDateTime(order.created_at)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {order.status !== 'cancelled' && order.status !== 'delivered' && (
            <>
              <button type="button"
                onClick={handleCancelOrder}
                disabled={updating}
                className="btn btn-ghost text-[var(--color-danger)]"
              >
                <IconClose size={18} />
                {t.cancelOrder}
              </button>
              {statusAction && (
                <button type="button"
                  onClick={() => handleStatusUpdate(statusAction.next)}
                  disabled={updating}
                  className="btn btn-primary"
                >
                  {updating ? t.updating : statusAction.label}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline */}
          <OrderTimeline
            status={order.status}
            createdAt={order.created_at}
            estimatedDeliveryDate={order.estimated_delivery_date}
            actualDeliveryDate={order.actual_delivery_date}
          />

          {/* Order items */}
          <div className="card p-6">
            <h2 className="font-semibold text-lg mb-4">{t.orderComposition}</h2>
            <div className="space-y-4">
              {order.order_items.map(item => (
                <div key={item.id} className="flex justify-between items-center pb-4 border-b border-[var(--color-border)] last:border-0 last:pb-0">
                  <div>
                    <div className="text-xs text-[var(--color-textMuted)] uppercase tracking-wider">
                      {item.brand}
                    </div>
                    <div className="font-medium">{item.flavor}</div>
                    <div className="text-sm text-[var(--color-textMuted)]">
                      {t.packageInfo(item.quantity, item.package_grams, item.unit_price)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(item.total_price, locale)}</div>
                    <div className="text-sm text-[var(--color-textMuted)]">
                      {t.totalGrams(item.quantity * item.package_grams)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="card p-6">
              <h2 className="font-semibold text-lg mb-2">{t.noteLabel}</h2>
              <p className="text-[var(--color-textMuted)]">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Supplier */}
          <div className="card p-4">
            <h3 className="text-sm text-[var(--color-textMuted)] mb-2">{t.supplierLabel}</h3>
            <div className="font-medium">{order.supplier.name}</div>
            {order.supplier.contact_email && (
              <a
                href={`mailto:${order.supplier.contact_email}`}
                className="text-sm text-[var(--color-primary)] hover:underline"
              >
                {order.supplier.contact_email}
              </a>
            )}
            {order.supplier.contact_phone && (
              <div className="text-sm text-[var(--color-textMuted)]">
                {order.supplier.contact_phone}
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="card p-4 space-y-2">
            <h3 className="text-sm text-[var(--color-textMuted)] mb-2">{t.orderSumLabel}</h3>
            <div className="flex justify-between text-sm">
              <span>{t.subtotalLabel}</span>
              <span>{formatCurrency(order.subtotal, locale)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>{t.shippingLabel}</span>
              <span>{order.shipping_cost > 0 ? formatCurrency(order.shipping_cost, locale) : t.freeShipping}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t border-[var(--color-border)]">
              <span>{t.totalLabel}</span>
              <span>{formatCurrency(order.total, locale)}</span>
            </div>
          </div>

          {/* Delivery info */}
          {order.estimated_delivery_date && order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div className="card p-4">
              <div className="flex items-center gap-2 text-sm">
                <IconTruck size={18} className="text-[var(--color-primary)]" />
                <span>{t.expectedDelivery}</span>
              </div>
              <div className="font-medium mt-1">
                {formatDate(order.estimated_delivery_date, locale, 'long')}
              </div>
            </div>
          )}

          {order.actual_delivery_date && (
            <div className="card p-4 bg-[var(--color-success)]/10 border-[var(--color-success)]/30">
              <div className="flex items-center gap-2 text-sm text-[var(--color-success)]">
                <IconCheck size={18} />
                <span>{t.deliveredLabel}</span>
              </div>
              <div className="font-medium mt-1">
                {formatDate(order.actual_delivery_date, locale, 'long')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card p-4 border-[var(--color-danger)]/50 bg-[var(--color-danger)]/5">
          <p className="text-[var(--color-danger)]">{error}</p>
        </div>
      )}

      {/* Delivery Modal */}
      <DeliveryModal
        isOpen={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        order={order}
        onConfirmDelivery={handleConfirmDelivery}
        onAddToInventory={handleAddToInventory}
      />
      <ConfirmDialog
        open={showCancelConfirm}
        title={t.cancelConfirmMsg}
        message={t.cancelConfirmMsg}
        confirmLabel={tc.confirm}
        cancelLabel={tc.cancel}
        danger
        onConfirm={confirmCancelOrder}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </div>
    </ErrorBoundary>
  )
}
