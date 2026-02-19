'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import type { BarInventoryItem, BarTransaction, BarTransactionType } from '@/types/database'

const DEMO_BAR_INVENTORY: BarInventoryItem[] = [
  { id: 'b1', profile_id: 'demo', name: 'Абсолют Водка', brand: 'Absolut', category: 'spirit', unit_type: 'ml', quantity: 500, min_quantity: 200, purchase_price: 18, package_size: 700, supplier_name: null, barcode: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'b2', profile_id: 'demo', name: 'Бифитер Джин', brand: 'Beefeater', category: 'spirit', unit_type: 'ml', quantity: 350, min_quantity: 200, purchase_price: 22, package_size: 700, supplier_name: null, barcode: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'b3', profile_id: 'demo', name: 'Бакарди Белый Ром', brand: 'Bacardi', category: 'spirit', unit_type: 'ml', quantity: 600, min_quantity: 200, purchase_price: 16, package_size: 700, supplier_name: null, barcode: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'b4', profile_id: 'demo', name: 'Сахарный сироп', brand: '', category: 'syrup', unit_type: 'ml', quantity: 800, min_quantity: 200, purchase_price: 5, package_size: 1000, supplier_name: null, barcode: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'b5', profile_id: 'demo', name: 'Сок лайма', brand: '', category: 'juice', unit_type: 'ml', quantity: 150, min_quantity: 300, purchase_price: 4, package_size: 1000, supplier_name: null, barcode: null, notes: 'Заканчивается!', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'b6', profile_id: 'demo', name: 'Лайм', brand: '', category: 'garnish', unit_type: 'pcs', quantity: 3, min_quantity: 5, purchase_price: 2, package_size: 10, supplier_name: null, barcode: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'b7', profile_id: 'demo', name: 'Ангостура', brand: 'Angostura', category: 'bitter', unit_type: 'ml', quantity: 120, min_quantity: 50, purchase_price: 12, package_size: 200, supplier_name: null, barcode: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'b8', profile_id: 'demo', name: 'Тоник', brand: 'Schweppes', category: 'mixer', unit_type: 'ml', quantity: 0, min_quantity: 500, purchase_price: 3, package_size: 1000, supplier_name: null, barcode: null, notes: 'Нужно заказать', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
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
  const limits = { free: 10, pro: Infinity, enterprise: Infinity }
  const itemsLimit = limits[tier]
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
      setError(`Достигнут лимит (${itemsLimit} позиций). Обновите подписку.`)
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
        notes: 'Начальный остаток',
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
      setError('Недостаточно остатка на складе')
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
