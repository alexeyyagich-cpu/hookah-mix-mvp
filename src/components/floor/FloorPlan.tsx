'use client'

import { useState, useRef, useCallback, useMemo, useEffect, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/i18n'
import { IconPlus } from '@/components/Icons'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { FloorTable, TableStatus, TableShape } from '@/types/database'

export const LONG_SESSION_MINUTES = 120

export const STATUS_COLORS: Record<TableStatus, { bg: string; border: string; text: string }> = {
  available: {
    bg: 'var(--color-success)',
    border: 'var(--color-success)',
    text: 'white',
  },
  occupied: {
    bg: 'var(--color-danger)',
    border: 'var(--color-danger)',
    text: 'white',
  },
  reserved: {
    bg: 'var(--color-warning)',
    border: 'var(--color-warning)',
    text: 'white',
  },
  cleaning: {
    bg: 'var(--color-textMuted)',
    border: 'var(--color-border)',
    text: 'white',
  },
}

interface FloorPlanProps {
  tables: FloorTable[]
  loading: boolean
  onTableSelect?: (table: FloorTable) => void
  editable?: boolean
  addTable: (table: Omit<FloorTable, 'id' | 'profile_id' | 'created_at' | 'updated_at'>) => Promise<FloorTable | null>
  updateTable: (id: string, updates: Partial<FloorTable>) => Promise<void>
  deleteTable: (id: string) => Promise<void>
  moveTable: (id: string, x: number, y: number) => Promise<void>
  setTableStatus: (id: string, status: TableStatus, guestName?: string | null) => Promise<void>
}

export function FloorPlan({
  tables, loading, onTableSelect, editable = false,
  addTable, updateTable, deleteTable, moveTable, setTableStatus,
}: FloorPlanProps) {
  const t = useTranslation('manage')

  // Extract unique zones for datalist suggestions
  const existingZones = useMemo(() =>
    [...new Set(tables.map(t => t.zone).filter((z): z is string => !!z))].sort(),
    [tables]
  )

  const STATUS_LABELS: Record<TableStatus, string> = {
    available: t.statusAvailable,
    occupied: t.statusOccupied,
    reserved: t.statusReserved,
    cleaning: t.statusCleaning,
  }
  const [selectedTable, setSelectedTable] = useState<FloorTable | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [draggedTable, setDraggedTable] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent, table: FloorTable) => {
    if (!editable) return
    e.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const pos = 'touches' in e
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
      : { x: e.clientX, y: e.clientY }

    setDraggedTable(table.id)
    setIsDragging(false)
    setDragOffset({
      x: pos.x - rect.left - table.position_x,
      y: pos.y - rect.top - table.position_y,
    })
  }, [editable])

  // Window-level drag listeners — works even when finger/pointer leaves the canvas
  const isDraggingRef = useRef(false)
  const draggedTableRef = useRef<string | null>(null)
  const dragOffsetRef = useRef({ x: 0, y: 0 })

  // Keep refs in sync with state
  isDraggingRef.current = isDragging
  draggedTableRef.current = draggedTable
  dragOffsetRef.current = dragOffset

  useEffect(() => {
    if (!draggedTable) return

    const getNativePos = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }
      if ('changedTouches' in e && e.changedTouches.length > 0) {
        return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
      }
      if ('clientX' in e) {
        return { x: e.clientX, y: e.clientY }
      }
      return { x: 0, y: 0 }
    }

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return
      e.preventDefault()
      const rect = containerRef.current.getBoundingClientRect()
      const pos = getNativePos(e)
      const off = dragOffsetRef.current
      const x = Math.max(0, Math.min(rect.width - 60, pos.x - rect.left - off.x))
      const y = Math.max(0, Math.min(rect.height - 60, pos.y - rect.top - off.y))

      setIsDragging(true)

      const tableEl = document.getElementById(`table-${draggedTableRef.current}`)
      if (tableEl) {
        tableEl.style.left = `${x}px`
        tableEl.style.top = `${y}px`
      }
    }

    const onEnd = async (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current || !draggedTableRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pos = getNativePos(e)
      const off = dragOffsetRef.current
      const x = Math.max(0, Math.min(rect.width - 60, pos.x - rect.left - off.x))
      const y = Math.max(0, Math.min(rect.height - 60, pos.y - rect.top - off.y))

      if (isDraggingRef.current) {
        await moveTable(draggedTableRef.current, Math.round(x), Math.round(y))
      }
      setDraggedTable(null)
      setIsDragging(false)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('touchcancel', onEnd)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [draggedTable, moveTable])

  const handleTableClick = useCallback((_e: React.MouseEvent | React.TouchEvent | React.KeyboardEvent, table: FloorTable) => {
    if (isDragging) return

    setSelectedTable(table)
    if (editable) {
      setIsEditModalOpen(true)
    } else {
      onTableSelect?.(table)
    }
  }, [editable, onTableSelect, isDragging])

  const formatDuration = (startTime: string | null): string => {
    if (!startTime) return ''
    const start = new Date(startTime)
    const now = new Date()
    const minutes = Math.floor((now.getTime() - start.getTime()) / 60000)
    if (minutes < 60) return t.durationMin(minutes)
    const hours = Math.floor(minutes / 60)
    return t.durationHourMin(hours, minutes % 60)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4">
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <div key={status} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ background: STATUS_COLORS[status as TableStatus].bg }}
            />
            <span className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
              {label}
            </span>
          </div>
        ))}

        {editable && (
          <button type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-bg)',
            }}
          >
            <IconPlus size={16} />
            {t.addTableBtn}
          </button>
        )}
      </div>

      {/* Floor Plan Canvas */}
      <div
        ref={containerRef}
        className="relative rounded-2xl border-2 border-dashed overflow-hidden"
        style={{
          background: 'var(--color-bgHover)',
          borderColor: 'var(--color-border)',
          height: '400px',
          minHeight: '400px',
          touchAction: editable ? 'none' : undefined,
        }}
      >
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--color-border) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Tables */}
        {tables.map(table => {
          const colors = STATUS_COLORS[table.status]
          const isOccupied = table.status === 'occupied'
          const elapsedMin = isOccupied && table.session_start_time
            ? Math.floor((Date.now() - new Date(table.session_start_time).getTime()) / 60000)
            : 0
          const isLongSession = elapsedMin >= LONG_SESSION_MINUTES

          return (
            <div
              key={table.id}
              id={`table-${table.id}`}
              role="button"
              tabIndex={0}
              aria-label={`${table.name}, ${table.status}`}
              onClick={(e) => handleTableClick(e, table)}
              onTouchEnd={(e) => {
                if (!editable && !isDragging) {
                  e.preventDefault()
                  handleTableClick(e, table)
                }
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleTableClick(e, table) }}
              onMouseDown={(e) => handlePointerDown(e, table)}
              onTouchStart={(e) => handlePointerDown(e, table)}
              className={`
                absolute flex flex-col items-center justify-center
                transition-all cursor-pointer select-none
                hover:scale-105 hover:brightness-110 active:scale-95
                ${editable ? 'cursor-move' : ''}
                ${draggedTable === table.id ? 'shadow-xl z-10 scale-105' : 'shadow-lg'}
                ${isOccupied ? 'animate-pulse-subtle' : ''}
                ${isLongSession ? 'animate-long-session' : ''}
              `}
              style={{
                left: table.position_x,
                top: table.position_y,
                width: table.width,
                height: table.height,
                background: `color-mix(in srgb, ${colors.bg} 85%, transparent)`,
                border: isLongSession ? '3px solid var(--color-warning)' : `2px solid ${colors.border}`,
                borderRadius: table.shape === 'circle' ? '50%' : '12px',
                transition: draggedTable === table.id ? 'none' : undefined,
                boxShadow: isLongSession ? '0 0 12px var(--color-warning)' : undefined,
              }}
            >
              {isLongSession && (
                <span className="absolute -top-1 -right-1 text-[10px]" aria-hidden="true">&#9888;</span>
              )}
              <span
                className="font-bold text-sm"
                style={{ color: colors.text }}
              >
                {table.name}
              </span>
              {table.current_guest_name && (
                <span
                  className="text-[10px] mt-0.5 max-w-full truncate px-1"
                  style={{ color: colors.text, opacity: 0.9 }}
                >
                  {table.current_guest_name}
                </span>
              )}
              {isOccupied && table.session_start_time && (
                <span
                  className="text-[10px] mt-0.5 font-semibold"
                  style={{ color: isLongSession ? 'var(--color-warning)' : colors.text, opacity: isLongSession ? 1 : 0.8 }}
                >
                  {formatDuration(table.session_start_time)}
                </span>
              )}
            </div>
          )
        })}

        {/* Empty state */}
        {tables.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--color-textMuted)' }}>
              {t.noTablesEmpty}
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--color-textMuted)' }}>
              {t.addTablesHint}
            </p>
            {editable && (
              <button type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: 'var(--color-primary)',
                  color: 'var(--color-bg)',
                }}
              >
                <IconPlus size={18} />
                {t.addTableBtn}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Table Modal (portal to body to avoid stacking context issues) */}
      {isAddModalOpen && createPortal(
        <TableModal
          existingZones={existingZones}
          onClose={() => setIsAddModalOpen(false)}
          onSave={async (data) => {
            await addTable({
              name: data.name,
              capacity: data.capacity,
              shape: data.shape,
              position_x: data.position_x,
              position_y: data.position_y,
              width: data.width,
              height: data.height,
              zone: data.zone,
              notes: data.notes,
              status: 'available',
              current_session_id: null,
              current_guest_name: null,
              session_start_time: null,
            })
            setIsAddModalOpen(false)
          }}
        />,
        document.body
      )}

      {/* Edit Table Modal */}
      {isEditModalOpen && selectedTable && createPortal(
        <TableModal
          table={selectedTable}
          existingZones={existingZones}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedTable(null)
          }}
          onSave={async (data) => {
            await updateTable(selectedTable.id, data)
            setIsEditModalOpen(false)
            setSelectedTable(null)
          }}
          onDelete={async () => {
            await deleteTable(selectedTable.id)
            setIsEditModalOpen(false)
            setSelectedTable(null)
          }}
          onStatusChange={async (status) => {
            await setTableStatus(selectedTable.id, status)
            setIsEditModalOpen(false)
            setSelectedTable(null)
          }}
        />,
        document.body
      )}
    </div>
  )
}

