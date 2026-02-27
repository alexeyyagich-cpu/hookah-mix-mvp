'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRole } from '@/lib/hooks/useRole'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { useShifts } from '@/lib/hooks/useShifts'
import { useFloorPlan } from '@/lib/hooks/useFloorPlan'
import { useKDS } from '@/lib/hooks/useKDS'
import { useSessions } from '@/lib/hooks/useSessions'
import { useBarSales } from '@/lib/hooks/useBarSales'
import { useInventory } from '@/lib/hooks/useInventory'
import { useNotificationSettings } from '@/lib/hooks/useNotificationSettings'
import { useReviews } from '@/lib/hooks/useReviews'
import { useTips } from '@/lib/hooks/useTips'
import { useTranslation, useLocale, formatTime } from '@/lib/i18n'
import { IconCrown, IconRefresh, IconLock } from '@/components/Icons'
import { EmptyState } from '@/components/ui/EmptyState'
import { AccessDenied } from '@/components/ui/AccessDenied'
import { LOW_STOCK_THRESHOLD } from '@/lib/constants'
import type { ShiftReconciliation } from '@/types/database'

import { LiveStatusBar } from '@/components/boss/LiveStatusBar'
import { RevenueCard } from '@/components/boss/RevenueCard'
import { ShiftOverviewCard } from '@/components/boss/ShiftOverviewCard'
import { QuickStatsRow } from '@/components/boss/QuickStatsRow'
import { AlertsPanel } from '@/components/boss/AlertsPanel'
import { FloorMiniMap } from '@/components/boss/FloorMiniMap'
import { ActivityFeed } from '@/components/boss/ActivityFeed'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { toast } from 'sonner'

export default function BossPage() {
  const tm = useTranslation('manage')
  const tc = useTranslation('common')
  const { locale } = useLocale()
  const { orgRole, loading: orgLoading } = useOrganizationContext()
  const { isOwner } = useRole(orgRole)
  const { isFreeTier } = useSubscription()

  // Data hooks
  const { shifts, activeShift, getReconciliation, openShift, refresh: refreshShifts } = useShifts()
  const { tables, refresh: refreshFloor } = useFloorPlan()
  const { orders: kdsOrders } = useKDS() // already polls at 10s
  const { sessions } = useSessions()
  const { sales } = useBarSales()
  const { inventory } = useInventory()
  const { settings: notifSettings } = useNotificationSettings()
  const { reviews, averageRating } = useReviews()
  const { tips } = useTips()

  // Live timer for shift duration (60s interval) — skip when no active shift
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!activeShift) return
    setNow(Date.now())
    const interval = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(interval)
  }, [activeShift])

  const shiftDurationMs = activeShift
    ? now - new Date(activeShift.opened_at).getTime()
    : 0

  const [activeReconciliation, setActiveRecon] = useState<ShiftReconciliation | null>(null)
  useEffect(() => {
    if (!activeShift) { setActiveRecon(null); return }
    let cancelled = false
    getReconciliation(activeShift).then(r => { if (!cancelled) setActiveRecon(r) })
    return () => { cancelled = true }
  }, [activeShift, getReconciliation])

  // Today/yesterday strings for filtering
  const todayStr = new Date().toISOString().split('T')[0]
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  // Auto-refresh (30s)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)

  const doRefresh = useCallback(async () => {
    if (typeof document !== 'undefined' && document.hidden) return
    setRefreshing(true)
    await Promise.all([refreshShifts(), refreshFloor()])
    setLastRefresh(new Date())
    setRefreshing(false)
  }, [refreshShifts, refreshFloor])

  useEffect(() => {
    const interval = setInterval(doRefresh, 30000)
    return () => clearInterval(interval)
  }, [doRefresh])

  // Quick open shift
  const [opening, setOpening] = useState(false)
  const handleQuickOpen = async () => {
    setOpening(true)
    try {
      await openShift()
    } catch {
      toast.error(tc.errorSaving)
    } finally {
      setOpening(false)
    }
  }

  // Owner guard — wait for org data to load before checking
  if (orgLoading) return (
    <ErrorBoundary sectionName="Boss">
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full" />
    </div>
    </ErrorBoundary>
  )
  if (!isOwner) return <ErrorBoundary sectionName="Boss"><AccessDenied /></ErrorBoundary>

  // Pro guard
  if (isFreeTier) {
    return (
      <ErrorBoundary sectionName="Boss Reports">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{tm.bossProRequired}</h1>
        <EmptyState
          icon={<IconLock size={32} />}
          title={tm.bossProRequired}
          description={tm.bossProRequiredDesc}
          action={{ label: tm.upgradePlan, href: '/pricing' }}
        />
      </div>
      </ErrorBoundary>
    )
  }

  const lowStockThreshold = notifSettings?.low_stock_threshold ?? LOW_STOCK_THRESHOLD

  return (
    <ErrorBoundary sectionName="Boss">
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <IconCrown size={24} className="text-[var(--color-primary)]" />
            {tm.bossTitle}
          </h1>
          <p className="text-sm text-[var(--color-textMuted)]">{tm.bossSubtitle}</p>
        </div>
        <button type="button"
          onClick={doRefresh}
          disabled={refreshing}
          className="p-2 rounded-xl hover:bg-[var(--color-bgHover)] transition-colors disabled:opacity-50"
          title="Refresh"
          aria-label="Refresh"
        >
          <IconRefresh size={20} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Live Status Bar */}
      <LiveStatusBar
        activeShift={activeShift}
        tables={tables}
        kdsOrders={kdsOrders}
        shiftDurationMs={shiftDurationMs}
        tm={tm}
      />

      {/* Revenue Card */}
      <RevenueCard
        sessions={sessions}
        sales={sales}
        todayStr={todayStr}
        yesterdayStr={yesterdayStr}
        tm={tm}
      />

      {/* Shift Overview */}
      <ShiftOverviewCard
        activeShift={activeShift}
        reconciliation={activeReconciliation}
        shiftDurationMs={shiftDurationMs}
        onQuickOpen={handleQuickOpen}
        opening={opening}
        tm={tm}
      />

      {/* Quick Stats */}
      <QuickStatsRow
        sessions={sessions}
        avgRating={averageRating}
        tips={tips}
        kdsOrders={kdsOrders}
        todayStr={todayStr}
        tm={tm}
      />

      {/* Alerts */}
      <AlertsPanel
        inventory={inventory}
        lowStockThreshold={lowStockThreshold}
        kdsOrders={kdsOrders}
        reviews={reviews}
        shifts={shifts}
        getReconciliation={getReconciliation}
        tm={tm}
      />

      {/* Floor Mini Map */}
      <FloorMiniMap
        tables={tables}
        tm={tm}
      />

      {/* Activity Feed */}
      <ActivityFeed
        sessions={sessions}
        sales={sales}
        kdsOrders={kdsOrders}
        reviews={reviews}
        tips={tips}
        tm={tm}
      />

      {/* Last Updated */}
      <div className="text-center text-xs text-[var(--color-textMuted)] pb-4">
        {refreshing
          ? tm.bossRefreshing
          : tm.bossLastUpdated(formatTime(lastRefresh, locale))
        }
      </div>
    </div>
    </ErrorBoundary>
  )
}
