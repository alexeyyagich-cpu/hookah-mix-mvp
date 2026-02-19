'use client'

import Link from 'next/link'
import type { MarketplaceOrderWithItems, OrderStatus } from '@/types/database'
import { IconPackage, IconTruck, IconCheck, IconClose, IconChevronRight } from '@/components/Icons'
import { useTranslation } from '@/lib/i18n'

interface OrderCardProps {
  order: MarketplaceOrderWithItems
}

const STATUS_STYLE: Record<OrderStatus, { colorClass: string; bgClass: string; Icon: typeof IconPackage }> = {
  pending: { colorClass: 'text-[var(--color-warning)]', bgClass: 'bg-[var(--color-warning)]/10', Icon: IconPackage },
  confirmed: { colorClass: 'text-[var(--color-primary)]', bgClass: 'bg-[var(--color-primary)]/10', Icon: IconPackage },
  shipped: { colorClass: 'text-[var(--color-primary)]', bgClass: 'bg-[var(--color-primary)]/10', Icon: IconTruck },
  delivered: { colorClass: 'text-[var(--color-success)]', bgClass: 'bg-[var(--color-success)]/10', Icon: IconCheck },
  cancelled: { colorClass: 'text-[var(--color-danger)]', bgClass: 'bg-[var(--color-danger)]/10', Icon: IconClose },
}

export function OrderCard({ order }: OrderCardProps) {
  const t = useTranslation('market')

  const STATUS_LABELS: Record<OrderStatus, string> = {
    pending: t.statusPendingCard,
    confirmed: t.statusConfirmedCard,
    shipped: t.statusShippedCard,
    delivered: t.statusDeliveredCard,
    cancelled: t.statusCancelledCard,
  }

  const status = STATUS_STYLE[order.status]
  const statusLabel = STATUS_LABELS[order.status]
  const StatusIcon = status.Icon

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const itemsSummary = order.order_items.slice(0, 3).map(item =>
    `${item.brand} ${item.flavor}`
  ).join(', ')
  const moreItems = order.order_items.length > 3
    ? ` +${order.order_items.length - 3}`
    : ''

  return (
    <Link
      href={`/marketplace/orders/${order.id}`}
      className="card p-4 hover:border-[var(--color-primary)]/50 transition-all group"
    >
      <div className="flex items-center justify-between">
        {/* Order info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${status.bgClass}`}
            >
              <StatusIcon size={20} className={status.colorClass} />
            </div>
            <div>
              <div className="font-medium">#{order.order_number}</div>
              <div className="text-sm text-[var(--color-textMuted)]">
                {formatDate(order.created_at)}
              </div>
            </div>
          </div>

          {/* Supplier */}
          <div className="mt-3 text-sm text-[var(--color-textMuted)]">
            {order.supplier.name}
          </div>

          {/* Items preview */}
          <div className="mt-1 text-sm truncate">
            {itemsSummary}{moreItems}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="font-semibold">{order.total.toFixed(2)}€</div>
            <div className={`text-xs font-medium ${status.colorClass}`}>
              {statusLabel}
            </div>
          </div>
          <IconChevronRight
            size={20}
            className="text-[var(--color-textMuted)] group-hover:text-[var(--color-primary)] transition-colors"
          />
        </div>
      </div>

      {/* Delivery info */}
      {order.status === 'shipped' && order.estimated_delivery_date && (
        <div className="mt-3 pt-3 border-t border-[var(--color-border)] text-sm">
          <span className="text-[var(--color-textMuted)]">{t.expectedDeliveryColon}</span>
          <span className="ml-2 font-medium">{formatDate(order.estimated_delivery_date)}</span>
        </div>
      )}

      {order.is_auto_order && (
        <div className="mt-2">
          <span className="badge badge-info text-xs">{t.autoOrder}</span>
        </div>
      )}
    </Link>
  )
}
