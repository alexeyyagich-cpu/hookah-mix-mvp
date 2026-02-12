'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import type { FloorTable, TableStatus } from '@/types/database'

// Demo floor tables
const DEMO_TABLES: FloorTable[] = [
  {
    id: '1',
    profile_id: 'demo',
    name: 'Стол 1',
    capacity: 4,
    shape: 'circle',
    position_x: 50,
    position_y: 50,
    width: 80,
    height: 80,
    status: 'occupied',
    current_session_id: '1',
    current_guest_name: 'Алексей К.',
    session_start_time: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    profile_id: 'demo',
    name: 'Стол 2',
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
    notes: 'У окна',
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
    current_guest_name: 'Бронь: Иван М.',
    session_start_time: null,
    notes: 'VIP-зона',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    profile_id: 'demo',
    name: 'Стол 3',
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
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    profile_id: 'demo',
    name: 'Барная стойка',
    capacity: 4,
    shape: 'rectangle',
    position_x: 380,
    position_y: 50,
    width: 40,
    height: 200,
    status: 'occupied',
    current_session_id: '2',
    current_guest_name: 'Мария С.',
    session_start_time: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
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

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('floor_tables')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError
      setTables(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки плана зала')
    }

    setLoading(false)
  }, [user, supabase])

  useEffect(() => {
    if (!isDemoMode) {
      fetchTables()
    }
  }, [fetchTables, isDemoMode])

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
      const { data, error: insertError } = await supabase
        .from('floor_tables')
        .insert({
          ...table,
          profile_id: user.id,
        })
        .select()
        .single()

      if (insertError) throw insertError
      setTables(prev => [...prev, data])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка добавления стола')
      return null
    }
  }, [user, supabase, isDemoMode])

  const updateTable = useCallback(async (id: string, updates: Partial<FloorTable>) => {
    if (isDemoMode) {
      setTables(prev => prev.map(t =>
        t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
      ))
      return
    }

    if (!user || !supabase) return

    try {
      const { error: updateError } = await supabase
        .from('floor_tables')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('profile_id', user.id)

      if (updateError) throw updateError
      setTables(prev => prev.map(t =>
        t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления стола')
    }
  }, [user, supabase, isDemoMode])

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
        .eq('profile_id', user.id)

      if (deleteError) throw deleteError
      setTables(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления стола')
    }
  }, [user, supabase, isDemoMode])

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
