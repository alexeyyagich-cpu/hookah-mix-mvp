'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import { translateError } from '@/lib/utils/translateError'
import type {
  DashboardControlSnapshot,
  StaffRowEnriched,
} from '@/types/dashboard-control'

const DEMO_SNAPSHOT = {
  tobacco_usage: {
    total_grams_today: 38,
    cost_today: 6.46,
    yesterday_grams: 53,
    week_avg_daily_grams: 44.3,
    week_pct_diff: -14.2,
  },
  avg_grams_per_bowl: {
    target_grams: 20,
    actual_avg: 19.0,
    overuse_pct: -5.0,
    sessions_count: 2,
    status: 'green',
  },
  staff_comparison: [
    {
      user_id: 'demo-staff-1',
      display_name: 'Marek Zielinski',
      role: 'hookah_master',
      sessions_count: 3,
      total_grams: 60,
      avg_grams: 20.0,
    },
    {
      user_id: 'demo-user-id',
      display_name: 'Demo User',
      role: 'owner',
      sessions_count: 2,
      total_grams: 38,
      avg_grams: 19.0,
    },
  ],
  low_stock_alerts: [
    {
      id: '4',
      brand: 'Darkside',
      flavor: 'Bananapapa',
      remaining_grams: 45,
      low_stock_threshold: 100,
      avg_daily_usage: 3.4,
      estimated_days_left: 13,
    },
  ],
  revenue_snapshot: {
    hookah_revenue_today: 35,
    hookah_cost_today: 6.46,
    hookah_revenue_yesterday: 47,
    bar_revenue_today: 54,
    bar_cost_today: 14.3,
    bar_revenue_yesterday: 42,
    combined_revenue_today: 89,
    combined_cost_today: 20.76,
    combined_revenue_yesterday: 89,
    hookah_margin_pct: 81.5,
    bar_margin_pct: 73.5,
    combined_margin_pct: 76.7,
  },
} as const satisfies DashboardControlSnapshot

function enrichStaffRows(rows: DashboardControlSnapshot['staff_comparison']): StaffRowEnriched[] {
  if (rows.length === 0) return []

  const activeRows = rows.filter(r => r.sessions_count > 0)
  if (activeRows.length === 0) {
    return rows.map(r => ({ ...r, deviation_from_mean: 0, status: 'normal' as const }))
  }

  const mean = activeRows.reduce((sum, r) => sum + r.avg_grams, 0) / activeRows.length
  const maxAvg = Math.max(...activeRows.map(r => r.avg_grams))
  const minAvg = Math.min(...activeRows.map(r => r.avg_grams))

  return rows.map(r => {
    const deviation = mean > 0
      ? Math.round(((r.avg_grams - mean) / mean) * 1000) / 10
      : 0
    let status: 'best' | 'worst' | 'normal' = 'normal'
    if (r.sessions_count > 0 && activeRows.length > 1 && maxAvg !== minAvg) {
      if (r.avg_grams === minAvg) status = 'best'
      else if (r.avg_grams === maxAvg) status = 'worst'
    }
    return { ...r, deviation_from_mean: deviation, status }
  })
}

interface UseDashboardControlReturn {
  data: DashboardControlSnapshot | null
  staffEnriched: StaffRowEnriched[]
  loading: boolean
  refreshing: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useDashboardControl(): UseDashboardControlReturn {
  const [data, setData] = useState<DashboardControlSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, isDemoMode } = useAuth()
  const { organizationId } = useOrganizationContext()
  const supabase = useMemo(() => (isSupabaseConfigured ? createClient() : null), [])

  useEffect(() => {
    if (isDemoMode && user) {
      setData(DEMO_SNAPSHOT)
      setLoading(false)
    }
  }, [isDemoMode, user])

  const fetchSnapshot = useCallback(async () => {
    if (isDemoMode || !user || !supabase) {
      setLoading(false)
      return
    }

    if (!data) setLoading(true)
    setRefreshing(true)
    setError(null)

    try {
      const { data: result, error: rpcError } = await supabase.rpc(
        'dashboard_control_snapshot',
        {
          p_org_id: organizationId || null,
          p_profile_id: organizationId ? null : user.id,
          p_date: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })(),
        }
      )

      if (rpcError) throw rpcError
      setData(result as DashboardControlSnapshot)
    } catch (err) {
      setError(translateError(err as Error))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [isDemoMode, user, supabase, organizationId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isDemoMode) fetchSnapshot()
  }, [fetchSnapshot, isDemoMode])

  // Auto-refresh every 60s
  useEffect(() => {
    if (isDemoMode) return
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return
      fetchSnapshot()
    }, 60_000)
    return () => clearInterval(interval)
  }, [fetchSnapshot, isDemoMode])

  // Refetch on reconnect
  useEffect(() => {
    if (typeof window === 'undefined') return
    let tid: ReturnType<typeof setTimeout>
    const handleOnline = () => { tid = setTimeout(fetchSnapshot, 3000) }
    window.addEventListener('online', handleOnline)
    return () => { clearTimeout(tid); window.removeEventListener('online', handleOnline) }
  }, [fetchSnapshot])

  const staffEnriched = useMemo(
    () => enrichStaffRows(data?.staff_comparison || []),
    [data?.staff_comparison]
  )

  return {
    data,
    staffEnriched,
    loading,
    refreshing,
    error,
    refresh: fetchSnapshot,
  }
}
