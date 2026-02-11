'use client'

import { useState } from 'react'
import { FloorPlan } from '@/components/floor/FloorPlan'
import { useFloorPlan } from '@/lib/hooks/useFloorPlan'
import { IconSettings } from '@/components/Icons'
import type { FloorTable } from '@/types/database'

export default function FloorPage() {
  const { tables } = useFloorPlan()
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedTable, setSelectedTable] = useState<FloorTable | null>(null)

  const stats = {
    total: tables.length,
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
  }

  const handleTableSelect = (table: FloorTable) => {
    setSelectedTable(table)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">План зала</h1>
          <p className="text-[var(--color-textMuted)]">
            {stats.available} свободных из {stats.total} столов
          </p>
        </div>
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            isEditMode ? 'ring-2 ring-offset-2 ring-[var(--color-primary)]' : ''
          }`}
          style={{
            background: isEditMode ? 'var(--color-primary)' : 'var(--color-bgHover)',
            color: isEditMode ? 'var(--color-bg)' : 'var(--color-text)',
          }}
        >
          <IconSettings size={18} />
          {isEditMode ? 'Готово' : 'Редактировать'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">Всего столов</div>
          <div className="text-2xl font-bold mt-1">{stats.total}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">Свободно</div>
          <div className="text-2xl font-bold text-[var(--color-success)] mt-1">{stats.available}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">Занято</div>
          <div className="text-2xl font-bold text-[var(--color-primary)] mt-1">{stats.occupied}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">Бронь</div>
          <div className="text-2xl font-bold text-[var(--color-warning)] mt-1">{stats.reserved}</div>
        </div>
      </div>

      {/* Floor Plan */}
      <div className="card p-6">
        <FloorPlan
          editable={isEditMode}
          onTableSelect={handleTableSelect}
        />
      </div>

      {/* Selected Table Info */}
      {selectedTable && !isEditMode && (
        <div
          className="card p-6"
          style={{
            borderColor: selectedTable.status === 'available' ? 'var(--color-success)' :
                         selectedTable.status === 'occupied' ? 'var(--color-primary)' :
                         selectedTable.status === 'reserved' ? 'var(--color-warning)' :
                         'var(--color-border)',
            borderWidth: '2px',
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">{selectedTable.name}</h2>
              <p className="text-sm text-[var(--color-textMuted)]">
                Вместимость: {selectedTable.capacity} человек
              </p>
            </div>
            <span
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{
                background: selectedTable.status === 'available' ? 'var(--color-success)' :
                           selectedTable.status === 'occupied' ? 'var(--color-primary)' :
                           selectedTable.status === 'reserved' ? 'var(--color-warning)' :
                           'var(--color-textMuted)',
                color: 'white',
              }}
            >
              {selectedTable.status === 'available' ? 'Свободен' :
               selectedTable.status === 'occupied' ? 'Занят' :
               selectedTable.status === 'reserved' ? 'Забронирован' :
               'Уборка'}
            </span>
          </div>

          {selectedTable.current_guest_name && (
            <div className="mb-4">
              <p className="text-sm text-[var(--color-textMuted)]">Гость</p>
              <p className="font-medium">{selectedTable.current_guest_name}</p>
            </div>
          )}

          {selectedTable.session_start_time && (
            <div className="mb-4">
              <p className="text-sm text-[var(--color-textMuted)]">Начало сессии</p>
              <p className="font-medium">
                {new Date(selectedTable.session_start_time).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}

          {selectedTable.notes && (
            <div className="p-3 rounded-xl bg-[var(--color-bgHover)]">
              <p className="text-sm text-[var(--color-textMuted)]">{selectedTable.notes}</p>
            </div>
          )}

          <button
            onClick={() => setSelectedTable(null)}
            className="mt-4 px-4 py-2 rounded-xl text-sm"
            style={{
              background: 'var(--color-bgHover)',
              color: 'var(--color-text)',
            }}
          >
            Закрыть
          </button>
        </div>
      )}

      {/* Help text */}
      {isEditMode && (
        <div className="p-4 rounded-xl bg-[var(--color-bgHover)] text-sm text-[var(--color-textMuted)]">
          <p className="font-medium mb-1">Режим редактирования:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Перетаскивайте столы для изменения расположения</li>
            <li>Нажмите на стол для редактирования</li>
            <li>Используйте кнопку &quot;Добавить стол&quot; для создания новых</li>
          </ul>
        </div>
      )}
    </div>
  )
}
