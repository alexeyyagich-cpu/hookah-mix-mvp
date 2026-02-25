'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useInventory } from '@/lib/hooks/useInventory'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { useStatistics } from '@/lib/hooks/useStatistics'
import { useNotificationSettings } from '@/lib/hooks/useNotificationSettings'
import { InventoryTable } from '@/components/dashboard/InventoryTable'
import { AddTobaccoModal } from '@/components/dashboard/AddTobaccoModal'
import { ScanButton } from '@/components/inventory/BarcodeScanner'
import { ImportModal } from '@/components/dashboard/ImportModal'
import { InvoiceScanModal } from '@/components/dashboard/InvoiceScanModal'
import { exportInventoryCSV, exportInventoryPDF } from '@/lib/utils/exportReport'
import { IconExport, IconChart, IconLock, IconScan } from '@/components/Icons'
import { useTranslation } from '@/lib/i18n'
import Link from 'next/link'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LOW_STOCK_THRESHOLD } from '@/lib/constants'
import type { TobaccoInventory } from '@/types/database'
import type { TobaccoBarcode } from '@/lib/data/tobaccoBarcodes'
import type { ImportRow } from '@/lib/utils/importParser'

export default function InventoryPage() {
  const t = useTranslation('hookah')
  const tc = useTranslation('common')
  const {
    inventory,
    loading,
    error,
    addTobacco,
    bulkAddTobacco,
    updateTobacco,
    deleteTobacco,
    adjustQuantity,
    canAddMore,
    itemsLimit,
  } = useInventory()
  const { isFreeTier, canExport } = useSubscription()
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [scanModalOpen, setScanModalOpen] = useState(false)
  const { settings: notificationSettings } = useNotificationSettings()
  const lowStockThreshold = notificationSettings?.low_stock_threshold || LOW_STOCK_THRESHOLD
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
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => { return () => clearTimeout(deleteTimerRef.current) }, [])
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [scannedTobacco, setScannedTobacco] = useState<TobaccoBarcode | null>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  // Handle barcode scan result
  const handleScanResult = (tobacco: TobaccoBarcode) => {
    setScannedTobacco(tobacco)
    setEditingItem(null)
    setModalOpen(true)
  }

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
      clearTimeout(deleteTimerRef.current)
      deleteTimerRef.current = setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  const handleAdjust = async (id: string, amount: number) => {
    const type = amount > 0 ? 'purchase' : 'adjustment'
    await adjustQuantity(id, amount, type, amount > 0 ? t.adjustPurchase : t.adjustCorrection)
  }



  const totalGrams = useMemo(() => inventory.reduce((sum, item) => sum + item.quantity_grams, 0), [inventory])

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
          <h1 className="text-2xl font-bold">{t.inventoryTitle}</h1>
          <p className="text-[var(--color-textMuted)]">
            {t.inventorySubtitle(inventory.length, isFreeTier ? itemsLimit : null, totalGrams.toFixed(0))}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Export Button with Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button type="button"
              onClick={() => canExport && setExportMenuOpen(!exportMenuOpen)}
              disabled={!canExport || inventory.length === 0}
              className="btn btn-ghost disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title={canExport ? t.exportInventory : t.availableOnPro}
            >
              <IconExport size={18} />
              {!canExport && <IconLock size={14} />}
            </button>

            {exportMenuOpen && canExport && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[var(--color-bgCard)] border border-[var(--color-border)] shadow-lg z-50 overflow-hidden">
                <button type="button"
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--color-bgHover)] flex items-center gap-2 transition-colors"
                >
                  <IconChart size={16} />
                  {t.exportCSV}
                </button>
                <button type="button"
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--color-bgHover)] flex items-center gap-2 transition-colors border-t border-[var(--color-border)]"
                >
                  <IconExport size={16} />
                  {t.exportPDF}
                </button>
              </div>
            )}
          </div>

          {/* Barcode Scanner */}
          {canAddMore && (
            <ScanButton
              onScanResult={handleScanResult}
              onManualAdd={() => {
                setScannedTobacco(null)
                setEditingItem(null)
                setModalOpen(true)
              }}
            />
          )}

          {!isFreeTier && (
            <>
              <button type="button"
                onClick={() => setScanModalOpen(true)}
                className="btn btn-ghost flex items-center gap-2"
              >
                <IconScan size={16} />
                {t.ocrBtn}
              </button>
              <button type="button"
                onClick={() => setImportModalOpen(true)}
                className="btn btn-ghost flex items-center gap-2"
              >
                <IconExport size={16} />
                {t.importBtn}
              </button>
            </>
          )}
          <button type="button"
            onClick={() => {
              setScannedTobacco(null)
              setEditingItem(null)
              setModalOpen(true)
            }}
            className="btn btn-primary"
            disabled={!canAddMore}
          >
            + {t.addTobacco}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">{t.totalItems}</div>
          <div className="text-2xl font-bold mt-1">{inventory.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">{t.inWarehouse}</div>
          <div className="text-2xl font-bold mt-1">{totalGrams.toFixed(0)}{tc.grams}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">{t.runningLow}</div>
          <div className="text-2xl font-bold text-[var(--color-warning)] mt-1">
            {inventory.filter(i => i.quantity_grams < lowStockThreshold && i.quantity_grams > 0).length}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">{t.outOfStock}</div>
          <div className="text-2xl font-bold text-[var(--color-danger)] mt-1">
            {inventory.filter(i => i.quantity_grams <= 0).length}
          </div>
        </div>
      </div>

      {/* Approaching Limit Warning */}
      {isFreeTier && itemsLimit && inventory.length >= Math.floor(itemsLimit * 0.8) && inventory.length < itemsLimit && (
        <div className="p-3 rounded-lg bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span className="text-sm">{t.approachingLimit(inventory.length, itemsLimit)}</span>
          </div>
          <Link href="/pricing" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
            {tc.upgrade}
          </Link>
        </div>
      )}

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
              {tc.upgrade}
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
      <ErrorBoundary sectionName="Inventory Table">
        <InventoryTable
          inventory={inventory}
          forecasts={forecastsMap}
          lowStockThreshold={lowStockThreshold}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdjust={handleAdjust}
          loading={loading}
        />
      </ErrorBoundary>

      {/* Delete Confirmation Toast */}
      {deleteConfirm && (
        <div className="fixed bottom-4 right-4 z-50 p-4 rounded-xl bg-[var(--color-danger)] text-white shadow-lg animate-fadeInUp">
          {t.deleteConfirmToast}
        </div>
      )}

      {/* Modal */}
      <AddTobaccoModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingItem(null)
          setScannedTobacco(null)
        }}
        onSave={handleSave}
        editingItem={editingItem}
        canAddMore={canAddMore}
        scannedTobacco={scannedTobacco}
      />

      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={async (rows: ImportRow[]) => {
          const items = rows.map(row => ({
            tobacco_id: `import-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            brand: row.brand,
            flavor: row.flavor,
            quantity_grams: row.quantity_grams,
            purchase_price: row.purchase_price,
            package_grams: row.package_grams,
            purchase_date: null,
            expiry_date: null,
            notes: null,
          }))
          await bulkAddTobacco(items)
        }}
      />

      <InvoiceScanModal
        isOpen={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        onImport={async (extractedItems) => {
          const items = extractedItems.map(item => ({
            tobacco_id: item.matchedTobaccoId || `ocr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            brand: item.brand,
            flavor: item.flavor,
            quantity_grams: item.packageGrams * item.quantity,
            purchase_price: item.price,
            package_grams: item.packageGrams,
            purchase_date: null,
            expiry_date: null,
            notes: null,
          }))
          await bulkAddTobacco(items)
        }}
      />
    </div>
  )
}
