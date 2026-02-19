'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import { calculateForecast, type ForecastResult } from '@/lib/utils/forecast'
import type { SessionWithItems, TobaccoInventory, InventoryTransaction } from '@/types/database'

// Demo bowl for sessions
const DEMO_BOWL = { id: '1', profile_id: 'demo', name: 'Phunnel Large', capacity_grams: 20, is_default: true, created_at: new Date().toISOString() }

// Demo data for statistics - sessions over the past week
const DEMO_SESSIONS: SessionWithItems[] = [
  // Today - 2 sessions
  {
    id: '1', profile_id: 'demo', created_by: null, guest_id: null, bowl_type_id: '1',
    session_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    total_grams: 20, compatibility_score: 92, notes: null, rating: 5, duration_minutes: 52,
    session_items: [
      { id: '1', session_id: '1', tobacco_inventory_id: '1', tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', grams_used: 10, percentage: 50 },
      { id: '2', session_id: '1', tobacco_inventory_id: '3', tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', grams_used: 10, percentage: 50 },
    ],
    bowl_type: DEMO_BOWL,
  },
  {
    id: '2', profile_id: 'demo', created_by: null, guest_id: null, bowl_type_id: '1',
    session_date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    total_grams: 18, compatibility_score: 85, notes: null, rating: 4, duration_minutes: 45,
    session_items: [
      { id: '3', session_id: '2', tobacco_inventory_id: '5', tobacco_id: 'tg1', brand: 'Tangiers', flavor: 'Cane Mint', grams_used: 12, percentage: 67 },
      { id: '4', session_id: '2', tobacco_inventory_id: '2', tobacco_id: 'mh2', brand: 'Musthave', flavor: 'Lemon-Lime', grams_used: 6, percentage: 33 },
    ],
    bowl_type: DEMO_BOWL,
  },
  // Yesterday - 3 sessions
  {
    id: '3', profile_id: 'demo', created_by: null, guest_id: null, bowl_type_id: '1',
    session_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    total_grams: 20, compatibility_score: 90, notes: null, rating: 5, duration_minutes: 48,
    session_items: [
      { id: '5', session_id: '3', tobacco_inventory_id: '1', tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', grams_used: 14, percentage: 70 },
      { id: '6', session_id: '3', tobacco_inventory_id: '5', tobacco_id: 'tg1', brand: 'Tangiers', flavor: 'Cane Mint', grams_used: 6, percentage: 30 },
    ],
    bowl_type: DEMO_BOWL,
  },
  {
    id: '4', profile_id: 'demo', created_by: null, guest_id: null, bowl_type_id: '1',
    session_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000).toISOString(),
    total_grams: 18, compatibility_score: 82, notes: null, rating: 4, duration_minutes: 40,
    session_items: [
      { id: '7', session_id: '4', tobacco_inventory_id: '3', tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', grams_used: 18, percentage: 100 },
    ],
    bowl_type: DEMO_BOWL,
  },
  {
    id: '5', profile_id: 'demo', created_by: null, guest_id: null, bowl_type_id: '2',
    session_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 6 * 60 * 60 * 1000).toISOString(),
    total_grams: 15, compatibility_score: 78, notes: null, rating: 3, duration_minutes: 35,
    session_items: [
      { id: '8', session_id: '5', tobacco_inventory_id: '4', tobacco_id: 'ds2', brand: 'Darkside', flavor: 'Bananapapa', grams_used: 15, percentage: 100 },
    ],
    bowl_type: { id: '2', profile_id: 'demo', name: 'Phunnel Medium', capacity_grams: 15, is_default: false, created_at: new Date().toISOString() },
  },
  // 2 days ago - 1 session
  {
    id: '6', profile_id: 'demo', created_by: null, guest_id: null, bowl_type_id: '1',
    session_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    total_grams: 20, compatibility_score: 88, notes: null, rating: 4, duration_minutes: 50,
    session_items: [
      { id: '9', session_id: '6', tobacco_inventory_id: '2', tobacco_id: 'mh2', brand: 'Musthave', flavor: 'Lemon-Lime', grams_used: 10, percentage: 50 },
      { id: '10', session_id: '6', tobacco_inventory_id: '3', tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', grams_used: 10, percentage: 50 },
    ],
    bowl_type: DEMO_BOWL,
  },
  // 3 days ago - 2 sessions
  {
    id: '7', profile_id: 'demo', created_by: null, guest_id: null, bowl_type_id: '1',
    session_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    total_grams: 20, compatibility_score: 95, notes: 'Отличный микс!', rating: 5, duration_minutes: 55,
    session_items: [
      { id: '11', session_id: '7', tobacco_inventory_id: '1', tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', grams_used: 12, percentage: 60 },
      { id: '12', session_id: '7', tobacco_inventory_id: '5', tobacco_id: 'tg1', brand: 'Tangiers', flavor: 'Cane Mint', grams_used: 8, percentage: 40 },
    ],
    bowl_type: DEMO_BOWL,
  },
  {
    id: '8', profile_id: 'demo', created_by: null, guest_id: null, bowl_type_id: '1',
    session_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000).toISOString(),
    total_grams: 18, compatibility_score: 80, notes: null, rating: 4, duration_minutes: 42,
    session_items: [
      { id: '13', session_id: '8', tobacco_inventory_id: '4', tobacco_id: 'ds2', brand: 'Darkside', flavor: 'Bananapapa', grams_used: 9, percentage: 50 },
      { id: '14', session_id: '8', tobacco_inventory_id: '2', tobacco_id: 'mh2', brand: 'Musthave', flavor: 'Lemon-Lime', grams_used: 9, percentage: 50 },
    ],
    bowl_type: DEMO_BOWL,
  },
  // 5 days ago - 1 session
  {
    id: '9', profile_id: 'demo', created_by: null, guest_id: null, bowl_type_id: '1',
    session_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    total_grams: 20, compatibility_score: 88, notes: null, rating: 4, duration_minutes: 47,
    session_items: [
      { id: '15', session_id: '9', tobacco_inventory_id: '1', tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', grams_used: 14, percentage: 70 },
      { id: '16', session_id: '9', tobacco_inventory_id: '5', tobacco_id: 'tg1', brand: 'Tangiers', flavor: 'Cane Mint', grams_used: 6, percentage: 30 },
    ],
    bowl_type: DEMO_BOWL,
  },
  // 6 days ago - 2 sessions
  {
    id: '10', profile_id: 'demo', created_by: null, guest_id: null, bowl_type_id: '1',
    session_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    total_grams: 20, compatibility_score: 91, notes: null, rating: 5, duration_minutes: 53,
    session_items: [
      { id: '17', session_id: '10', tobacco_inventory_id: '3', tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', grams_used: 10, percentage: 50 },
      { id: '18', session_id: '10', tobacco_inventory_id: '1', tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', grams_used: 10, percentage: 50 },
    ],
    bowl_type: DEMO_BOWL,
  },
  {
    id: '11', profile_id: 'demo', created_by: null, guest_id: null, bowl_type_id: '2',
    session_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 - 5 * 60 * 60 * 1000).toISOString(),
    total_grams: 15, compatibility_score: 75, notes: null, rating: 3, duration_minutes: 30,
    session_items: [
      { id: '19', session_id: '11', tobacco_inventory_id: '2', tobacco_id: 'mh2', brand: 'Musthave', flavor: 'Lemon-Lime', grams_used: 15, percentage: 100 },
    ],
    bowl_type: { id: '2', profile_id: 'demo', name: 'Phunnel Medium', capacity_grams: 15, is_default: false, created_at: new Date().toISOString() },
  },
]

const DEMO_INVENTORY: TobaccoInventory[] = [
  { id: '1', profile_id: 'demo', tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', quantity_grams: 180, purchase_price: 15, package_grams: 100, purchase_date: null, expiry_date: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', profile_id: 'demo', tobacco_id: 'mh2', brand: 'Musthave', flavor: 'Lemon-Lime', quantity_grams: 95, purchase_price: 15, package_grams: 100, purchase_date: null, expiry_date: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '3', profile_id: 'demo', tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', quantity_grams: 220, purchase_price: 18, package_grams: 100, purchase_date: null, expiry_date: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '4', profile_id: 'demo', tobacco_id: 'ds2', brand: 'Darkside', flavor: 'Bananapapa', quantity_grams: 45, purchase_price: 18, package_grams: 100, purchase_date: null, expiry_date: null, notes: 'Low stock!', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '5', profile_id: 'demo', tobacco_id: 'tg1', brand: 'Tangiers', flavor: 'Cane Mint', quantity_grams: 150, purchase_price: 22, package_grams: 100, purchase_date: null, expiry_date: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '6', profile_id: 'demo', tobacco_id: 'bb1', brand: 'Black Burn', flavor: 'Something Berry', quantity_grams: 0, purchase_price: 14, package_grams: 100, purchase_date: null, expiry_date: null, notes: 'Need to order', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]

const DEMO_TRANSACTIONS: InventoryTransaction[] = [
  // Today
  { id: '1', profile_id: 'demo', tobacco_inventory_id: '1', type: 'session', quantity_grams: -10, session_id: '1', notes: 'Pinkman', created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: '2', profile_id: 'demo', tobacco_inventory_id: '3', type: 'session', quantity_grams: -10, session_id: '1', notes: 'Supernova', created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: '3', profile_id: 'demo', tobacco_inventory_id: '5', type: 'session', quantity_grams: -12, session_id: '2', notes: 'Cane Mint', created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
  // Yesterday
  { id: '4', profile_id: 'demo', tobacco_inventory_id: '1', type: 'session', quantity_grams: -14, session_id: '3', notes: 'Pinkman', created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '5', profile_id: 'demo', tobacco_inventory_id: '3', type: 'session', quantity_grams: -18, session_id: '4', notes: 'Supernova', created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '6', profile_id: 'demo', tobacco_inventory_id: '4', type: 'session', quantity_grams: -15, session_id: '5', notes: 'Bananapapa', created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  // 2 days ago
  { id: '7', profile_id: 'demo', tobacco_inventory_id: '2', type: 'session', quantity_grams: -10, session_id: '6', notes: 'Lemon-Lime', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  // 3 days ago
  { id: '8', profile_id: 'demo', tobacco_inventory_id: '1', type: 'session', quantity_grams: -12, session_id: '7', notes: 'Pinkman', created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '9', profile_id: 'demo', tobacco_inventory_id: '4', type: 'session', quantity_grams: -9, session_id: '8', notes: 'Bananapapa', created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  // 5 days ago
  { id: '10', profile_id: 'demo', tobacco_inventory_id: '1', type: 'session', quantity_grams: -14, session_id: '9', notes: 'Pinkman', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  // 6 days ago
  { id: '11', profile_id: 'demo', tobacco_inventory_id: '3', type: 'session', quantity_grams: -10, session_id: '10', notes: 'Supernova', created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
  // Initial purchases
  { id: '12', profile_id: 'demo', tobacco_inventory_id: '1', type: 'purchase', quantity_grams: 200, session_id: null, notes: 'Закупка', created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '13', profile_id: 'demo', tobacco_inventory_id: '3', type: 'purchase', quantity_grams: 200, session_id: null, notes: 'Закупка', created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
]

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

    setLoading(true)
    setError(null)

    try {
      // Fetch sessions with items
      let sessionsQuery = supabase
        .from('sessions')
        .select(`
          *,
          session_items (*)
        `)
        .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)
        .gte('session_date', dateRange.start.toISOString())
        .lte('session_date', dateRange.end.toISOString())
        .order('session_date', { ascending: false })

      if (organizationId && locationId) {
        sessionsQuery = sessionsQuery.eq('location_id', locationId)
      }

      const { data: sessionsData, error: sessionsError } = await sessionsQuery

      if (sessionsError) throw sessionsError
      setSessions(sessionsData || [])

      // Fetch inventory
      let inventoryQuery = supabase
        .from('tobacco_inventory')
        .select('*')
        .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

      if (organizationId && locationId) {
        inventoryQuery = inventoryQuery.eq('location_id', locationId)
      }

      const { data: inventoryData, error: inventoryError } = await inventoryQuery

      if (inventoryError) throw inventoryError
      setInventory(inventoryData || [])

      // Fetch recent transactions
      let transactionsQuery = supabase
        .from('inventory_transactions')
        .select('*')
        .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (organizationId && locationId) {
        transactionsQuery = transactionsQuery.eq('location_id', locationId)
      }

      const { data: transactionsData, error: transactionsError } = await transactionsQuery

      if (transactionsError) throw transactionsError
      setTransactions(transactionsData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки статистики')
    }

    setLoading(false)
  }, [user, supabase, dateRange, organizationId, locationId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
      const date = new Date(session.session_date).toISOString().split('T')[0]
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
  }, [sessions, inventory, transactions])

  return {
    statistics,
    loading,
    error,
    refresh: fetchData,
    dateRange,
    setDateRange,
  }
}
