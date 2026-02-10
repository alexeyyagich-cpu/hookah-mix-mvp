'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/AuthContext'
import type { Guest, StrengthPreference, FlavorProfile } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Demo data for testing
const DEMO_GUESTS: Guest[] = [
  {
    id: '1',
    profile_id: 'demo',
    name: 'Алексей',
    phone: '+7 999 123 4567',
    notes: 'Постоянный гость, любит крепкие миксы',
    strength_preference: 'strong',
    flavor_profiles: ['fresh', 'citrus'],
    visit_count: 12,
    last_visit_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    profile_id: 'demo',
    name: 'Мария',
    phone: '+7 999 987 6543',
    notes: 'Предпочитает лёгкие фруктовые',
    strength_preference: 'light',
    flavor_profiles: ['fruity', 'sweet'],
    visit_count: 8,
    last_visit_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    profile_id: 'demo',
    name: 'Дмитрий',
    phone: null,
    notes: null,
    strength_preference: 'medium',
    flavor_profiles: ['spicy', 'citrus'],
    visit_count: 3,
    last_visit_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export interface NewGuest {
  name: string
  phone?: string | null
  notes?: string | null
  strength_preference?: StrengthPreference | null
  flavor_profiles?: FlavorProfile[]
}

interface UseGuestsReturn {
  guests: Guest[]
  loading: boolean
  error: string | null
  addGuest: (guest: NewGuest) => Promise<Guest | null>
  updateGuest: (id: string, updates: Partial<NewGuest>) => Promise<boolean>
  deleteGuest: (id: string) => Promise<boolean>
  recordVisit: (id: string) => Promise<boolean>
  refresh: () => Promise<void>
}

export function useGuests(): UseGuestsReturn {
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isDemoMode } = useAuth()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  // Return demo data if in demo mode
  useEffect(() => {
    if (isDemoMode && user) {
      setGuests(DEMO_GUESTS)
      setLoading(false)
    }
  }, [isDemoMode, user])

  const fetchGuests = useCallback(async () => {
    if (!user || !supabase) {
      setGuests([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('guests')
      .select('*')
      .eq('profile_id', user.id)
      .order('last_visit_at', { ascending: false, nullsFirst: false })
      .order('name', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setGuests([])
    } else {
      setGuests(data || [])
    }

    setLoading(false)
  }, [user, supabase])

  useEffect(() => {
    if (!isDemoMode) {
      fetchGuests()
    }
  }, [fetchGuests, isDemoMode])

  const addGuest = async (guest: NewGuest): Promise<Guest | null> => {
    if (isDemoMode) {
      const newGuest: Guest = {
        id: `demo-${Date.now()}`,
        profile_id: 'demo',
        name: guest.name,
        phone: guest.phone || null,
        notes: guest.notes || null,
        strength_preference: guest.strength_preference || null,
        flavor_profiles: guest.flavor_profiles || [],
        visit_count: 0,
        last_visit_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setGuests(prev => [newGuest, ...prev])
      return newGuest
    }

    if (!user || !supabase) return null

    const { data, error: insertError } = await supabase
      .from('guests')
      .insert({
        profile_id: user.id,
        name: guest.name,
        phone: guest.phone || null,
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

    if (!user || !supabase) return false

    const { error: updateError } = await supabase
      .from('guests')
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

    await fetchGuests()
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
      .eq('profile_id', user.id)

    if (deleteError) {
      setError(deleteError.message)
      return false
    }

    await fetchGuests()
    return true
  }

  const recordVisit = async (id: string): Promise<boolean> => {
    if (isDemoMode) {
      setGuests(prev => prev.map(g =>
        g.id === id
          ? {
              ...g,
              visit_count: g.visit_count + 1,
              last_visit_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          : g
      ))
      return true
    }

    if (!user || !supabase) return false

    const guest = guests.find(g => g.id === id)
    if (!guest) return false

    const { error: updateError } = await supabase
      .from('guests')
      .update({
        visit_count: guest.visit_count + 1,
        last_visit_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('profile_id', user.id)

    if (updateError) {
      setError(updateError.message)
      return false
    }

    await fetchGuests()
    return true
  }

  return {
    guests,
    loading,
    error,
    addGuest,
    updateGuest,
    deleteGuest,
    recordVisit,
    refresh: fetchGuests,
  }
}
