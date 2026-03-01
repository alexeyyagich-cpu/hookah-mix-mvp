'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import { calculateForecast, type ForecastResult } from '@/lib/utils/forecast'
import { translateError } from '@/lib/utils/translateError'
import type { SessionWithItems, TobaccoInventory, InventoryTransaction } from '@/types/database'
import { DEMO_SESSIONS, DEMO_INVENTORY, DEMO_TRANSACTIONS } from '@/lib/demo'

interface ConsumptionByBrand {
  brand: string
  grams: number
  sessions: number
}

interface ConsumptionByFlavor {
  brand: string
  flavor: string
  grams: number
  sessions: number
}

interface DailyConsumption {
  date: string
  grams: number
  sessions: number
}

export interface InventoryForecast extends TobaccoInventory {
  forecast: ForecastResult
}

interface Statistics {
  totalSessions: number
  totalGramsUsed: number
  averageSessionGrams: number
  averageCompatibilityScore: number
  averageRating: number
  consumptionByBrand: ConsumptionByBrand[]
  consumptionByFlavor: ConsumptionByFlavor[]
  dailyConsumption: DailyConsumption[]
  topMixes: { items: { brand: string; flavor: string }[]; count: number }[]
  lowStockItems: TobaccoInventory[]
  recentTransactions: InventoryTransaction[]
  forecasts: InventoryForecast[]
}

interface UseStatisticsOptions {
  lowStockThreshold?: number
}

interface UseStatisticsReturn {
  statistics: Statistics | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  dateRange: { start: Date; end: Date }
  setDateRange: (range: { start: Date; end: Date }) => void
}

