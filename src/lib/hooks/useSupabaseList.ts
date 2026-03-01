'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import { getCachedData, setCachedData } from '@/lib/offline/db'
import { translateError } from '@/lib/utils/translateError'

interface OrderBySpec {
  column: string
  ascending?: boolean
  nullsFirst?: boolean
}

export interface UseSupabaseListConfig<T> {
  /** Supabase table name (e.g. 'bowl_types') */
  table: string
  /** localStorage/IDB cache key. false = skip cache (e.g. reservations). */
  cacheKey: string | false
  /** PostgREST select string. Default: '*' */
  select?: string
  /** Columns to order by */
  orderBy: readonly OrderBySpec[]
  /** Optional row limit */
  limit?: number
  /** Static demo data to show in demo mode */
  demoData: T[] | (() => T[])
  /** Reconnect behavior: 'simple' = re-fetch on online, false = none. Default: 'simple' */
  reconnect?: 'simple' | 'reconcile' | false
  /** Hook to modify the query before execution (for date filters, location filters, etc.) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- query type is dynamic per table
  modifyQuery?: (query: any, userId: string) => any
}

export interface UseSupabaseListReturn<T> {
  items: T[]
  setItems: React.Dispatch<React.SetStateAction<T[]>>
  loading: boolean
  error: string | null
  setError: React.Dispatch<React.SetStateAction<string | null>>
  refresh: () => Promise<void>
  /** Supabase client (null if not configured) */
  supabase: ReturnType<typeof createClient> | null
  /** Current authenticated user */
  user: ReturnType<typeof useAuth>['user']
  /** Current profile */
  profile: ReturnType<typeof useAuth>['profile']
  /** Organization ID from context */
  organizationId: string | null
  /** Location ID from context */
  locationId: string | null
  /** Whether in demo mode */
  isDemoMode: boolean
}

export function useSupabaseList<T>(config: UseSupabaseListConfig<T>): UseSupabaseListReturn<T> {
  const {
    table,
    cacheKey,
    select = '*',
    orderBy,
    limit,
    demoData,
    reconnect = 'simple',
    modifyQuery,
  } = config

  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user, profile, isDemoMode } = useAuth()
  const { organizationId, locationId } = useOrganizationContext()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])
  const fetchIdRef = useRef(0)

  // Demo mode
  useEffect(() => {
    if (isDemoMode && user) {
      setItems(typeof demoData === 'function' ? demoData() : demoData)
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- demoData is a stable reference passed by the caller
  }, [isDemoMode, user])

  const fetchData = useCallback(async () => {
    if (!user || !supabase) {
      setItems([])
      setLoading(false)
      return
    }

    const fetchId = ++fetchIdRef.current

    // Cache-first
    if (cacheKey) {
      const cached = await getCachedData<T>(cacheKey, user.id)
      if (cached) {
        setItems(cached.data)
        setLoading(false)
      }
      if (typeof navigator !== 'undefined' && !navigator.onLine) return
      if (!cached) setLoading(true)
    } else {
      setLoading(true)
    }

    setError(null)

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic table/select; typed data via T
      let query: any = supabase // eslint-disable-line @typescript-eslint/no-explicit-any
        .from(table as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .select(select)
        .eq(
          organizationId ? 'organization_id' : 'profile_id',
          organizationId || user.id
        )

      // Apply modifyQuery if provided
      if (modifyQuery) {
        query = modifyQuery(query, user.id)
      }

      // Apply ordering
      for (const ob of orderBy) {
        query = query.order(ob.column, {
          ascending: ob.ascending !== false,
          ...(ob.nullsFirst !== undefined ? { nullsFirst: ob.nullsFirst } : {}),
        })
      }

      // Apply limit
      if (limit) {
        query = query.limit(limit)
      }

      const { data, error: fetchError } = await query

      if (fetchId !== fetchIdRef.current) return // stale

      if (fetchError) {
        if (cacheKey) {
          const cached = await getCachedData<T>(cacheKey, user.id)
          if (!cached) {
            setError(translateError(fetchError))
            setItems([])
          }
        } else {
          setError(translateError(fetchError))
          setItems([])
        }
      } else {
        const result = (data || []) as T[]
        setItems(result)
        if (cacheKey) {
          await setCachedData(cacheKey, user.id, result)
        }
      }
    } catch {
      // Network error — keep cache
    }

    if (fetchId === fetchIdRef.current) {
      setLoading(false)
    }
  }, [user, supabase, organizationId, table, select, cacheKey, orderBy, limit, modifyQuery])

  // Initial fetch
  useEffect(() => {
    if (!isDemoMode) fetchData()
  }, [fetchData, isDemoMode])

  // Reconnect
  useEffect(() => {
    if (!reconnect) return

    let tid: ReturnType<typeof setTimeout>
    const handleOnline = () => { tid = setTimeout(fetchData, 3000) }
    window.addEventListener('online', handleOnline)

    if (reconnect === 'reconcile') {
      const handleReconcile = () => fetchData()
      window.addEventListener('offline-discard-reconcile', handleReconcile)
      return () => {
        clearTimeout(tid)
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline-discard-reconcile', handleReconcile)
      }
    }

    return () => {
      clearTimeout(tid)
      window.removeEventListener('online', handleOnline)
    }
  }, [fetchData, reconnect])

  return {
    items,
    setItems,
    loading,
    error,
    setError,
    refresh: fetchData,
    supabase,
    user,
    profile,
    organizationId,
    locationId,
    isDemoMode,
  }
}
