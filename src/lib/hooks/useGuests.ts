'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Guest, MixSnapshot, StrengthPreference, FlavorProfile } from '@/types/database'
import { translateError } from '@/lib/utils/translateError'
import {
  cacheGuestsLocally,
  queueGuestUpdate,
  getRecentGuests as getRecentGuestsFromList,
  searchGuests as searchGuestsFromList,
} from '@/logic/quickRepeatEngine'
import { DEMO_GUESTS } from '@/lib/demo'
import { useSupabaseList } from './useSupabaseList'
import { applyOrgFilter } from './useOrgFilter'

export interface NewGuest {
  name: string
  phone?: string | null
  photo_url?: string | null
  notes?: string | null
  strength_preference?: StrengthPreference | null
  flavor_profiles?: FlavorProfile[]
}

interface UseGuestsReturn {
  guests: Guest[]
  recentGuests: Guest[]
  loading: boolean
  error: string | null
  isOffline: boolean
  addGuest: (guest: NewGuest) => Promise<Guest | null>
  updateGuest: (id: string, updates: Partial<NewGuest>) => Promise<boolean>
  deleteGuest: (id: string) => Promise<boolean>
  recordVisit: (id: string, snapshot?: MixSnapshot) => Promise<boolean>
  saveMixSnapshot: (guestId: string, snapshot: MixSnapshot) => Promise<boolean>
  searchGuests: (query: string) => Guest[]
  getGuestById: (id: string) => Guest | undefined
  refresh: () => Promise<void>
}

const ORDER_BY = [
  { column: 'last_visit_at', ascending: false, nullsFirst: false },
  { column: 'name', ascending: true },
] as const

