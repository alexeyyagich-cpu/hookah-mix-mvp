'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import type { Guest, MixSnapshot, StrengthPreference, FlavorProfile } from '@/types/database'
import {
  cacheGuestsLocally,
  getCachedGuests,
  queueGuestUpdate,
  getRecentGuests as getRecentGuestsFromList,
  searchGuests as searchGuestsFromList,
} from '@/logic/quickRepeatEngine'

// Demo data with mix snapshots for testing
const DEMO_GUESTS: Guest[] = [
  {
    id: '1',
    profile_id: 'demo',
    name: 'Alex',
    phone: '+48 512 345 678',
    photo_url: null,
    notes: 'Regular guest, likes strong mixes',
    strength_preference: 'strong',
    flavor_profiles: ['fresh', 'citrus'],
    last_mix_snapshot: {
      id: 'snap_demo_1',
      tobaccos: [
        { tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', percent: 50, color: '#EC4899' },
        { tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', percent: 25, color: '#06B6D4' },
        { tobacco_id: 'ds2', brand: 'Darkside', flavor: 'Bananapapa', percent: 25, color: '#FACC15' },
      ],
      total_grams: 20,
      strength: 'strong',
      compatibility_score: 85,
      bowl_type: 'Phunnel',
      heat_setup: { coals: 4, packing: 'dense' },
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    visit_count: 12,
    last_visit_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    profile_id: 'demo',
    name: 'Maria',
    phone: '+49 170 987 6543',
    photo_url: null,
    notes: 'Prefers light fruity mixes',
    strength_preference: 'light',
    flavor_profiles: ['fruity', 'sweet'],
    last_mix_snapshot: {
      id: 'snap_demo_2',
      tobaccos: [
        { tobacco_id: 'af4', brand: 'Al Fakher', flavor: 'Watermelon', percent: 60, color: '#FB7185' },
        { tobacco_id: 'fm3', brand: 'Fumari', flavor: 'Ambrosia', percent: 40, color: '#FBBF24' },
      ],
      total_grams: 18,
      strength: 'light',
      compatibility_score: 92,
      bowl_type: 'Turkish',
      heat_setup: { coals: 3, packing: 'fluffy' },
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    visit_count: 8,
    last_visit_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    profile_id: 'demo',
    name: 'David',
    phone: null,
    photo_url: null,
    notes: null,
    strength_preference: 'medium',
    flavor_profiles: ['spicy', 'citrus'],
    last_mix_snapshot: null, // No previous mix
    visit_count: 3,
    last_visit_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    profile_id: 'demo',
    name: 'Anna',
    phone: '+48 601 555 123',
    photo_url: null,
    notes: 'VIP guest',
    strength_preference: 'medium',
    flavor_profiles: ['fruity', 'fresh'],
    last_mix_snapshot: {
      id: 'snap_demo_4',
      tobaccos: [
        { tobacco_id: 'ds3', brand: 'Darkside', flavor: 'Falling Star', percent: 45, color: '#F59E0B' },
        { tobacco_id: 'tg1', brand: 'Tangiers', flavor: 'Cane Mint', percent: 25, color: '#10B981' },
        { tobacco_id: 'mh5', brand: 'Musthave', flavor: 'Lemon', percent: 30, color: '#FCD34D' },
      ],
      total_grams: 22,
      strength: 'medium',
      compatibility_score: 78,
      bowl_type: 'Phunnel',
      heat_setup: { coals: 3, packing: 'semi-dense' },
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    visit_count: 15,
    last_visit_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

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

export function useGuests(): UseGuestsReturn {
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)
  const { user, isDemoMode } = useAuth()
  const { organizationId } = useOrganizationContext()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

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

  // Return demo data if in demo mode
  useEffect(() => {
    if (isDemoMode && user) {
      setGuests(DEMO_GUESTS)
      setLoading(false)
    }
  }, [isDemoMode, user])

  // Cache guests locally whenever they change
  useEffect(() => {
    if (guests.length > 0 && !isDemoMode) {
      cacheGuestsLocally(guests)
    }
  }, [guests, isDemoMode])

  const fetchGuests = useCallback(async () => {
    if (!user || !supabase) {
      setGuests([])
      setLoading(false)
      return
    }

    // If offline, use cached data
    if (isOffline) {
      const cached = getCachedGuests()
      if (cached) {
        setGuests(cached)
        setLoading(false)
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('guests')
        .select('*')
        .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)
        .order('last_visit_at', { ascending: false, nullsFirst: false })
        .order('name', { ascending: true })

      if (fetchError) {
        // Try cached data on error
        const cached = getCachedGuests()
        if (cached) {
          setGuests(cached)
          setIsOffline(true)
        } else {
          setError(fetchError.message)
          setGuests([])
        }
      } else {
        setGuests(data || [])
      }
    } catch {
      // Network error - use cached
      const cached = getCachedGuests()
      if (cached) {
        setGuests(cached)
        setIsOffline(true)
      }
    }

    setLoading(false)
  }, [user, supabase, isOffline, organizationId])

  useEffect(() => {
    if (!isDemoMode) {
      fetchGuests()
    }
  }, [fetchGuests, isDemoMode])

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
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      return null
    }

    await fetchGuests()
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

    const { error: updateError } = await supabase
      .from('guests')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

    if (updateError) {
      setError(updateError.message)
      await fetchGuests() // Revert on error
      return false
    }

    return true
  }

  const deleteGuest = async (id: string): Promise<boolean> => {
    if (isDemoMode) {
      setGuests(prev => prev.filter(g => g.id !== id))
      return true
    }

    if (!user || !supabase) return false

    const { error: deleteError } = await supabase
      .from('guests')
      .delete()
      .eq('id', id)
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

    if (deleteError) {
      setError(deleteError.message)
      return false
    }

    await fetchGuests()
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

    const { error: updateError } = await supabase
      .from('guests')
      .update(updates)
      .eq('id', id)
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

    if (updateError) {
      setError(updateError.message)
      await fetchGuests()
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

    const { error: updateError } = await supabase
      .from('guests')
      .update(updates)
      .eq('id', guestId)
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

    if (updateError) {
      setError(updateError.message)
      await fetchGuests()
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
    refresh: fetchGuests,
  }
}
