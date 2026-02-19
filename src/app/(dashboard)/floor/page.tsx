'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FloorPlan, STATUS_COLORS as TABLE_STATUS_COLORS } from '@/components/floor/FloorPlan'
import { useFloorPlan } from '@/lib/hooks/useFloorPlan'
import { useReservations } from '@/lib/hooks/useReservations'
import { IconSettings, IconCalendar } from '@/components/Icons'
import { useTranslation, useLocale } from '@/lib/i18n'

const LOCALE_MAP: Record<string, string> = { ru: 'ru-RU', en: 'en-US', de: 'de-DE' }
import type { FloorTable, ReservationStatus } from '@/types/database'

const RESERVATION_STATUS_COLORS: Record<ReservationStatus, string> = {
  pending: 'var(--color-warning)',
  confirmed: 'var(--color-success)',
  cancelled: 'var(--color-danger)',
  completed: 'var(--color-textMuted)',
}

export default function FloorPage() {
  const tm = useTranslation('manage')
  const tc = useTranslation('common')
  const { locale } = useLocale()
  const floorPlan = useFloorPlan()
  const { tables, setTableStatus, loading } = floorPlan
  const { reservations } = useReservations()
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedTable, setSelectedTable] = useState<FloorTable | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const todayReservations = reservations
    .filter(r => r.reservation_date === today && r.status !== 'cancelled' && r.status !== 'completed')
    .sort((a, b) => a.reservation_time.localeCompare(b.reservation_time))
    .slice(0, 5)

  const stats = {
    total: tables.length,
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
  }

  // Keep selectedTable in sync with tables array
  const activeSelectedTable = selectedTable
    ? tables.find(t => t.id === selectedTable.id) || selectedTable
    : null

  const handleTableSelect = (table: FloorTable) => {
    setSelectedTable(table)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{tm.floorTitle}</h1>
          <p className="text-[var(--color-textMuted)]">
            {tm.floorAvailableOfTotal(stats.available, stats.total)}
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
          {isEditMode ? tm.ready : tc.edit}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">{tm.totalTables}</div>
          <div className="text-2xl font-bold mt-1">{stats.total}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">{tm.freeCount}</div>
          <div className="text-2xl font-bold text-[var(--color-success)] mt-1">{stats.available}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">{tm.occupiedCount}</div>
          <div className="text-2xl font-bold text-[var(--color-primary)] mt-1">{stats.occupied}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">{tm.reservedCount}</div>
          <div className="text-2xl font-bold text-[var(--color-warning)] mt-1">{stats.reserved}</div>
        </div>
      </div>

      {/* Today's Reservations Widget */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <IconCalendar size={18} className="text-[var(--color-primary)]" />
            {tm.todayReservations}
          </h2>
          <Link
            href="/floor/reservations"
            className="text-sm text-[var(--color-primary)] hover:underline"
          >
            {tm.allReservations}
          </Link>
        </div>

        {todayReservations.length === 0 ? (
          <p className="text-sm text-[var(--color-textMuted)]">{tm.noTodayReservations}</p>
        ) : (
          <div className="space-y-2">
            {todayReservations.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between py-2 px-3 rounded-xl bg-[var(--color-bgHover)]"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold text-sm">{r.reservation_time.slice(0, 5)}</span>
                  <span className="text-sm">{r.guest_name}</span>
                  <span className="text-xs text-[var(--color-textMuted)]">{r.guest_count} {tm.guestCountShort}</span>
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: RESERVATION_STATUS_COLORS[r.status] }}
                >
                  {r.status === 'pending' ? tm.statusPending : tm.statusConfirmed}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floor Plan — single useFloorPlan instance passed as props */}
      <div className="card p-6">
        <FloorPlan
          tables={tables}
          loading={loading}
          editable={isEditMode}
          onTableSelect={handleTableSelect}
          addTable={floorPlan.addTable}
          updateTable={floorPlan.updateTable}
          deleteTable={floorPlan.deleteTable}
          moveTable={floorPlan.moveTable}
          setTableStatus={floorPlan.setTableStatus}
        />
      </div>

      {/* Selected Table Info */}
      {activeSelectedTable && !isEditMode && (
        <div
          className="card p-6"
          style={{
            borderColor: activeSelectedTable.status === 'available' ? 'var(--color-success)' :
                         activeSelectedTable.status === 'occupied' ? 'var(--color-primary)' :
                         activeSelectedTable.status === 'reserved' ? 'var(--color-warning)' :
                         'var(--color-border)',
            borderWidth: '2px',
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">{activeSelectedTable.name}</h2>
              <p className="text-sm text-[var(--color-textMuted)]">
                {tm.capacity(activeSelectedTable.capacity)}
              </p>
            </div>
            <span
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{
                background: TABLE_STATUS_COLORS[activeSelectedTable.status].bg,
                color: 'white',
              }}
            >
              {activeSelectedTable.status === 'available' ? tm.statusAvailable :
               activeSelectedTable.status === 'occupied' ? tm.statusOccupied :
               activeSelectedTable.status === 'reserved' ? tm.statusReserved :
               tm.statusCleaning}
            </span>
          </div>

          {activeSelectedTable.current_guest_name && (
            <div className="mb-4">
              <p className="text-sm text-[var(--color-textMuted)]">{tm.currentGuest}</p>
              <p className="font-medium">{activeSelectedTable.current_guest_name}</p>
            </div>
          )}

          {activeSelectedTable.session_start_time && (
            <div className="mb-4">
              <p className="text-sm text-[var(--color-textMuted)]">{tm.sessionStart}</p>
              <p className="font-medium">
                {new Date(activeSelectedTable.session_start_time).toLocaleTimeString(LOCALE_MAP[locale] || 'ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}

          {activeSelectedTable.notes && (
            <div className="p-3 rounded-xl bg-[var(--color-bgHover)]">
              <p className="text-sm text-[var(--color-textMuted)]">{activeSelectedTable.notes}</p>
            </div>
          )}

          {/* Status change buttons */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {([
              { status: 'available' as const, label: tm.statusAvailable, color: 'var(--color-success)' },
              { status: 'occupied' as const, label: tm.statusOccupied, color: 'var(--color-primary)' },
              { status: 'reserved' as const, label: tm.statusReserved, color: 'var(--color-warning)' },
              { status: 'cleaning' as const, label: tm.statusCleaning, color: 'var(--color-textMuted)' },
            ] as const).map(({ status, label, color }) => (
              <button
                key={status}
                onClick={async () => {
                  await setTableStatus(activeSelectedTable.id, status)
                }}
                disabled={activeSelectedTable.status === status}
                className="px-3 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: activeSelectedTable.status === status ? color : 'var(--color-bgHover)',
                  color: activeSelectedTable.status === status ? 'white' : 'var(--color-text)',
                  opacity: activeSelectedTable.status === status ? 1 : 0.8,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSelectedTable(null)}
            className="mt-3 px-4 py-2 rounded-xl text-sm w-full"
            style={{
              background: 'var(--color-bgHover)',
              color: 'var(--color-text)',
            }}
          >
            {tc.close}
          </button>
        </div>
      )}

      {/* Help text */}
      {isEditMode && (
        <div className="p-4 rounded-xl bg-[var(--color-bgHover)] text-sm text-[var(--color-textMuted)]">
          <p className="font-medium mb-1">{tm.editModeTitle}</p>
          <ul className="list-disc list-inside space-y-1">
            <li>{tm.editModeDrag}</li>
            <li>{tm.editModeClick}</li>
            <li>{tm.editModeAdd}</li>
          </ul>
        </div>
      )}
    </div>
  )
}
