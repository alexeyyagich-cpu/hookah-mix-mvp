'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import { useBarInventory } from '@/lib/hooks/useBarInventory'
import { useBarRecipes } from '@/lib/hooks/useBarRecipes'
import { PORTION_CONVERSIONS } from '@/data/bar-ingredients'
import type { BarSale, BarAnalytics, BarRecipeWithIngredients } from '@/types/database'

// Demo sales data (past 7 days)
function generateDemoSales(): BarSale[] {
  const now = new Date()
  const sales: BarSale[] = []
  const cocktails = [
    { name: 'Мохито', price: 9, cost: 2.4, recipe_id: 'demo-r1' },
    { name: 'Негрони', price: 11, cost: 3.2, recipe_id: 'demo-r2' },
    { name: 'Джин-Тоник', price: 8, cost: 1.9, recipe_id: 'demo-r3' },
    { name: 'Апероль Шприц', price: 9, cost: 2.6, recipe_id: 'demo-r4' },
    { name: 'Эспрессо Мартини', price: 11, cost: 3.0, recipe_id: 'demo-r7' },
    { name: 'Leipzig Sour', price: 12, cost: 3.5, recipe_id: 'demo-r8' },
    { name: 'Московский мул', price: 9, cost: 2.1, recipe_id: 'demo-r11' },
    { name: 'Tropical Hookah', price: 7, cost: 1.5, recipe_id: 'demo-r10' },
  ]

  for (let day = 0; day < 7; day++) {
    const date = new Date(now)
    date.setDate(date.getDate() - day)
    const salesPerDay = 3 + Math.floor(Math.random() * 5)

    for (let j = 0; j < salesPerDay; j++) {
      const cocktail = cocktails[Math.floor(Math.random() * cocktails.length)]
      const qty = 1 + Math.floor(Math.random() * 2)
      const revenue = cocktail.price * qty
      const cost = cocktail.cost * qty
      const margin = ((revenue - cost) / revenue) * 100

      date.setHours(14 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60))

      sales.push({
        id: `demo-sale-${day}-${j}`,
        profile_id: 'demo',
        recipe_id: cocktail.recipe_id,
        recipe_name: cocktail.name,
        quantity: qty,
        unit_price: cocktail.price,
        total_revenue: revenue,
        total_cost: cost,
        margin_percent: margin,
        table_id: null,
        guest_name: null,
        notes: null,
        sold_at: date.toISOString(),
      })
    }
  }

  return sales.sort((a, b) => new Date(b.sold_at).getTime() - new Date(a.sold_at).getTime())
}

interface UseBarSalesReturn {
  sales: BarSale[]
  loading: boolean
  error: string | null
  recordSale: (recipe: BarRecipeWithIngredients, quantity?: number, notes?: string) => Promise<BarSale | null>
  deleteSale: (id: string) => Promise<boolean>
  getAnalytics: (days?: number) => BarAnalytics
  refresh: () => Promise<void>
}

