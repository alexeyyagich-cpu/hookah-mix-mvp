'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import { getCachedData, setCachedData } from '@/lib/offline/db'
import { enqueueOfflineMutation } from '@/lib/offline/offlineMutation'
import type { TobaccoInventory, InventoryTransaction, TransactionType } from '@/types/database'
import { SUBSCRIPTION_LIMITS } from '@/types/database'
import { translateError } from '@/lib/utils/translateError'
import { useTranslation } from '@/lib/i18n'
// Demo data for testing (prices in EUR, package_grams = 100g default)
const _D = 24 * 60 * 60 * 1000
const DEMO_INVENTORY: TobaccoInventory[] = [
  { id: '1', profile_id: 'demo', tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', quantity_grams: 180, purchase_price: 15, package_grams: 100, purchase_date: new Date(Date.now() - 10 * _D).toISOString(), expiry_date: new Date(Date.now() + 180 * _D).toISOString(), notes: null, created_at: new Date(Date.now() - 10 * _D).toISOString(), updated_at: new Date().toISOString() },
  { id: '2', profile_id: 'demo', tobacco_id: 'mh2', brand: 'Musthave', flavor: 'Lemon-Lime', quantity_grams: 95, purchase_price: 15, package_grams: 100, purchase_date: new Date(Date.now() - 14 * _D).toISOString(), expiry_date: new Date(Date.now() + 170 * _D).toISOString(), notes: null, created_at: new Date(Date.now() - 14 * _D).toISOString(), updated_at: new Date().toISOString() },
  { id: '3', profile_id: 'demo', tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', quantity_grams: 220, purchase_price: 18, package_grams: 100, purchase_date: new Date(Date.now() - 7 * _D).toISOString(), expiry_date: new Date(Date.now() + 200 * _D).toISOString(), notes: null, created_at: new Date(Date.now() - 7 * _D).toISOString(), updated_at: new Date().toISOString() },
  { id: '4', profile_id: 'demo', tobacco_id: 'ds2', brand: 'Darkside', flavor: 'Bananapapa', quantity_grams: 45, purchase_price: 18, package_grams: 100, purchase_date: new Date(Date.now() - 21 * _D).toISOString(), expiry_date: new Date(Date.now() + 160 * _D).toISOString(), notes: 'Running low!', created_at: new Date(Date.now() - 21 * _D).toISOString(), updated_at: new Date().toISOString() },
  { id: '5', profile_id: 'demo', tobacco_id: 'tg1', brand: 'Tangiers', flavor: 'Cane Mint', quantity_grams: 150, purchase_price: 22, package_grams: 100, purchase_date: new Date(Date.now() - 5 * _D).toISOString(), expiry_date: new Date(Date.now() + 190 * _D).toISOString(), notes: null, created_at: new Date(Date.now() - 5 * _D).toISOString(), updated_at: new Date().toISOString() },
  { id: '6', profile_id: 'demo', tobacco_id: 'bb1', brand: 'Black Burn', flavor: 'Something Berry', quantity_grams: 0, purchase_price: 14, package_grams: 100, purchase_date: new Date(Date.now() - 28 * _D).toISOString(), expiry_date: new Date(Date.now() + 150 * _D).toISOString(), notes: 'Need to order', created_at: new Date(Date.now() - 28 * _D).toISOString(), updated_at: new Date().toISOString() },
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
  const th = useTranslation('hookah')
  const tc = useTranslation('common')
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  // Return demo data if in demo mode
  useEffect(() => {
    if (isDemoMode && user) {
      setInventory(DEMO_INVENTORY)
      setLoading(false)
    }
  }, [isDemoMode, user])

  // Determine limits based on subscription
  const tier = profile?.subscription_tier || 'trial'
  const itemsLimit = SUBSCRIPTION_LIMITS[tier].inventory_items
  const canAddMore = inventory.length < itemsLimit

  const fetchInventory = useCallback(async () => {
    if (!user || !supabase) {
      setInventory([])
      setLoading(false)
      return
    }

    // Try cache first for instant display
    const cached = await getCachedData<TobaccoInventory>('inventory', user.id)
    if (cached) {
      setInventory(cached.data)
      setLoading(false)
    }

    // If offline, stop here
    if (typeof navigator !== 'undefined' && !navigator.onLine) return

    if (!cached) setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('tobacco_inventory')
        .select('*')
        .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)
        .order('brand', { ascending: true })
        .order('flavor', { ascending: true })

      if (fetchError) {
        if (!cached) { setError(translateError(fetchError)); setInventory([]) }
      } else {
        setInventory(data || [])
        await setCachedData('inventory', user.id, data || [])
      }
    } catch {
      // Network error — keep cache if available
    }

    setLoading(false)
  }, [user, supabase, organizationId])

  useEffect(() => {
    if (!isDemoMode) fetchInventory()
  }, [fetchInventory, isDemoMode])

  // Refetch after reconnect to replace offline temp data with real data
  // Also refetch when a mutation is discarded to reconcile local state
  useEffect(() => {
    let tid: ReturnType<typeof setTimeout>
    const handleOnline = () => { tid = setTimeout(fetchInventory, 3000) }
    const handleReconcile = () => fetchInventory()
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline-discard-reconcile', handleReconcile)
    return () => {
      clearTimeout(tid)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline-discard-reconcile', handleReconcile)
    }
  }, [fetchInventory])

  const addTobacco = async (
    tobacco: Omit<TobaccoInventory, 'id' | 'profile_id' | 'created_at' | 'updated_at'>
  ): Promise<TobaccoInventory | null> => {
    if (!user) return null
    if (!canAddMore) {
      setError(th.freeTierLimit(itemsLimit))
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
      setError(translateError(insertError))
      return null
    }

    // If there's a purchase, add a transaction (best-effort — item already created)
    if (tobacco.quantity_grams > 0) {
      try {
        await supabase.from('inventory_transactions').insert({
          profile_id: user.id,
          ...(organizationId ? { organization_id: organizationId, location_id: locationId } : {}),
          tobacco_inventory_id: data.id,
          type: 'purchase',
          quantity_grams: tobacco.quantity_grams,
          notes: 'Initial stock',
        })
      } catch {
        if (process.env.NODE_ENV !== 'production') console.error('Failed to record initial stock transaction for', data.id)
      }
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
      setError(translateError(updateError))
      return false
    }

    setError(null)
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

    // First delete related transactions (best-effort — continue to item delete)
    try {
      await supabase.from('inventory_transactions').delete().eq('tobacco_inventory_id', id)
    } catch {
      if (process.env.NODE_ENV !== 'production') console.error('Failed to delete inventory transactions for', id)
    }

    // Then delete the tobacco
    const { error: deleteError } = await supabase
      .from('tobacco_inventory')
      .delete()
      .eq('id', id)
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

    if (deleteError) {
      setError(translateError(deleteError))
      return false
    }

    setError(null)
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
      setError(tc.insufficientStock)
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

    // Offline: compound mutation (update quantity + insert transaction)
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setInventory(prev => prev.map(item =>
        item.id === id
          ? { ...item, quantity_grams: newQuantity, updated_at: new Date().toISOString() }
          : item
      ))

      await enqueueOfflineMutation<TobaccoInventory>({
        storeName: 'inventory',
        userId: user.id,
        table: 'tobacco_inventory',
        operation: 'compound',
        payload: { id },
        meta: {
          inventoryId: id,
          delta: quantityChange,
          organizationId,
          locationId,
          transactionData: {
            tobacco_inventory_id: id,
            type,
            quantity_grams: quantityChange,
            session_id: sessionId || null,
            notes: notes || null,
            ...(organizationId ? { organization_id: organizationId, location_id: locationId } : {}),
          },
        },
        optimisticUpdate: (cached) => cached.map(item =>
          item.id === id
            ? { ...item, quantity_grams: newQuantity, updated_at: new Date().toISOString() }
            : item
        ),
      })

      return true
    }

    // Add transaction record first (source of truth, best-effort — RPC still runs)
    try {
      await supabase.from('inventory_transactions').insert({
        profile_id: user.id,
        ...(organizationId ? { organization_id: organizationId, location_id: locationId } : {}),
        tobacco_inventory_id: id,
        type,
        quantity_grams: quantityChange,
        session_id: sessionId,
        notes,
      })
    } catch {
      if (process.env.NODE_ENV !== 'production') console.error('Failed to record inventory transaction for', id)
    }

    // Atomic quantity adjustment via RPC — no read-then-write race
    const { error: rpcError } = await supabase.rpc('decrement_tobacco_inventory', {
      p_inventory_id: id,
      p_grams_used: -quantityChange, // negative change = decrement; positive = increment (negative grams_used)
    })

    if (rpcError) {
      setError(translateError(rpcError))
      return false
    }

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
      setError(translateError(fetchError))
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
