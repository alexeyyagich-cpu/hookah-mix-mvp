'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useReservations } from '@/lib/hooks/useReservations'
import { useFloorPlan } from '@/lib/hooks/useFloorPlan'
import { IconCalendar, IconChevronLeft, IconTrash } from '@/components/Icons'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useTranslation, useLocale, formatDate } from '@/lib/i18n'
import { useRole } from '@/lib/hooks/useRole'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import type { ReservationStatus } from '@/types/database'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const STATUS_COLORS: Record<ReservationStatus, string> = {
  pending: 'var(--color-warning)',
  confirmed: 'var(--color-success)',
  cancelled: 'var(--color-danger)',
  completed: 'var(--color-textMuted)',
}

type StatusFilter = 'all' | ReservationStatus

export default function ReservationsPage() {
  const tm = useTranslation('manage')
  const tc = useTranslation('common')
  const { locale } = useLocale()
  const { orgRole: contextOrgRole } = useOrganizationContext()
  const { hasPermission } = useRole(contextOrgRole)
  const canEdit = hasPermission('floor.edit')
  const { reservations, loading, updateStatus, assignTable, deleteReservation } = useReservations()

  const STATUS_LABELS: Record<ReservationStatus, string> = {
    pending: tm.statusPending,
    confirmed: tm.statusConfirmed,
    cancelled: tm.statusCancelled,
    completed: tm.statusCompleted,
  }
  const { tables } = useFloorPlan()

  const today = new Date().toISOString().split('T')[0]
  const [dateFilter, setDateFilter] = useState(today)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const filteredReservations = useMemo(() => reservations.filter(r => {
    if (dateFilter && r.reservation_date !== dateFilter) return false
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    return true
  }), [reservations, dateFilter, statusFilter])

  const availableTables = useMemo(() => tables.filter(t => t.status === 'available' || t.status === 'reserved'), [tables])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteReservation(id)
    } finally {
      setDeletingId(null)
    }
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
    <ErrorBoundary sectionName="Reservations">
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/floor"
        className="inline-flex items-center gap-2 text-[var(--color-textMuted)] hover:text-[var(--color-text)] transition-colors"
      >
        <IconChevronLeft size={20} />
        {tm.backToFloorPlan}
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <IconCalendar size={24} className="text-[var(--color-primary)]" />
            {tm.reservationsTitle}
          </h1>
          <p className="text-[var(--color-textMuted)] mt-1">
            {tm.reservationsCount(filteredReservations.length)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div>
          <label className="block text-xs text-[var(--color-textMuted)] mb-1">{tm.date}</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--color-textMuted)] mb-1">{tm.filterStatus}</label>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {([
              ['all', tm.filterAll],
              ['pending', tm.statusPending],
              ['confirmed', tm.statusConfirmed],
              ['cancelled', tm.statusCancelled],
            ] as [StatusFilter, string][]).map(([key, label]) => (
              <button type="button"
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
        <EmptyState
          icon={<IconCalendar size={32} />}
          title={tm.noReservations}
          description={tm.noReservationsForDate}
        />
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
                      {formatDate(reservation.reservation_date + 'T00:00:00', locale, 'short')}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{reservation.guest_name}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-[var(--color-textMuted)]">
                          <span>{reservation.guest_count} {tm.guestCountShort}</span>
                          {reservation.guest_phone && <span>{reservation.guest_phone}</span>}
                          {reservation.source !== 'online' && (
                            <span className="px-2 py-0.5 rounded text-xs bg-[var(--color-bgHover)]">
                              {reservation.source === 'phone' ? tm.sourcePhone : tm.sourceWalkIn}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status badge */}
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium text-[var(--color-bg)] flex-shrink-0"
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
                      ) : canEdit ? (
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) assignTable(reservation.id, e.target.value)
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                        >
                          <option value="">{tm.assignTable}</option>
                          {availableTables.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.capacity} {tm.guestCountShort})</option>
                          ))}
                        </select>
                      ) : null}

                      {/* Actions — only for users with floor.edit permission */}
                      {canEdit && reservation.status === 'pending' && (
                        <button type="button"
                          onClick={() => updateStatus(reservation.id, 'confirmed')}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-success)]/20 text-[var(--color-success)] hover:bg-[var(--color-success)]/30 transition-colors"
                        >
                          {tm.confirmReservation}
                        </button>
                      )}
                      {canEdit && (reservation.status === 'pending' || reservation.status === 'confirmed') && (
                        <button type="button"
                          onClick={() => updateStatus(reservation.id, 'cancelled')}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-danger)]/20 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/30 transition-colors"
                        >
                          {tm.cancelAction}
                        </button>
                      )}
                      {canEdit && (
                        <button type="button"
                          onClick={() => setDeleteTarget(reservation.id)}
                          disabled={deletingId === reservation.id}
                          className="p-1.5 rounded-lg text-[var(--color-textMuted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors disabled:opacity-50"
                          aria-label={tm.deleteReservation}
                        >
                          <IconTrash size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        title={tm.deleteReservation}
        message={tc.deleteWarning}
        danger
        onConfirm={async () => {
          if (deleteTarget) {
            await handleDelete(deleteTarget)
          }
          setDeleteTarget(null)
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
    </ErrorBoundary>
  )
}
