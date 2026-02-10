'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/AuthContext'
import { calculateForecast, type ForecastResult } from '@/lib/utils/forecast'
import type { SessionWithItems, TobaccoInventory, InventoryTransaction } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Demo bowl for sessions
const DEMO_BOWL = { id: '1', profile_id: 'demo', name: 'Phunnel Large', capacity_grams: 20, is_default: true, created_at: new Date().toISOString() }

// Demo data for statistics
const DEMO_SESSIONS: SessionWithItems[] = [
  {
    id: '1', profile_id: 'demo', bowl_type_id: '1',
    session_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    total_grams: 20, compatibility_score: 92, notes: null, rating: 5,
    session_items: [
      { id: '1', session_id: '1', tobacco_inventory_id: '1', tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', grams_used: 10, percentage: 50 },
      { id: '2', session_id: '1', tobacco_inventory_id: '3', tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', grams_used: 10, percentage: 50 },
    ],
    bowl_type: DEMO_BOWL,
  },
  {
    id: '2', profile_id: 'demo', bowl_type_id: '1',
    session_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    total_grams: 18, compatibility_score: 85, notes: null, rating: 4,
    session_items: [
      { id: '3', session_id: '2', tobacco_inventory_id: '5', tobacco_id: 'tg1', brand: 'Tangiers', flavor: 'Cane Mint', grams_used: 12, percentage: 67 },
      { id: '4', session_id: '2', tobacco_inventory_id: '2', tobacco_id: 'mh2', brand: 'Musthave', flavor: 'Lemon-Lime', grams_used: 6, percentage: 33 },
    ],
    bowl_type: DEMO_BOWL,
  },
  {
    id: '3', profile_id: 'demo', bowl_type_id: '2',
    session_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    total_grams: 15, compatibility_score: 78, notes: null, rating: 3,
    session_items: [
      { id: '5', session_id: '3', tobacco_inventory_id: '4', tobacco_id: 'ds2', brand: 'Darkside', flavor: 'Bananapapa', grams_used: 15, percentage: 100 },
    ],
    bowl_type: { id: '2', profile_id: 'demo', name: 'Phunnel Medium', capacity_grams: 15, is_default: false, created_at: new Date().toISOString() },
  },
  {
    id: '4', profile_id: 'demo', bowl_type_id: '1',
    session_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    total_grams: 20, compatibility_score: 88, notes: null, rating: 4,
    session_items: [
      { id: '6', session_id: '4', tobacco_inventory_id: '1', tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', grams_used: 14, percentage: 70 },
      { id: '7', session_id: '4', tobacco_inventory_id: '5', tobacco_id: 'tg1', brand: 'Tangiers', flavor: 'Cane Mint', grams_used: 6, percentage: 30 },
    ],
    bowl_type: DEMO_BOWL,
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
  { id: '1', profile_id: 'demo', tobacco_inventory_id: '1', type: 'session', quantity_grams: -10, session_id: '1', notes: 'Session: Musthave Pinkman', created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '2', profile_id: 'demo', tobacco_inventory_id: '3', type: 'session', quantity_grams: -10, session_id: '1', notes: 'Session: Darkside Supernova', created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '3', profile_id: 'demo', tobacco_inventory_id: '5', type: 'session', quantity_grams: -12, session_id: '2', notes: 'Session: Tangiers Cane Mint', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '4', profile_id: 'demo', tobacco_inventory_id: '1', type: 'purchase', quantity_grams: 200, session_id: null, notes: 'Initial stock', created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
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
  topMixes: { items: { brand: string; flavor: string; percentage: number }[]; count: number }[]
  lowStockItems: TobaccoInventory[]
  recentTransactions: InventoryTransaction[]
  forecasts: InventoryForecast[]
}

interface UseStatisticsReturn {
  statistics: Statistics | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  dateRange: { start: Date; end: Date }
  setDateRange: (range: { start: Date; end: Date }) => void
}

export function useStatistics(): UseStatisticsReturn {
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
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          *,
          session_items (*)
        `)
        .eq('profile_id', user.id)
        .gte('session_date', dateRange.start.toISOString())
        .lte('session_date', dateRange.end.toISOString())
        .order('session_date', { ascending: false })

      if (sessionsError) throw sessionsError
      setSessions(sessionsData || [])

      // Fetch inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('tobacco_inventory')
        .select('*')
        .eq('profile_id', user.id)

      if (inventoryError) throw inventoryError
      setInventory(inventoryData || [])

      // Fetch recent transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('inventory_transactions')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (transactionsError) throw transactionsError
      setTransactions(transactionsData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки статистики')
    }

    setLoading(false)
  }, [user, supabase, dateRange])

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

    // Top mixes (by combination of flavors)
    const mixMap = new Map<string, { items: { brand: string; flavor: string; percentage: number }[]; count: number }>()
    sessions.forEach(session => {
      if (!session.session_items?.length) return
      const mixKey = session.session_items
        .map(i => `${i.brand}:${i.flavor}:${i.percentage}`)
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
            percentage: i.percentage,
          })),
          count: 1,
        })
      }
    })
    const topMixes = Array.from(mixMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Low stock items (less than 50g)
    const lowStockItems = inventory
      .filter(item => item.quantity_grams < 50)
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
