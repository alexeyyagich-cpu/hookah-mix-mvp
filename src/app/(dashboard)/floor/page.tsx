'use client'

import { Suspense, useState, useMemo, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { FloorPlan, LONG_SESSION_MINUTES } from '@/components/floor/FloorPlan'
import FloorTablePanel from '@/components/floor/FloorTablePanel'
import { useFloorPlan } from '@/lib/hooks/useFloorPlan'
import { useReservations } from '@/lib/hooks/useReservations'
import { useInventory } from '@/lib/hooks/useInventory'
import { useSessions } from '@/lib/hooks/useSessions'
import { IconSettings, IconCalendar, IconFloor } from '@/components/Icons'
import { EmptyState } from '@/components/ui/EmptyState'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/lib/AuthContext'
import { useGuests } from '@/lib/hooks/useGuests'
import { useKDS } from '@/lib/hooks/useKDS'
import { quickRepeatGuest } from '@/logic/quickRepeatEngine'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import { useRole } from '@/lib/hooks/useRole'
import { toast } from 'sonner'

import type { FloorTable, ReservationStatus, Guest } from '@/types/database'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const RESERVATION_STATUS_COLORS: Record<ReservationStatus, string> = {
  pending: 'var(--color-warning)',
  confirmed: 'var(--color-success)',
  cancelled: 'var(--color-danger)',
  completed: 'var(--color-textMuted)',
}

export default function FloorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><LoadingSpinner size="lg" /></div>}>
      <FloorPageInner />
    </Suspense>
  )
}

