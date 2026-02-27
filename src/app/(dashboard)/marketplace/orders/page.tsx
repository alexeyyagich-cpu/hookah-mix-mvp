'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMarketplaceOrders } from '@/lib/hooks/useMarketplaceOrders'
import { OrderCard } from '@/components/marketplace/OrderCard'
import { IconChevronLeft, IconPackage, IconShop } from '@/components/Icons'
import { EmptyState } from '@/components/ui/EmptyState'
import { useTranslation } from '@/lib/i18n'
import type { OrderStatus } from '@/types/database'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function OrdersPage() {
  const tmk = useTranslation('market')
  const { orders, loading, error } = useMarketplaceOrders()
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')

  const STATUS_TABS: { key: OrderStatus | 'all'; label: string }[] = [
    { key: 'all', label: tmk.statusAll },
    { key: 'pending', label: tmk.statusPendingPlural },
    { key: 'confirmed', label: tmk.statusConfirmedPlural },
    { key: 'shipped', label: tmk.statusShippedLabel },
    { key: 'delivered', label: tmk.statusDeliveredPlural },
  ]

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(o => o.status === statusFilter)

  const countByStatus = (status: OrderStatus | 'all') => {
    if (status === 'all') return orders.length
    return orders.filter(o => o.status === status).length
  }

  return (
    <ErrorBoundary sectionName="Marketplace Orders">
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors"
      >
        <IconChevronLeft size={20} />
        {tmk.backToMarketplace}
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <IconPackage size={28} className="text-[var(--color-primary)]" />
          <div>
            <h1 className="text-2xl font-bold">{tmk.myOrders}</h1>
            <p className="text-[var(--color-textMuted)]">
              {tmk.ordersCount(orders.length)}
            </p>
          </div>
        </div>

        <Link href="/marketplace" className="btn btn-primary flex items-center gap-2">
          <IconShop size={18} />
          {tmk.newOrder}
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {STATUS_TABS.map(tab => {
          const count = countByStatus(tab.key)
          const isActive = statusFilter === tab.key
          return (
            <button type="button"
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-bgCard)] border border-[var(--color-border)] hover:bg-[var(--color-bgHover)]'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                  isActive ? 'bg-white/20' : 'bg-[var(--color-bgHover)]'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="card p-4 border-[var(--color-danger)]/50 bg-[var(--color-danger)]/5">
          <p className="text-[var(--color-danger)]">{error}</p>
        </div>
      )}

      {/* Orders list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-bgHover)]" />
                <div className="flex-1">
                  <div className="h-4 bg-[var(--color-bgHover)] rounded w-1/4 mb-2" />
                  <div className="h-3 bg-[var(--color-bgHover)] rounded w-1/3" />
                </div>
                <div className="h-6 bg-[var(--color-bgHover)] rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={<IconPackage size={32} />}
          title={statusFilter === 'all' ? tmk.noOrders : tmk.noOrdersWithStatus}
          description={statusFilter === 'all' ? tmk.placeFirstOrder : tmk.tryDifferentFilter}
          action={statusFilter === 'all' ? { label: tmk.goToSuppliers, href: '/marketplace' } : undefined}
        />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
    </ErrorBoundary>
  )
}
