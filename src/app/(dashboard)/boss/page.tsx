'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
import { useTranslation } from '@/lib/i18n'
import { IconCrown, IconRefresh } from '@/components/Icons'
import Link from 'next/link'

import { LiveStatusBar } from '@/components/boss/LiveStatusBar'
import { RevenueCard } from '@/components/boss/RevenueCard'
import { ShiftOverviewCard } from '@/components/boss/ShiftOverviewCard'
import { QuickStatsRow } from '@/components/boss/QuickStatsRow'
import { AlertsPanel } from '@/components/boss/AlertsPanel'
import { FloorMiniMap } from '@/components/boss/FloorMiniMap'
import { ActivityFeed } from '@/components/boss/ActivityFeed'

export default function BossPage() {
  const tm = useTranslation('manage')
  const router = useRouter()
  const { orgRole } = useOrganizationContext()
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

  // Live timer for shift duration (60s interval)
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(interval)
  }, [])

  const shiftDurationMs = activeShift
    ? now - new Date(activeShift.opened_at).getTime()
    : 0

  const activeReconciliation = useMemo(
    () => activeShift ? getReconciliation(activeShift) : null,
    [activeShift, getReconciliation, now]
  )

  // Today/yesterday strings for filtering
  const todayStr = new Date().toISOString().split('T')[0]
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  // Auto-refresh (30s)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)

  const doRefresh = useCallback(async () => {
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
    await openShift()
    setOpening(false)
  }

  // Owner guard
  useEffect(() => {
    if (!isOwner) router.push('/dashboard')
  }, [isOwner, router])

  if (!isOwner) return null

  // Pro guard
  if (isFreeTier) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/20 to-purple-500/20 flex items-center justify-center">
            <IconCrown size={32} className="text-[var(--color-primary)]" />
          </div>
          <h2 className="text-xl font-bold mb-2">{tm.bossProRequired}</h2>
          <p className="text-[var(--color-textMuted)] mb-4">{tm.bossProRequiredDesc}</p>
          <Link href="/pricing" className="btn btn-primary">
            Upgrade to Pro
          </Link>
        </div>
      </div>
    )
  }

  const lowStockThreshold = notifSettings?.low_stock_threshold ?? 50

  return (
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
        <button
          onClick={doRefresh}
          disabled={refreshing}
          className="p-2 rounded-xl hover:bg-[var(--color-bgHover)] transition-colors disabled:opacity-50"
          title="Refresh"
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
        tm={tm as unknown as Record<string, unknown>}
      />

      {/* Revenue Card */}
      <RevenueCard
        sessions={sessions}
        sales={sales}
        todayStr={todayStr}
        yesterdayStr={yesterdayStr}
        tm={tm as unknown as Record<string, unknown>}
      />

      {/* Shift Overview */}
      <ShiftOverviewCard
        activeShift={activeShift}
        reconciliation={activeReconciliation}
        shiftDurationMs={shiftDurationMs}
        onQuickOpen={handleQuickOpen}
        opening={opening}
        tm={tm as unknown as Record<string, unknown>}
      />

      {/* Quick Stats */}
      <QuickStatsRow
        sessions={sessions}
        avgRating={averageRating}
        tips={tips}
        kdsOrders={kdsOrders}
        todayStr={todayStr}
        tm={tm as unknown as Record<string, unknown>}
      />

      {/* Alerts */}
      <AlertsPanel
        inventory={inventory}
        lowStockThreshold={lowStockThreshold}
        kdsOrders={kdsOrders}
        reviews={reviews}
        shifts={shifts}
        getReconciliation={getReconciliation}
        tm={tm as unknown as Record<string, unknown>}
      />

      {/* Floor Mini Map */}
      <FloorMiniMap
        tables={tables}
        tm={tm as unknown as Record<string, unknown>}
      />

      {/* Activity Feed */}
      <ActivityFeed
        sessions={sessions}
        sales={sales}
        kdsOrders={kdsOrders}
        reviews={reviews}
        tips={tips}
        tm={tm as unknown as Record<string, unknown>}
      />

      {/* Last Updated */}
      <div className="text-center text-xs text-[var(--color-textMuted)] pb-4">
        {refreshing
          ? tm.bossRefreshing
          : tm.bossLastUpdated(lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
        }
      </div>
    </div>
  )
}
