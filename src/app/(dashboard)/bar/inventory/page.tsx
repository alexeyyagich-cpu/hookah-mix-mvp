'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useBarInventory } from '@/lib/hooks/useBarInventory'
import { BarInventoryTable } from '@/components/bar/BarInventoryTable'
import { AddBarIngredientModal } from '@/components/bar/AddBarIngredientModal'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { IconBar, IconInventory, IconWarning, IconChart } from '@/components/Icons'
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
  } = useBarInventory()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<BarInventoryItem | null>(null)

  const handleSave = async (item: Omit<BarInventoryItem, 'id' | 'profile_id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingItem) {
        await updateIngredient(editingItem.id, item)
      } else {
        await addIngredient(item)
      }
      setEditingItem(null)
      toast.success(tc.saved)
    } catch {
      toast.error(tc.errorSaving)
    }
  }

  const handleEdit = (item: BarInventoryItem) => {
    setEditingItem(item)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteIngredient(id)
      toast.success(tc.deleted)
    } catch {
      toast.error(tc.errorDeleting)
    }
  }

  const handleAdjust = async (id: string, amount: number) => {
    try {
      const type = amount > 0 ? 'purchase' : 'adjustment'
      await adjustQuantity(id, amount, type, amount > 0 ? t.receipt : t.adjustment)
      toast.success(tc.saved)
    } catch {
      toast.error(tc.errorSaving)
    }
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
            {t.itemsCount(totalItems)}
            {totalVolumeMl > 0 && ` · ${t.volumeInStock((totalVolumeMl / 1000).toFixed(1))}`}
          </p>
        </div>
        <button type="button"
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatsCard
          icon={<IconBar size={20} />}
          label={t.totalItems}
          value={totalItems}
          color="primary"
        />
        <StatsCard
          icon={<IconInventory size={20} />}
          label={t.volumeLiquids}
          value={`${(totalVolumeMl / 1000).toFixed(1)}${t.litersShort}`}
          color="primary"
        />
        <StatsCard
          icon={<IconWarning size={20} />}
          label={t.runningLow}
          value={lowStockItems.length}
          color="warning"
        />
        <StatsCard
          icon={<IconChart size={20} />}
          label={t.outOfStock}
          value={outOfStockItems.length}
          color="danger"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="card p-4 border-[var(--color-danger)]/50 bg-[var(--color-danger)]/5">
          <p className="text-[var(--color-danger)]">{error}</p>
        </div>
      )}

      {/* Table */}
      <ErrorBoundary sectionName="Bar Inventory Table">
        <BarInventoryTable
          inventory={inventory}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdjust={handleAdjust}
          loading={loading}
          onAdd={() => {
            setEditingItem(null)
            setModalOpen(true)
          }}
        />
      </ErrorBoundary>

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