export function useBarSales(): UseBarSalesReturn {
  const [sales, setSales] = useState<BarSale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isDemoMode } = useAuth()
  const { organizationId, locationId } = useOrganizationContext()
  const { inventory, adjustQuantity } = useBarInventory()
  const { calculateCost } = useBarRecipes()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  useEffect(() => {
    if (isDemoMode && user) {
      setSales(generateDemoSales())
      setLoading(false)
    }
  }, [isDemoMode, user])

  const fetchSales = useCallback(async () => {
    if (!user || !supabase) {
      setSales([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('bar_sales')
      .select('*')
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)
      .order('sold_at', { ascending: false })
      .limit(500)

    if (fetchError) {
      setError(fetchError.message)
      setSales([])
      setLoading(false)
      return
    }

    setSales(data || [])
    setLoading(false)
  }, [user, supabase, organizationId])

  useEffect(() => {
    if (!isDemoMode) fetchSales()
  }, [fetchSales, isDemoMode])

  const recordSale = useCallback(async (
    recipe: BarRecipeWithIngredients,
    quantity: number = 1,
    notes?: string
  ): Promise<BarSale | null> => {
    if (!user) return null

    // Calculate cost at time of sale
    const cost = calculateCost(recipe)
    const unitPrice = recipe.menu_price || 0
    const totalRevenue = unitPrice * quantity
    const totalCost = cost.total_cost * quantity
    const margin = totalRevenue > 0
      ? ((totalRevenue - totalCost) / totalRevenue) * 100
      : null

    // Auto write-off: deduct ingredients from inventory
    for (const ing of recipe.ingredients) {
      if (!ing.bar_inventory_id) continue

      const conversion = PORTION_CONVERSIONS[ing.unit]
      if (!conversion) continue

      const deductAmount = ing.quantity * conversion.value * quantity
      await adjustQuantity(
        ing.bar_inventory_id,
        -deductAmount,
        'sale',
        `Продажа: ${recipe.name} x${quantity}`
      )
    }

    const saleData = {
      profile_id: user.id,
      ...(organizationId ? { organization_id: organizationId, location_id: locationId } : {}),
      recipe_id: recipe.id,
      recipe_name: recipe.name,
      quantity,
      unit_price: unitPrice,
      total_revenue: totalRevenue,
      total_cost: totalCost,
      margin_percent: margin,
      table_id: null,
      guest_name: null,
      notes: notes || null,
    }

    if (isDemoMode || !supabase) {
      const newSale: BarSale = {
        ...saleData,
        id: `demo-sale-${Date.now()}`,
        sold_at: new Date().toISOString(),
      }
      setSales(prev => [newSale, ...prev])
      return newSale
    }

    const { data, error: insertError } = await supabase
      .from('bar_sales')
      .insert(saleData)
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      return null
    }

    setSales(prev => [data, ...prev])
    return data
  }, [user, isDemoMode, supabase, calculateCost, adjustQuantity, organizationId, locationId])

  const deleteSale = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false

    if (isDemoMode || !supabase) {
      setSales(prev => prev.filter(s => s.id !== id))
      return true
    }

    const { error: deleteError } = await supabase
      .from('bar_sales')
      .delete()
      .eq('id', id)
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

    if (deleteError) {
      setError(deleteError.message)
      return false
    }

    setSales(prev => prev.filter(s => s.id !== id))
    return true
  }, [user, isDemoMode, supabase, organizationId])

  const getAnalytics = useCallback((days: number = 7): BarAnalytics => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    const periodSales = sales.filter(s => new Date(s.sold_at) >= cutoff)

    const totalRevenue = periodSales.reduce((sum, s) => sum + s.total_revenue, 0)
    const totalCost = periodSales.reduce((sum, s) => sum + s.total_cost, 0)
    const totalProfit = totalRevenue - totalCost
    const totalSalesCount = periodSales.reduce((sum, s) => sum + s.quantity, 0)

    const margins = periodSales
      .map(s => s.margin_percent)
      .filter((m): m is number => m !== null)
    const avgMargin = margins.length > 0
      ? margins.reduce((a, b) => a + b, 0) / margins.length
      : null

    // Top cocktails
    const cocktailMap = new Map<string, { count: number; revenue: number }>()
    for (const s of periodSales) {
      const existing = cocktailMap.get(s.recipe_name) || { count: 0, revenue: 0 }
      cocktailMap.set(s.recipe_name, {
        count: existing.count + s.quantity,
        revenue: existing.revenue + s.total_revenue,
      })
    }
    const topCocktails = Array.from(cocktailMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)

    // Revenue by day
    const dayMap = new Map<string, { revenue: number; cost: number }>()
    for (const s of periodSales) {
      const dateKey = new Date(s.sold_at).toISOString().split('T')[0]
      const existing = dayMap.get(dateKey) || { revenue: 0, cost: 0 }
      dayMap.set(dateKey, {
        revenue: existing.revenue + s.total_revenue,
        cost: existing.cost + s.total_cost,
      })
    }
    const revenueByDay = Array.from(dayMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Cost by ingredient category (from inventory)
    const categoryMap = new Map<string, number>()
    for (const s of periodSales) {
      // Approximate: distribute total cost evenly across "ingredients"
      // In a real scenario, we'd join with recipe ingredients
      const key = 'cocktails'
      categoryMap.set(key, (categoryMap.get(key) || 0) + s.total_cost)
    }
    const costByCategory = Array.from(categoryMap.entries())
      .map(([category, cost]) => ({ category, cost }))

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      totalSales: totalSalesCount,
      avgMargin,
      topCocktails,
      revenueByDay,
      costByCategory,
    }
  }, [sales])

  return {
    sales,
    loading,
    error,
    recordSale,
    deleteSale,
    getAnalytics,
    refresh: fetchSales,
  }
}