function FloorPageInner() {
  const tm = useTranslation('manage')
  const tc = useTranslation('common')
  const { user, profile } = useAuth()
  const { orgRole: contextOrgRole } = useOrganizationContext()
  const { hasPermission } = useRole(contextOrgRole)
  const floorPlan = useFloorPlan()
  const { tables, setTableStatus, startSession, endSession, loading } = floorPlan
  const { reservations, createReservation, assignTable } = useReservations()
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
  const serveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const qrTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [qrTableId, setQrTableId] = useState<string | null>(null)
  const [quickReserving, setQuickReserving] = useState(false)
  const [statusChanging, setStatusChanging] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const zoneFilter = searchParams.get('zone') || null
  const setZoneFilter = useCallback((value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('zone', value)
    else params.delete('zone')
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router])
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
  const todayReservations = useMemo(() => reservations
    .filter(r => r.reservation_date === today && r.status !== 'cancelled' && r.status !== 'completed')
    .sort((a, b) => a.reservation_time.localeCompare(b.reservation_time)),
    [reservations, today])

  const activeTables = useMemo(() => zoneFilter ? filteredTables : tables, [zoneFilter, filteredTables, tables])
  const longSessionCount = useMemo(() => activeTables.filter(t =>
    t.status === 'occupied' && t.session_start_time &&
    (Date.now() - new Date(t.session_start_time).getTime()) / 60000 >= LONG_SESSION_MINUTES
  ).length, [activeTables])
  const stats = useMemo(() => ({
    total: activeTables.length,
    available: activeTables.filter(t => t.status === 'available').length,
    occupied: activeTables.filter(t => t.status === 'occupied').length,
    reserved: activeTables.filter(t => t.status === 'reserved').length,
  }), [activeTables])

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
        if (process.env.NODE_ENV !== 'production') console.error('KDS order failed:', e)
      }

      setServeStatus('served')
      serveTimerRef.current = setTimeout(() => setServeStatus('idle'), 1500)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('Serve error:', err)
      toast.error(tc.errorSaving)
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
      if (process.env.NODE_ENV !== 'production') console.error('Quick reserve error:', err)
      toast.error(tc.errorSaving)
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
    qrTimerRef.current = setTimeout(() => {
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

  const handleStatusChange = async (status: 'available' | 'occupied' | 'reserved' | 'cleaning') => {
    if (!activeSelectedTable || statusChanging) return
    setStatusChanging(true)
    try {
      if (status === 'available' && linkedReservation) {
        await handleUnlinkReservation()
        return
      }
      if (status === 'available' && activeSelectedTable.session_start_time) {
        await handleEndSession()
        await setTableStatus(activeSelectedTable.id, 'available')
        return
      }
      await setTableStatus(activeSelectedTable.id, status)
    } finally {
      setStatusChanging(false)
    }
  }

  useEffect(() => () => { clearTimeout(serveTimerRef.current); clearTimeout(qrTimerRef.current) }, [])

  return (
    <ErrorBoundary sectionName="Floor Plan">
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{tm.floorTitle}</h1>
        <p className="text-[var(--color-textMuted)]">
          {tm.floorAvailableOfTotal(stats.available, stats.total)}
        </p>
      </div>

      {/* Stats Cards */}
      <div className={`grid grid-cols-2 ${longSessionCount > 0 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4 stagger-children`}>
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
          <h2 className="text-lg font-semibold flex items-center gap-2">
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
                  className="px-2 py-0.5 rounded-full text-xs font-medium text-[var(--color-bg)] shrink-0"
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
              aria-pressed={!zoneFilter}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                !zoneFilter
                  ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                  : 'bg-[var(--color-bgHover)] text-[var(--color-textMuted)] hover:text-[var(--color-text)]'
              }`}
            >
              {tm.zoneFilterAll}
            </button>
            {zones.map(z => (
              <button type="button"
                key={z}
                onClick={() => setZoneFilter(zoneFilter === z ? null : z)}
                aria-pressed={zoneFilter === z}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  zoneFilter === z
                    ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
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
            className={`btn btn-sm self-end ${
              isEditMode ? 'btn-primary ring-2 ring-offset-2 ring-[var(--color-primary)]' : 'btn-ghost'
            }`}
          >
            <IconSettings size={18} />
            {isEditMode ? tm.ready : tc.edit}
          </button>
        )}
      </div>
      {tables.length === 0 && !loading && !isEditMode ? (
        <EmptyState
          icon={<IconFloor size={32} />}
          title={tm.noTables}
          description={tm.noTablesHint}
          action={hasPermission('floor.edit') ? { label: tm.enableEditMode, onClick: () => setIsEditMode(true) } : undefined}
        />
      ) : filteredTables.length === 0 && zoneFilter && tables.length > 0 ? (
        <div className="card p-8 text-center">
          <p className="text-[var(--color-textMuted)]">{tm.noTables}</p>
          <button type="button" onClick={() => setZoneFilter(null)} className="btn btn-ghost btn-sm mt-3">
            ← {tc.back}
          </button>
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
        <FloorTablePanel
          table={activeSelectedTable}
          linkedReservation={linkedReservation}
          unlinkedReservations={unlinkedReservations}
          filteredGuests={filteredGuests}
          occupiedGuest={occupiedGuest}
          serveRepeatResult={serveRepeatResult}
          serveStatus={serveStatus}
          deductInventory={deductInventory}
          statusChanging={statusChanging}
          quickReserving={quickReserving}
          guestSearch={guestSearch}
          showQuickReserve={showQuickReserve}
          showGuestPicker={showGuestPicker}
          showLinkPicker={showLinkPicker}
          quickForm={quickForm}
          qrTableId={qrTableId}
          qrCanvasRef={qrCanvasRef}
          venueSlug={profile?.venue_slug}
          onStartSession={handleStartSession}
          onEndSession={handleEndSession}
          onConfirmServe={handleConfirmServe}
          onQuickReserve={handleQuickReserve}
          onLinkReservation={handleLinkReservation}
          onUnlinkReservation={handleUnlinkReservation}
          onDownloadQr={handleDownloadQr}
          onStatusChange={handleStatusChange}
          onClose={() => {
            setSelectedTable(null)
            setShowQuickReserve(false)
            setShowLinkPicker(false)
            setShowGuestPicker(false)
            setGuestSearch('')
            setSelectedGuestObj(null)
            setServeStatus('idle')
          }}
          onGuestSearchChange={setGuestSearch}
          onShowQuickReserve={setShowQuickReserve}
          onShowGuestPicker={setShowGuestPicker}
          onShowLinkPicker={setShowLinkPicker}
          onQuickFormChange={(field, value) => setQuickForm(f => ({ ...f, [field]: value }))}
          onDeductInventoryChange={setDeductInventory}
          onSetQrTableId={setQrTableId}
        />
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
    </ErrorBoundary>
  )
}
