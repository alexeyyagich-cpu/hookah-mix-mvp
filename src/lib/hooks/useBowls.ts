'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import type { BowlType } from '@/types/database'

// Demo data for testing
const DEMO_BOWLS: BowlType[] = [
  { id: '1', profile_id: 'demo', name: 'Phunnel Large', capacity_grams: 20, is_default: true, created_at: new Date().toISOString() },
  { id: '2', profile_id: 'demo', name: 'Phunnel Medium', capacity_grams: 15, is_default: false, created_at: new Date().toISOString() },
  { id: '3', profile_id: 'demo', name: 'Turka Classic', capacity_grams: 18, is_default: false, created_at: new Date().toISOString() },
]

interface UseBowlsReturn {
  bowls: BowlType[]
  defaultBowl: BowlType | null
  loading: boolean
  error: string | null
  addBowl: (bowl: Omit<BowlType, 'id' | 'profile_id' | 'created_at'>) => Promise<BowlType | null>
  updateBowl: (id: string, updates: Partial<BowlType>) => Promise<boolean>
  deleteBowl: (id: string) => Promise<boolean>
  setDefaultBowl: (id: string) => Promise<boolean>
  refresh: () => Promise<void>
  canAddMore: boolean
  bowlsLimit: number
}

export function useBowls(): UseBowlsReturn {
  const [bowls, setBowls] = useState<BowlType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, profile, isDemoMode } = useAuth()
  const { organizationId, locationId } = useOrganizationContext()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  // Return demo data if in demo mode
  useEffect(() => {
    if (isDemoMode && user) {
      setBowls(DEMO_BOWLS)
      setLoading(false)
    }
  }, [isDemoMode, user])

  // Determine limits based on subscription
  const tier = profile?.subscription_tier || 'free'
  const limits = {
    free: { bowl_types: 1 },
    pro: { bowl_types: Infinity },
    enterprise: { bowl_types: Infinity },
  }
  const bowlsLimit = limits[tier].bowl_types
  const canAddMore = bowls.length < bowlsLimit

  const defaultBowl = bowls.find(b => b.is_default) || bowls[0] || null

  const fetchBowls = useCallback(async () => {
    if (!user || !supabase) {
      setBowls([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('bowl_types')
      .select('*')
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)
      .order('name', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setBowls([])
    } else {
      setBowls(data || [])
    }

    setLoading(false)
  }, [user, supabase])

  useEffect(() => {
    if (!isDemoMode) fetchBowls()
  }, [fetchBowls, isDemoMode])

  const addBowl = async (
    bowl: Omit<BowlType, 'id' | 'profile_id' | 'created_at'>
  ): Promise<BowlType | null> => {
    if (!user) return null
    if (!canAddMore) {
      setError(`Достигнут лимит (${bowlsLimit} чаш). Обновите подписку для добавления больше чаш.`)
      return null
    }

    if (isDemoMode || !supabase) {
      const isDefault = bowls.length === 0 || bowl.is_default
      const newBowl: BowlType = {
        ...bowl,
        id: `demo-${Date.now()}`,
        profile_id: 'demo',
        is_default: isDefault,
        created_at: new Date().toISOString(),
      }
      if (isDefault) {
        setBowls(prev => [...prev.map(b => ({ ...b, is_default: false })), newBowl])
      } else {
        setBowls(prev => [...prev, newBowl])
      }
      return newBowl
    }

    // If this is set as default, unset other defaults
    if (bowl.is_default) {
      await supabase
        .from('bowl_types')
        .update({ is_default: false })
        .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)
    }

    // If this is the first bowl, make it default
    const isDefault = bowls.length === 0 || bowl.is_default

    const { data, error: insertError } = await supabase
      .from('bowl_types')
      .insert({
        ...bowl,
        profile_id: user.id,
        ...(organizationId ? { organization_id: organizationId, location_id: locationId } : {}),
        is_default: isDefault,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      return null
    }

    await fetchBowls()
    return data
  }

  const updateBowl = async (id: string, updates: Partial<BowlType>): Promise<boolean> => {
    if (!user) return false

    if (isDemoMode || !supabase) {
      setBowls(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))
      return true
    }

    const { error: updateError } = await supabase
      .from('bowl_types')
      .update(updates)
      .eq('id', id)
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

    if (updateError) {
      setError(updateError.message)
      return false
    }

    await fetchBowls()
    return true
  }

  const deleteBowl = async (id: string): Promise<boolean> => {
    if (!user) return false

    if (isDemoMode || !supabase) {
      setBowls(prev => prev.filter(b => b.id !== id))
      return true
    }

    const bowl = bowls.find(b => b.id === id)
    const wasDefault = bowl?.is_default

    const { error: deleteError } = await supabase
      .from('bowl_types')
      .delete()
      .eq('id', id)
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

    if (deleteError) {
      setError(deleteError.message)
      return false
    }

    // If we deleted the default bowl, set another one as default
    if (wasDefault && bowls.length > 1) {
      const remaining = bowls.filter(b => b.id !== id)
      if (remaining.length > 0) {
        await supabase
          .from('bowl_types')
          .update({ is_default: true })
          .eq('id', remaining[0].id)
      }
    }

    await fetchBowls()
    return true
  }

  const setDefaultBowl = async (id: string): Promise<boolean> => {
    if (!user) return false

    if (isDemoMode || !supabase) {
      setBowls(prev => prev.map(b => ({ ...b, is_default: b.id === id })))
      return true
    }

    // Unset all defaults
    await supabase
      .from('bowl_types')
      .update({ is_default: false })
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

    // Set new default
    const { error: updateError } = await supabase
      .from('bowl_types')
      .update({ is_default: true })
      .eq('id', id)
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

    if (updateError) {
      setError(updateError.message)
      return false
    }

    await fetchBowls()
    return true
  }

  return {
    bowls,
    defaultBowl,
    loading,
    error,
    addBowl,
    updateBowl,
    deleteBowl,
    setDefaultBowl,
    refresh: fetchBowls,
    canAddMore,
    bowlsLimit,
  }
}
