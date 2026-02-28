'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import { getCachedData, setCachedData } from '@/lib/offline/db'
import { enqueueOfflineMutation, generateTempId } from '@/lib/offline/offlineMutation'
import type { Session, SessionItem, SessionWithItems } from '@/types/database'
import { translateError } from '@/lib/utils/translateError'
// Demo bowls for sessions
const D = 24 * 60 * 60 * 1000
const H = 60 * 60 * 1000
const DEMO_BOWL = { id: '1', profile_id: 'demo', name: 'Phunnel Large', capacity_grams: 20, is_default: true, created_at: new Date().toISOString() }
const DEMO_BOWL_M = { id: '2', profile_id: 'demo', name: 'Phunnel Medium', capacity_grams: 15, is_default: false, created_at: new Date().toISOString() }

// Demo data — 11 sessions spanning 7 days, with guest/staff links
const DEMO_SESSIONS: SessionWithItems[] = [
  // Today — 2 sessions
  {
    id: '1', profile_id: 'demo', created_by: 'demo-staff-1', guest_id: '1',
    bowl_type_id: '1', session_date: new Date(Date.now() - 2 * H).toISOString(),
    total_grams: 20, compatibility_score: 92, notes: 'Great mix!', rating: 5, duration_minutes: 52, selling_price: 15,
    session_items: [
      { id: '1', session_id: '1', tobacco_inventory_id: '1', tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', grams_used: 10, percentage: 50 },
      { id: '2', session_id: '1', tobacco_inventory_id: '3', tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', grams_used: 10, percentage: 50 },
    ],
    bowl_type: DEMO_BOWL,
  },
  {
    id: '2', profile_id: 'demo', created_by: 'demo-staff-1', guest_id: null,
    bowl_type_id: '1', session_date: new Date(Date.now() - 5 * H).toISOString(),
    total_grams: 18, compatibility_score: 85, notes: null, rating: 4, duration_minutes: 45, selling_price: 20,
    session_items: [
      { id: '3', session_id: '2', tobacco_inventory_id: '5', tobacco_id: 'tg1', brand: 'Tangiers', flavor: 'Cane Mint', grams_used: 12, percentage: 67 },
      { id: '4', session_id: '2', tobacco_inventory_id: '2', tobacco_id: 'mh2', brand: 'Musthave', flavor: 'Lemon-Lime', grams_used: 6, percentage: 33 },
    ],
    bowl_type: DEMO_BOWL,
  },
  // Yesterday — 3 sessions
  {
    id: '3', profile_id: 'demo', created_by: 'demo-staff-2', guest_id: '2',
    bowl_type_id: '1', session_date: new Date(Date.now() - 1 * D).toISOString(),
    total_grams: 20, compatibility_score: 90, notes: null, rating: 5, duration_minutes: 48, selling_price: 15,
    session_items: [
      { id: '5', session_id: '3', tobacco_inventory_id: '1', tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', grams_used: 14, percentage: 70 },
      { id: '6', session_id: '3', tobacco_inventory_id: '5', tobacco_id: 'tg1', brand: 'Tangiers', flavor: 'Cane Mint', grams_used: 6, percentage: 30 },
    ],
    bowl_type: DEMO_BOWL,
  },
  {
    id: '4', profile_id: 'demo', created_by: 'demo-staff-1', guest_id: null,
    bowl_type_id: '1', session_date: new Date(Date.now() - 1 * D - 3 * H).toISOString(),
    total_grams: 18, compatibility_score: 82, notes: null, rating: 4, duration_minutes: 40, selling_price: 20,
    session_items: [
      { id: '7', session_id: '4', tobacco_inventory_id: '3', tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', grams_used: 18, percentage: 100 },
    ],
    bowl_type: DEMO_BOWL,
  },
  {
    id: '5', profile_id: 'demo', created_by: 'demo-staff-2', guest_id: '4',
    bowl_type_id: '2', session_date: new Date(Date.now() - 1 * D - 6 * H).toISOString(),
    total_grams: 15, compatibility_score: 78, notes: null, rating: 3, duration_minutes: 35, selling_price: 12,
    session_items: [
      { id: '8', session_id: '5', tobacco_inventory_id: '4', tobacco_id: 'ds2', brand: 'Darkside', flavor: 'Bananapapa', grams_used: 15, percentage: 100 },
    ],
    bowl_type: DEMO_BOWL_M,
  },
  // 2 days ago — 1 session
  {
    id: '6', profile_id: 'demo', created_by: 'demo-staff-1', guest_id: null,
    bowl_type_id: '1', session_date: new Date(Date.now() - 2 * D).toISOString(),
    total_grams: 20, compatibility_score: 88, notes: null, rating: 4, duration_minutes: 50, selling_price: 20,
    session_items: [
      { id: '9', session_id: '6', tobacco_inventory_id: '2', tobacco_id: 'mh2', brand: 'Musthave', flavor: 'Lemon-Lime', grams_used: 10, percentage: 50 },
      { id: '10', session_id: '6', tobacco_inventory_id: '3', tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', grams_used: 10, percentage: 50 },
    ],
    bowl_type: DEMO_BOWL,
  },
  // 3 days ago — 2 sessions
  {
    id: '7', profile_id: 'demo', created_by: 'demo-staff-1', guest_id: '1',
    bowl_type_id: '1', session_date: new Date(Date.now() - 3 * D).toISOString(),
    total_grams: 20, compatibility_score: 95, notes: 'Signature mix for Alex', rating: 5, duration_minutes: 55, selling_price: 25,
    session_items: [
      { id: '11', session_id: '7', tobacco_inventory_id: '1', tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', grams_used: 12, percentage: 60 },
      { id: '12', session_id: '7', tobacco_inventory_id: '5', tobacco_id: 'tg1', brand: 'Tangiers', flavor: 'Cane Mint', grams_used: 8, percentage: 40 },
    ],
    bowl_type: DEMO_BOWL,
  },
  {
    id: '8', profile_id: 'demo', created_by: 'demo-staff-2', guest_id: '3',
    bowl_type_id: '1', session_date: new Date(Date.now() - 3 * D - 4 * H).toISOString(),
    total_grams: 18, compatibility_score: 80, notes: null, rating: 4, duration_minutes: 42, selling_price: 20,
    session_items: [
      { id: '13', session_id: '8', tobacco_inventory_id: '4', tobacco_id: 'ds2', brand: 'Darkside', flavor: 'Bananapapa', grams_used: 9, percentage: 50 },
      { id: '14', session_id: '8', tobacco_inventory_id: '2', tobacco_id: 'mh2', brand: 'Musthave', flavor: 'Lemon-Lime', grams_used: 9, percentage: 50 },
    ],
    bowl_type: DEMO_BOWL,
  },
  // 5 days ago — 1 session
  {
    id: '9', profile_id: 'demo', created_by: 'demo-staff-1', guest_id: '2',
    bowl_type_id: '1', session_date: new Date(Date.now() - 5 * D).toISOString(),
    total_grams: 20, compatibility_score: 88, notes: null, rating: 4, duration_minutes: 47, selling_price: 20,
    session_items: [
      { id: '15', session_id: '9', tobacco_inventory_id: '1', tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', grams_used: 14, percentage: 70 },
      { id: '16', session_id: '9', tobacco_inventory_id: '5', tobacco_id: 'tg1', brand: 'Tangiers', flavor: 'Cane Mint', grams_used: 6, percentage: 30 },
    ],
    bowl_type: DEMO_BOWL,
  },
  // 6 days ago — 2 sessions
  {
    id: '10', profile_id: 'demo', created_by: 'demo-staff-2', guest_id: null,
    bowl_type_id: '1', session_date: new Date(Date.now() - 6 * D).toISOString(),
    total_grams: 20, compatibility_score: 91, notes: null, rating: 5, duration_minutes: 53, selling_price: 15,
    session_items: [
      { id: '17', session_id: '10', tobacco_inventory_id: '3', tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', grams_used: 10, percentage: 50 },
      { id: '18', session_id: '10', tobacco_inventory_id: '1', tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', grams_used: 10, percentage: 50 },
    ],
    bowl_type: DEMO_BOWL,
  },
  {
    id: '11', profile_id: 'demo', created_by: 'demo-staff-1', guest_id: null,
    bowl_type_id: '2', session_date: new Date(Date.now() - 6 * D - 5 * H).toISOString(),
    total_grams: 15, compatibility_score: 75, notes: 'Try with less mint next time', rating: 3, duration_minutes: 30, selling_price: 12,
    session_items: [
      { id: '19', session_id: '11', tobacco_inventory_id: '2', tobacco_id: 'mh2', brand: 'Musthave', flavor: 'Lemon-Lime', grams_used: 15, percentage: 100 },
    ],
    bowl_type: DEMO_BOWL_M,
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
  const tier = profile?.subscription_tier || 'trial'
  const historyDays = tier === 'trial' ? 30 : null // null = unlimited

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
        if (!cached) { setError(translateError(fetchError)); setSessions([]) }
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
      setError(translateError(sessionError))
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
      setError(translateError(itemsError))
      // Rollback session
      await supabase.from('sessions').delete().eq('id', session.id)
      return null
    }

    // Deduct from inventory if requested (best-effort per item — session already committed)
    if (deductFromInventory) {
      for (const item of items) {
        if (item.tobacco_inventory_id) {
          try {
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
          } catch {
            if (process.env.NODE_ENV !== 'production') console.error('Inventory deduction failed for', item.tobacco_inventory_id)
          }
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
      setError(translateError(updateError))
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

    // Fetch transactions first (for inventory reversal data + IDs for cleanup)
    const { data: transactions } = await supabase
      .from('inventory_transactions')
      .select('id, tobacco_inventory_id, quantity_grams')
      .eq('session_id', id)
      .eq('type', 'session')

    // Delete session FIRST — cascades to session_items (ON DELETE CASCADE),
    // sets inventory_transactions.session_id to NULL (ON DELETE SET NULL).
    // If this fails, nothing else is touched — safe to retry.
    const { error: deleteError } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id)
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

    if (deleteError) {
      setError(translateError(deleteError))
      return false
    }

    // Session deleted — now reverse inventory (best-effort, data already safe)
    if (transactions) {
      for (const tx of transactions) {
        if (tx.tobacco_inventory_id && tx.quantity_grams < 0) {
          try {
            await supabase.rpc('decrement_tobacco_inventory', {
              p_inventory_id: tx.tobacco_inventory_id,
              p_grams_used: tx.quantity_grams, // negative value → increments stock back
            })
          } catch {
            console.error('Reverse inventory failed for', tx.tobacco_inventory_id)
          }
        }
      }

      // Clean up orphaned inventory transactions by ID (session_id is now NULL)
      const txIds = transactions.map(tx => tx.id).filter(Boolean)
      if (txIds.length > 0) {
        await supabase.from('inventory_transactions').delete().in('id', txIds)
      }
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
      setError(translateError(fetchError))
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