export function useGuests(): UseGuestsReturn {
  const {
    items: guests, setItems: setGuests, loading, error, setError, refresh,
    supabase, user, organizationId, isDemoMode,
  } = useSupabaseList<Guest>({
    table: 'guests',
    cacheKey: 'guests',
    orderBy: ORDER_BY,
    limit: 200,
    demoData: DEMO_GUESTS,
  })

  const [isOffline, setIsOffline] = useState(false)

  // Monitor online/offline status
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    setIsOffline(!navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Cache guests locally whenever they change
  useEffect(() => {
    if (guests.length > 0 && !isDemoMode) {
      cacheGuestsLocally(guests)
    }
  }, [guests, isDemoMode])

  // Get recent guests (last 10 who visited)
  const recentGuests = useMemo(() => {
    return getRecentGuestsFromList(guests, 10)
  }, [guests])

  // Search guests by name
  const searchGuests = useCallback((query: string): Guest[] => {
    return searchGuestsFromList(guests, query)
  }, [guests])

  // Get guest by ID
  const getGuestById = useCallback((id: string): Guest | undefined => {
    return guests.find(g => g.id === id)
  }, [guests])

  const addGuest = async (guest: NewGuest): Promise<Guest | null> => {
    if (isDemoMode) {
      const newGuest: Guest = {
        id: `demo-${Date.now()}`,
        profile_id: 'demo',
        name: guest.name,
        phone: guest.phone || null,
        photo_url: guest.photo_url || null,
        notes: guest.notes || null,
        strength_preference: guest.strength_preference || null,
        flavor_profiles: guest.flavor_profiles || [],
        last_mix_snapshot: null,
        bonus_balance: 0,
        discount_percent: 0,
        total_spent: 0,
        loyalty_tier: 'bronze',
        visit_count: 0,
        last_visit_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setGuests(prev => [newGuest, ...prev])
      return newGuest
    }

    if (!user || !supabase) return null

    // If offline, create locally and queue for sync
    if (isOffline) {
      const newGuest: Guest = {
        id: `local-${Date.now()}`,
        profile_id: user.id,
        name: guest.name,
        phone: guest.phone || null,
        photo_url: guest.photo_url || null,
        notes: guest.notes || null,
        strength_preference: guest.strength_preference || null,
        flavor_profiles: guest.flavor_profiles || [],
        last_mix_snapshot: null,
        bonus_balance: 0,
        discount_percent: 0,
        total_spent: 0,
        loyalty_tier: 'bronze',
        visit_count: 0,
        last_visit_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setGuests(prev => [newGuest, ...prev])
      queueGuestUpdate(newGuest.id, newGuest)
      return newGuest
    }

    const { data, error: insertError } = await supabase
      .from('guests')
      .insert({
        profile_id: user.id,
        ...(organizationId ? { organization_id: organizationId } : {}),
        name: guest.name,
        phone: guest.phone || null,
        photo_url: guest.photo_url || null,
        notes: guest.notes || null,
        strength_preference: guest.strength_preference || null,
        flavor_profiles: guest.flavor_profiles || [],
        last_mix_snapshot: null,
        last_visit_at: null,
        bonus_balance: 0,
        discount_percent: 0,
        total_spent: 0,
        loyalty_tier: 'bronze',
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

  const updateGuest = async (id: string, updates: Partial<NewGuest>): Promise<boolean> => {
    if (isDemoMode) {
      setGuests(prev => prev.map(g =>
        g.id === id
          ? { ...g, ...updates, updated_at: new Date().toISOString() }
          : g
      ))
      return true
    }

    // Optimistic update + queue for sync if offline
    setGuests(prev => prev.map(g =>
      g.id === id
        ? { ...g, ...updates, updated_at: new Date().toISOString() }
        : g
    ))

    if (isOffline) {
      queueGuestUpdate(id, updates)
      return true
    }

    if (!user || !supabase) return false

    const { error: updateError } = await applyOrgFilter(
      supabase
        .from('guests')
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
      await refresh() // Revert on error
      return false
    }

    setError(null)
    return true
  }

  const deleteGuest = async (id: string): Promise<boolean> => {
    if (isDemoMode) {
      setGuests(prev => prev.filter(g => g.id !== id))
      return true
    }

    if (!user || !supabase) return false

    const { error: deleteError } = await applyOrgFilter(
      supabase
        .from('guests')
        .delete()
        .eq('id', id),
      organizationId,
      user.id
    )

    if (deleteError) {
      setError(translateError(deleteError))
      return false
    }

    await refresh()
    return true
  }

  // Record visit with optional mix snapshot
  const recordVisit = async (id: string, snapshot?: MixSnapshot): Promise<boolean> => {
    const guest = guests.find(g => g.id === id)
    if (!guest) return false

    const updates: Partial<Guest> = {
      visit_count: guest.visit_count + 1,
      last_visit_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (snapshot) {
      updates.last_mix_snapshot = snapshot
    }

    if (isDemoMode) {
      setGuests(prev => prev.map(g =>
        g.id === id ? { ...g, ...updates } : g
      ))
      return true
    }

    // Optimistic update
    setGuests(prev => prev.map(g =>
      g.id === id ? { ...g, ...updates } : g
    ))

    if (isOffline) {
      queueGuestUpdate(id, updates)
      return true
    }

    if (!user || !supabase) return false

    const { error: updateError } = await applyOrgFilter(
      supabase
        .from('guests')
        .update(updates)
        .eq('id', id),
      organizationId,
      user.id
    )

    if (updateError) {
      setError(translateError(updateError))
      await refresh()
      return false
    }

    return true
  }

  // Save mix snapshot for a guest (separate from recordVisit for flexibility)
  const saveMixSnapshot = async (guestId: string, snapshot: MixSnapshot): Promise<boolean> => {
    const guest = guests.find(g => g.id === guestId)
    if (!guest) return false

    const updates = {
      last_mix_snapshot: snapshot,
      updated_at: new Date().toISOString(),
    }

    if (isDemoMode) {
      setGuests(prev => prev.map(g =>
        g.id === guestId ? { ...g, ...updates } : g
      ))
      return true
    }

    // Optimistic update
    setGuests(prev => prev.map(g =>
      g.id === guestId ? { ...g, ...updates } : g
    ))

    if (isOffline) {
      queueGuestUpdate(guestId, updates)
      return true
    }

    if (!user || !supabase) return false

    const { error: updateError } = await applyOrgFilter(
      supabase
        .from('guests')
        .update(updates)
        .eq('id', guestId),
      organizationId,
      user.id
    )

    if (updateError) {
      setError(translateError(updateError))
      await refresh()
      return false
    }

    return true
  }

  return {
    guests,
    recentGuests,
    loading,
    error,
    isOffline,
    addGuest,
    updateGuest,
    deleteGuest,
    recordVisit,
    saveMixSnapshot,
    searchGuests,
    getGuestById,
    refresh,
  }
}
