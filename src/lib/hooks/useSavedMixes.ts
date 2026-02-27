'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import type { SavedMix, SavedMixTobacco } from '@/types/database'

// Demo saved mixes
const DEMO_MIXES: SavedMix[] = [
  {
    id: '1',
    profile_id: 'demo',
    name: 'Summer Evening',
    tobaccos: [
      { tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', percent: 60, color: '#FF6B9D' },
      { tobacco_id: 'tg1', brand: 'Tangiers', flavor: 'Cane Mint', percent: 40, color: '#00D9A5' },
    ],
    compatibility_score: 92,
    is_favorite: true,
    usage_count: 15,
    rating: 5,
    notes: 'Perfect mix for a summer evening. Mint freshness pairs great with Pinkman.',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    profile_id: 'demo',
    name: 'Fruity Mix',
    tobaccos: [
      { tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', percent: 50, color: '#FF4B4B' },
      { tobacco_id: 'mh2', brand: 'Musthave', flavor: 'Lemon-Lime', percent: 50, color: '#FFE500' },
    ],
    compatibility_score: 85,
    is_favorite: false,
    usage_count: 8,
    rating: 4,
    notes: null,
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    profile_id: 'demo',
    name: 'Tropical Paradise',
    tobaccos: [
      { tobacco_id: 'ds2', brand: 'Darkside', flavor: 'Bananapapa', percent: 40, color: '#FFD93D' },
      { tobacco_id: 'bb1', brand: 'Black Burn', flavor: 'Something Berry', percent: 35, color: '#FF6B9D' },
      { tobacco_id: 'tg1', brand: 'Tangiers', flavor: 'Cane Mint', percent: 25, color: '#00D9A5' },
    ],
    compatibility_score: 78,
    is_favorite: true,
    usage_count: 5,
    rating: null,
    notes: 'Try with less mint next time',
    created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

interface UseSavedMixesReturn {
  savedMixes: SavedMix[]
  loading: boolean
  error: string | null
  saveMix: (name: string, tobaccos: SavedMixTobacco[], compatibilityScore: number | null) => Promise<void>
  deleteMix: (id: string) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  incrementUsage: (id: string) => Promise<void>
  updateMix: (id: string, updates: { rating?: number | null; notes?: string | null; name?: string }) => Promise<void>
  refresh: () => Promise<void>
}

export function useSavedMixes(): UseSavedMixesReturn {
  const [savedMixes, setSavedMixes] = useState<SavedMix[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user, isDemoMode } = useAuth()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  // Return demo data if in demo mode
  useEffect(() => {
    if (isDemoMode && user) {
      setSavedMixes(DEMO_MIXES)
      setLoading(false)
    }
  }, [isDemoMode, user])

  const fetchMixes = useCallback(async () => {
    if (!user || !supabase) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('saved_mixes')
        .select('id, profile_id, name, tobaccos, compatibility_score, is_favorite, usage_count, rating, notes, created_at')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setSavedMixes(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mixes')
    }

    setLoading(false)
  }, [user, supabase])

  useEffect(() => {
    if (!isDemoMode) {
      fetchMixes()
    }
  }, [fetchMixes, isDemoMode])

  const saveMix = useCallback(async (
    name: string,
    tobaccos: SavedMixTobacco[],
    compatibilityScore: number | null
  ) => {
    if (isDemoMode) {
      // Add to demo data
      const newMix: SavedMix = {
        id: Date.now().toString(),
        profile_id: 'demo',
        name,
        tobaccos,
        compatibility_score: compatibilityScore,
        is_favorite: false,
        usage_count: 0,
        rating: null,
        notes: null,
        created_at: new Date().toISOString(),
      }
      setSavedMixes(prev => [newMix, ...prev])
      return
    }

    if (!user || !supabase) return

    setError(null)

    try {
      const { data, error: insertError } = await supabase
        .from('saved_mixes')
        .insert({
          profile_id: user.id,
          name,
          tobaccos,
          compatibility_score: compatibilityScore,
        })
        .select()
        .single()

      if (insertError) throw insertError

      setSavedMixes(prev => [data, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save mix')
      throw err
    }
  }, [user, supabase, isDemoMode])

  const deleteMix = useCallback(async (id: string) => {
    if (isDemoMode) {
      setSavedMixes(prev => prev.filter(m => m.id !== id))
      return
    }

    if (!user || !supabase) return

    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('saved_mixes')
        .delete()
        .eq('id', id)
        .eq('profile_id', user.id)

      if (deleteError) throw deleteError

      setSavedMixes(prev => prev.filter(m => m.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete mix')
      throw err
    }
  }, [user, supabase, isDemoMode])

  const toggleFavorite = useCallback(async (id: string) => {
    const mix = savedMixes.find(m => m.id === id)
    if (!mix) return

    if (isDemoMode) {
      setSavedMixes(prev => prev.map(m =>
        m.id === id ? { ...m, is_favorite: !m.is_favorite } : m
      ))
      return
    }

    if (!user || !supabase) return

    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('saved_mixes')
        .update({ is_favorite: !mix.is_favorite })
        .eq('id', id)
        .eq('profile_id', user.id)

      if (updateError) throw updateError

      setSavedMixes(prev => prev.map(m =>
        m.id === id ? { ...m, is_favorite: !m.is_favorite } : m
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update mix')
      throw err
    }
  }, [user, supabase, savedMixes, isDemoMode])

  const incrementUsage = useCallback(async (id: string) => {
    const mix = savedMixes.find(m => m.id === id)
    if (!mix) return

    if (isDemoMode) {
      setSavedMixes(prev => prev.map(m =>
        m.id === id ? { ...m, usage_count: m.usage_count + 1 } : m
      ))
      return
    }

    if (!user || !supabase) return

    try {
      const { error: updateError } = await supabase
        .from('saved_mixes')
        .update({ usage_count: mix.usage_count + 1 })
        .eq('id', id)
        .eq('profile_id', user.id)

      if (updateError) throw updateError

      setSavedMixes(prev => prev.map(m =>
        m.id === id ? { ...m, usage_count: m.usage_count + 1 } : m
      ))
    } catch {
      // Silently fail — usage increment is non-critical
    }
  }, [user, supabase, savedMixes, isDemoMode])

  const updateMix = useCallback(async (
    id: string,
    updates: { rating?: number | null; notes?: string | null; name?: string }
  ) => {
    if (isDemoMode) {
      setSavedMixes(prev => prev.map(m =>
        m.id === id ? { ...m, ...updates } : m
      ))
      return
    }

    if (!user || !supabase) return

    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('saved_mixes')
        .update(updates)
        .eq('id', id)
        .eq('profile_id', user.id)

      if (updateError) throw updateError

      setSavedMixes(prev => prev.map(m =>
        m.id === id ? { ...m, ...updates } : m
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update mix')
      throw err
    }
  }, [user, supabase, isDemoMode])

  return {
    savedMixes,
    loading,
    error,
    saveMix,
    deleteMix,
    toggleFavorite,
    incrementUsage,
    updateMix,
    refresh: fetchMixes,
  }
}
