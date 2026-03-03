'use client'

import { useCallback } from 'react'
import { useBarInventory } from '@/lib/hooks/useBarInventory'
import { useBarRecipes } from '@/lib/hooks/useBarRecipes'
import { PORTION_CONVERSIONS } from '@/data/bar-ingredients'
import type { BarSale, BarAnalytics, BarRecipeWithIngredients } from '@/types/database'
import { translateError } from '@/lib/utils/translateError'
import { generateDemoSales } from '@/lib/demo'
import { useSupabaseList } from './useSupabaseList'
import { applyOrgFilter } from './useOrgFilter'

export function computeBarAnalytics(sales: BarSale[], days: number = 7): BarAnalytics {
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

  const dayMap = new Map<string, { revenue: number; cost: number }>()
  for (const s of periodSales) {
    const d = new Date(s.sold_at)
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const existing = dayMap.get(dateKey) || { revenue: 0, cost: 0 }
    dayMap.set(dateKey, {
      revenue: existing.revenue + s.total_revenue,
      cost: existing.cost + s.total_cost,
    })
  }
  const revenueByDay = Array.from(dayMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const categoryMap = new Map<string, number>()
  for (const s of periodSales) {
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

const ORDER_BY = [{ column: 'sold_at', ascending: false }] as const

export function useBarSales(): UseBarSalesReturn {
  const {
    items: sales, setItems: setSales, loading, error, setError, refresh,
    supabase, user, organizationId, locationId, isDemoMode,
  } = useSupabaseList<BarSale>({
    table: 'bar_sales',
    cacheKey: 'bar_sales',
    orderBy: ORDER_BY,
    limit: 200,
    demoData: () => generateDemoSales(),
  })

  const { inventory, adjustQuantity } = useBarInventory()
  const { calculateCost } = useBarRecipes(inventory)

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

    try {
      // Insert sale record FIRST — so failed insert doesn't leave orphaned deductions
      const { data, error: insertError } = await supabase
        .from('bar_sales')
        .insert(saleData)
        .select()
        .single()

      if (insertError) {
        setError(translateError(insertError))
        return null
      }

      // Auto write-off: deduct ingredients from inventory AFTER sale is recorded
      for (const ing of recipe.ingredients) {
        if (!ing.bar_inventory_id) continue

        const conversion = PORTION_CONVERSIONS[ing.unit]
        if (!conversion) continue

        const deductAmount = ing.quantity * conversion.value * quantity
        try {
          await adjustQuantity(
            ing.bar_inventory_id,
            -deductAmount,
            'sale',
            `Sale: ${recipe.name} x${quantity}`
          )
        } catch {
          // Log but continue — sale is already recorded, best-effort deduction
          if (process.env.NODE_ENV !== 'production') console.error('Ingredient deduction failed for', ing.bar_inventory_id)
        }
      }

      setError(null)
      setSales(prev => [data, ...prev])
      return data
    } catch (err) {
      setError(translateError(err as Error))
      return null
    }
  }, [user, isDemoMode, supabase, calculateCost, adjustQuantity, organizationId, locationId, setSales, setError])

  const deleteSale = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false

    if (isDemoMode || !supabase) {
      setSales(prev => prev.filter(s => s.id !== id))
      return true
    }

    try {
      const { error: deleteError } = await applyOrgFilter(
        supabase.from('bar_sales').delete().eq('id', id),
        organizationId, user.id
      )

      if (deleteError) {
        setError(translateError(deleteError))
        return false
      }

      setError(null)
      setSales(prev => prev.filter(s => s.id !== id))
      return true
    } catch (err) {
      setError(translateError(err as Error))
      return false
    }
  }, [user, isDemoMode, supabase, organizationId, setSales, setError])

  const getAnalytics = useCallback((days: number = 7): BarAnalytics => {
    return computeBarAnalytics(sales, days)
  }, [sales])

  return {
    sales,
    loading,
    error,
    recordSale,
    deleteSale,
    getAnalytics,
    refresh,
  }
}
