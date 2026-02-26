'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useModules } from '@/lib/hooks/useModules'
import { useBarSales } from '@/lib/hooks/useBarSales'
import { useBarInventory } from '@/lib/hooks/useBarInventory'
import { useSessions } from '@/lib/hooks/useSessions'
import { useInventory } from '@/lib/hooks/useInventory'

export interface PnLLineItem {
  date: string
  barRevenue: number
  barCost: number
  hookahCost: number
  totalRevenue: number
  totalCost: number
  profit: number
}

export interface CostCategory {
  category: string
  module: 'bar' | 'hookah'
  cost: number
  percentage: number
}

export interface TopProfitableItem {
  name: string
  module: 'bar' | 'hookah'
  revenue: number
  cost: number
  profit: number
  margin: number
  count: number
}

export interface PnLBarData {
  revenue: number
  cost: number
  profit: number
  salesCount: number
  avgMargin: number | null
}

export interface PnLHookahData {
  revenue: number
  cost: number
  profit: number
  margin: number | null
  gramsUsed: number
  sessionsCount: number
  costPerSession: number
}

export interface PnLData {
  totalRevenue: number
  totalCost: number
  grossProfit: number
  marginPercent: number | null

  // Previous period comparison
  prevRevenue: number
  prevCost: number
  prevProfit: number
  revenueChange: number | null
  costChange: number | null
  profitChange: number | null

  // Module data
  bar: PnLBarData | null
  hookah: PnLHookahData | null

  // Breakdowns
  dailyPnL: PnLLineItem[]
  costByCategory: CostCategory[]
  topItems: TopProfitableItem[]
}

export type PnLPreset = '7d' | '30d' | '90d'

interface UsePnLReturn {
  data: PnLData
  loading: boolean
  error: string | null
  selectedPreset: PnLPreset
  setSelectedPreset: (preset: PnLPreset) => void
  period: { start: Date; end: Date }
}

function getPresetDays(preset: PnLPreset): number {
  switch (preset) {
    case '7d': return 7
    case '30d': return 30
    case '90d': return 90
  }
}

function percentChange(prev: number, curr: number): number | null {
  if (prev === 0) return curr > 0 ? 100 : null
  return ((curr - prev) / prev) * 100
}

function dateKey(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toISOString().split('T')[0]
}

