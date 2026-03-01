'use client'

import type { BarInventoryItem, BarTransaction, BarTransactionType } from '@/types/database'
import { SUBSCRIPTION_LIMITS } from '@/types/database'
import { translateError } from '@/lib/utils/translateError'
import { useTranslation } from '@/lib/i18n'
import { DEMO_BAR_INVENTORY } from '@/lib/demo'
import { useSupabaseList } from './useSupabaseList'
import { applyOrgFilter } from './useOrgFilter'

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

const ORDER_BY = [{ column: 'category', ascending: true }, { column: 'name', ascending: true }] as const

export function useBarInventory(): UseBarInventoryReturn {
  const {
    items: inventory, setItems: setInventory, loading, error, setError, refresh,
    supabase, user, profile, organizationId, locationId, isDemoMode,
  } = useSupabaseList<BarInventoryItem>({
    table: 'bar_inventory',
    cacheKey: 'bar_inventory',
    orderBy: ORDER_BY,
    demoData: DEMO_BAR_INVENTORY,
  })

  const tb = useTranslation('bar')
  const tc = useTranslation('common')

  const tier = profile?.subscription_tier || 'trial'
  const itemsLimit = SUBSCRIPTION_LIMITS[tier].bar_inventory_items
  const canAddMore = inventory.length < itemsLimit

  const addIngredient = async (
    item: Omit<BarInventoryItem, 'id' | 'profile_id' | 'created_at' | 'updated_at'>
  ): Promise<BarInventoryItem | null> => {
    if (!user) return null
    if (!canAddMore) {
      setError(tb.freeTierLimit(itemsLimit))
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
      setError(translateError(insertError))
      return null
    }

    if (item.quantity > 0) {
      try {
        await supabase.from('bar_transactions').insert({
          profile_id: user.id,
          ...(organizationId ? { organization_id: organizationId, location_id: locationId } : {}),
          bar_inventory_id: data.id,
          type: 'purchase',
          quantity: item.quantity,
          unit_type: item.unit_type,
          notes: 'Initial stock',
        })
      } catch {
        if (process.env.NODE_ENV !== 'production') console.error('Failed to record initial bar transaction for', data.id)
      }
    }

    await refresh()
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

    const { error: updateError } = await applyOrgFilter(
      supabase.from('bar_inventory').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id),
      organizationId, user.id
    )

    if (updateError) {
      setError(translateError(updateError))
      return false
    }

    setError(null)
    await refresh()
    return true
  }

  const deleteIngredient = async (id: string): Promise<boolean> => {
    if (!user) return false

    if (isDemoMode || !supabase) {
      setInventory(prev => prev.filter(item => item.id !== id))
      return true
    }

    try {
      await supabase.from('bar_transactions').delete().eq('bar_inventory_id', id)
    } catch {
      if (process.env.NODE_ENV !== 'production') console.error('Failed to delete bar transactions for', id)
    }

    const { error: deleteError } = await applyOrgFilter(
      supabase.from('bar_inventory').delete().eq('id', id),
      organizationId, user.id
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
    type: BarTransactionType,
    notes?: string
  ): Promise<boolean> => {
    if (!user) return false

    const item = inventory.find(i => i.id === id)
    if (!item) return false

    const newQuantity = item.quantity + quantityChange
    if (newQuantity < 0) {
      setError(tc.insufficientStock)
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

    // Record transaction first (source of truth, best-effort — RPC still runs)
    try {
      await supabase.from('bar_transactions').insert({
        profile_id: user.id,
        ...(organizationId ? { organization_id: organizationId, location_id: locationId } : {}),
        bar_inventory_id: id,
        type,
        quantity: quantityChange,
        unit_type: item.unit_type,
        notes,
      })
    } catch {
      if (process.env.NODE_ENV !== 'production') console.error('Failed to record bar transaction for', id)
    }

    // Atomic quantity adjustment via RPC — no read-then-write race
    const { error: rpcError } = await supabase.rpc('adjust_bar_inventory', {
      p_inventory_id: id,
      p_quantity_change: quantityChange,
    })

    if (rpcError) {
      setError(translateError(rpcError))
      return false
    }

    await refresh()
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
      setError(translateError(fetchError))
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
    refresh,
    canAddMore,
    itemsLimit,
  }
}
