'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import type { TobaccoInventory, InventoryTransaction, TransactionType } from '@/types/database'

// Demo data for testing (prices in EUR, package_grams = 100g default)
const DEMO_INVENTORY: TobaccoInventory[] = [
  { id: '1', profile_id: 'demo', tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', quantity_grams: 180, purchase_price: 15, package_grams: 100, purchase_date: null, expiry_date: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', profile_id: 'demo', tobacco_id: 'mh2', brand: 'Musthave', flavor: 'Lemon-Lime', quantity_grams: 95, purchase_price: 15, package_grams: 100, purchase_date: null, expiry_date: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '3', profile_id: 'demo', tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', quantity_grams: 220, purchase_price: 18, package_grams: 100, purchase_date: null, expiry_date: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '4', profile_id: 'demo', tobacco_id: 'ds2', brand: 'Darkside', flavor: 'Bananapapa', quantity_grams: 45, purchase_price: 18, package_grams: 100, purchase_date: null, expiry_date: null, notes: 'Running low!', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '5', profile_id: 'demo', tobacco_id: 'tg1', brand: 'Tangiers', flavor: 'Cane Mint', quantity_grams: 150, purchase_price: 22, package_grams: 100, purchase_date: null, expiry_date: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '6', profile_id: 'demo', tobacco_id: 'bb1', brand: 'Black Burn', flavor: 'Something Berry', quantity_grams: 0, purchase_price: 14, package_grams: 100, purchase_date: null, expiry_date: null, notes: 'Need to order', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]

interface UseInventoryReturn {
  inventory: TobaccoInventory[]
  loading: boolean
  error: string | null
  addTobacco: (tobacco: Omit<TobaccoInventory, 'id' | 'profile_id' | 'created_at' | 'updated_at'>) => Promise<TobaccoInventory | null>
  bulkAddTobacco: (items: Omit<TobaccoInventory, 'id' | 'profile_id' | 'created_at' | 'updated_at'>[]) => Promise<number>
  updateTobacco: (id: string, updates: Partial<TobaccoInventory>) => Promise<boolean>
  deleteTobacco: (id: string) => Promise<boolean>
  adjustQuantity: (id: string, quantityChange: number, type: TransactionType, notes?: string, sessionId?: string) => Promise<boolean>
  getTransactions: (tobaccoId: string) => Promise<InventoryTransaction[]>
  refresh: () => Promise<void>
  canAddMore: boolean
  itemsLimit: number
}

export function useInventory(): UseInventoryReturn {
  const [inventory, setInventory] = useState<TobaccoInventory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, profile, isDemoMode } = useAuth()
  const { organizationId, locationId } = useOrganizationContext()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  // Return demo data if in demo mode
  useEffect(() => {
    if (isDemoMode && user) {
      setInventory(DEMO_INVENTORY)
      setLoading(false)
    }
  }, [isDemoMode, user])

  // Determine limits based on subscription
  const tier = profile?.subscription_tier || 'free'
  const limits = {
    free: { inventory_items: 10 },
    pro: { inventory_items: Infinity },
    enterprise: { inventory_items: Infinity },
  }
  const itemsLimit = limits[tier].inventory_items
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
      .from('tobacco_inventory')
      .select('*')
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)
      .order('brand', { ascending: true })
      .order('flavor', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setInventory([])
    } else {
      setInventory(data || [])
    }

    setLoading(false)
  }, [user, supabase])

  useEffect(() => {
    if (!isDemoMode) fetchInventory()
  }, [fetchInventory, isDemoMode])

  const addTobacco = async (
    tobacco: Omit<TobaccoInventory, 'id' | 'profile_id' | 'created_at' | 'updated_at'>
  ): Promise<TobaccoInventory | null> => {
    if (!user) return null
    if (!canAddMore) {
      setError(`Limit reached (${itemsLimit} items). Upgrade your plan to add more.`)
      return null
    }

    // Demo mode: add to local state
    if (isDemoMode || !supabase) {
      const newItem: TobaccoInventory = {
        ...tobacco,
        id: `demo-${Date.now()}`,
        profile_id: 'demo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setInventory(prev => [...prev, newItem])
      return newItem
    }

    const { data, error: insertError } = await supabase
      .from('tobacco_inventory')
      .insert({
        ...tobacco,
        profile_id: user.id,
        ...(organizationId ? { organization_id: organizationId, location_id: locationId } : {}),
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      return null
    }

    // If there's a purchase, add a transaction
    if (tobacco.quantity_grams > 0) {
      await supabase.from('inventory_transactions').insert({
        profile_id: user.id,
        ...(organizationId ? { organization_id: organizationId, location_id: locationId } : {}),
        tobacco_inventory_id: data.id,
        type: 'purchase',
        quantity_grams: tobacco.quantity_grams,
        notes: 'Initial stock',
      })
    }

    await fetchInventory()
    return data
  }

  const updateTobacco = async (id: string, updates: Partial<TobaccoInventory>): Promise<boolean> => {
    if (!user) return false

    // Demo mode: update local state
    if (isDemoMode || !supabase) {
      setInventory(prev => prev.map(item =>
        item.id === id
          ? { ...item, ...updates, updated_at: new Date().toISOString() }
          : item
      ))
      return true
    }

    const { error: updateError } = await supabase
      .from('tobacco_inventory')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

    if (updateError) {
      setError(updateError.message)
      return false
    }

    await fetchInventory()
    return true
  }

  const deleteTobacco = async (id: string): Promise<boolean> => {
    if (!user) return false

    // Demo mode: delete from local state
    if (isDemoMode || !supabase) {
      setInventory(prev => prev.filter(item => item.id !== id))
      return true
    }

    // First delete related transactions
    await supabase
      .from('inventory_transactions')
      .delete()
      .eq('tobacco_inventory_id', id)

    // Then delete the tobacco
    const { error: deleteError } = await supabase
      .from('tobacco_inventory')
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
    type: TransactionType,
    notes?: string,
    sessionId?: string
  ): Promise<boolean> => {
    if (!user) return false

    // Get current quantity
    const tobacco = inventory.find(t => t.id === id)
    if (!tobacco) return false

    const newQuantity = tobacco.quantity_grams + quantityChange
    if (newQuantity < 0) {
      setError('Insufficient tobacco stock')
      return false
    }

    // Demo mode: update local state
    if (isDemoMode || !supabase) {
      setInventory(prev => prev.map(item =>
        item.id === id
          ? { ...item, quantity_grams: newQuantity, updated_at: new Date().toISOString() }
          : item
      ))
      return true
    }

    // Update quantity
    const { error: updateError } = await supabase
      .from('tobacco_inventory')
      .update({
        quantity_grams: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

    if (updateError) {
      setError(updateError.message)
      return false
    }

    // Add transaction record
    await supabase.from('inventory_transactions').insert({
      profile_id: user.id,
      ...(organizationId ? { organization_id: organizationId, location_id: locationId } : {}),
      tobacco_inventory_id: id,
      type,
      quantity_grams: quantityChange,
      session_id: sessionId,
      notes,
    })

    await fetchInventory()
    return true
  }

  const getTransactions = async (tobaccoId: string): Promise<InventoryTransaction[]> => {
    if (!user || !supabase) return []

    const { data, error: fetchError } = await supabase
      .from('inventory_transactions')
      .select('*')
      .eq('tobacco_inventory_id', tobaccoId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      return []
    }

    return data || []
  }

  const bulkAddTobacco = async (
    items: Omit<TobaccoInventory, 'id' | 'profile_id' | 'created_at' | 'updated_at'>[]
  ): Promise<number> => {
    let added = 0
    for (const item of items) {
      const result = await addTobacco(item)
      if (result) added++
    }
    return added
  }

  return {
    inventory,
    loading,
    error,
    addTobacco,
    bulkAddTobacco,
    updateTobacco,
    deleteTobacco,
    adjustQuantity,
    getTransactions,
    refresh: fetchInventory,
    canAddMore,
    itemsLimit,
  }
}
