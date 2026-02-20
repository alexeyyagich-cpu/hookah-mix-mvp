'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import type { SessionWithItems } from '@/types/database'

interface PeriodStats {
  totalSessions: number
  totalGramsUsed: number
  averageSessionGrams: number
  averageCompatibilityScore: number
  averageRating: number
}

interface Comparison {
  sessionsChange: number        // percentage change
  gramsChange: number           // percentage change
  avgGramsChange: number        // percentage change
  compatibilityChange: number   // absolute change in points
  ratingChange: number          // absolute change
}

export interface Period {
  start: Date
  end: Date
}

interface UseStatisticsComparisonReturn {
  periodA: PeriodStats | null
  periodB: PeriodStats | null
  comparison: Comparison | null
  loading: boolean
  error: string | null
  periodsConfig: {
    periodA: Period
    periodB: Period
  }
  setPeriodsConfig: (config: { periodA: Period; periodB: Period }) => void
  presets: {
    name: string
    periodA: Period
    periodB: Period
  }[]
  applyPreset: (presetIndex: number) => void
}

// Helper to calculate stats from sessions
function calculatePeriodStats(sessions: SessionWithItems[]): PeriodStats {
  const totalSessions = sessions.length
  const totalGramsUsed = sessions.reduce((sum, s) => sum + s.total_grams, 0)
  const averageSessionGrams = totalSessions > 0 ? totalGramsUsed / totalSessions : 0

  const sessionsWithScore = sessions.filter(s => s.compatibility_score !== null)
  const averageCompatibilityScore =
    sessionsWithScore.length > 0
      ? sessionsWithScore.reduce((sum, s) => sum + (s.compatibility_score || 0), 0) / sessionsWithScore.length
      : 0

  const sessionsWithRating = sessions.filter(s => s.rating !== null)
  const averageRating =
    sessionsWithRating.length > 0
      ? sessionsWithRating.reduce((sum, s) => sum + (s.rating || 0), 0) / sessionsWithRating.length
      : 0

  return {
    totalSessions,
    totalGramsUsed: Math.round(totalGramsUsed * 10) / 10,
    averageSessionGrams: Math.round(averageSessionGrams * 10) / 10,
    averageCompatibilityScore: Math.round(averageCompatibilityScore),
    averageRating: Math.round(averageRating * 10) / 10,
  }
}

// Calculate percentage change
function percentChange(oldVal: number, newVal: number): number {
  if (oldVal === 0) return newVal > 0 ? 100 : 0
  return Math.round(((newVal - oldVal) / oldVal) * 100)
}

// Demo data generators
function generateDemoStats(multiplier: number = 1): PeriodStats {
  return {
    totalSessions: Math.round(12 * multiplier),
    totalGramsUsed: Math.round(240 * multiplier),
    averageSessionGrams: 20,
    averageCompatibilityScore: Math.round(82 + (multiplier > 1 ? 5 : 0)),
    averageRating: Math.round((4.2 + (multiplier > 1 ? 0.3 : 0)) * 10) / 10,
  }
}

