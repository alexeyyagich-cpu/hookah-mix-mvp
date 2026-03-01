'use client'

import { useCallback } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useSupabaseList } from './useSupabaseList'
import { applyOrgFilter } from './useOrgFilter'
import { enqueueOfflineMutation, generateTempId } from '@/lib/offline/offlineMutation'
import type { Session, SessionItem, SessionWithItems } from '@/types/database'
import { translateError } from '@/lib/utils/translateError'
import { DEMO_SESSIONS } from '@/lib/demo'

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

const ORDER_BY = [{ column: 'session_date', ascending: false }] as const

export function useSessions(): UseSessionsReturn {
  const { profile } = useAuth()

  const tier = profile?.subscription_tier || 'trial'
  const historyDays = tier === 'trial' ? 30 : null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- query type is dynamic per table
  const modifyQuery = useCallback((query: any, _userId: string) => {
    if (historyDays) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - historyDays)
      return query.gte('session_date', cutoffDate.toISOString())
    }
    return query
  }, [historyDays])

  const {
    items: sessions, setItems: setSessions, loading, error, setError, refresh,
    supabase, user, organizationId, locationId, isDemoMode,
  } = useSupabaseList<SessionWithItems>({
    table: 'sessions',
    cacheKey: 'sessions',
    select: '*, session_items (*), bowl_type:bowl_types (*)',
    orderBy: ORDER_BY,
    limit: 100,
    demoData: DEMO_SESSIONS,
    reconnect: 'reconcile',
    modifyQuery,
  })

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

    await refresh()
    return session
  }

  const updateSession = async (id: string, updates: Partial<Session>): Promise<boolean> => {
    if (!user) return false

    if (isDemoMode || !supabase) {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
      return true
    }

    const { error: updateError } = await applyOrgFilter(
      supabase.from('sessions').update(updates).eq('id', id),
      organizationId,
      user.id
    )

    if (updateError) {
      setError(translateError(updateError))
      return false
    }

    await refresh()
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
    const { error: deleteError } = await applyOrgFilter(
      supabase.from('sessions').delete().eq('id', id),
      organizationId,
      user.id
    )

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
            if (process.env.NODE_ENV !== 'production') console.error('Reverse inventory failed for', tx.tobacco_inventory_id)
          }
        }
      }

      // Clean up orphaned inventory transactions by ID (session_id is now NULL)
      const txIds = transactions.map(tx => tx.id).filter(Boolean)
      if (txIds.length > 0) {
        await supabase.from('inventory_transactions').delete().in('id', txIds)
      }
    }

    await refresh()
    return true
  }

  const getSession = async (id: string): Promise<SessionWithItems | null> => {
    if (!user || !supabase) return null

    const { data, error: fetchError } = await applyOrgFilter(
      supabase
        .from('sessions')
        .select(`
          *,
          session_items (*),
          bowl_type:bowl_types (*)
        `)
        .eq('id', id),
      organizationId,
      user.id
    ).single()

    if (fetchError) {
      setError(translateError(fetchError))
      return null
    }

    return data as unknown as SessionWithItems
  }

  return {
    sessions,
    loading,
    error,
    createSession,
    updateSession,
    deleteSession,
    getSession,
    refresh,
  }
}
