'use client'

import { useState } from 'react'
import { useBarInventory } from '@/lib/hooks/useBarInventory'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { BarInventoryTable } from '@/components/bar/BarInventoryTable'
import { AddBarIngredientModal } from '@/components/bar/AddBarIngredientModal'
import { BAR_UNIT_LABELS } from '@/data/bar-ingredients'
import { useTranslation } from '@/lib/i18n'
import type { BarInventoryItem } from '@/types/database'

export default function BarInventoryPage() {
  const t = useTranslation('bar')
  const tc = useTranslation('common')
  const {
    inventory,
    loading,
    error,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    adjustQuantity,
    canAddMore,
    itemsLimit,
  } = useBarInventory()
  const { isFreeTier } = useSubscription()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<BarInventoryItem | null>(null)

  const handleSave = async (item: Omit<BarInventoryItem, 'id' | 'profile_id' | 'created_at' | 'updated_at'>) => {
    if (editingItem) {
      await updateIngredient(editingItem.id, item)
    } else {
      await addIngredient(item)
    }
    setEditingItem(null)
  }

  const handleEdit = (item: BarInventoryItem) => {
    setEditingItem(item)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    await deleteIngredient(id)
  }

  const handleAdjust = async (id: string, amount: number) => {
    const type = amount > 0 ? 'purchase' : 'adjustment'
    await adjustQuantity(id, amount, type, amount > 0 ? t.receipt : t.adjustment)
  }

  // Stats
  const totalItems = inventory.length
  const lowStockItems = inventory.filter(i => i.quantity > 0 && i.quantity < i.min_quantity)
  const outOfStockItems = inventory.filter(i => i.quantity <= 0)

  // Aggregate volume for ml items
  const totalVolumeMl = inventory
    .filter(i => i.unit_type === 'ml')
    .reduce((sum, i) => sum + i.quantity, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.inventoryTitle}</h1>
          <p className="text-[var(--color-textMuted)]">
            {isFreeTier ? t.itemsCountWithLimit(totalItems, itemsLimit!) : t.itemsCount(totalItems)}
            {totalVolumeMl > 0 && ` · ${t.volumeInStock((totalVolumeMl / 1000).toFixed(1))}`}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null)
            setModalOpen(true)
          }}
          className="btn btn-primary"
          disabled={!canAddMore}
        >
          + {t.addIngredient}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">{t.totalItems}</div>
          <div className="text-2xl font-bold mt-1">{totalItems}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">{t.volumeLiquids}</div>
          <div className="text-2xl font-bold mt-1">{(totalVolumeMl / 1000).toFixed(1)}{t.litersShort}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">{t.runningLow}</div>
          <div className="text-2xl font-bold text-[var(--color-warning)] mt-1">
            {lowStockItems.length}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">{t.outOfStock}</div>
          <div className="text-2xl font-bold text-[var(--color-danger)] mt-1">
            {outOfStockItems.length}
          </div>
        </div>
      </div>

      {/* Limit Warning */}
      {isFreeTier && !canAddMore && (
        <div className="card p-4 border-[var(--color-warning)]/50 bg-[var(--color-warning)]/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div className="flex-1">
              <h3 className="font-semibold">{t.limitReached}</h3>
              <p className="text-sm text-[var(--color-textMuted)]">
                {t.freeTierLimit(itemsLimit!)}
              </p>
            </div>
            <a href="/pricing" className="btn btn-primary">
              {t.upgrade}
            </a>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card p-4 border-[var(--color-danger)]/50 bg-[var(--color-danger)]/5">
          <p className="text-[var(--color-danger)]">{error}</p>
        </div>
      )}

      {/* Table */}
      <BarInventoryTable
        inventory={inventory}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdjust={handleAdjust}
        loading={loading}
      />

      {/* Modal */}
      <AddBarIngredientModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingItem(null)
        }}
        onSave={handleSave}
        editingItem={editingItem}
        canAddMore={canAddMore}
      />
    </div>
  )
}
