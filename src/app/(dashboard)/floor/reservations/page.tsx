'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useReservations } from '@/lib/hooks/useReservations'
import { useFloorPlan } from '@/lib/hooks/useFloorPlan'
import { IconCalendar, IconTrash } from '@/components/Icons'
import type { ReservationStatus } from '@/types/database'

const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: 'Ожидает',
  confirmed: 'Подтверждён',
  cancelled: 'Отменён',
  completed: 'Завершён',
}

const STATUS_COLORS: Record<ReservationStatus, string> = {
  pending: 'var(--color-warning)',
  confirmed: 'var(--color-success)',
  cancelled: 'var(--color-danger)',
  completed: 'var(--color-textMuted)',
}

type StatusFilter = 'all' | ReservationStatus

export default function ReservationsPage() {
  const { reservations, loading, updateStatus, assignTable, deleteReservation } = useReservations()
  const { tables } = useFloorPlan()

  const today = new Date().toISOString().split('T')[0]
  const [dateFilter, setDateFilter] = useState(today)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredReservations = reservations.filter(r => {
    if (dateFilter && r.reservation_date !== dateFilter) return false
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    return true
  })

  const availableTables = tables.filter(t => t.status === 'available' || t.status === 'reserved')

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await deleteReservation(id)
    setDeletingId(null)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[var(--color-bgHover)] rounded animate-pulse" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-6 h-32 animate-pulse bg-[var(--color-bgHover)]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <IconCalendar size={24} className="text-[var(--color-primary)]" />
            Бронирования
          </h1>
          <p className="text-[var(--color-textMuted)] mt-1">
            {filteredReservations.length} бронирований
          </p>
        </div>
        <Link
          href="/floor"
          className="text-sm text-[var(--color-primary)] hover:underline"
        >
          ← План зала
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div>
          <label className="block text-xs text-[var(--color-textMuted)] mb-1">Дата</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--color-textMuted)] mb-1">Статус</label>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {([
              ['all', 'Все'],
              ['pending', 'Ожидает'],
              ['confirmed', 'Подтверждён'],
              ['cancelled', 'Отменён'],
            ] as [StatusFilter, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  statusFilter === key
                    ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                    : 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reservations List */}
      {filteredReservations.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">📅</div>
          <h3 className="text-lg font-semibold mb-2">Нет бронирований</h3>
          <p className="text-[var(--color-textMuted)] text-sm">
            На выбранную дату нет бронирований.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map((reservation) => {
            const assignedTable = tables.find(t => t.id === reservation.table_id)

            return (
              <div key={reservation.id} className="card p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Time badge */}
                  <div className="flex-shrink-0 text-center sm:w-20">
                    <div className="text-2xl font-bold">{reservation.reservation_time.slice(0, 5)}</div>
                    <div className="text-xs text-[var(--color-textMuted)]">
                      {new Date(reservation.reservation_date + 'T00:00:00').toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{reservation.guest_name}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-[var(--color-textMuted)]">
                          <span>{reservation.guest_count} чел.</span>
                          {reservation.guest_phone && <span>{reservation.guest_phone}</span>}
                          {reservation.source !== 'online' && (
                            <span className="px-2 py-0.5 rounded text-xs bg-[var(--color-bgHover)]">
                              {reservation.source === 'phone' ? 'Телефон' : 'Без записи'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status badge */}
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium text-white flex-shrink-0"
                        style={{ backgroundColor: STATUS_COLORS[reservation.status] }}
                      >
                        {STATUS_LABELS[reservation.status]}
                      </span>
                    </div>

                    {reservation.notes && (
                      <p className="mt-2 text-sm text-[var(--color-textMuted)] italic">
                        {reservation.notes}
                      </p>
                    )}

                    {/* Table assignment */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {assignedTable ? (
                        <span className="px-3 py-1 rounded-lg text-xs bg-[var(--color-bgHover)]">
                          {assignedTable.name}
                        </span>
                      ) : (
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) assignTable(reservation.id, e.target.value)
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                        >
                          <option value="">Назначить стол</option>
                          {availableTables.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.capacity} чел.)</option>
                          ))}
                        </select>
                      )}

                      {/* Actions */}
                      {reservation.status === 'pending' && (
                        <button
                          onClick={() => updateStatus(reservation.id, 'confirmed')}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-success)]/20 text-[var(--color-success)] hover:bg-[var(--color-success)]/30 transition-colors"
                        >
                          Подтвердить
                        </button>
                      )}
                      {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
                        <button
                          onClick={() => updateStatus(reservation.id, 'cancelled')}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-danger)]/20 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/30 transition-colors"
                        >
                          Отменить
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(reservation.id)}
                        disabled={deletingId === reservation.id}
                        className="p-1.5 rounded-lg text-[var(--color-textMuted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors disabled:opacity-50"
                        aria-label="Удалить бронирование"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
