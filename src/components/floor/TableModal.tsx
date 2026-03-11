'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/i18n'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { STATUS_COLORS } from './floorConstants'
import type { FloorTable, TableStatus, TableShape } from '@/types/database'

export interface TableFormData {
  name: string
  capacity: number
  shape: TableShape
  width: number
  height: number
  zone: string | null
  notes: string | null
  position_x: number
  position_y: number
}

export interface TableModalProps {
  table?: FloorTable
  existingZones?: string[]
  onClose: () => void
  onSave: (data: TableFormData) => Promise<void>
  onDelete?: () => Promise<void>
  onStatusChange?: (status: TableStatus) => Promise<void>
}

export function TableModal({ table, existingZones = [], onClose, onSave, onDelete, onStatusChange }: TableModalProps) {
  const t = useTranslation('manage')
  const tc = useTranslation('common')
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(dialogRef, true, onClose)
  useBodyScrollLock(true)

  const STATUS_LABELS: Record<TableStatus, string> = {
    available: t.statusAvailable,
    occupied: t.statusOccupied,
    reserved: t.statusReserved,
    cleaning: t.statusCleaning,
  }

  const [name, setName] = useState(table?.name || '')
  const [capacity, setCapacity] = useState(table?.capacity?.toString() || '4')
  const [zone, setZone] = useState(table?.zone || '')
  const [notes, setNotes] = useState(table?.notes || '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        name,
        capacity: parseInt(capacity) || 4,
        shape: table?.shape || 'circle',
        width: table?.width || 80,
        height: table?.height || 80,
        zone: zone.trim() || null,
        notes: notes || null,
        position_x: table?.position_x || 100,
        position_y: table?.position_y || 100,
      })
    } catch {
      toast.error(tc.errorSaving)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl p-6"
        style={{
          background: 'var(--color-bgCard)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            {table ? t.editTableTitle : t.newTableTitle}
          </h2>
          <button type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--color-bgHover)]"
            style={{ color: 'var(--color-textMuted)' }}
            aria-label={tc.close}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t.labelName}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.placeholderTable}
              className="w-full px-4 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t.labelCapacity}</label>
            <input
              type="number"
              inputMode="numeric"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              min="1"
              max="20"
              step="1"
              className="w-full px-4 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t.zoneLabel}</label>
            <input
              type="text"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder={t.zonePlaceholder}
              list="zone-suggestions"
              className="w-full px-4 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
            />
            {existingZones.length > 0 && (
              <datalist id="zone-suggestions">
                {existingZones.map(z => <option key={z} value={z} />)}
              </datalist>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t.labelNotes}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.placeholderNotes}
              rows={2}
              className="w-full px-4 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none resize-none"
            />
          </div>

          {/* Status buttons for editing */}
          {table && onStatusChange && (
            <div>
              <label className="block text-sm font-medium mb-2">{t.labelStatus}</label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(STATUS_LABELS) as TableStatus[]).map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onStatusChange(status)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: STATUS_COLORS[status].bg,
                      color: STATUS_COLORS[status].text,
                      boxShadow: table.status === status
                        ? `0 0 0 2px var(--color-bgCard), 0 0 0 4px ${STATUS_COLORS[status].border}`
                        : 'none',
                    }}
                  >
                    {STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-4">
            {table && onDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: 'var(--color-danger)',
                  color: 'var(--color-bg)',
                }}
              >
                {t.deleteBtn}
              </button>
            )}
            <ConfirmDialog
              open={confirmDelete}
              title={t.deleteBtn}
              message={tc.deleteWarning}
              danger
              onConfirm={async () => {
                if (onDelete) await onDelete()
                setConfirmDelete(false)
              }}
              onCancel={() => setConfirmDelete(false)}
            />
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{
                background: 'var(--color-bgHover)',
                color: 'var(--color-text)',
              }}
            >
              {t.cancelBtn}
            </button>
            <button
              type="submit"
              disabled={saving || !name}
              className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
              style={{
                background: 'var(--color-primary)',
                color: 'var(--color-bg)',
              }}
            >
              {saving ? t.saving : t.saveBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
