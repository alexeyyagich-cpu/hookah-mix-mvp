'use client'

import Link from 'next/link'
import { STATUS_COLORS as TABLE_STATUS_COLORS, LONG_SESSION_MINUTES } from '@/components/floor/FloorPlan'
import { LazyQRCode as QRCodeCanvas } from '@/components/ui/LazyQRCode'
import { useTranslation, formatTime, useLocale } from '@/lib/i18n'
import type { FloorTable, Reservation, ReservationStatus, Guest } from '@/types/database'
import type { QuickRepeatResult, QuickRepeatError } from '@/logic/quickRepeatEngine'
import type React from 'react'

const RESERVATION_STATUS_COLORS: Record<ReservationStatus, string> = {
  pending: 'var(--color-warning)',
  confirmed: 'var(--color-success)',
  cancelled: 'var(--color-danger)',
  completed: 'var(--color-textMuted)',
}

// Exported so callers can reference it if needed
export { RESERVATION_STATUS_COLORS }

export interface FloorTablePanelProps {
  table: FloorTable
  linkedReservation: Reservation | null | undefined
  unlinkedReservations: Reservation[]
  filteredGuests: Guest[]
  occupiedGuest: Guest | null
  serveRepeatResult: QuickRepeatResult | QuickRepeatError | null
  serveStatus: 'idle' | 'serving' | 'served'
  deductInventory: boolean
  statusChanging: boolean
  quickReserving: boolean
  guestSearch: string
  showQuickReserve: boolean
  showGuestPicker: boolean
  showLinkPicker: boolean
  quickForm: {
    guest_name: string
    guest_phone: string
    guest_count: string
    reservation_time: string
  }
  qrTableId: string | null
  qrCanvasRef: React.RefObject<HTMLCanvasElement | null>
  venueSlug: string | null | undefined
  // Handlers
  onStartSession: (guestName: string, guest?: Guest) => void
  onEndSession: () => void
  onConfirmServe: () => void
  onQuickReserve: () => void
  onLinkReservation: (reservationId: string) => void
  onUnlinkReservation: () => void
  onDownloadQr: (table: FloorTable) => void
  onStatusChange: (
    status: 'available' | 'occupied' | 'reserved' | 'cleaning'
  ) => void
  onClose: () => void
  onGuestSearchChange: (value: string) => void
  onShowQuickReserve: (show: boolean) => void
  onShowGuestPicker: (show: boolean) => void
  onShowLinkPicker: (show: boolean) => void
  onQuickFormChange: (
    field: keyof FloorTablePanelProps['quickForm'],
    value: string
  ) => void
  onDeductInventoryChange: (value: boolean) => void
  onSetQrTableId: (id: string | null) => void
}

