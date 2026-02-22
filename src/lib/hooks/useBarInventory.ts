'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import type { BarInventoryItem, BarTransaction, BarTransactionType } from '@/types/database'
import { SUBSCRIPTION_LIMITS } from '@/types/database'

// Demo bar inventory — Leipzig hookah lounge
const t = new Date().toISOString()
const bi = (id: string, name: string, brand: string, cat: BarInventoryItem['category'], unit: string, qty: number, min: number, price: number, pkg: number, notes: string | null = null): BarInventoryItem => ({
  id, profile_id: 'demo', name, brand, category: cat, unit_type: unit as BarInventoryItem['unit_type'],
  quantity: qty, min_quantity: min, purchase_price: price, package_size: pkg,
  supplier_name: null, barcode: null, notes, created_at: t, updated_at: t,
})

const DEMO_BAR_INVENTORY: BarInventoryItem[] = [
  // Spirits
  bi('b1', 'Bulleit Bourbon', 'Bulleit', 'spirit', 'ml', 450, 200, 28, 700),
  bi('b2', 'Beefeater Gin', 'Beefeater', 'spirit', 'ml', 380, 200, 22, 700),
  bi('b3', 'Bacardi White Rum', 'Bacardi', 'spirit', 'ml', 550, 200, 16, 700),
  bi('b9', 'Absolut Vodka', 'Absolut', 'spirit', 'ml', 620, 200, 18, 700),
  bi('b10', 'Olmeca Blanco Tequila', 'Olmeca', 'spirit', 'ml', 320, 200, 20, 700),
  bi('b11', 'Campari', 'Campari', 'spirit', 'ml', 280, 150, 16, 700),
  bi('b12', 'Aperol', 'Aperol', 'spirit', 'ml', 400, 200, 14, 700),
  bi('b13', 'Kahlúa Coffee Liqueur', 'Kahlúa', 'spirit', 'ml', 350, 150, 18, 700),
  // Syrups
  bi('b4', 'Simple Syrup', '', 'syrup', 'ml', 750, 200, 5, 1000),
  bi('b14', 'Sea Buckthorn Syrup', '', 'syrup', 'ml', 300, 150, 8, 500, 'For Leipzig Sour'),
  bi('b15', 'Honey Syrup', '', 'syrup', 'ml', 400, 150, 6, 500),
  bi('b16', 'Coconut Syrup', '', 'syrup', 'ml', 350, 100, 7, 500),
  // Juices
  bi('b5', 'Fresh Lime Juice', '', 'juice', 'ml', 120, 300, 4, 1000, 'Running low!'),
  bi('b17', 'Fresh Lemon Juice', '', 'juice', 'ml', 200, 300, 4, 1000),
  bi('b18', 'Pineapple Juice', '', 'juice', 'ml', 600, 300, 3, 1000),
  bi('b19', 'Passion Fruit Puree', '', 'juice', 'ml', 250, 150, 12, 500),
  // Mixers
  bi('b8', 'Schweppes Tonic', 'Schweppes', 'mixer', 'ml', 0, 500, 3, 1000, 'Need to order!'),
  bi('b20', 'Soda Water', '', 'mixer', 'ml', 1500, 500, 2, 1000),
  bi('b21', 'Ginger Beer', 'Fever-Tree', 'mixer', 'ml', 800, 300, 5, 500),
  bi('b22', 'Cola', 'Coca-Cola', 'mixer', 'ml', 1000, 500, 2, 1000),
  bi('b23', 'Prosecco', 'Zonin', 'mixer', 'ml', 500, 300, 8, 750),
  // Bitters & Garnish
  bi('b7', 'Angostura Bitters', 'Angostura', 'bitter', 'ml', 120, 50, 12, 200),
  bi('b6', 'Lime', '', 'garnish', 'pcs', 4, 10, 0.3, 1, 'Need to buy'),
  bi('b24', 'Fresh Mint', '', 'garnish', 'pcs', 25, 10, 0.1, 1),
  bi('b25', 'Orange', '', 'garnish', 'pcs', 6, 5, 0.4, 1),
]

interface UseBarInventoryReturn {
  inventory: BarInventoryItem[]
  loading: boolean
  error: string | null
  addIngredient: (item: Omit<BarInventoryItem, 'id' | 'profile_id' | 'created_at' | 'updated_at'>) => Promise<BarInventoryItem | null>
  updateIngredient: (id: string, updates: Partial<BarInventoryItem>) => Promise<boolean>
  deleteIngredient: (id: string) => Promise<boolean>
  adjustQuantity: (id: string, quantityChange: number, type: BarTransactionType, notes?: string) => Promise<boolean>
  getTransactions: (itemId: string) => Promise<BarTransaction[]>
  refresh: () => Promise<void>
  canAddMore: boolean
  itemsLimit: number
}