interface TableFormData {
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

interface TableModalProps {
  table?: FloorTable
  existingZones?: string[]
  onClose: () => void
  onSave: (data: TableFormData) => Promise<void>
  onDelete?: () => Promise<void>
  onStatusChange?: (status: TableStatus) => Promise<void>
}

function TableModal({ table, existingZones = [], onClose, onSave, onDelete, onStatusChange }: TableModalProps) {
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
  const [shape, setShape] = useState<TableShape>(table?.shape || 'circle')
  const [width, setWidth] = useState(table?.width?.toString() || '80')
  const [height, setHeight] = useState(table?.height?.toString() || '80')
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
        shape,
        width: parseInt(width) || 80,
        height: parseInt(height) || 80,
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

          <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium mb-1">{t.labelShape}</label>
              <select
                value={shape}
                onChange={(e) => setShape(e.target.value as TableShape)}
                className="w-full px-4 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
              >
                <option value="circle">{t.shapeCircle}</option>
                <option value="square">{t.shapeSquare}</option>
                <option value="rectangle">{t.shapeRectangle}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t.labelWidth}</label>
              <input
                type="number"
                inputMode="numeric"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                min="40"
                max="200"
                step="1"
                className="w-full px-4 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.labelHeight}</label>
              <input
                type="number"
                inputMode="numeric"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                min="40"
                max="200"
                step="1"
                className="w-full px-4 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
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

// Animations (.animate-pulse-subtle, .animate-long-session) defined in globals.css
