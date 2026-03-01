'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import { getCachedData, setCachedData } from '@/lib/offline/db'
import type { FloorTable, TableStatus } from '@/types/database'
import { translateError } from '@/lib/utils/translateError'
// Strip fields that may not exist in the database yet (e.g. zone before migration)
// This prevents Supabase from rejecting the entire update due to unknown columns
const DB_KNOWN_COLUMNS = new Set([
  'name', 'capacity', 'shape', 'position_x', 'position_y', 'width', 'height',
  'status', 'current_session_id', 'current_guest_name', 'session_start_time',
  'notes', 'profile_id', 'organization_id', 'location_id', 'zone',
  'created_at', 'updated_at',
])

function stripUnknownForDb(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(obj)) {
    if (DB_KNOWN_COLUMNS.has(key)) result[key] = obj[key]
  }
  return result
}

// Demo floor tables
const DEMO_TABLES: FloorTable[] = [
  {
    id: '1',
    profile_id: 'demo',
    name: 'Table 1',
    capacity: 4,
    shape: 'circle',
    position_x: 50,
    position_y: 50,
    width: 80,
    height: 80,
    status: 'occupied',
    current_session_id: '1',
    current_guest_name: 'Tomasz K.',
    session_start_time: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    zone: 'Main hall',
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    profile_id: 'demo',
    name: 'Table 2',
    capacity: 6,
    shape: 'rectangle',
    position_x: 200,
    position_y: 50,
    width: 120,
    height: 80,
    status: 'available',
    current_session_id: null,
    current_guest_name: null,
    session_start_time: null,
    zone: 'Main hall',
    notes: 'By the window',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    profile_id: 'demo',
    name: 'VIP',
    capacity: 8,
    shape: 'rectangle',
    position_x: 50,
    position_y: 180,
    width: 150,
    height: 100,
    status: 'reserved',
    current_session_id: null,
    current_guest_name: 'Reserved: Max W.',
    session_start_time: null,
    zone: 'VIP',
    notes: 'VIP zone',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    profile_id: 'demo',
    name: 'Table 3',
    capacity: 2,
    shape: 'circle',
    position_x: 280,
    position_y: 200,
    width: 60,
    height: 60,
    status: 'cleaning',
    current_session_id: null,
    current_guest_name: null,
    session_start_time: null,
    zone: 'Main hall',
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    profile_id: 'demo',
    name: 'Bar counter',
    capacity: 4,
    shape: 'rectangle',
    position_x: 380,
    position_y: 50,
    width: 40,
    height: 200,
    status: 'occupied',
    current_session_id: '2',
    current_guest_name: 'Lena S.',
    session_start_time: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    zone: 'Bar',
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

interface UseFloorPlanReturn {
  tables: FloorTable[]
  loading: boolean
  error: string | null
  addTable: (table: Omit<FloorTable, 'id' | 'profile_id' | 'created_at' | 'updated_at'>) => Promise<FloorTable | null>
  updateTable: (id: string, updates: Partial<FloorTable>) => Promise<void>
  deleteTable: (id: string) => Promise<void>
  moveTable: (id: string, x: number, y: number) => Promise<void>
  setTableStatus: (id: string, status: TableStatus, guestName?: string | null) => Promise<void>
  startSession: (tableId: string, sessionId: string, guestName: string) => Promise<void>
  endSession: (tableId: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useFloorPlan(): UseFloorPlanReturn {
  const [tables, setTables] = useState<FloorTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user, isDemoMode } = useAuth()
  const { organizationId, locationId } = useOrganizationContext()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  // Return demo data if in demo mode
  useEffect(() => {
    if (isDemoMode && user) {
      setTables(DEMO_TABLES)
      setLoading(false)
    }
  }, [isDemoMode, user])

  const fetchTables = useCallback(async () => {
    if (!user || !supabase) {
      setLoading(false)
      return
    }

    // Try cache first for instant display
    const cached = await getCachedData<FloorTable>('floor_tables', user.id)
    if (cached) {
      setTables(cached.data)
      setLoading(false)
    }

    // If offline, stop here
    if (typeof navigator !== 'undefined' && !navigator.onLine) return

    if (!cached) setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('floor_tables')
        .select('*')
        .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)
        .order('created_at', { ascending: true })

      if (fetchError) {
        if (!cached) { setError(translateError(fetchError)); setTables([]) }
      } else {
        setTables(data || [])
        await setCachedData('floor_tables', user.id, data || [])
      }
    } catch {
      // Network error — keep cache if available
    }

    setLoading(false)
  }, [user, supabase, organizationId])

  useEffect(() => {
    if (!isDemoMode) {
      fetchTables()
    }
  }, [fetchTables, isDemoMode])

  // Refetch after reconnect or offline discard
  useEffect(() => {
    let tid: ReturnType<typeof setTimeout>
    const handleOnline = () => { tid = setTimeout(fetchTables, 3000) }
    const handleReconcile = () => fetchTables()
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline-discard-reconcile', handleReconcile)
    return () => {
      clearTimeout(tid)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline-discard-reconcile', handleReconcile)
    }
  }, [fetchTables])

  // Supabase Realtime subscription — live sync across devices
  useEffect(() => {
    if (!supabase || !user || isDemoMode) return

    const channel = supabase
      .channel('floor_tables_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'floor_tables' },
        (payload) => {
          const raw = payload.new || payload.old
          if (!raw || typeof raw !== 'object' || !('id' in raw) || !('profile_id' in raw)) return
          const record = raw as FloorTable

          // Client-side filter: only process changes for our org/profile
          const isOurs = organizationId
            ? record.organization_id === organizationId
            : record.profile_id === user.id
          if (!isOurs) return

          switch (payload.eventType) {
            case 'INSERT': {
              setTables(prev => {
                if (prev.some(t => t.id === record.id)) return prev
                return [...prev, record]
              })
              break
            }
            case 'UPDATE': {
              setTables(prev => prev.map(t =>
                t.id === record.id ? record : t
              ))
              break
            }
            case 'DELETE': {
              setTables(prev => prev.filter(t => t.id !== record.id))
              break
            }
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, user, isDemoMode, organizationId])

  const addTable = useCallback(async (
    table: Omit<FloorTable, 'id' | 'profile_id' | 'created_at' | 'updated_at'>
  ): Promise<FloorTable | null> => {
    if (isDemoMode) {
      const newTable: FloorTable = {
        ...table,
        id: Date.now().toString(),
        profile_id: 'demo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setTables(prev => [...prev, newTable])
      return newTable
    }

    if (!user || !supabase) return null

    try {
      const payload = stripUnknownForDb({
        ...table,
        profile_id: user.id,
        ...(organizationId ? { organization_id: organizationId, location_id: locationId } : {}),
      })
      const { data, error: insertError } = await supabase
        .from('floor_tables')
        .insert(payload)
        .select()
        .single()

      if (insertError) {
        // If zone column doesn't exist yet, retry without it
        if (insertError.message?.includes('zone')) {
          const { zone: _z, ...payloadNoZone } = payload as Record<string, unknown> & { zone?: unknown }
          const { data: d2, error: e2 } = await supabase
            .from('floor_tables')
            .insert(payloadNoZone)
            .select()
            .single()
          if (e2) throw e2
          setTables(prev => [...prev, d2])
          return d2
        }
        throw insertError
      }
      setTables(prev => [...prev, data])
      return data
    } catch (err) {
      setError(translateError(err as Error))
      return null
    }
  }, [user, supabase, isDemoMode, organizationId, locationId])

  const updateTable = useCallback(async (id: string, updates: Partial<FloorTable>) => {
    const now = new Date().toISOString()

    // Snapshot for rollback
    const previousTables = tables

    // Optimistic update — apply locally immediately
    setTables(prev => prev.map(t =>
      t.id === id ? { ...t, ...updates, updated_at: now } : t
    ))

    if (isDemoMode) return
    if (!user || !supabase) return

    try {
      const payload = stripUnknownForDb({ ...updates, updated_at: now })
      const { error: updateError } = await supabase
        .from('floor_tables')
        .update(payload)
        .eq('id', id)
        .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

      if (updateError) {
        // If zone column doesn't exist yet, retry without it
        if (updateError.message?.includes('zone')) {
          const { zone: _z, ...payloadNoZone } = payload as Record<string, unknown> & { zone?: unknown }
          const { error: e2 } = await supabase
            .from('floor_tables')
            .update(payloadNoZone)
            .eq('id', id)
            .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)
          if (e2) throw e2
          return // local state already updated optimistically
        }
        throw updateError
      }
    } catch (err) {
      setError(translateError(err as Error))
      // Revert optimistic update to previous state
      setTables(previousTables)
    }
  }, [user, supabase, isDemoMode, organizationId, tables])

  const deleteTable = useCallback(async (id: string) => {
    if (isDemoMode) {
      setTables(prev => prev.filter(t => t.id !== id))
      return
    }

    if (!user || !supabase) return

    try {
      const { error: deleteError } = await supabase
        .from('floor_tables')
        .delete()
        .eq('id', id)
        .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

      if (deleteError) throw deleteError
      setTables(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      setError(translateError(err as Error))
    }
  }, [user, supabase, isDemoMode, organizationId])

  const moveTable = useCallback(async (id: string, x: number, y: number) => {
    await updateTable(id, { position_x: x, position_y: y })
  }, [updateTable])

  const setTableStatus = useCallback(async (
    id: string,
    status: TableStatus,
    guestName?: string | null
  ) => {
    const updates: Partial<FloorTable> = { status }
    if (guestName !== undefined) {
      updates.current_guest_name = guestName
    }
    if (status === 'available') {
      updates.current_session_id = null
      updates.current_guest_name = null
      updates.session_start_time = null
    }
    await updateTable(id, updates)
  }, [updateTable])

  const startSession = useCallback(async (tableId: string, sessionId: string, guestName: string) => {
    await updateTable(tableId, {
      status: 'occupied',
      current_session_id: sessionId,
      current_guest_name: guestName,
      session_start_time: new Date().toISOString(),
    })
  }, [updateTable])

  const endSession = useCallback(async (tableId: string) => {
    await updateTable(tableId, {
      status: 'cleaning',
      current_session_id: null,
      current_guest_name: null,
      session_start_time: null,
    })
  }, [updateTable])

  return {
    tables,
    loading,
    error,
    addTable,
    updateTable,
    deleteTable,
    moveTable,
    setTableStatus,
    startSession,
    endSession,
    refresh: fetchTables,
  }
}