export default function FloorTablePanel({
  table,
  linkedReservation,
  unlinkedReservations,
  filteredGuests,
  occupiedGuest,
  serveRepeatResult,
  serveStatus,
  deductInventory,
  statusChanging,
  quickReserving,
  guestSearch,
  showQuickReserve,
  showGuestPicker,
  showLinkPicker,
  quickForm,
  qrTableId,
  qrCanvasRef,
  venueSlug,
  onStartSession,
  onEndSession,
  onConfirmServe,
  onQuickReserve,
  onLinkReservation,
  onUnlinkReservation,
  onDownloadQr,
  onStatusChange,
  onClose,
  onGuestSearchChange,
  onShowQuickReserve,
  onShowGuestPicker,
  onShowLinkPicker,
  onQuickFormChange,
  onDeductInventoryChange,
}: FloorTablePanelProps) {
  const tm = useTranslation('manage')
  const tc = useTranslation('common')
  const { locale } = useLocale()

  return (
    <>
      {/* Selected Table Info */}
      <div
        className="card p-6"
        style={{
          borderColor: TABLE_STATUS_COLORS[table.status].bg,
          borderWidth: '2px',
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{table.name}</h2>
              <button type="button"
                onClick={(e) => { e.stopPropagation(); onDownloadQr(table) }}
                className="min-w-[44px] min-h-[44px] p-2.5 rounded text-xs text-[var(--color-textMuted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bgCard)] flex items-center justify-center"
                title={tm.downloadTableQr}
                aria-label={tm.downloadTableQr}
              >
                QR
              </button>
            </div>
            <p className="text-sm text-[var(--color-textMuted)]">
              {tm.capacity(table.capacity)}
            </p>
          </div>
          <span
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{
              background: TABLE_STATUS_COLORS[table.status].bg,
              color: 'var(--color-bg)',
            }}
          >
            {table.status === 'available' ? tm.statusAvailable :
             table.status === 'occupied' ? tm.statusOccupied :
             table.status === 'reserved' ? tm.statusReserved :
             tm.statusCleaning}
          </span>
        </div>

        {table.current_guest_name && (
          <div className="mb-4">
            <p className="text-sm text-[var(--color-textMuted)]">{tm.currentGuest}</p>
            <p className="font-medium">{table.current_guest_name}</p>
          </div>
        )}

        {table.session_start_time && (
          <div className="mb-4">
            <p className="text-sm text-[var(--color-textMuted)]">{tm.sessionStart}</p>
            <p className="font-medium">
              {formatTime(table.session_start_time, locale)}
            </p>
          </div>
        )}

        {/* Long session warning */}
        {table.status === 'occupied' && table.session_start_time &&
          (Date.now() - new Date(table.session_start_time).getTime()) / 60000 >= LONG_SESSION_MINUTES && (
          <div className="mb-4 p-3 rounded-xl bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 flex items-center gap-2">
            <span className="text-lg">&#9888;</span>
            <span className="text-sm font-medium text-[var(--color-warning)]">
              {tm.floorSessionExceeds(Math.floor((Date.now() - new Date(table.session_start_time).getTime()) / 60000))}
            </span>
          </div>
        )}

        {table.notes && (
          <div className="p-3 rounded-xl bg-[var(--color-bgHover)] mb-4">
            <p className="text-sm text-[var(--color-textMuted)]">{table.notes}</p>
          </div>
        )}

        {/* Linked Reservation Details */}
        {linkedReservation && (
          <div className="p-4 rounded-xl mb-4" style={{ background: 'var(--color-warning)', color: 'var(--color-bg)', opacity: 0.95 }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm">{tm.reservationDetails}</span>
              <button type="button"
                onClick={onUnlinkReservation}
                className="text-xs px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                {tm.unlinkReservation}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="opacity-80">{tm.reservationGuest}:</span>{' '}
                <span className="font-medium">{linkedReservation.guest_name}</span>
              </div>
              <div>
                <span className="opacity-80">{tm.reservationTime}:</span>{' '}
                <span className="font-medium">{linkedReservation.reservation_time.slice(0, 5)}</span>
              </div>
              <div>
                <span className="opacity-80">{tm.reservationGuests}:</span>{' '}
                <span className="font-medium">{linkedReservation.guest_count}</span>
              </div>
              {linkedReservation.guest_phone && (
                <div>
                  <span className="opacity-80">{tm.reservationPhone}:</span>{' '}
                  <span className="font-medium">{linkedReservation.guest_phone}</span>
                </div>
              )}
            </div>
            {linkedReservation.notes && (
              <div className="mt-2 text-sm">
                <span className="opacity-80">{tm.reservationNotes}:</span>{' '}
                {linkedReservation.notes}
              </div>
            )}
          </div>
        )}

        {/* Session action buttons */}
        {table.status === 'occupied' && table.session_start_time && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[var(--color-danger)] animate-pulse" />
              <span className="text-sm font-medium text-[var(--color-danger)]">{tm.sessionActive}</span>
            </div>
            <button type="button"
              onClick={onEndSession}
              className="btn btn-danger btn-sm w-full"
            >
              {tm.endSessionBtn}
            </button>
          </div>
        )}

        {/* One-Tap Serve Panel */}
        {table.status === 'occupied' && occupiedGuest && serveRepeatResult && (
          <div className="mb-4 p-4 rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/5">
            {serveRepeatResult.success ? (
              <>
                <h3 className="font-semibold text-sm mb-3">{tm.lastMixOf(occupiedGuest.name)}</h3>

                {/* Tobacco pills */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {serveRepeatResult.tobaccos.map((rt, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: rt.tobacco.color + '20',
                        color: rt.tobacco.color,
                        border: `1px solid ${rt.tobacco.color}40`,
                        opacity: rt.available ? 1 : 0.5,
                        textDecoration: !rt.available && !rt.replacement ? 'line-through' : 'none',
                      }}
                    >
                      {rt.tobacco.flavor} ({rt.percent}%)
                    </span>
                  ))}
                </div>

                {/* Mix details */}
                <p className="text-xs text-[var(--color-textMuted)] mb-2">
                  {tm.serveGrams(serveRepeatResult.snapshot.total_grams)}
                  {serveRepeatResult.snapshot.bowl_type && ` · ${serveRepeatResult.snapshot.bowl_type}`}
                  {serveRepeatResult.snapshot.heat_setup && ` · ${tm.serveCoals(serveRepeatResult.snapshot.heat_setup.coals)}`}
                </p>

                {/* Warnings */}
                {serveRepeatResult.warnings.length > 0 && (
                  <div className="mb-3 space-y-1">
                    {serveRepeatResult.warnings.map((w, i) => (
                      <p key={i} className="text-xs px-2 py-1 rounded-lg bg-[var(--color-warning)]/10 text-[var(--color-warning)]">
                        {w.message}
                      </p>
                    ))}
                  </div>
                )}

                {/* Deduct toggle */}
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deductInventory}
                    onChange={(e) => onDeductInventoryChange(e.target.checked)}
                    className="w-4 h-4 rounded accent-[var(--color-success)]"
                  />
                  <span className="text-sm">{tm.deductFromStock}</span>
                </label>

                {/* Serve + Create new mix buttons */}
                <div className="flex gap-2">
                  <button type="button"
                    onClick={onConfirmServe}
                    disabled={serveStatus !== 'idle'}
                    className="btn btn-success btn-sm flex-1 disabled:opacity-60"
                  >
                    {serveStatus === 'serving' ? tm.serving :
                     serveStatus === 'served' ? tm.served :
                     tm.serveLastMix}
                  </button>
                  <Link
                    href="/mix"
                    className="btn btn-ghost btn-sm flex-1"
                  >
                    {tm.createNewMix}
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-[var(--color-textMuted)] mb-3">
                  {tm.noSavedMix(occupiedGuest.name)}
                </p>
                <Link
                  href="/mix"
                  className="btn btn-primary btn-sm w-full"
                >
                  {tm.createNewMix}
                </Link>
              </>
            )}
          </div>
        )}

        {/* Status change buttons */}
        <div className="grid grid-cols-2 gap-2">
          {([
            { status: 'available' as const, label: tm.statusAvailable, color: 'var(--color-success)' },
            { status: 'occupied' as const, label: tm.statusOccupied, color: 'var(--color-danger)' },
            { status: 'reserved' as const, label: tm.statusReserved, color: 'var(--color-warning)' },
            { status: 'cleaning' as const, label: tm.statusCleaning, color: 'var(--color-textMuted)' },
          ] as const).map(({ status, label, color }) => (
            <button type="button"
              key={status}
              onClick={async () => {
                if (statusChanging) return
                if (status === 'occupied' && table.status !== 'occupied') {
                  onShowGuestPicker(true)
                  onShowQuickReserve(false)
                  onShowLinkPicker(false)
                  return
                }
                if (status === 'reserved' && table.status !== 'reserved') {
                  onShowQuickReserve(true)
                  onShowLinkPicker(false)
                  onShowGuestPicker(false)
                  return
                }
                onStatusChange(status)
              }}
              disabled={table.status === status || statusChanging}
              aria-pressed={table.status === status}
              className="px-3 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: table.status === status ? color : 'var(--color-bgHover)',
                color: table.status === status ? 'var(--color-bg)' : 'var(--color-text)',
                opacity: table.status === status ? 1 : 0.8,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Guest Picker (for starting session) */}
        {showGuestPicker && (
          <div className="mt-4 p-4 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5">
            <h3 className="font-semibold text-sm mb-3">{tm.guestOptional}</h3>
            <input
              type="text"
              value={guestSearch}
              onChange={(e) => onGuestSearchChange(e.target.value)}
              placeholder={tm.guestNamePlaceholder}
              aria-label={tm.guestNamePlaceholder}
              className="w-full px-3 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-sm mb-2"
            />
            {filteredGuests.length > 0 && (
              <div className="mb-2 max-h-40 overflow-y-auto space-y-1">
                {filteredGuests.map(g => (
                  <button type="button"
                    key={g.id}
                    onClick={() => onStartSession(g.name, g)}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-[var(--color-bgHover)] hover:bg-[var(--color-primary)]/10 transition-colors text-left text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{g.name}</span>
                      {g.last_mix_snapshot && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-success)]/20 text-[var(--color-success)]">{tm.hasMix}</span>
                      )}
                    </div>
                    {g.visit_count > 0 && (
                      <span className="text-xs text-[var(--color-textMuted)]">{g.visit_count}x</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <button type="button"
                onClick={() => { onShowGuestPicker(false); onGuestSearchChange('') }}
                className="btn btn-ghost btn-sm flex-1"
              >
                {tm.cancelBtn}
              </button>
              <button type="button"
                onClick={() => onStartSession(guestSearch || '')}
                className="btn btn-primary btn-sm flex-1"
              >
                {tm.startSessionBtn}
              </button>
            </div>
          </div>
        )}

        {/* Quick Reserve Form */}
        {showQuickReserve && (
          <div className="mt-4 p-4 rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5">
            <h3 className="font-semibold text-sm mb-3">{tm.quickReserve}</h3>

            {/* Option to link existing reservation */}
            {unlinkedReservations.length > 0 && !showLinkPicker && (
              <button type="button"
                onClick={() => onShowLinkPicker(true)}
                className="w-full mb-3 px-3 py-2 rounded-xl text-sm font-medium border border-dashed border-[var(--color-warning)] text-[var(--color-warning)] hover:bg-[var(--color-warning)]/10 transition-colors"
              >
                {tm.linkReservation} ({unlinkedReservations.length})
              </button>
            )}

            {/* Link picker */}
            {showLinkPicker && (
              <div className="mb-3 space-y-2">
                {unlinkedReservations.map(r => (
                  <button type="button"
                    key={r.id}
                    onClick={() => onLinkReservation(r.id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--color-bgHover)] hover:bg-[var(--color-warning)]/10 transition-colors text-left"
                  >
                    <div>
                      <span className="font-medium text-sm">{r.guest_name}</span>
                      <span className="text-xs text-[var(--color-textMuted)] ml-2">
                        {r.guest_count} {tm.guestCountShort}
                      </span>
                    </div>
                    <span className="font-mono text-sm font-semibold">{r.reservation_time.slice(0, 5)}</span>
                  </button>
                ))}
                <button type="button"
                  onClick={() => onShowLinkPicker(false)}
                  className="w-full text-xs text-[var(--color-textMuted)] py-1"
                >
                  {tm.cancelBtn}
                </button>
              </div>
            )}

            {/* Or create new reservation */}
            {!showLinkPicker && (
              <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onQuickReserve() }}>
                <input
                  type="text"
                  value={quickForm.guest_name}
                  onChange={(e) => onQuickFormChange('guest_name', e.target.value)}
                  placeholder={tm.guestNamePlaceholder}
                  aria-label={tm.guestNamePlaceholder}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-warning)] focus-visible:ring-2 focus-visible:ring-[var(--color-warning)] focus:outline-none text-sm"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="time"
                    value={quickForm.reservation_time}
                    onChange={(e) => onQuickFormChange('reservation_time', e.target.value)}
                    className="px-3 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-warning)] focus-visible:ring-2 focus-visible:ring-[var(--color-warning)] focus:outline-none text-sm"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    value={quickForm.guest_count}
                    onChange={(e) => onQuickFormChange('guest_count', e.target.value)}
                    min="1"
                    max="20"
                    step="1"
                    placeholder={tm.guestCountLabel}
                    aria-label={tm.guestCountLabel}
                    className="px-3 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-warning)] focus-visible:ring-2 focus-visible:ring-[var(--color-warning)] focus:outline-none text-sm"
                  />
                  <input
                    type="tel"
                    value={quickForm.guest_phone}
                    onChange={(e) => onQuickFormChange('guest_phone', e.target.value)}
                    placeholder={tm.guestPhonePlaceholder}
                    aria-label={tm.guestPhonePlaceholder}
                    className="px-3 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-warning)] focus-visible:ring-2 focus-visible:ring-[var(--color-warning)] focus:outline-none text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="button"
                    onClick={() => onShowQuickReserve(false)}
                    className="btn btn-ghost btn-sm flex-1"
                  >
                    {tm.cancelBtn}
                  </button>
                  <button type="submit"
                    disabled={quickReserving || !quickForm.guest_name || !quickForm.reservation_time}
                    className="btn btn-warning btn-sm flex-1"
                  >
                    {quickReserving ? tm.reserving : tm.reserveBtn}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <button type="button"
          onClick={onClose}
          className="mt-3 px-4 py-2 rounded-xl text-sm w-full"
          style={{
            background: 'var(--color-bgHover)',
            color: 'var(--color-text)',
          }}
        >
          {tc.close}
        </button>
      </div>

      {/* Hidden QR canvas for download */}
      {qrTableId && venueSlug && (
        <div className="fixed -left-[9999px]" aria-hidden="true">
          <QRCodeCanvas
            ref={qrCanvasRef}
            value={`${process.env.NEXT_PUBLIC_APP_URL || 'https://hookahtorus.com'}/menu/${venueSlug}?table=${qrTableId}`}
            size={512}
            level="M"
          />
        </div>
      )}
    </>
  )
}
