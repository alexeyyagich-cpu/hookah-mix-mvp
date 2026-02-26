'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import type { AutoReorderRule, TobaccoInventory, SupplierProduct } from '@/types/database'
import { translateError } from '@/lib/utils/translateError'
// Extended rule type with related data
export interface AutoReorderRuleWithDetails extends AutoReorderRule {
  tobacco?: TobaccoInventory
  product?: SupplierProduct
}

// Demo rules
const DEMO_RULES: AutoReorderRuleWithDetails[] = [
  {
    id: 'demo-r1',
    profile_id: 'demo-user-id',
    tobacco_inventory_id: '4', // Darkside Bananapapa
    supplier_product_id: 'demo-p5',
    threshold_grams: 50,
    reorder_quantity: 3,
    is_enabled: true,
    last_triggered_at: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-r2',
    profile_id: 'demo-user-id',
    tobacco_inventory_id: '6', // Black Burn Something Berry
    supplier_product_id: 'demo-p9',
    threshold_grams: 30,
    reorder_quantity: 5,
    is_enabled: true,
    last_triggered_at: '2026-02-08T10:00:00Z',
    created_at: new Date().toISOString(),
  },
]

interface CreateRuleInput {
  tobacco_inventory_id: string
  supplier_product_id: string
  threshold_grams: number
  reorder_quantity: number
}

interface UseAutoReorderReturn {
  rules: AutoReorderRuleWithDetails[]
  loading: boolean
  error: string | null
  createRule: (input: CreateRuleInput) => Promise<AutoReorderRule | null>
  updateRule: (id: string, updates: Partial<AutoReorderRule>) => Promise<boolean>
  deleteRule: (id: string) => Promise<boolean>
  toggleRule: (id: string) => Promise<boolean>
  getRuleForInventory: (tobaccoInventoryId: string) => AutoReorderRuleWithDetails | undefined
  checkTriggeredRules: (inventory: TobaccoInventory[]) => AutoReorderRuleWithDetails[]
  refresh: () => Promise<void>
}

export function useAutoReorder(): UseAutoReorderReturn {
  const [rules, setRules] = useState<AutoReorderRuleWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isDemoMode } = useAuth()
  const { organizationId } = useOrganizationContext()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  // Return demo data if in demo mode
  useEffect(() => {
    if (isDemoMode && user) {
      setRules(DEMO_RULES)
      setLoading(false)
    }
  }, [isDemoMode, user])

  const fetchRules = useCallback(async () => {
    if (!user || !supabase) {
      setRules([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('auto_reorder_rules')
      .select(`
        *,
        tobacco:tobacco_inventory(*),
        product:supplier_products(*)
      `)
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(translateError(fetchError))
      setRules([])
    } else {
      setRules(data || [])
    }

    setLoading(false)
  }, [user, supabase, organizationId])

  useEffect(() => {
    if (!isDemoMode) {
      fetchRules()
    }
  }, [fetchRules, isDemoMode])

  const createRule = useCallback(async (input: CreateRuleInput): Promise<AutoReorderRule | null> => {
    if (!user) return null

    // Demo mode
    if (isDemoMode || !supabase) {
      const newRule: AutoReorderRuleWithDetails = {
        id: `demo-r${Date.now()}`,
        profile_id: 'demo-user-id',
        ...input,
        is_enabled: true,
        last_triggered_at: null,
        created_at: new Date().toISOString(),
      }
      setRules(prev => [newRule, ...prev])
      return newRule
    }

    const { data, error: insertError } = await supabase
      .from('auto_reorder_rules')
      .insert({
        profile_id: user.id,
        ...input,
        is_enabled: true,
        ...(organizationId ? { organization_id: organizationId } : {}),
      })
      .select()
      .single()

    if (insertError) {
      setError(translateError(insertError))
      return null
    }

    await fetchRules()
    return data
  }, [user, isDemoMode, supabase, fetchRules])

  const updateRule = useCallback(async (id: string, updates: Partial<AutoReorderRule>): Promise<boolean> => {
    if (!user) return false

    // Demo mode
    if (isDemoMode || !supabase) {
      setRules(prev => prev.map(rule =>
        rule.id === id ? { ...rule, ...updates } : rule
      ))
      return true
    }

    const { error: updateError } = await supabase
      .from('auto_reorder_rules')
      .update(updates)
      .eq('id', id)
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

    if (updateError) {
      setError(translateError(updateError))
      return false
    }

    await fetchRules()
    return true
  }, [user, isDemoMode, supabase, fetchRules, organizationId])

  const deleteRule = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false

    // Demo mode
    if (isDemoMode || !supabase) {
      setRules(prev => prev.filter(rule => rule.id !== id))
      return true
    }

    const { error: deleteError } = await supabase
      .from('auto_reorder_rules')
      .delete()
      .eq('id', id)
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

    if (deleteError) {
      setError(translateError(deleteError))
      return false
    }

    await fetchRules()
    return true
  }, [user, isDemoMode, supabase, fetchRules, organizationId])

  const toggleRule = useCallback(async (id: string): Promise<boolean> => {
    const rule = rules.find(r => r.id === id)
    if (!rule) return false

    return updateRule(id, { is_enabled: !rule.is_enabled })
  }, [rules, updateRule])

  const getRuleForInventory = useCallback((tobaccoInventoryId: string): AutoReorderRuleWithDetails | undefined => {
    return rules.find(r => r.tobacco_inventory_id === tobaccoInventoryId)
  }, [rules])

  // Check which rules should be triggered based on current inventory levels
  const checkTriggeredRules = useCallback((inventory: TobaccoInventory[]): AutoReorderRuleWithDetails[] => {
    return rules.filter(rule => {
      if (!rule.is_enabled) return false

      const tobaccoItem = inventory.find(item => item.id === rule.tobacco_inventory_id)
      if (!tobaccoItem) return false

      return tobaccoItem.quantity_grams <= rule.threshold_grams
    })
  }, [rules])

  return {
    rules,
    loading,
    error,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    getRuleForInventory,
    checkTriggeredRules,
    refresh: fetchRules,
  }
}
