'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import { getCachedData, setCachedData } from '@/lib/offline/db'
import { enqueueOfflineMutation, generateTempId } from '@/lib/offline/offlineMutation'
import type { Session, SessionItem, SessionWithItems } from '@/types/database'

// Demo bowl for sessions
const DEMO_BOWL = { id: '1', profile_id: 'demo', name: 'Phunnel Large', capacity_grams: 20, is_default: true, created_at: new Date().toISOString() }

// Demo data for testing
const DEMO_SESSIONS: SessionWithItems[] = [
  {
    id: '1',
    profile_id: 'demo',
    created_by: null,
    guest_id: null,
    bowl_type_id: '1',
    session_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    total_grams: 20,
    compatibility_score: 92,
    notes: 'Great mix!',
    rating: 5,
    duration_minutes: 52,
    selling_price: 15,
    session_items: [
      { id: '1', session_id: '1', tobacco_inventory_id: '1', tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', grams_used: 10, percentage: 50 },
      { id: '2', session_id: '1', tobacco_inventory_id: '3', tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', grams_used: 10, percentage: 50 },
    ],
    bowl_type: DEMO_BOWL,
  },
  {
    id: '2',
    profile_id: 'demo',
    created_by: null,
    guest_id: null,
    bowl_type_id: '1',
    session_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    total_grams: 18,
    compatibility_score: 85,
    notes: null,
    rating: 4,
    duration_minutes: 45,
    selling_price: 20,
    session_items: [
      { id: '3', session_id: '2', tobacco_inventory_id: '5', tobacco_id: 'tg1', brand: 'Tangiers', flavor: 'Cane Mint', grams_used: 12, percentage: 67 },
      { id: '4', session_id: '2', tobacco_inventory_id: '2', tobacco_id: 'mh2', brand: 'Musthave', flavor: 'Lemon-Lime', grams_used: 6, percentage: 33 },
    ],
    bowl_type: DEMO_BOWL,
  },
  {
    id: '3',
    profile_id: 'demo',
    created_by: null,
    guest_id: null,
    bowl_type_id: '2',
    session_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    total_grams: 15,
    compatibility_score: 78,
    notes: 'Try with less mint next time',
    rating: 3,
    duration_minutes: null,
    selling_price: 12,
    session_items: [
      { id: '5', session_id: '3', tobacco_inventory_id: '4', tobacco_id: 'ds2', brand: 'Darkside', flavor: 'Bananapapa', grams_used: 15, percentage: 100 },
    ],
    bowl_type: { id: '2', profile_id: 'demo', name: 'Phunnel Medium', capacity_grams: 15, is_default: false, created_at: new Date().toISOString() },
  },
]

interface UseSessionsReturn {
  sessions: SessionWithItems[]
  loading: boolean
  error: string | null
  createSession: (
    session: Omit<Session, 'id' | 'profile_id'>,
    items: Omit<SessionItem, 'id' | 'session_id'>[],
    deductFromInventory?: boolean
  ) => Promise<Session | null>
  updateSession: (id: string, updates: Partial<Session>) => Promise<boolean>
  deleteSession: (id: string) => Promise<boolean>
  getSession: (id: string) => Promise<SessionWithItems | null>
  refresh: () => Promise<void>
}

export function useSessions(): UseSessionsReturn {
  const [sessions, setSessions] = useState<SessionWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, profile, isDemoMode } = useAuth()
  const { organizationId, locationId } = useOrganizationContext()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  // Return demo data if in demo mode
  useEffect(() => {
    if (isDemoMode && user) {
      setSessions(DEMO_SESSIONS)
      setLoading(false)
    }
  }, [isDemoMode, user])

  // Determine history limit based on subscription
  const tier = profile?.subscription_tier || 'free'
  const historyDays = tier === 'free' ? 30 : null // null = unlimited

  const fetchSessions = useCallback(async () => {
    if (!user || !supabase) {
      setSessions([])
      setLoading(false)
      return
    }

    // Try cache first for instant display
    const cached = await getCachedData<SessionWithItems>('sessions', user.id)
    if (cached) {
      setSessions(cached.data)
      setLoading(false)
    }

    // If offline, stop here
    if (typeof navigator !== 'undefined' && !navigator.onLine) return

    if (!cached) setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('sessions')
        .select(`
          *,
          session_items (*),
          bowl_type:bowl_types (*)
        `)
        .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)
        .order('session_date', { ascending: false })

      // Apply date filter for free tier
      if (historyDays) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - historyDays)
        query = query.gte('session_date', cutoffDate.toISOString())
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        if (!cached) { setError(fetchError.message); setSessions([]) }
      } else {
        setSessions(data || [])
        await setCachedData('sessions', user.id, data || [])
      }
    } catch {
      // Network error — keep cache if available
    }

    setLoading(false)
  }, [user, supabase, historyDays, organizationId])

  useEffect(() => {
    if (!isDemoMode) fetchSessions()
  }, [fetchSessions, isDemoMode])

  // Refetch after reconnect to replace offline temp data with real data
  // Also refetch when a mutation is discarded to reconcile local state
  useEffect(() => {
    let tid: ReturnType<typeof setTimeout>
    const handleOnline = () => { tid = setTimeout(fetchSessions, 3000) }
    const handleReconcile = () => fetchSessions()
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline-discard-reconcile', handleReconcile)
    return () => {
      clearTimeout(tid)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline-discard-reconcile', handleReconcile)
    }
  }, [fetchSessions])

  const createSession = async (
    sessionData: Omit<Session, 'id' | 'profile_id'>,
    items: Omit<SessionItem, 'id' | 'session_id'>[],
    deductFromInventory = true
  ): Promise<Session | null> => {
    if (!user) return null

    if (isDemoMode || !supabase) {
      const newSession: Session = {
        ...sessionData,
        id: `demo-${Date.now()}`,
        profile_id: 'demo',
        created_by: null,
      }
      const newItems = items.map((item, i) => ({
        ...item,
        id: `demo-item-${Date.now()}-${i}`,
        session_id: newSession.id,
      }))
      setSessions(prev => [{ ...newSession, session_items: newItems, bowl_type: null } as SessionWithItems, ...prev])
      return newSession
    }

    // Offline: compound mutation (session + items + inventory adjustments)
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const tempId = generateTempId()
      const newSession: Session = {
        ...sessionData,
        id: tempId,
        profile_id: user.id,
        created_by: user.id,
      }
      const newItems = items.map((item) => ({
        ...item,
        id: generateTempId(),
        session_id: tempId,
      }))
      const sessionWithItems: SessionWithItems = {
        ...newSession,
        session_items: newItems,
        bowl_type: null,
      }

      setSessions(prev => [sessionWithItems, ...prev])

      const inventoryAdjustments = deductFromInventory
        ? items
            .filter(item => item.tobacco_inventory_id)
            .map(item => ({
              tobacco_inventory_id: item.tobacco_inventory_id,
              grams_used: item.grams_used,
              brand: item.brand,
              flavor: item.flavor,
              organizationId,
              locationId,
            }))
        : []

      await enqueueOfflineMutation<SessionWithItems>({
        storeName: 'sessions',
        userId: user.id,
        table: 'sessions',
        operation: 'compound',
        payload: {
          ...sessionData,
          id: tempId,
          profile_id: user.id,
          created_by: user.id,
          ...(organizationId ? { organization_id: organizationId, location_id: locationId } : {}),
        },
        meta: {
          items: newItems.map(item => ({
            tobacco_inventory_id: item.tobacco_inventory_id,
            tobacco_id: item.tobacco_id,
            brand: item.brand,
            flavor: item.flavor,
            grams_used: item.grams_used,
            percentage: item.percentage,
          })),
          inventoryAdjustments,
        },
        optimisticUpdate: (cached) => [sessionWithItems, ...cached],
      })

      return newSession
    }

    // Create session — created_by always tracks the actual logged-in user
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        ...sessionData,
        profile_id: user.id,
        created_by: user.id,
        ...(organizationId ? { organization_id: organizationId, location_id: locationId } : {}),
      })
      .select()
      .single()

    if (sessionError) {
      setError(sessionError.message)
      return null
    }

    // Create session items
    const sessionItems = items.map(item => ({
      ...item,
      session_id: session.id,
    }))

    const { error: itemsError } = await supabase
      .from('session_items')
      .insert(sessionItems)

    if (itemsError) {
      setError(itemsError.message)
      // Rollback session
      await supabase.from('sessions').delete().eq('id', session.id)
      return null
    }

    // Deduct from inventory if requested
    if (deductFromInventory) {
      for (const item of items) {
        if (item.tobacco_inventory_id) {
          // Record transaction (UNIQUE constraint prevents duplicates on retry)
          await supabase.from('inventory_transactions').insert({
            profile_id: user.id,
            ...(organizationId ? { organization_id: organizationId, location_id: locationId } : {}),
            tobacco_inventory_id: item.tobacco_inventory_id,
            type: 'session',
            quantity_grams: -item.grams_used,
            session_id: session.id,
            notes: `Session: ${item.brand} ${item.flavor}`,
          })

          // Atomic decrement via RPC — no read-then-write race
          await supabase.rpc('decrement_tobacco_inventory', {
            p_inventory_id: item.tobacco_inventory_id,
            p_grams_used: item.grams_used,
          })
        }
      }
    }

    await fetchSessions()
    return session
  }

  const updateSession = async (id: string, updates: Partial<Session>): Promise<boolean> => {
    if (!user) return false

    if (isDemoMode || !supabase) {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
      return true
    }

    const { error: updateError } = await supabase
      .from('sessions')
      .update(updates)
      .eq('id', id)
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

    if (updateError) {
      setError(updateError.message)
      return false
    }

    await fetchSessions()
    return true
  }

  const deleteSession = async (id: string): Promise<boolean> => {
    if (!user) return false

    if (isDemoMode || !supabase) {
      setSessions(prev => prev.filter(s => s.id !== id))
      return true
    }

    // Reverse inventory deductions before deleting
    const { data: transactions } = await supabase
      .from('inventory_transactions')
      .select('tobacco_inventory_id, quantity_grams')
      .eq('session_id', id)
      .eq('type', 'session')

    if (transactions) {
      for (const tx of transactions) {
        if (tx.tobacco_inventory_id && tx.quantity_grams < 0) {
          await supabase.rpc('decrement_tobacco_inventory', {
            p_inventory_id: tx.tobacco_inventory_id,
            p_grams_used: tx.quantity_grams, // negative value → increments stock back
          })
        }
      }
    }

    // Delete session items
    await supabase
      .from('session_items')
      .delete()
      .eq('session_id', id)

    // Delete related inventory transactions
    await supabase
      .from('inventory_transactions')
      .delete()
      .eq('session_id', id)

    // Delete session
    const { error: deleteError } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id)
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

    if (deleteError) {
      setError(deleteError.message)
      return false
    }

    await fetchSessions()
    return true
  }

  const getSession = async (id: string): Promise<SessionWithItems | null> => {
    if (!user || !supabase) return null

    const { data, error: fetchError } = await supabase
      .from('sessions')
      .select(`
        *,
        session_items (*),
        bowl_type:bowl_types (*)
      `)
      .eq('id', id)
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)
      .single()

    if (fetchError) {
      setError(fetchError.message)
      return null
    }

    return data
  }

  return {
    sessions,
    loading,
    error,
    createSession,
    updateSession,
    deleteSession,
    getSession,
    refresh: fetchSessions,
  }
}
