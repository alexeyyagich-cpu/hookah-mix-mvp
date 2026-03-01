'use client'

import { enqueueOfflineMutation } from '@/lib/offline/offlineMutation'
import type { TobaccoInventory, InventoryTransaction, TransactionType } from '@/types/database'
import { SUBSCRIPTION_LIMITS } from '@/types/database'
import { translateError } from '@/lib/utils/translateError'
import { useTranslation } from '@/lib/i18n'
import { DEMO_INVENTORY } from '@/lib/demo'
import { useSupabaseList } from './useSupabaseList'
import { applyOrgFilter } from './useOrgFilter'

const ORDER_BY = [
  { column: 'brand', ascending: true },
  { column: 'flavor', ascending: true },
] as const

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
  const th = useTranslation('hookah')
  const tc = useTranslation('common')

  const {
    items: inventory, setItems: setInventory, loading, error, setError, refresh,
    supabase, user, profile, organizationId, locationId, isDemoMode,
  } = useSupabaseList<TobaccoInventory>({
    table: 'tobacco_inventory',
    cacheKey: 'inventory',
    orderBy: ORDER_BY,
    demoData: DEMO_INVENTORY,
    reconnect: 'reconcile',
  })

  const tier = profile?.subscription_tier || 'trial'
  const itemsLimit = SUBSCRIPTION_LIMITS[tier].inventory_items
  const canAddMore = inventory.length < itemsLimit

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

    await refresh()
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

    const { error: updateError } = await applyOrgFilter(
      supabase
        .from('tobacco_inventory')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id),
      organizationId,
      user.id
    )

    if (updateError) {
      setError(translateError(updateError))
      return false
    }

    setError(null)
    await refresh()
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
    const { error: deleteError } = await applyOrgFilter(
      supabase
        .from('tobacco_inventory')
        .delete()
        .eq('id', id),
      organizationId,
      user.id
    )

    if (deleteError) {
      setError(translateError(deleteError))
      return false
    }

    setError(null)
    await refresh()
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

    await refresh()
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
    refresh,
    canAddMore,
    itemsLimit,
  }
}
