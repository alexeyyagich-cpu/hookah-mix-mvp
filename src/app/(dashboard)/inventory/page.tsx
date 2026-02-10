'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useInventory } from '@/lib/hooks/useInventory'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { useStatistics } from '@/lib/hooks/useStatistics'
import { useNotificationSettings } from '@/lib/hooks/useNotificationSettings'
import { InventoryTable } from '@/components/dashboard/InventoryTable'
import { AddTobaccoModal } from '@/components/dashboard/AddTobaccoModal'
import { exportInventoryCSV, exportInventoryPDF } from '@/lib/utils/exportReport'
import { IconExport, IconChart, IconLock, IconPlus } from '@/components/Icons'
import type { TobaccoInventory } from '@/types/database'

export default function InventoryPage() {
  const {
    inventory,
    loading,
    error,
    addTobacco,
    updateTobacco,
    deleteTobacco,
    adjustQuantity,
    canAddMore,
    itemsLimit,
  } = useInventory()
  const { isFreeTier, canExport } = useSubscription()
  const { settings: notificationSettings } = useNotificationSettings()
  const lowStockThreshold = notificationSettings?.low_stock_threshold || 50
  const { statistics } = useStatistics({ lowStockThreshold })

  // Create forecasts map from statistics
  const forecastsMap = useMemo(() => {
    if (!statistics?.forecasts) return undefined
    const map = new Map()
    statistics.forecasts.forEach(item => {
      map.set(item.id, item.forecast)
    })
    return map
  }, [statistics?.forecasts])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TobaccoInventory | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  // Close export menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setExportMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleExport = (format: 'csv' | 'pdf') => {
    if (!canExport || inventory.length === 0) return
    if (format === 'csv') {
      exportInventoryCSV(inventory, lowStockThreshold)
    } else {
      exportInventoryPDF(inventory, lowStockThreshold)
    }
    setExportMenuOpen(false)
  }

  const handleSave = async (tobacco: Omit<TobaccoInventory, 'id' | 'profile_id' | 'created_at' | 'updated_at'>) => {
    if (editingItem) {
      await updateTobacco(editingItem.id, tobacco)
    } else {
      await addTobacco(tobacco)
    }
    setEditingItem(null)
  }

  const handleEdit = (item: TobaccoInventory) => {
    setEditingItem(item)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (deleteConfirm === id) {
      await deleteTobacco(id)
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  const handleAdjust = async (id: string, amount: number) => {
    const type = amount > 0 ? 'purchase' : 'adjustment'
    await adjustQuantity(id, amount, type, amount > 0 ? 'Поступление' : 'Корректировка')
  }

  const totalValue = inventory.reduce((sum, item) => {
    if (item.purchase_price) {
      return sum + (item.purchase_price * item.quantity_grams / 1000) // assuming price per kg
    }
    return sum
  }, 0)

  const totalGrams = inventory.reduce((sum, item) => sum + item.quantity_grams, 0)

  // Background portal
  const [bgContainer, setBgContainer] = useState<HTMLElement | null>(null)
  useEffect(() => {
    setBgContainer(document.getElementById('page-background'))
    return () => setBgContainer(null)
  }, [])

  return (
    <div className="space-y-6 relative">
      {/* Background Image via Portal */}
      {bgContainer && createPortal(
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: 'url(/images/inventory-bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            backgroundAttachment: 'fixed',
          }}
        />,
        bgContainer
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Инвентарь табака</h1>
          <p className="text-[var(--color-textMuted)]">
            {inventory.length} позиций
            {isFreeTier && ` из ${itemsLimit}`}
            {' '}• {totalGrams.toFixed(0)}г на складе
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export Button with Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => canExport && setExportMenuOpen(!exportMenuOpen)}
              disabled={!canExport || inventory.length === 0}
              className="btn btn-ghost disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title={canExport ? 'Экспорт инвентаря' : 'Доступно на Pro'}
            >
              <IconExport size={18} />
              {!canExport && <IconLock size={14} />}
            </button>

            {exportMenuOpen && canExport && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[var(--color-bgCard)] border border-[var(--color-border)] shadow-lg z-50 overflow-hidden">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--color-bgHover)] flex items-center gap-2 transition-colors"
                >
                  <IconChart size={16} />
                  Экспорт CSV
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--color-bgHover)] flex items-center gap-2 transition-colors border-t border-[var(--color-border)]"
                >
                  <IconExport size={16} />
                  Экспорт PDF
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setEditingItem(null)
              setModalOpen(true)
            }}
            className="btn btn-primary"
            disabled={!canAddMore}
          >
            + Добавить табак
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">Всего позиций</div>
          <div className="text-2xl font-bold mt-1">{inventory.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">На складе</div>
          <div className="text-2xl font-bold mt-1">{totalGrams.toFixed(0)}г</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">Заканчиваются</div>
          <div className="text-2xl font-bold text-[var(--color-warning)] mt-1">
            {inventory.filter(i => i.quantity_grams < lowStockThreshold && i.quantity_grams > 0).length}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">Закончились</div>
          <div className="text-2xl font-bold text-[var(--color-danger)] mt-1">
            {inventory.filter(i => i.quantity_grams <= 0).length}
          </div>
        </div>
      </div>

      {/* Limit Warning */}
      {isFreeTier && !canAddMore && (
        <div className="card p-4 border-[var(--color-warning)]/50 bg-[var(--color-warning)]/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div className="flex-1">
              <h3 className="font-semibold">Достигнут лимит</h3>
              <p className="text-sm text-[var(--color-textMuted)]">
                Бесплатный тариф позволяет добавить до {itemsLimit} позиций.
                Обновите подписку для безлимитного инвентаря.
              </p>
            </div>
            <a href="/pricing" className="btn btn-primary">
              Обновить
            </a>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card p-4 border-[var(--color-danger)]/50 bg-[var(--color-danger)]/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">❌</span>
            <p className="text-[var(--color-danger)]">{error}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <InventoryTable
        inventory={inventory}
        forecasts={forecastsMap}
        lowStockThreshold={lowStockThreshold}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdjust={handleAdjust}
        loading={loading}
      />

      {/* Delete Confirmation Toast */}
      {deleteConfirm && (
        <div className="fixed bottom-4 right-4 z-50 p-4 rounded-xl bg-[var(--color-danger)] text-white shadow-lg animate-fadeInUp">
          Нажмите еще раз для подтверждения удаления
        </div>
      )}

      {/* Modal */}
      <AddTobaccoModal
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
