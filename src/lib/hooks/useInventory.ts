'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/AuthContext'
import type { TobaccoInventory, InventoryTransaction, TransactionType } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Demo data for testing
const DEMO_INVENTORY: TobaccoInventory[] = [
  { id: '1', profile_id: 'demo', tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', quantity_grams: 180, purchase_price: 1500, purchase_date: null, expiry_date: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', profile_id: 'demo', tobacco_id: 'mh2', brand: 'Musthave', flavor: 'Lemon-Lime', quantity_grams: 95, purchase_price: 1500, purchase_date: null, expiry_date: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '3', profile_id: 'demo', tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', quantity_grams: 220, purchase_price: 1800, purchase_date: null, expiry_date: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '4', profile_id: 'demo', tobacco_id: 'ds2', brand: 'Darkside', flavor: 'Bananapapa', quantity_grams: 45, purchase_price: 1800, purchase_date: null, expiry_date: null, notes: 'Заканчивается!', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '5', profile_id: 'demo', tobacco_id: 'tg1', brand: 'Tangiers', flavor: 'Cane Mint', quantity_grams: 150, purchase_price: 2200, purchase_date: null, expiry_date: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '6', profile_id: 'demo', tobacco_id: 'bb1', brand: 'Black Burn', flavor: 'Something Berry', quantity_grams: 0, purchase_price: 1400, purchase_date: null, expiry_date: null, notes: 'Нужно заказать', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]

interface UseInventoryReturn {
  inventory: TobaccoInventory[]
  loading: boolean
  error: string | null
  addTobacco: (tobacco: Omit<TobaccoInventory, 'id' | 'profile_id' | 'created_at' | 'updated_at'>) => Promise<TobaccoInventory | null>
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
      .eq('profile_id', user.id)
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
    fetchInventory()
  }, [fetchInventory])

  const addTobacco = async (
    tobacco: Omit<TobaccoInventory, 'id' | 'profile_id' | 'created_at' | 'updated_at'>
  ): Promise<TobaccoInventory | null> => {
    if (!user || !supabase) return null
    if (!canAddMore) {
      setError(`Достигнут лимит (${itemsLimit} позиций). Обновите подписку для добавления больше табаков.`)
      return null
    }

    const { data, error: insertError } = await supabase
      .from('tobacco_inventory')
      .insert({
        ...tobacco,
        profile_id: user.id,
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
        tobacco_inventory_id: data.id,
        type: 'purchase',
        quantity_grams: tobacco.quantity_grams,
        notes: 'Начальный остаток',
      })
    }

    await fetchInventory()
    return data
  }

  const updateTobacco = async (id: string, updates: Partial<TobaccoInventory>): Promise<boolean> => {
    if (!user || !supabase) return false

    const { error: updateError } = await supabase
      .from('tobacco_inventory')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('profile_id', user.id)

    if (updateError) {
      setError(updateError.message)
      return false
    }

    await fetchInventory()
    return true
  }

  const deleteTobacco = async (id: string): Promise<boolean> => {
    if (!user || !supabase) return false

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
      .eq('profile_id', user.id)

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
    if (!user || !supabase) return false

    // Get current quantity
    const tobacco = inventory.find(t => t.id === id)
    if (!tobacco) return false

    const newQuantity = tobacco.quantity_grams + quantityChange
    if (newQuantity < 0) {
      setError('Недостаточно табака на складе')
      return false
    }

    // Update quantity
    const { error: updateError } = await supabase
      .from('tobacco_inventory')
      .update({
        quantity_grams: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('profile_id', user.id)

    if (updateError) {
      setError(updateError.message)
      return false
    }

    // Add transaction record
    await supabase.from('inventory_transactions').insert({
      profile_id: user.id,
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

  return {
    inventory,
    loading,
    error,
    addTobacco,
    updateTobacco,
    deleteTobacco,
    adjustQuantity,
    getTransactions,
    refresh: fetchInventory,
    canAddMore,
    itemsLimit,
  }
}
