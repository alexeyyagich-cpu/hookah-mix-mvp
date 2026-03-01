'use client'

import type { BowlType } from '@/types/database'
import { SUBSCRIPTION_LIMITS } from '@/types/database'
import { translateError } from '@/lib/utils/translateError'
import { useTranslation } from '@/lib/i18n'
import { DEMO_BOWLS } from '@/lib/demo'
import { useSupabaseList } from './useSupabaseList'
import { applyOrgFilter } from './useOrgFilter'

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

const ORDER_BY = [{ column: 'name', ascending: true }] as const

export function useBowls(): UseBowlsReturn {
  const {
    items: bowls, setItems: setBowls, loading, error, setError, refresh,
    supabase, user, profile, organizationId, locationId, isDemoMode,
  } = useSupabaseList<BowlType>({
    table: 'bowl_types',
    cacheKey: 'bowls',
    orderBy: ORDER_BY,
    demoData: DEMO_BOWLS,
  })

  const th = useTranslation('hookah')

  // Determine limits based on subscription
  const tier = profile?.subscription_tier || 'trial'
  const bowlsLimit = SUBSCRIPTION_LIMITS[tier].bowl_types
  const canAddMore = bowls.length < bowlsLimit

  const defaultBowl = bowls.find(b => b.is_default) || bowls[0] || null

  const addBowl = async (
    bowl: Omit<BowlType, 'id' | 'profile_id' | 'created_at'>
  ): Promise<BowlType | null> => {
    if (!user) return null
    if (!canAddMore) {
      setError(th.freeTierLimit(bowlsLimit))
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

    // If this is set as default, unset other defaults (best-effort before insert)
    if (bowl.is_default) {
      try {
        await applyOrgFilter(
          supabase.from('bowl_types').update({ is_default: false }),
          organizationId, user.id
        )
      } catch {
        if (process.env.NODE_ENV !== 'production') console.error('Failed to unset default bowls')
      }
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
      setError(translateError(insertError))
      return null
    }

    setError(null)
    await refresh()
    return data
  }

  const updateBowl = async (id: string, updates: Partial<BowlType>): Promise<boolean> => {
    if (!user) return false

    if (isDemoMode || !supabase) {
      setBowls(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))
      return true
    }

    const { error: updateError } = await applyOrgFilter(
      supabase.from('bowl_types').update(updates).eq('id', id),
      organizationId, user.id
    )

    if (updateError) {
      setError(translateError(updateError))
      return false
    }

    await refresh()
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

    const { error: deleteError } = await applyOrgFilter(
      supabase.from('bowl_types').delete().eq('id', id),
      organizationId, user.id
    )

    if (deleteError) {
      setError(translateError(deleteError))
      return false
    }

    // If we deleted the default bowl, set another one as default
    if (wasDefault && bowls.length > 1) {
      const remaining = bowls.filter(b => b.id !== id)
      if (remaining.length > 0) {
        try {
          await supabase
            .from('bowl_types')
            .update({ is_default: true })
            .eq('id', remaining[0].id)
        } catch {
          if (process.env.NODE_ENV !== 'production') console.error('Failed to set new default bowl')
        }
      }
    }

    await refresh()
    return true
  }

  const setDefaultBowl = async (id: string): Promise<boolean> => {
    if (!user) return false

    if (isDemoMode || !supabase) {
      setBowls(prev => prev.map(b => ({ ...b, is_default: b.id === id })))
      return true
    }

    // Unset all defaults (best-effort before setting new one)
    try {
      await applyOrgFilter(
        supabase.from('bowl_types').update({ is_default: false }),
        organizationId, user.id
      )
    } catch {
      if (process.env.NODE_ENV !== 'production') console.error('Failed to unset default bowls')
    }

    // Set new default
    const { error: updateError } = await applyOrgFilter(
      supabase.from('bowl_types').update({ is_default: true }).eq('id', id),
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

  return {
    bowls,
    defaultBowl,
    loading,
    error,
    addBowl,
    updateBowl,
    deleteBowl,
    setDefaultBowl,
    refresh,
    canAddMore,
    bowlsLimit,
  }
}