export function useStatistics(options: UseStatisticsOptions = {}): UseStatisticsReturn {
  const { lowStockThreshold = 50 } = options
  const [sessions, setSessions] = useState<SessionWithItems[]>([])
  const [inventory, setInventory] = useState<TobaccoInventory[]>([])
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    return { start, end }
  })

  const { user, isDemoMode } = useAuth()
  const { organizationId, locationId } = useOrganizationContext()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])
  const fetchIdRef = useRef(0)

  // Return demo data if in demo mode
  useEffect(() => {
    if (isDemoMode && user) {
      setSessions(DEMO_SESSIONS)
      setInventory(DEMO_INVENTORY)
      setTransactions(DEMO_TRANSACTIONS)
      setLoading(false)
    }
  }, [isDemoMode, user])

  const fetchData = useCallback(async () => {
    if (!user || !supabase) {
      setLoading(false)
      return
    }

    const fetchId = ++fetchIdRef.current
    setLoading(true)
    setError(null)

    try {
      // Fetch sessions with items
      let sessionsQuery = supabase
        .from('sessions')
        .select(`
          id, profile_id, created_by, guest_id, bowl_type_id, session_date, total_grams, compatibility_score, notes, rating, duration_minutes, selling_price,
          session_items (id, session_id, tobacco_inventory_id, tobacco_id, brand, flavor, grams_used, percentage),
          bowl_type:bowl_types (id, profile_id, name, capacity_grams, is_default, created_at)
        `)
        .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)
        .gte('session_date', dateRange.start.toISOString())
        .lte('session_date', dateRange.end.toISOString())
        .order('session_date', { ascending: false })

      if (organizationId && locationId) {
        sessionsQuery = sessionsQuery.eq('location_id', locationId)
      }

      // Build inventory query
      let inventoryQuery = supabase
        .from('tobacco_inventory')
        .select('id, profile_id, tobacco_id, brand, flavor, quantity_grams, purchase_price, package_grams, purchase_date, expiry_date, notes, created_at, updated_at')
        .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

      if (organizationId && locationId) {
        inventoryQuery = inventoryQuery.eq('location_id', locationId)
      }

      // Build transactions query
      let transactionsQuery = supabase
        .from('inventory_transactions')
        .select('id, profile_id, tobacco_inventory_id, type, quantity_grams, session_id, notes, idempotency_key, created_at')
        .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (organizationId && locationId) {
        transactionsQuery = transactionsQuery.eq('location_id', locationId)
      }

      // Run all three queries in parallel
      const [sessionsResult, inventoryResult, transactionsResult] = await Promise.all([
        sessionsQuery,
        inventoryQuery,
        transactionsQuery,
      ])

      if (sessionsResult.error) throw sessionsResult.error
      if (inventoryResult.error) throw inventoryResult.error
      if (transactionsResult.error) throw transactionsResult.error
      if (fetchId !== fetchIdRef.current) return // stale

      setSessions((sessionsResult.data || []) as unknown as SessionWithItems[])
      setInventory(inventoryResult.data || [])
      setTransactions(transactionsResult.data || [])
    } catch (err) {
      if (fetchId !== fetchIdRef.current) return // stale
      setError(translateError(err as Error))
    }

    setLoading(false)
  }, [user, supabase, dateRange, organizationId, locationId])

  useEffect(() => {
    if (!isDemoMode) fetchData()
  }, [fetchData, isDemoMode])

  const statistics = useMemo<Statistics | null>(() => {
    if (!sessions.length && !inventory.length) return null

    // Basic stats
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

    // Consumption by brand
    const brandMap = new Map<string, { grams: number; sessions: Set<string> }>()
    sessions.forEach(session => {
      session.session_items?.forEach(item => {
        const existing = brandMap.get(item.brand) || { grams: 0, sessions: new Set() }
        existing.grams += item.grams_used
        existing.sessions.add(session.id)
        brandMap.set(item.brand, existing)
      })
    })
    const consumptionByBrand: ConsumptionByBrand[] = Array.from(brandMap.entries())
      .map(([brand, data]) => ({
        brand,
        grams: Math.round(data.grams * 10) / 10,
        sessions: data.sessions.size,
      }))
      .sort((a, b) => b.grams - a.grams)

    // Consumption by flavor
    const flavorMap = new Map<string, { grams: number; sessions: Set<string> }>()
    sessions.forEach(session => {
      session.session_items?.forEach(item => {
        const key = `${item.brand}:${item.flavor}`
        const existing = flavorMap.get(key) || { grams: 0, sessions: new Set() }
        existing.grams += item.grams_used
        existing.sessions.add(session.id)
        flavorMap.set(key, existing)
      })
    })
    const consumptionByFlavor: ConsumptionByFlavor[] = Array.from(flavorMap.entries())
      .map(([key, data]) => {
        const [brand, flavor] = key.split(':')
        return {
          brand,
          flavor,
          grams: Math.round(data.grams * 10) / 10,
          sessions: data.sessions.size,
        }
      })
      .sort((a, b) => b.grams - a.grams)
      .slice(0, 10)

    // Daily consumption
    const dailyMap = new Map<string, { grams: number; sessions: number }>()
    sessions.forEach(session => {
      const sd = new Date(session.session_date)
      const date = `${sd.getFullYear()}-${String(sd.getMonth() + 1).padStart(2, '0')}-${String(sd.getDate()).padStart(2, '0')}`
      const existing = dailyMap.get(date) || { grams: 0, sessions: 0 }
      existing.grams += session.total_grams
      existing.sessions += 1
      dailyMap.set(date, existing)
    })
    const dailyConsumption: DailyConsumption[] = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        grams: Math.round(data.grams * 10) / 10,
        sessions: data.sessions,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Top mixes (by combination of flavors - without percentages)
    const mixMap = new Map<string, { items: { brand: string; flavor: string }[]; count: number }>()
    sessions.forEach(session => {
      if (!session.session_items?.length) return
      // Group by brand+flavor only, not percentage
      const mixKey = session.session_items
        .map(i => `${i.brand}:${i.flavor}`)
        .sort()
        .join('|')
      const existing = mixMap.get(mixKey)
      if (existing) {
        existing.count += 1
      } else {
        mixMap.set(mixKey, {
          items: session.session_items.map(i => ({
            brand: i.brand,
            flavor: i.flavor,
          })),
          count: 1,
        })
      }
    })
    const topMixes = Array.from(mixMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Low stock items (less than threshold)
    const lowStockItems = inventory
      .filter(item => item.quantity_grams < lowStockThreshold)
      .sort((a, b) => a.quantity_grams - b.quantity_grams)

    // Calculate forecasts for each inventory item
    const forecasts: InventoryForecast[] = inventory.map(item => {
      const itemTransactions = transactions.filter(t => t.tobacco_inventory_id === item.id)
      const forecast = calculateForecast(item.quantity_grams, itemTransactions)
      return { ...item, forecast }
    })

    return {
      totalSessions,
      totalGramsUsed: Math.round(totalGramsUsed * 10) / 10,
      averageSessionGrams: Math.round(averageSessionGrams * 10) / 10,
      averageCompatibilityScore: Math.round(averageCompatibilityScore),
      averageRating: Math.round(averageRating * 10) / 10,
      consumptionByBrand,
      consumptionByFlavor,
      dailyConsumption,
      topMixes,
      lowStockItems,
      recentTransactions: transactions,
      forecasts,
    }
  }, [sessions, inventory, transactions, lowStockThreshold])

  return {
    statistics,
    loading,
    error,
    refresh: fetchData,
    dateRange,
    setDateRange,
  }
}
