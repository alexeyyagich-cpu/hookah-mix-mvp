'use client'

import { useState, useRef, useCallback } from 'react'
import { useFloorPlan } from '@/lib/hooks/useFloorPlan'
import { IconPlus, IconSettings } from '@/components/Icons'
import type { FloorTable, TableStatus, TableShape } from '@/types/database'

const STATUS_COLORS: Record<TableStatus, { bg: string; border: string; text: string }> = {
  available: {
    bg: 'var(--color-success)',
    border: 'var(--color-success)',
    text: 'white',
  },
  occupied: {
    bg: 'var(--color-primary)',
    border: 'var(--color-primary)',
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

const STATUS_LABELS: Record<TableStatus, string> = {
  available: 'Свободен',
  occupied: 'Занят',
  reserved: 'Забронирован',
  cleaning: 'Уборка',
}

interface FloorPlanProps {
  onTableSelect?: (table: FloorTable) => void
  editable?: boolean
}

export function FloorPlan({ onTableSelect, editable = false }: FloorPlanProps) {
  const { tables, loading, addTable, updateTable, deleteTable, moveTable, setTableStatus } = useFloorPlan()
  const [selectedTable, setSelectedTable] = useState<FloorTable | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [draggedTable, setDraggedTable] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent, table: FloorTable) => {
    if (!editable) return
    e.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    setDraggedTable(table.id)
    setDragOffset({
      x: e.clientX - rect.left - table.position_x,
      y: e.clientY - rect.top - table.position_y,
    })
  }, [editable])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggedTable || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(rect.width - 60, e.clientX - rect.left - dragOffset.x))
    const y = Math.max(0, Math.min(rect.height - 60, e.clientY - rect.top - dragOffset.y))

    // Update position visually (optimistic update)
    const tableEl = document.getElementById(`table-${draggedTable}`)
    if (tableEl) {
      tableEl.style.left = `${x}px`
      tableEl.style.top = `${y}px`
    }
  }, [draggedTable, dragOffset])

  const handleMouseUp = useCallback(async (e: React.MouseEvent) => {
    if (!draggedTable || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(rect.width - 60, e.clientX - rect.left - dragOffset.x))
    const y = Math.max(0, Math.min(rect.height - 60, e.clientY - rect.top - dragOffset.y))

    await moveTable(draggedTable, Math.round(x), Math.round(y))
    setDraggedTable(null)
  }, [draggedTable, dragOffset, moveTable])

  const handleTableClick = useCallback((table: FloorTable) => {
    setSelectedTable(table)
    if (editable) {
      setIsEditModalOpen(true)
    } else {
      onTableSelect?.(table)
    }
  }, [editable, onTableSelect])

  const formatDuration = (startTime: string | null): string => {
    if (!startTime) return ''
    const start = new Date(startTime)
    const now = new Date()
    const minutes = Math.floor((now.getTime() - start.getTime()) / 60000)
    if (minutes < 60) return `${minutes} мин`
    const hours = Math.floor(minutes / 60)
    return `${hours}ч ${minutes % 60}м`
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
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-bg)',
            }}
          >
            <IconPlus size={16} />
            Добавить стол
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
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
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

          return (
            <div
              key={table.id}
              id={`table-${table.id}`}
              onClick={() => handleTableClick(table)}
              onMouseDown={(e) => handleMouseDown(e, table)}
              className={`
                absolute flex flex-col items-center justify-center
                transition-shadow cursor-pointer select-none
                ${editable ? 'cursor-move' : ''}
                ${draggedTable === table.id ? 'shadow-xl z-10' : 'shadow-lg'}
                ${isOccupied ? 'animate-pulse-subtle' : ''}
              `}
              style={{
                left: table.position_x,
                top: table.position_y,
                width: table.width,
                height: table.height,
                background: `color-mix(in srgb, ${colors.bg} 85%, transparent)`,
                border: `2px solid ${colors.border}`,
                borderRadius: table.shape === 'circle' ? '50%' : '12px',
              }}
            >
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
                  className="text-[10px] mt-0.5"
                  style={{ color: colors.text, opacity: 0.8 }}
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
              Нет столов
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--color-textMuted)' }}>
              Добавьте столы для визуализации зала
            </p>
            {editable && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: 'var(--color-primary)',
                  color: 'var(--color-bg)',
                }}
              >
                <IconPlus size={18} />
                Добавить стол
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Table Modal */}
      {isAddModalOpen && (
        <TableModal
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
              notes: data.notes,
              status: 'available',
              current_session_id: null,
              current_guest_name: null,
              session_start_time: null,
            })
            setIsAddModalOpen(false)
          }}
        />
      )}

      {/* Edit Table Modal */}
      {isEditModalOpen && selectedTable && (
        <TableModal
          table={selectedTable}
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
        />
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
  notes: string | null
  position_x: number
  position_y: number
}

interface TableModalProps {
  table?: FloorTable
  onClose: () => void
  onSave: (data: TableFormData) => Promise<void>
  onDelete?: () => Promise<void>
  onStatusChange?: (status: TableStatus) => Promise<void>
}

function TableModal({ table, onClose, onSave, onDelete, onStatusChange }: TableModalProps) {
  const [name, setName] = useState(table?.name || '')
  const [capacity, setCapacity] = useState(table?.capacity?.toString() || '4')
  const [shape, setShape] = useState<TableShape>(table?.shape || 'circle')
  const [width, setWidth] = useState(table?.width?.toString() || '80')
  const [height, setHeight] = useState(table?.height?.toString() || '80')
  const [notes, setNotes] = useState(table?.notes || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onSave({
      name,
      capacity: parseInt(capacity) || 4,
      shape,
      width: parseInt(width) || 80,
      height: parseInt(height) || 80,
      notes: notes || null,
      position_x: table?.position_x || 100,
      position_y: table?.position_y || 100,
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{
          background: 'var(--color-bgCard)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            {table ? 'Редактировать стол' : 'Новый стол'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--color-bgHover)]"
            style={{ color: 'var(--color-textMuted)' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Стол 1"
              className="w-full px-4 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Вместимость</label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                min="1"
                max="20"
                className="w-full px-4 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Форма</label>
              <select
                value={shape}
                onChange={(e) => setShape(e.target.value as TableShape)}
                className="w-full px-4 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
              >
                <option value="circle">Круглый</option>
                <option value="square">Квадратный</option>
                <option value="rectangle">Прямоугольный</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ширина (px)</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                min="40"
                max="200"
                className="w-full px-4 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Высота (px)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                min="40"
                max="200"
                className="w-full px-4 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Заметки</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VIP-зона, у окна..."
              rows={2}
              className="w-full px-4 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none resize-none"
            />
          </div>

          {/* Status buttons for editing */}
          {table && onStatusChange && (
            <div>
              <label className="block text-sm font-medium mb-2">Статус</label>
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
                onClick={onDelete}
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: 'var(--color-danger)',
                  color: 'white',
                }}
              >
                Удалить
              </button>
            )}
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
              Отмена
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
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Add subtle pulse animation
const styles = `
@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}
.animate-pulse-subtle {
  animation: pulse-subtle 2s ease-in-out infinite;
}
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}