export function usePnL(): UsePnLReturn {
  const { isDemoMode } = useAuth()
  const { isHookahActive, isBarActive } = useModules()
  const { sales, loading: barLoading, error: barError } = useBarSales()
  const { inventory: barInventory } = useBarInventory()
  const { sessions, loading: sessionsLoading } = useSessions()
  const { inventory: tobaccoInventory } = useInventory()

  const [selectedPreset, setSelectedPreset] = useState<PnLPreset>('30d')

  // Memoize date boundaries so useMemo deps stay stable
  const { days, periodStart, periodEnd, prevStart, prevEnd } = useMemo(() => {
    const d = getPresetDays(selectedPreset)
    const now = new Date()
    const pEnd = new Date(now)
    const pStart = new Date(now)
    pStart.setDate(pStart.getDate() - d)
    const pvEnd = new Date(pStart)
    const pvStart = new Date(pStart)
    pvStart.setDate(pvStart.getDate() - d)
    return { days: d, periodStart: pStart, periodEnd: pEnd, prevStart: pvStart, prevEnd: pvEnd }
  }, [selectedPreset])

  const loading = barLoading || sessionsLoading

  // Build a price-per-gram lookup from tobacco inventory
  const pricePerGram = useMemo(() => {
    const map: Record<string, number> = {}
    for (const item of tobaccoInventory) {
      if (item.purchase_price && item.package_grams && item.package_grams > 0) {
        map[item.tobacco_id] = item.purchase_price / item.package_grams
      }
    }
    return map
  }, [tobaccoInventory])

  // Bar category lookup
  const barCategoryMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const item of barInventory) {
      map[item.id] = item.category
    }
    return map
  }, [barInventory])

  const data = useMemo<PnLData>(() => {
    // --- BAR: current period ---
    const periodSales = isBarActive
      ? sales.filter(s => {
          const d = new Date(s.sold_at)
          return d >= periodStart && d <= periodEnd
        })
      : []

    const barRevenue = periodSales.reduce((s, x) => s + x.total_revenue, 0)
    const barCost = periodSales.reduce((s, x) => s + x.total_cost, 0)
    const barProfit = barRevenue - barCost
    const barSalesCount = periodSales.reduce((s, x) => s + x.quantity, 0)
    const margins = periodSales.map(s => s.margin_percent).filter((m): m is number => m !== null)
    const barAvgMargin = margins.length > 0 ? margins.reduce((a, b) => a + b, 0) / margins.length : null

    // --- BAR: previous period ---
    const prevSales = isBarActive
      ? sales.filter(s => {
          const d = new Date(s.sold_at)
          return d >= prevStart && d < prevEnd
        })
      : []
    const prevBarRevenue = prevSales.reduce((s, x) => s + x.total_revenue, 0)
    const prevBarCost = prevSales.reduce((s, x) => s + x.total_cost, 0)

    // --- HOOKAH: current period ---
    const periodSessions = isHookahActive
      ? sessions.filter(s => {
          const d = new Date(s.session_date)
          return d >= periodStart && d <= periodEnd
        })
      : []

    let hookahCost = 0
    let hookahRevenue = 0
    let hookahGrams = 0
    const hookahBrandCosts: Record<string, number> = {}

    for (const session of periodSessions) {
      if (session.selling_price) {
        hookahRevenue += session.selling_price
      }
      for (const item of session.session_items || []) {
        const ppg = pricePerGram[item.tobacco_id] || 0
        const itemCost = item.grams_used * ppg
        hookahCost += itemCost
        hookahGrams += item.grams_used
        hookahBrandCosts[item.brand] = (hookahBrandCosts[item.brand] || 0) + itemCost
      }
    }

    // --- HOOKAH: previous period ---
    const prevSessions = isHookahActive
      ? sessions.filter(s => {
          const d = new Date(s.session_date)
          return d >= prevStart && d < prevEnd
        })
      : []
    let prevHookahCost = 0
    let prevHookahRevenue = 0
    for (const session of prevSessions) {
      if (session.selling_price) {
        prevHookahRevenue += session.selling_price
      }
      for (const item of session.session_items || []) {
        prevHookahCost += item.grams_used * (pricePerGram[item.tobacco_id] || 0)
      }
    }

    // --- TOTALS ---
    const totalRevenue = barRevenue + hookahRevenue
    const totalCost = barCost + hookahCost
    const grossProfit = totalRevenue - totalCost
    const marginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : null

    const prevRevenue = prevBarRevenue + prevHookahRevenue
    const prevCost = prevBarCost + prevHookahCost
    const prevProfit = prevRevenue - prevCost

    // --- DAILY P&L ---
    const dayMap: Record<string, PnLLineItem> = {}

    // Fill all days in range
    for (let i = 0; i < days; i++) {
      const d = new Date(periodStart)
      d.setDate(d.getDate() + i)
      const key = dateKey(d)
      dayMap[key] = {
        date: key,
        barRevenue: 0,
        barCost: 0,
        hookahCost: 0,
        totalRevenue: 0,
        totalCost: 0,
        profit: 0,
      }
    }

    for (const sale of periodSales) {
      const key = dateKey(sale.sold_at)
      if (dayMap[key]) {
        dayMap[key].barRevenue += sale.total_revenue
        dayMap[key].barCost += sale.total_cost
      }
    }

    for (const session of periodSessions) {
      const key = dateKey(session.session_date)
      if (dayMap[key]) {
        if (session.selling_price) {
          dayMap[key].barRevenue += 0 // hookah revenue handled below
        }
        for (const item of session.session_items || []) {
          dayMap[key].hookahCost += item.grams_used * (pricePerGram[item.tobacco_id] || 0)
        }
      }
    }

    // Accumulate hookah revenue per day
    const hookahRevenueByDay: Record<string, number> = {}
    for (const session of periodSessions) {
      const key = dateKey(session.session_date)
      if (session.selling_price) {
        hookahRevenueByDay[key] = (hookahRevenueByDay[key] || 0) + session.selling_price
      }
    }

    const dailyPnL = Object.values(dayMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        ...d,
        totalRevenue: d.barRevenue + (hookahRevenueByDay[d.date] || 0),
        totalCost: d.barCost + d.hookahCost,
        profit: d.barRevenue + (hookahRevenueByDay[d.date] || 0) - d.barCost - d.hookahCost,
      }))

    // --- COST BY CATEGORY ---
    const catMap: Record<string, { module: 'bar' | 'hookah'; cost: number }> = {}

    // Bar cost categories from sales — approximate by recipe cost distribution
    // Since we don't have per-ingredient cost per sale, use bar inventory categories
    const barCatCost = barCost
    if (barCatCost > 0) {
      // Distribute bar cost proportionally among inventory categories
      const invByCat: Record<string, number> = {}
      let totalInvValue = 0
      for (const item of barInventory) {
        if (item.purchase_price) {
          const cat = item.category
          invByCat[cat] = (invByCat[cat] || 0) + item.purchase_price
          totalInvValue += item.purchase_price
        }
      }
      if (totalInvValue > 0) {
        for (const [cat, val] of Object.entries(invByCat)) {
          catMap[`bar:${cat}`] = {
            module: 'bar',
            cost: (val / totalInvValue) * barCatCost,
          }
        }
      } else {
        catMap['bar:cocktails'] = { module: 'bar', cost: barCatCost }
      }
    }

    // Hookah cost by brand
    for (const [brand, cost] of Object.entries(hookahBrandCosts)) {
      catMap[`hookah:${brand}`] = { module: 'hookah', cost }
    }

    const totalCostForCategories = Object.values(catMap).reduce((s, x) => s + x.cost, 0)
    const costByCategory: CostCategory[] = Object.entries(catMap)
      .map(([key, val]) => ({
        category: key.split(':')[1],
        module: val.module,
        cost: val.cost,
        percentage: totalCostForCategories > 0 ? (val.cost / totalCostForCategories) * 100 : 0,
      }))
      .sort((a, b) => b.cost - a.cost)

    // --- TOP PROFITABLE ITEMS ---
    const topItems: TopProfitableItem[] = []

    // Bar: group sales by recipe_name
    const cocktailMap: Record<string, { revenue: number; cost: number; count: number }> = {}
    for (const s of periodSales) {
      const existing = cocktailMap[s.recipe_name] || { revenue: 0, cost: 0, count: 0 }
      cocktailMap[s.recipe_name] = {
        revenue: existing.revenue + s.total_revenue,
        cost: existing.cost + s.total_cost,
        count: existing.count + s.quantity,
      }
    }
    for (const [name, val] of Object.entries(cocktailMap)) {
      const profit = val.revenue - val.cost
      topItems.push({
        name,
        module: 'bar',
        revenue: val.revenue,
        cost: val.cost,
        profit,
        margin: val.revenue > 0 ? (profit / val.revenue) * 100 : 0,
        count: val.count,
      })
    }

    // Hookah: top brands by cost
    for (const [brand, cost] of Object.entries(hookahBrandCosts)) {
      topItems.push({
        name: brand,
        module: 'hookah',
        revenue: 0,
        cost,
        profit: -cost,
        margin: 0,
        count: 0,
      })
    }

    topItems.sort((a, b) => b.profit - a.profit)

    return {
      totalRevenue,
      totalCost,
      grossProfit,
      marginPercent,
      prevRevenue,
      prevCost,
      prevProfit,
      revenueChange: percentChange(prevRevenue, totalRevenue),
      costChange: percentChange(prevCost, totalCost),
      profitChange: percentChange(prevProfit, grossProfit),
      bar: isBarActive ? {
        revenue: barRevenue,
        cost: barCost,
        profit: barProfit,
        salesCount: barSalesCount,
        avgMargin: barAvgMargin,
      } : null,
      hookah: isHookahActive ? {
        revenue: hookahRevenue,
        cost: hookahCost,
        profit: hookahRevenue - hookahCost,
        margin: hookahRevenue > 0 ? ((hookahRevenue - hookahCost) / hookahRevenue) * 100 : null,
        gramsUsed: hookahGrams,
        sessionsCount: periodSessions.length,
        costPerSession: periodSessions.length > 0 ? hookahCost / periodSessions.length : 0,
      } : null,
      dailyPnL,
      costByCategory,
      topItems,
    }
  }, [sales, sessions, tobaccoInventory, barInventory, pricePerGram, isBarActive, isHookahActive, periodStart, periodEnd, prevStart, prevEnd, days])

  return {
    data,
    loading,
    error: barError || null,
    selectedPreset,
    setSelectedPreset,
    period: { start: periodStart, end: periodEnd },
  }
}