export function useStatisticsComparison(): UseStatisticsComparisonReturn {
  // Default periods: this week vs last week
  const getDefaultPeriods = () => {
    const now = new Date()
    const thisWeekEnd = new Date(now)
    const thisWeekStart = new Date(now)
    thisWeekStart.setDate(thisWeekStart.getDate() - 7)

    const lastWeekEnd = new Date(thisWeekStart)
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1)
    const lastWeekStart = new Date(lastWeekEnd)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)

    return {
      periodA: { start: thisWeekStart, end: thisWeekEnd },
      periodB: { start: lastWeekStart, end: lastWeekEnd },
    }
  }

  const [periodsConfig, setPeriodsConfig] = useState(getDefaultPeriods)
  const [sessionsA, setSessionsA] = useState<SessionWithItems[]>([])
  const [sessionsB, setSessionsB] = useState<SessionWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user, isDemoMode } = useAuth()
  const { organizationId, locationId } = useOrganizationContext()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  // Presets for quick selection
  const presets = useMemo(() => {
    const now = new Date()

    // This week vs last week
    const thisWeekEnd = new Date(now)
    const thisWeekStart = new Date(now)
    thisWeekStart.setDate(thisWeekStart.getDate() - 7)
    const lastWeekEnd = new Date(thisWeekStart)
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1)
    const lastWeekStart = new Date(lastWeekEnd)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)

    // This month vs last month
    const thisMonthEnd = new Date(now)
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthEnd = new Date(thisMonthStart)
    lastMonthEnd.setDate(lastMonthEnd.getDate() - 1)
    const lastMonthStart = new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), 1)

    // Last 30 days vs previous 30 days
    const last30End = new Date(now)
    const last30Start = new Date(now)
    last30Start.setDate(last30Start.getDate() - 30)
    const prev30End = new Date(last30Start)
    prev30End.setDate(prev30End.getDate() - 1)
    const prev30Start = new Date(prev30End)
    prev30Start.setDate(prev30Start.getDate() - 30)

    return [
      {
        name: 'This week vs last',
        periodA: { start: thisWeekStart, end: thisWeekEnd },
        periodB: { start: lastWeekStart, end: lastWeekEnd },
      },
      {
        name: 'This month vs last',
        periodA: { start: thisMonthStart, end: thisMonthEnd },
        periodB: { start: lastMonthStart, end: lastMonthEnd },
      },
      {
        name: 'Last 30 days vs previous',
        periodA: { start: last30Start, end: last30End },
        periodB: { start: prev30Start, end: prev30End },
      },
    ]
  }, [])

  const applyPreset = useCallback((presetIndex: number) => {
    if (presets[presetIndex]) {
      setPeriodsConfig({
        periodA: presets[presetIndex].periodA,
        periodB: presets[presetIndex].periodB,
      })
    }
  }, [presets])

  // Fetch data for both periods
  const fetchData = useCallback(async () => {
    if (isDemoMode && user) {
      // Return demo data
      setSessionsA([])
      setSessionsB([])
      setLoading(false)
      return
    }

    if (!user || !supabase) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Fetch period A sessions
      let queryA = supabase
        .from('sessions')
        .select('*, session_items (*)')
        .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)
        .gte('session_date', periodsConfig.periodA.start.toISOString())
        .lte('session_date', periodsConfig.periodA.end.toISOString())

      if (organizationId && locationId) {
        queryA = queryA.eq('location_id', locationId)
      }

      const { data: dataA, error: errorA } = await queryA

      if (errorA) throw errorA
      setSessionsA(dataA || [])

      // Fetch period B sessions
      let queryB = supabase
        .from('sessions')
        .select('*, session_items (*)')
        .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)
        .gte('session_date', periodsConfig.periodB.start.toISOString())
        .lte('session_date', periodsConfig.periodB.end.toISOString())

      if (organizationId && locationId) {
        queryB = queryB.eq('location_id', locationId)
      }

      const { data: dataB, error: errorB } = await queryB

      if (errorB) throw errorB
      setSessionsB(dataB || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    }

    setLoading(false)
  }, [user, supabase, periodsConfig, isDemoMode, organizationId, locationId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Calculate stats for both periods
  const periodA = useMemo<PeriodStats | null>(() => {
    if (isDemoMode) return generateDemoStats(1.2) // Current period slightly better
    if (!sessionsA.length && !isDemoMode) return null
    return calculatePeriodStats(sessionsA)
  }, [sessionsA, isDemoMode])

  const periodB = useMemo<PeriodStats | null>(() => {
    if (isDemoMode) return generateDemoStats(1)
    if (!sessionsB.length && !isDemoMode) return null
    return calculatePeriodStats(sessionsB)
  }, [sessionsB, isDemoMode])

  // Calculate comparison
  const comparison = useMemo<Comparison | null>(() => {
    if (!periodA || !periodB) return null

    return {
      sessionsChange: percentChange(periodB.totalSessions, periodA.totalSessions),
      gramsChange: percentChange(periodB.totalGramsUsed, periodA.totalGramsUsed),
      avgGramsChange: percentChange(periodB.averageSessionGrams, periodA.averageSessionGrams),
      compatibilityChange: periodA.averageCompatibilityScore - periodB.averageCompatibilityScore,
      ratingChange: Math.round((periodA.averageRating - periodB.averageRating) * 10) / 10,
    }
  }, [periodA, periodB])

  return {
    periodA,
    periodB,
    comparison,
    loading,
    error,
    periodsConfig,
    setPeriodsConfig,
    presets,
    applyPreset,
  }
}
