'use client'

import { useState, useMemo } from 'react'
import { useKDS } from '@/lib/hooks/useKDS'
import { useFloorPlan } from '@/lib/hooks/useFloorPlan'
import { useBarRecipes } from '@/lib/hooks/useBarRecipes'
import { useBowls } from '@/lib/hooks/useBowls'
import { useInventory } from '@/lib/hooks/useInventory'
import { useGuests } from '@/lib/hooks/useGuests'
import { useModules } from '@/lib/hooks/useModules'
import { KdsOrderCard } from '@/components/kds/KdsOrderCard'
import { NewOrderModal } from '@/components/kds/NewOrderModal'
import { IconPlus, IconMenuList } from '@/components/Icons'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useTranslation } from '@/lib/i18n'
import type { KdsOrderStatus } from '@/types/database'

type TypeFilter = 'all' | 'bar' | 'hookah'
type MobileColumn = 'new' | 'preparing' | 'ready'

export default function KdsPage() {
  const tm = useTranslation('manage')
  const { orders, loading, error, createOrder, updateStatus, cancelOrder } = useKDS()
  const { tables } = useFloorPlan()
  const { recipes } = useBarRecipes()
  const { bowls } = useBowls()
  const { inventory } = useInventory()
  const { guests } = useGuests()
  const { isBarActive, isHookahActive } = useModules()

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [mobileColumn, setMobileColumn] = useState<MobileColumn>('new')
  const [modalOpen, setModalOpen] = useState(false)

  const isCombined = isBarActive && isHookahActive

  const filteredOrders = useMemo(() => {
    if (typeFilter === 'all') return orders
    return orders.filter(o => o.type === typeFilter)
  }, [orders, typeFilter])

  const newOrders = useMemo(() => filteredOrders.filter(o => o.status === 'new'), [filteredOrders])
  const preparingOrders = useMemo(() => filteredOrders.filter(o => o.status === 'preparing'), [filteredOrders])
  const readyOrders = useMemo(() => filteredOrders.filter(o => o.status === 'ready'), [filteredOrders])

  const handleAction = async (orderId: string, newStatus: KdsOrderStatus) => {
    await updateStatus(orderId, newStatus)
  }

  const handleCancel = async (orderId: string) => {
    await cancelOrder(orderId)
  }

  const activeCount = orders.length

  const columns: { key: MobileColumn; label: string; dot: string; orders: typeof newOrders }[] = [
    { key: 'new', label: tm.newOrders, dot: 'bg-[var(--color-warning)]', orders: newOrders },
    { key: 'preparing', label: tm.preparing, dot: 'bg-[var(--color-primary)]', orders: preparingOrders },
    { key: 'ready', label: tm.ready, dot: 'bg-[var(--color-success)]', orders: readyOrders },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{tm.kdsTitle}</h1>
          <p className="text-[var(--color-textMuted)]">
            {activeCount > 0
              ? tm.activeOrders(activeCount)
              : tm.noActiveOrders}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <IconPlus size={18} />
          {tm.newOrder}
        </button>
      </div>

      {/* Module filter tabs */}
      {isCombined && (
        <div className="flex bg-[var(--color-bgHover)] rounded-xl p-1 w-fit">
          {([
            { key: 'all' as TypeFilter, label: tm.filterAllOrders },
            { key: 'bar' as TypeFilter, label: tm.filterBar },
            { key: 'hookah' as TypeFilter, label: tm.filterHookah },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                typeFilter === key
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card p-4 border-[var(--color-danger)]/50 bg-[var(--color-danger)]/5">
          <p className="text-[var(--color-danger)]">{error}</p>
        </div>
      )}

      {/* Loading */}
      <ErrorBoundary sectionName="KDS Board">
      {loading ? (
        <div className="card p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto" />
        </div>
      ) : filteredOrders.length === 0 ? (
        /* Empty state */
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-bgHover)] flex items-center justify-center">
            <IconMenuList size={32} className="text-[var(--color-textMuted)]" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{tm.noActiveOrders}</h3>
          <p className="text-[var(--color-textMuted)] mb-4">
            {tm.createOrderDesc}
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="btn btn-primary"
          >
            {tm.createOrder}
          </button>
        </div>
      ) : (
        <>
          {/* Desktop: 3-column Kanban */}
          <div className="hidden lg:grid grid-cols-3 gap-6">
            {columns.map(col => (
              <div key={col.key}>
                {/* Column header */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <h2 className="font-semibold">{col.label}</h2>
                  <span className="text-xs font-medium text-[var(--color-textMuted)] bg-[var(--color-bgHover)] px-2 py-0.5 rounded-full">
                    {col.orders.length}
                  </span>
                </div>
                {/* Cards */}
                <div className="space-y-3">
                  {col.orders.map(order => (
                    <KdsOrderCard
                      key={order.id}
                      order={order}
                      onAction={handleAction}
                      onCancel={handleCancel}
                    />
                  ))}
                  {col.orders.length === 0 && (
                    <div className="text-center py-8 text-sm text-[var(--color-textMuted)] rounded-xl border border-dashed border-[var(--color-border)]">
                      {tm.emptyColumn}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile: tab switcher */}
          <div className="lg:hidden space-y-4">
            <div className="flex bg-[var(--color-bgHover)] rounded-xl p-1">
              {columns.map(col => (
                <button
                  key={col.key}
                  onClick={() => setMobileColumn(col.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    mobileColumn === col.key
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'text-[var(--color-textMuted)]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    mobileColumn === col.key ? 'bg-white' : col.dot
                  }`} />
                  {col.label}
                  {col.orders.length > 0 && (
                    <span className={`text-xs px-1.5 rounded-full ${
                      mobileColumn === col.key
                        ? 'bg-white/20'
                        : 'bg-[var(--color-bgCard)]'
                    }`}>
                      {col.orders.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Active column cards */}
            <div className="space-y-3">
              {columns.find(c => c.key === mobileColumn)?.orders.map(order => (
                <KdsOrderCard
                  key={order.id}
                  order={order}
                  onAction={handleAction}
                  onCancel={handleCancel}
                />
              ))}
              {columns.find(c => c.key === mobileColumn)?.orders.length === 0 && (
                <div className="text-center py-8 text-sm text-[var(--color-textMuted)] card">
                  {tm.noOrdersInColumn}
                </div>
              )}
            </div>
          </div>
        </>
      )}
      </ErrorBoundary>

      {/* New Order Modal */}
      <NewOrderModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreateOrder={createOrder}
        tables={tables}
        recipes={recipes}
        isBarActive={isBarActive}
        isHookahActive={isHookahActive}
        bowls={bowls}
        inventory={inventory}
        guests={guests}
      />
    </div>
  )
}
