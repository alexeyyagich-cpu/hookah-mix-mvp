'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import type { Reservation, ReservationStatus } from '@/types/database'

// Demo reservations
const DEMO_RESERVATIONS: Reservation[] = [
  {
    id: '1',
    profile_id: 'demo',
    table_id: '3',
    guest_name: 'Иван Морозов',
    guest_phone: '+7 999 123-45-67',
    guest_count: 4,
    reservation_date: new Date().toISOString().split('T')[0],
    reservation_time: '19:00',
    duration_minutes: 120,
    status: 'confirmed',
    notes: 'День рождения',
    source: 'online',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    profile_id: 'demo',
    table_id: null,
    guest_name: 'Анна Соколова',
    guest_phone: '+7 999 987-65-43',
    guest_count: 2,
    reservation_date: new Date().toISOString().split('T')[0],
    reservation_time: '20:30',
    duration_minutes: 120,
    status: 'pending',
    notes: null,
    source: 'online',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    profile_id: 'demo',
    table_id: '1',
    guest_name: 'Сергей Волков',
    guest_phone: null,
    guest_count: 6,
    reservation_date: new Date().toISOString().split('T')[0],
    reservation_time: '21:00',
    duration_minutes: 180,
    status: 'confirmed',
    notes: 'VIP-зона',
    source: 'phone',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    profile_id: 'demo',
    table_id: null,
    guest_name: 'Ольга Петрова',
    guest_phone: '+7 999 555-12-34',
    guest_count: 3,
    reservation_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reservation_time: '18:00',
    duration_minutes: 120,
    status: 'pending',
    notes: null,
    source: 'online',
    created_at: new Date().toISOString(),
  },
]

// ============================================================================
// Dashboard hook (owner) — full CRUD
// ============================================================================

interface UseReservationsReturn {
  reservations: Reservation[]
  loading: boolean
  error: string | null
  updateStatus: (id: string, status: ReservationStatus) => Promise<void>
  assignTable: (id: string, tableId: string | null) => Promise<void>
  deleteReservation: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useReservations(): UseReservationsReturn {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user, isDemoMode } = useAuth()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  useEffect(() => {
    if (isDemoMode && user) {
      setReservations(DEMO_RESERVATIONS)
      setLoading(false)
    }
  }, [isDemoMode, user])

  const fetchReservations = useCallback(async () => {
    if (!user || !supabase) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('reservations')
        .select('*')
        .eq('profile_id', user.id)
        .order('reservation_date', { ascending: true })
        .order('reservation_time', { ascending: true })

      if (fetchError) throw fetchError
      setReservations(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки бронирований')
    }

    setLoading(false)
  }, [user, supabase])

  useEffect(() => {
    if (!isDemoMode) {
      fetchReservations()
    }
  }, [fetchReservations, isDemoMode])

  const updateStatus = useCallback(async (id: string, status: ReservationStatus) => {
    if (isDemoMode) {
      setReservations(prev => prev.map(r =>
        r.id === id ? { ...r, status } : r
      ))
      return
    }

    if (!user || !supabase) return

    try {
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ status })
        .eq('id', id)
        .eq('profile_id', user.id)

      if (updateError) throw updateError
      setReservations(prev => prev.map(r =>
        r.id === id ? { ...r, status } : r
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления статуса')
    }
  }, [user, supabase, isDemoMode])

  const assignTable = useCallback(async (id: string, tableId: string | null) => {
    if (isDemoMode) {
      setReservations(prev => prev.map(r =>
        r.id === id ? { ...r, table_id: tableId } : r
      ))
      return
    }

    if (!user || !supabase) return

    try {
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ table_id: tableId })
        .eq('id', id)
        .eq('profile_id', user.id)

      if (updateError) throw updateError
      setReservations(prev => prev.map(r =>
        r.id === id ? { ...r, table_id: tableId } : r
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка назначения стола')
    }
  }, [user, supabase, isDemoMode])

  const deleteReservation = useCallback(async (id: string) => {
    if (isDemoMode) {
      setReservations(prev => prev.filter(r => r.id !== id))
      return
    }

    if (!user || !supabase) return

    try {
      const { error: deleteError } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id)
        .eq('profile_id', user.id)

      if (deleteError) throw deleteError
      setReservations(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления бронирования')
    }
  }, [user, supabase, isDemoMode])

  return {
    reservations,
    loading,
    error,
    updateStatus,
    assignTable,
    deleteReservation,
    refresh: fetchReservations,
  }
}

// ============================================================================
// Public hook — submit reservation + check occupied slots (no auth required)
// ============================================================================

interface UsePublicReservationReturn {
  occupiedSlots: { date: string; time: string }[]
  loading: boolean
  error: string | null
  submitReservation: (reservation: {
    guest_name: string
    guest_phone?: string
    guest_count: number
    reservation_date: string
    reservation_time: string
    notes?: string
  }) => Promise<boolean>
  submitting: boolean
  fetchSlots: (date: string) => Promise<void>
}

export function usePublicReservation(profileId: string | undefined): UsePublicReservationReturn {
  const [occupiedSlots, setOccupiedSlots] = useState<{ date: string; time: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  const fetchSlots = useCallback(async (date: string) => {
    if (!profileId || !supabase) return

    setLoading(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('reservations')
        .select('reservation_date, reservation_time')
        .eq('profile_id', profileId)
        .eq('reservation_date', date)
        .in('status', ['pending', 'confirmed'])

      if (fetchError) throw fetchError
      setOccupiedSlots(
        (data || []).map(d => ({ date: d.reservation_date, time: d.reservation_time }))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки слотов')
    }
    setLoading(false)
  }, [profileId, supabase])

  const submitReservation = useCallback(async (reservation: {
    guest_name: string
    guest_phone?: string
    guest_count: number
    reservation_date: string
    reservation_time: string
    notes?: string
  }): Promise<boolean> => {
    if (!profileId || !supabase) return false

    setSubmitting(true)
    try {
      const { error: insertError } = await supabase
        .from('reservations')
        .insert({
          profile_id: profileId,
          guest_name: reservation.guest_name,
          guest_phone: reservation.guest_phone || null,
          guest_count: reservation.guest_count,
          reservation_date: reservation.reservation_date,
          reservation_time: reservation.reservation_time,
          notes: reservation.notes || null,
          source: 'online' as const,
        })

      if (insertError) throw insertError
      setSubmitting(false)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания бронирования')
      setSubmitting(false)
      return false
    }
  }, [profileId, supabase])

  return {
    occupiedSlots,
    loading,
    error,
    submitReservation,
    submitting,
    fetchSlots,
  }
}