export function useBarInventory(): UseBarInventoryReturn {
  const [inventory, setInventory] = useState<BarInventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, profile, isDemoMode } = useAuth()
  const { organizationId, locationId } = useOrganizationContext()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  // Return demo data if in demo mode
  useEffect(() => {
    if (isDemoMode && user) {
      setInventory(DEMO_BAR_INVENTORY)
      setLoading(false)
    }
  }, [isDemoMode, user])

  // Subscription limits
  const tier = profile?.subscription_tier || 'free'
  const itemsLimit = SUBSCRIPTION_LIMITS[tier].bar_inventory_items
  const canAddMore = inventory.length < itemsLimit

  const fetchInventory = useCallback(async () => {
    if (!user || !supabase) {
      setInventory([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('bar_inventory')
      .select('*')
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setInventory([])
    } else {
      setInventory(data || [])
    }

    setLoading(false)
  }, [user, supabase, organizationId])

  useEffect(() => {
    if (!isDemoMode) fetchInventory()
  }, [fetchInventory, isDemoMode])

  const addIngredient = async (
    item: Omit<BarInventoryItem, 'id' | 'profile_id' | 'created_at' | 'updated_at'>
  ): Promise<BarInventoryItem | null> => {
    if (!user) return null
    if (!canAddMore) {
      setError(`Limit reached (${itemsLimit} items). Upgrade your plan.`)
      return null
    }

    if (isDemoMode || !supabase) {
      const newItem: BarInventoryItem = {
        ...item,
        id: `demo-${Date.now()}`,
        profile_id: 'demo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setInventory(prev => [...prev, newItem])
      return newItem
    }

    const { data, error: insertError } = await supabase
      .from('bar_inventory')
      .insert({
        ...item,
        profile_id: user.id,
        ...(organizationId ? { organization_id: organizationId, location_id: locationId } : {}),
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      return null
    }

    if (item.quantity > 0) {
      await supabase.from('bar_transactions').insert({
        profile_id: user.id,
        ...(organizationId ? { organization_id: organizationId, location_id: locationId } : {}),
        bar_inventory_id: data.id,
        type: 'purchase',
        quantity: item.quantity,
        unit_type: item.unit_type,
        notes: 'Initial stock',
      })
    }

    await fetchInventory()
    return data
  }

  const updateIngredient = async (id: string, updates: Partial<BarInventoryItem>): Promise<boolean> => {
    if (!user) return false

    if (isDemoMode || !supabase) {
      setInventory(prev => prev.map(item =>
        item.id === id
          ? { ...item, ...updates, updated_at: new Date().toISOString() }
          : item
      ))
      return true
    }

    const { error: updateError } = await supabase
      .from('bar_inventory')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

    if (updateError) {
      setError(updateError.message)
      return false
    }

    await fetchInventory()
    return true
  }

  const deleteIngredient = async (id: string): Promise<boolean> => {
    if (!user) return false

    if (isDemoMode || !supabase) {
      setInventory(prev => prev.filter(item => item.id !== id))
      return true
    }

    await supabase
      .from('bar_transactions')
      .delete()
      .eq('bar_inventory_id', id)

    const { error: deleteError } = await supabase
      .from('bar_inventory')
      .delete()
      .eq('id', id)
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

    if (deleteError) {
      setError(deleteError.message)
      return false
    }

    await fetchInventory()
    return true
  }

  const adjustQuantity = async (
    id: string,
    quantityChange: number,
    type: BarTransactionType,
    notes?: string
  ): Promise<boolean> => {
    if (!user) return false

    const item = inventory.find(i => i.id === id)
    if (!item) return false

    const newQuantity = item.quantity + quantityChange
    if (newQuantity < 0) {
      setError('Insufficient stock')
      return false
    }

    if (isDemoMode || !supabase) {
      setInventory(prev => prev.map(i =>
        i.id === id
          ? { ...i, quantity: newQuantity, updated_at: new Date().toISOString() }
          : i
      ))
      return true
    }

    const { error: updateError } = await supabase
      .from('bar_inventory')
      .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

    if (updateError) {
      setError(updateError.message)
      return false
    }

    await supabase.from('bar_transactions').insert({
      profile_id: user.id,
      ...(organizationId ? { organization_id: organizationId, location_id: locationId } : {}),
      bar_inventory_id: id,
      type,
      quantity: quantityChange,
      unit_type: item.unit_type,
      notes,
    })

    await fetchInventory()
    return true
  }

  const getTransactions = async (itemId: string): Promise<BarTransaction[]> => {
    if (!user || !supabase) return []

    const { data, error: fetchError } = await supabase
      .from('bar_transactions')
      .select('*')
      .eq('bar_inventory_id', itemId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      return []
    }

    return data || []
  }

  return {
    inventory,
    loading,
    error,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    adjustQuantity,
    getTransactions,
    refresh: fetchInventory,
    canAddMore,
    itemsLimit,
  }
}
