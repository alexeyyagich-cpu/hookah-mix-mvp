'use client'

import { useState, useMemo, useCallback, useRef, } from 'react'
import Link from 'next/link'
import { FloorPlan, STATUS_COLORS as TABLE_STATUS_COLORS, LONG_SESSION_MINUTES } from '@/components/floor/FloorPlan'
import { useFloorPlan } from '@/lib/hooks/useFloorPlan'
import { useReservations } from '@/lib/hooks/useReservations'
import { useInventory } from '@/lib/hooks/useInventory'
import { useSessions } from '@/lib/hooks/useSessions'
import { IconSettings, IconCalendar } from '@/components/Icons'
import { useTranslation, useLocale, LOCALE_MAP } from '@/lib/i18n'
import { useAuth } from '@/lib/AuthContext'
import { useGuests } from '@/lib/hooks/useGuests'
import { useKDS } from '@/lib/hooks/useKDS'
import { quickRepeatGuest } from '@/logic/quickRepeatEngine'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import { useRole } from '@/lib/hooks/useRole'
import { QRCodeCanvas } from 'qrcode.react'
import { toast } from 'sonner'

import type { FloorTable, ReservationStatus, Guest } from '@/types/database'

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
  const { user, isDemoMode, profile } = useAuth()
  const { organizationId, locationId, orgRole: contextOrgRole } = useOrganizationContext()
  const { hasPermission } = useRole(contextOrgRole)
  const floorPlan = useFloorPlan()
  const { tables, setTableStatus, startSession, endSession, loading } = floorPlan
  const { reservations, createReservation, assignTable, refresh: refreshReservations } = useReservations()
  const { guests, recordVisit } = useGuests()
  const { inventory } = useInventory()
  const { createSession } = useSessions()
  const { createOrder: createKdsOrder } = useKDS()
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedTable, setSelectedTable] = useState<FloorTable | null>(null)
  const [showQuickReserve, setShowQuickReserve] = useState(false)
  const [showLinkPicker, setShowLinkPicker] = useState(false)
  const [showGuestPicker, setShowGuestPicker] = useState(false)
  const [guestSearch, setGuestSearch] = useState('')
  const [selectedGuestObj, setSelectedGuestObj] = useState<Guest | null>(null)
  const [deductInventory, setDeductInventory] = useState(true)
  const [serveStatus, setServeStatus] = useState<'idle' | 'serving' | 'served'>('idle')
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)
  const [qrTableId, setQrTableId] = useState<string | null>(null)
  const [quickReserving, setQuickReserving] = useState(false)
  const [zoneFilter, setZoneFilter] = useState<string | null>(null)
  const [quickForm, setQuickForm] = useState({
    guest_name: '',
    guest_phone: '',
    guest_count: '2',
    reservation_time: '',
  })

  // Extract unique zones for filter pills
  const zones = useMemo(() =>
    [...new Set(tables.map(t => t.zone).filter((z): z is string => !!z))].sort(),
    [tables]
  )

  // Filter tables by zone
  const filteredTables = useMemo(() => {
    if (!zoneFilter) return tables
    return tables.filter(t => (t.zone || null) === zoneFilter)
  }, [tables, zoneFilter])

  const today = new Date().toISOString().split('T')[0]
  const todayReservations = reservations
    .filter(r => r.reservation_date === today && r.status !== 'cancelled' && r.status !== 'completed')
    .sort((a, b) => a.reservation_time.localeCompare(b.reservation_time))

  const activeTables = zoneFilter ? filteredTables : tables
  const longSessionCount = activeTables.filter(t =>
    t.status === 'occupied' && t.session_start_time &&
    (Date.now() - new Date(t.session_start_time).getTime()) / 60000 >= LONG_SESSION_MINUTES
  ).length
  const stats = {
    total: activeTables.length,
    available: activeTables.filter(t => t.status === 'available').length,
    occupied: activeTables.filter(t => t.status === 'occupied').length,
    reserved: activeTables.filter(t => t.status === 'reserved').length,
  }

  // Keep selectedTable in sync with tables array
  const activeSelectedTable = selectedTable
    ? tables.find(t => t.id === selectedTable.id) || selectedTable
    : null

  // Find reservation linked to selected table
  const linkedReservation = activeSelectedTable
    ? todayReservations.find(r => r.table_id === activeSelectedTable.id)
    : null

  // Unlinked today's reservations (for link picker)
  const unlinkedReservations = todayReservations.filter(r => !r.table_id)

  // Filtered guests for picker
  const filteredGuests = guestSearch.trim()
    ? guests.filter(g => g.name.toLowerCase().includes(guestSearch.toLowerCase()))
    : guests.slice(0, 10)

  // Recover guest object for occupied table (from state or by name match)
  const occupiedGuest = useMemo(() => {
    if (selectedGuestObj) return selectedGuestObj
    if (activeSelectedTable?.status === 'occupied' && activeSelectedTable.current_guest_name) {
      return guests.find(g => g.name === activeSelectedTable.current_guest_name) || null
    }
    return null
  }, [selectedGuestObj, activeSelectedTable, guests])

  // Quick-repeat result for the occupied guest
  const serveRepeatResult = useMemo(() => {
    if (!occupiedGuest || activeSelectedTable?.status !== 'occupied') return null
    return quickRepeatGuest(occupiedGuest, inventory)
  }, [occupiedGuest, activeSelectedTable, inventory])

  const handleTableSelect = (table: FloorTable) => {
    setSelectedTable(table)
    setShowQuickReserve(false)
    setShowLinkPicker(false)
    setShowGuestPicker(false)
    setGuestSearch('')
    setSelectedGuestObj(null)
    setServeStatus('idle')
  }

  const handleStartSession = async (guestName: string, guest?: Guest) => {
    if (!activeSelectedTable) return
    const sessionId = crypto.randomUUID()
    await startSession(activeSelectedTable.id, sessionId, guestName)
    setSelectedGuestObj(guest || null)
    setServeStatus('idle')
    setShowGuestPicker(false)
    setGuestSearch('')
  }

  const handleEndSession = async () => {
    if (!activeSelectedTable) return
    await endSession(activeSelectedTable.id)
    setSelectedGuestObj(null)
    setServeStatus('idle')
  }

  const handleConfirmServe = async () => {
    if (!serveRepeatResult || !serveRepeatResult.success || !occupiedGuest || !user) return
    setServeStatus('serving')

    try {
      const { snapshot, tobaccos: resolvedTobaccos } = serveRepeatResult

      // Build session items matching inventory
      const sessionItems = resolvedTobaccos
        .filter(rt => rt.available || rt.replacement)
        .map(rt => {
          const tobacco = rt.replacement || rt.tobacco
          const invItem = inventory.find(
            inv => inv.tobacco_id === tobacco.id ||
              (inv.brand.toLowerCase() === tobacco.brand.toLowerCase() && inv.flavor.toLowerCase() === tobacco.flavor.toLowerCase())
          )
          const gramsUsed = Math.round((snapshot.total_grams * rt.percent) / 100)
          return {
            tobacco_inventory_id: invItem?.id || null,
            tobacco_id: tobacco.id,
            brand: tobacco.brand,
            flavor: tobacco.flavor,
            grams_used: gramsUsed,
            percentage: rt.percent,
          }
        })

      // Create session
      await createSession(
        {
          bowl_type_id: null,
          session_date: new Date().toISOString(),
          total_grams: snapshot.total_grams,
          compatibility_score: snapshot.compatibility_score,
          notes: null,
          rating: null,
          duration_minutes: null,
          selling_price: null,
          created_by: user.id,
          guest_id: occupiedGuest.id,
        },
        sessionItems,
        deductInventory
      )

      // Record visit in guest CRM
      await recordVisit(occupiedGuest.id, snapshot)

      // Send KDS order (non-blocking)
      try {
        await createKdsOrder({
          table_id: activeSelectedTable?.id || null,
          table_name: activeSelectedTable?.name || null,
          guest_name: occupiedGuest.name,
          type: 'hookah',
          items: [{
            name: resolvedTobaccos
              .filter(rt => rt.available || rt.replacement)
              .map(rt => {
                const tob = rt.replacement || rt.tobacco
                return `${tob.flavor} (${rt.percent}%)`
              })
              .join(' + '),
            quantity: 1,
            details: `${snapshot.total_grams}g, ${snapshot.bowl_type || ''}`,
            hookah_data: {
              tobaccos: resolvedTobaccos
                .filter(rt => rt.available || rt.replacement)
                .map(rt => {
                  const tob = rt.replacement || rt.tobacco
                  return {
                    tobacco_id: tob.id,
                    brand: tob.brand,
                    flavor: tob.flavor,
                    percent: rt.percent,
                    color: tob.color,
                  }
                }),
              total_grams: snapshot.total_grams,
              bowl_name: snapshot.bowl_type || null,
              bowl_id: null,
              heat_setup: snapshot.heat_setup || null,
              strength: snapshot.strength || null,
              compatibility_score: snapshot.compatibility_score,
            },
          }],
          notes: null,
        })
      } catch (e) {
        console.error('KDS order failed:', e)
      }

      setServeStatus('served')
      setTimeout(() => setServeStatus('idle'), 1500)
    } catch (err) {
      console.error('Serve error:', err)
      setServeStatus('idle')
    }
  }

  const handleQuickReserve = async () => {
    if (!activeSelectedTable || !quickForm.guest_name || !quickForm.reservation_time) return
    setQuickReserving(true)

    try {
      const newRes = await createReservation({
        table_id: activeSelectedTable.id,
        guest_name: quickForm.guest_name,
        guest_phone: quickForm.guest_phone || null,
        guest_count: parseInt(quickForm.guest_count) || 2,
        reservation_date: today,
        reservation_time: quickForm.reservation_time,
        source: 'walk_in',
      })

      if (!newRes) throw new Error('Failed to create reservation')

      await setTableStatus(activeSelectedTable.id, 'reserved', quickForm.guest_name)

      setShowQuickReserve(false)
      setQuickForm({ guest_name: '', guest_phone: '', guest_count: '2', reservation_time: '' })
    } catch (err) {
      console.error('Quick reserve error:', err)
    }
    setQuickReserving(false)
  }

  const handleLinkReservation = async (reservationId: string) => {
    if (!activeSelectedTable) return
    await assignTable(reservationId, activeSelectedTable.id)

    // Find the reservation to get the guest name
    const res = todayReservations.find(r => r.id === reservationId)
    if (res) {
      await setTableStatus(activeSelectedTable.id, 'reserved', res.guest_name)
    }
    setShowLinkPicker(false)
  }

  const handleUnlinkReservation = async () => {
    if (!linkedReservation || !activeSelectedTable) return
    await assignTable(linkedReservation.id, null)
    await setTableStatus(activeSelectedTable.id, 'available')
  }

  const handleDownloadQr = useCallback((table: FloorTable) => {
    if (!profile?.venue_slug) {
      toast.error(tm.noVenueSlugForQr)
      return
    }
    setQrTableId(table.id)
    setTimeout(() => {
      const canvas = qrCanvasRef.current
      if (!canvas) return
      const url = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `qr-${table.name}.png`
      link.href = url
      link.click()
      setQrTableId(null)
      toast.success(tm.tableQrDownloaded)
    }, 100)
  }, [profile?.venue_slug, tm])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{tm.floorTitle}</h1>
        <p className="text-[var(--color-textMuted)]">
          {tm.floorAvailableOfTotal(stats.available, stats.total)}
        </p>
      </div>

      {/* Stats Cards */}
      <div className={`grid grid-cols-2 ${longSessionCount > 0 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
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
          <div className="text-2xl font-bold text-[var(--color-danger)] mt-1">{stats.occupied}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[var(--color-textMuted)]">{tm.reservedCount}</div>
          <div className="text-2xl font-bold text-[var(--color-warning)] mt-1">{stats.reserved}</div>
        </div>
        {longSessionCount > 0 && (
          <div className="card p-4 border-[var(--color-warning)] border-2">
            <div className="text-sm text-[var(--color-warning)]">&#9888; {tm.floorLongSession}</div>
            <div className="text-2xl font-bold text-[var(--color-warning)] mt-1">{longSessionCount}</div>
          </div>
        )}
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
            {todayReservations.slice(0, 5).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between py-2 px-3 rounded-xl bg-[var(--color-bgHover)]"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="font-mono font-semibold text-sm shrink-0">{r.reservation_time.slice(0, 5)}</span>
                  <span className="text-sm truncate">{r.guest_name}</span>
                  <span className="text-xs text-[var(--color-textMuted)]">{r.guest_count} {tm.guestCountShort}</span>
                  {r.table_id && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-warning)]/20 text-[var(--color-warning)]">
                      {tables.find(t => t.id === r.table_id)?.name || `#${r.table_id.slice(0, 4)}`}
                    </span>
                  )}
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium text-white shrink-0"
                  style={{ backgroundColor: RESERVATION_STATUS_COLORS[r.status] }}
                >
                  {r.status === 'pending' ? tm.statusPending : tm.statusConfirmed}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floor Plan */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Zone filter pills */}
        {zones.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button type="button"
              onClick={() => setZoneFilter(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                !zoneFilter
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
              }`}
            >
              {tm.zoneFilterAll}
            </button>
            {zones.map(z => (
              <button type="button"
                key={z}
                onClick={() => setZoneFilter(zoneFilter === z ? null : z)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  zoneFilter === z
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
                }`}
              >
                {z}
              </button>
            ))}
          </div>
        )}

        {hasPermission('floor.edit') && (
          <button type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors self-end ${
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
        )}
      </div>
      {tables.length === 0 && !loading && !isEditMode ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">🪑</div>
          <h3 className="text-lg font-semibold mb-2">{tm.noTables}</h3>
          <p className="text-[var(--color-textMuted)] mb-4">{tm.noTablesHint}</p>
          {hasPermission('floor.edit') && (
            <button type="button" onClick={() => setIsEditMode(true)} className="btn btn-primary">
              {tm.enableEditMode}
            </button>
          )}
        </div>
      ) : (
        <div className="card p-6">
          <FloorPlan
            tables={filteredTables}
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
      )}

      {/* Selected Table Info */}
      {activeSelectedTable && !isEditMode && (
        <div
          className="card p-6"
          style={{
            borderColor: TABLE_STATUS_COLORS[activeSelectedTable.status].bg,
            borderWidth: '2px',
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{activeSelectedTable.name}</h2>
                <button type="button"
                  onClick={(e) => { e.stopPropagation(); handleDownloadQr(activeSelectedTable); }}
                  className="p-1 rounded text-xs text-[var(--color-textMuted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bgCard)]"
                  title={tm.downloadTableQr}
                >
                  QR
                </button>
              </div>
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

          {/* Long session warning */}
          {activeSelectedTable.status === 'occupied' && activeSelectedTable.session_start_time &&
            (Date.now() - new Date(activeSelectedTable.session_start_time).getTime()) / 60000 >= LONG_SESSION_MINUTES && (
            <div className="mb-4 p-3 rounded-xl bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 flex items-center gap-2">
              <span className="text-lg">&#9888;</span>
              <span className="text-sm font-medium text-[var(--color-warning)]">
                {tm.floorSessionExceeds(Math.floor((Date.now() - new Date(activeSelectedTable.session_start_time).getTime()) / 60000))}
              </span>
            </div>
          )}

          {activeSelectedTable.notes && (
            <div className="p-3 rounded-xl bg-[var(--color-bgHover)] mb-4">
              <p className="text-sm text-[var(--color-textMuted)]">{activeSelectedTable.notes}</p>
            </div>
          )}

          {/* Linked Reservation Details */}
          {linkedReservation && (
            <div className="p-4 rounded-xl mb-4" style={{ background: 'var(--color-warning)', color: 'white', opacity: 0.95 }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">{tm.reservationDetails}</span>
                <button type="button"
                  onClick={handleUnlinkReservation}
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
          {activeSelectedTable.status === 'occupied' && activeSelectedTable.session_start_time && (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[var(--color-danger)] animate-pulse" />
                <span className="text-sm font-medium text-[var(--color-danger)]">{tm.sessionActive}</span>
              </div>
              <button type="button"
                onClick={handleEndSession}
                className="w-full px-3 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'var(--color-danger)', color: 'white' }}
              >
                {tm.endSessionBtn}
              </button>
            </div>
          )}

          {/* One-Tap Serve Panel */}
          {activeSelectedTable.status === 'occupied' && occupiedGuest && serveRepeatResult && (
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
                      onChange={(e) => setDeductInventory(e.target.checked)}
                      className="w-4 h-4 rounded accent-[var(--color-success)]"
                    />
                    <span className="text-sm">{tm.deductFromStock}</span>
                  </label>

                  {/* Serve + Create new mix buttons */}
                  <div className="flex gap-2">
                    <button type="button"
                      onClick={handleConfirmServe}
                      disabled={serveStatus !== 'idle'}
                      className="flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-60"
                      style={{
                        background: serveStatus === 'served' ? 'var(--color-success)' : 'var(--color-success)',
                        color: 'white',
                      }}
                    >
                      {serveStatus === 'serving' ? tm.serving :
                       serveStatus === 'served' ? tm.served :
                       tm.serveLastMix}
                    </button>
                    <Link
                      href="/mix"
                      className="flex-1 px-3 py-2.5 rounded-xl text-sm font-medium text-center transition-all"
                      style={{ background: 'var(--color-bgHover)', color: 'var(--color-text)' }}
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
                    className="block w-full px-3 py-2.5 rounded-xl text-sm font-medium text-center transition-all"
                    style={{ background: 'var(--color-primary)', color: 'white' }}
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
                  if (status === 'occupied' && activeSelectedTable.status !== 'occupied') {
                    // Show guest picker to start a proper session
                    setShowGuestPicker(true)
                    setShowQuickReserve(false)
                    setShowLinkPicker(false)
                    return
                  }
                  if (status === 'reserved' && activeSelectedTable.status !== 'reserved') {
                    // Show quick reserve form instead of just toggling
                    setShowQuickReserve(true)
                    setShowLinkPicker(false)
                    setShowGuestPicker(false)
                    return
                  }
                  if (status === 'available' && linkedReservation) {
                    // Unlink reservation when freeing table
                    await handleUnlinkReservation()
                    return
                  }
                  if (status === 'available' && activeSelectedTable.session_start_time) {
                    // End session when freeing table
                    await handleEndSession()
                    await setTableStatus(activeSelectedTable.id, 'available')
                    return
                  }
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

          {/* Guest Picker (for starting session) */}
          {showGuestPicker && (
            <div className="mt-4 p-4 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5">
              <h3 className="font-semibold text-sm mb-3">{tm.guestOptional}</h3>
              <input
                type="text"
                value={guestSearch}
                onChange={(e) => setGuestSearch(e.target.value)}
                placeholder={tm.guestNamePlaceholder}
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-sm mb-2"
              />
              {filteredGuests.length > 0 && (
                <div className="mb-2 max-h-40 overflow-y-auto space-y-1">
                  {filteredGuests.map(g => (
                    <button type="button"
                      key={g.id}
                      onClick={() => handleStartSession(g.name, g)}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-[var(--color-bgHover)] hover:bg-[var(--color-primary)]/10 transition-colors text-left text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{g.name}</span>
                        {g.last_mix_snapshot && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-success)]/20 text-[var(--color-success)]">mix</span>
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
                  onClick={() => { setShowGuestPicker(false); setGuestSearch('') }}
                  className="flex-1 px-3 py-2 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--color-bgHover)', color: 'var(--color-text)' }}
                >
                  {tm.cancelBtn}
                </button>
                <button type="button"
                  onClick={() => handleStartSession(guestSearch || '')}
                  className="flex-1 px-3 py-2 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--color-primary)', color: 'white' }}
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
                  onClick={() => setShowLinkPicker(true)}
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
                      onClick={() => handleLinkReservation(r.id)}
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
                    onClick={() => setShowLinkPicker(false)}
                    className="w-full text-xs text-[var(--color-textMuted)] py-1"
                  >
                    {tm.cancelBtn}
                  </button>
                </div>
              )}

              {/* Or create new reservation */}
              {!showLinkPicker && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={quickForm.guest_name}
                    onChange={(e) => setQuickForm(f => ({ ...f, guest_name: e.target.value }))}
                    placeholder={tm.guestNamePlaceholder}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-warning)] focus:outline-none text-sm"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="time"
                      value={quickForm.reservation_time}
                      onChange={(e) => setQuickForm(f => ({ ...f, reservation_time: e.target.value }))}
                      className="px-3 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-warning)] focus:outline-none text-sm"
                    />
                    <input
                      type="number"
                      value={quickForm.guest_count}
                      onChange={(e) => setQuickForm(f => ({ ...f, guest_count: e.target.value }))}
                      min="1"
                      max="20"
                      placeholder={tm.guestCountLabel}
                      className="px-3 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-warning)] focus:outline-none text-sm"
                    />
                    <input
                      type="tel"
                      value={quickForm.guest_phone}
                      onChange={(e) => setQuickForm(f => ({ ...f, guest_phone: e.target.value }))}
                      placeholder={tm.guestPhonePlaceholder}
                      className="px-3 py-2 rounded-xl bg-[var(--color-bgHover)] border border-[var(--color-border)] focus:border-[var(--color-warning)] focus:outline-none text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="button"
                      onClick={() => setShowQuickReserve(false)}
                      className="flex-1 px-3 py-2 rounded-xl text-sm font-medium"
                      style={{ background: 'var(--color-bgHover)', color: 'var(--color-text)' }}
                    >
                      {tm.cancelBtn}
                    </button>
                    <button type="button"
                      onClick={handleQuickReserve}
                      disabled={quickReserving || !quickForm.guest_name || !quickForm.reservation_time}
                      className="flex-1 px-3 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
                      style={{ background: 'var(--color-warning)', color: 'white' }}
                    >
                      {quickReserving ? tm.reserving : tm.reserveBtn}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <button type="button"
            onClick={() => { setSelectedTable(null); setShowQuickReserve(false); setShowLinkPicker(false); setShowGuestPicker(false); setGuestSearch(''); setSelectedGuestObj(null); setServeStatus('idle') }}
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

      {/* Hidden QR canvas for download */}
      {qrTableId && profile?.venue_slug && (
        <div className="fixed -left-[9999px]">
          <QRCodeCanvas
            ref={qrCanvasRef}
            value={`https://hookahtorus.com/menu/${profile.venue_slug}?table=${qrTableId}`}
            size={512}
            level="M"
          />
        </div>
      )}
    </div>
  )
}
