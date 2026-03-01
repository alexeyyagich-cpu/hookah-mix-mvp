'use client'

import { useEffect, useCallback } from 'react'
import type { Database, FloorTable, TableStatus } from '@/types/database'
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

import { DEMO_TABLES } from '@/lib/demo'
import { useSupabaseList } from './useSupabaseList'
import { applyOrgFilter } from './useOrgFilter'

const ORDER_BY = [{ column: 'created_at', ascending: true }] as const

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
  const {
    items: tables, setItems: setTables, loading, error, setError, refresh,
    supabase, user, organizationId, locationId, isDemoMode,
  } = useSupabaseList<FloorTable>({
    table: 'floor_tables',
    cacheKey: 'floor_tables',
    orderBy: ORDER_BY,
    demoData: DEMO_TABLES,
    reconnect: 'reconcile',
  })

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
  }, [supabase, user, isDemoMode, organizationId, setTables])

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
      }) as Database['public']['Tables']['floor_tables']['Insert']
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
            .insert(payloadNoZone as Database['public']['Tables']['floor_tables']['Insert'])
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
  }, [user, supabase, isDemoMode, organizationId, locationId, setTables, setError])

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
      const { error: updateError } = await applyOrgFilter(
        supabase.from('floor_tables').update(payload).eq('id', id),
        organizationId,
        user.id
      )

      if (updateError) {
        // If zone column doesn't exist yet, retry without it
        if (updateError.message?.includes('zone')) {
          const { zone: _z, ...payloadNoZone } = payload as Record<string, unknown> & { zone?: unknown }
          const { error: e2 } = await applyOrgFilter(
            supabase.from('floor_tables').update(payloadNoZone).eq('id', id),
            organizationId,
            user.id
          )
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
  }, [user, supabase, isDemoMode, organizationId, tables, setTables, setError])

  const deleteTable = useCallback(async (id: string) => {
    if (isDemoMode) {
      setTables(prev => prev.filter(t => t.id !== id))
      return
    }

    if (!user || !supabase) return

    try {
      const { error: deleteError } = await applyOrgFilter(
        supabase.from('floor_tables').delete().eq('id', id),
        organizationId,
        user.id
      )

      if (deleteError) throw deleteError
      setTables(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      setError(translateError(err as Error))
    }
  }, [user, supabase, isDemoMode, organizationId, setTables, setError])

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
    refresh,
  }
}
