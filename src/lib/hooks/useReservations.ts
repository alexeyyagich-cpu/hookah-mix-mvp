'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import type { Reservation, ReservationStatus } from '@/types/database'
import { translateError } from '@/lib/utils/translateError'
import { DEMO_RESERVATIONS } from '@/lib/demo'
import { useSupabaseList } from './useSupabaseList'
import { applyOrgFilter } from './useOrgFilter'

// ============================================================================
// Dashboard hook (owner) — full CRUD
// ============================================================================

interface CreateReservationInput {
  table_id?: string | null
  guest_name: string
  guest_phone?: string | null
  guest_count: number
  reservation_date: string
  reservation_time: string
  notes?: string | null
  source?: 'online' | 'phone' | 'walk_in'
}

interface UseReservationsReturn {
  reservations: Reservation[]
  loading: boolean
  error: string | null
  createReservation: (input: CreateReservationInput) => Promise<Reservation | null>
  updateStatus: (id: string, status: ReservationStatus) => Promise<void>
  assignTable: (id: string, tableId: string | null) => Promise<void>
  deleteReservation: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

const ORDER_BY = [
  { column: 'reservation_date', ascending: true },
  { column: 'reservation_time', ascending: true },
] as const

export function useReservations(): UseReservationsReturn {
  const { organizationId, locationId } = useOrganizationContext()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- query type is dynamic per table
  const modifyQuery = useCallback((query: any) => {
    if (organizationId && locationId) {
      return query.eq('location_id', locationId)
    }
    return query
  }, [organizationId, locationId])

  const {
    items: reservations,
    setItems: setReservations,
    loading,
    error,
    setError,
    refresh,
    supabase,
    user,
    isDemoMode,
  } = useSupabaseList<Reservation>({
    table: 'reservations',
    cacheKey: false,
    orderBy: ORDER_BY,
    demoData: DEMO_RESERVATIONS,
    reconnect: false,
    modifyQuery,
  })

  const reservationsRef = useRef(reservations)
  reservationsRef.current = reservations

  const createReservation = useCallback(async (input: CreateReservationInput): Promise<Reservation | null> => {
    if (isDemoMode) {
      const newRes: Reservation = {
        id: `demo-${Date.now()}`,
        profile_id: 'demo',
        table_id: input.table_id || null,
        guest_name: input.guest_name,
        guest_phone: input.guest_phone || null,
        guest_count: input.guest_count,
        reservation_date: input.reservation_date,
        reservation_time: input.reservation_time,
        duration_minutes: 120,
        status: 'confirmed',
        notes: input.notes || null,
        source: input.source || 'walk_in',
        created_at: new Date().toISOString(),
      }
      setReservations(prev => [...prev, newRes])
      return newRes
    }

    if (!user || !supabase) return null

    try {
      const { data, error: insertError } = await supabase
        .from('reservations')
        .insert({
          profile_id: user.id,
          table_id: input.table_id || null,
          guest_name: input.guest_name,
          guest_phone: input.guest_phone || null,
          guest_count: input.guest_count,
          reservation_date: input.reservation_date,
          reservation_time: input.reservation_time,
          notes: input.notes || null,
          source: input.source || 'walk_in',
          ...(organizationId ? { organization_id: organizationId } : {}),
          ...(locationId ? { location_id: locationId } : {}),
        })
        .select()
        .single()

      if (insertError) throw insertError
      setReservations(prev => [...prev, data])
      return data
    } catch (err) {
      setError(translateError(err as Error))
      return null
    }
  }, [user, supabase, isDemoMode, organizationId, locationId, setReservations, setError])

  const updateStatus = useCallback(async (id: string, status: ReservationStatus) => {
    if (isDemoMode) {
      setReservations(prev => prev.map(r =>
        r.id === id ? { ...r, status } : r
      ))
      return
    }

    if (!user || !supabase) return

    const snapshot = reservationsRef.current
    setReservations(prev => prev.map(r =>
      r.id === id ? { ...r, status } : r
    ))

    try {
      const { error: updateError } = await applyOrgFilter(
        supabase
          .from('reservations')
          .update({ status })
          .eq('id', id),
        organizationId,
        user.id
      )

      if (updateError) throw updateError
    } catch (err) {
      setReservations(snapshot)
      setError(translateError(err as Error))
    }
  }, [user, supabase, isDemoMode, organizationId, setReservations, setError])

  const assignTable = useCallback(async (id: string, tableId: string | null) => {
    if (isDemoMode) {
      setReservations(prev => prev.map(r =>
        r.id === id ? { ...r, table_id: tableId } : r
      ))
      return
    }

    if (!user || !supabase) return

    const snapshot = reservationsRef.current
    setReservations(prev => prev.map(r =>
      r.id === id ? { ...r, table_id: tableId } : r
    ))

    try {
      const { error: updateError } = await applyOrgFilter(
        supabase
          .from('reservations')
          .update({ table_id: tableId })
          .eq('id', id),
        organizationId,
        user.id
      )

      if (updateError) throw updateError
    } catch (err) {
      setReservations(snapshot)
      setError(translateError(err as Error))
    }
  }, [user, supabase, isDemoMode, organizationId, setReservations, setError])

  const deleteReservation = useCallback(async (id: string) => {
    if (isDemoMode) {
      setReservations(prev => prev.filter(r => r.id !== id))
      return
    }

    if (!user || !supabase) return

    const snapshot = reservationsRef.current
    setReservations(prev => prev.filter(r => r.id !== id))

    try {
      const { error: deleteError } = await applyOrgFilter(
        supabase
          .from('reservations')
          .delete()
          .eq('id', id),
        organizationId,
        user.id
      )

      if (deleteError) throw deleteError
    } catch (err) {
      setReservations(snapshot)
      setError(translateError(err as Error))
    }
  }, [user, supabase, isDemoMode, organizationId, setReservations, setError])

  return {
    reservations,
    loading,
    error,
    createReservation,
    updateStatus,
    assignTable,
    deleteReservation,
    refresh,
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

export function usePublicReservation(profileId: string | undefined, orgId?: string): UsePublicReservationReturn {
  const [occupiedSlots, setOccupiedSlots] = useState<{ date: string; time: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  const fetchSlots = useCallback(async (date: string) => {
    if ((!profileId && !orgId) || !supabase) return

    setLoading(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('reservations')
        .select('reservation_date, reservation_time')
        .eq(orgId ? 'organization_id' : 'profile_id', orgId || profileId!)
        .eq('reservation_date', date)
        .in('status', ['pending', 'confirmed'])

      if (fetchError) throw fetchError
      setOccupiedSlots(
        (data || []).map(d => ({ date: d.reservation_date, time: d.reservation_time }))
      )
    } catch (err) {
      setError(translateError(err as Error))
    } finally {
      setLoading(false)
    }
  }, [profileId, orgId, supabase])

  const submitReservation = useCallback(async (reservation: {
    guest_name: string
    guest_phone?: string
    guest_count: number
    reservation_date: string
    reservation_time: string
    notes?: string
  }): Promise<boolean> => {
    if ((!profileId && !orgId) || !supabase) return false

    setSubmitting(true)
    try {
      const { error: insertError } = await supabase
        .from('reservations')
        .insert({
          profile_id: profileId || '',
          guest_name: reservation.guest_name,
          guest_phone: reservation.guest_phone || null,
          guest_count: reservation.guest_count,
          reservation_date: reservation.reservation_date,
          reservation_time: reservation.reservation_time,
          notes: reservation.notes || null,
          source: 'online' as const,
          ...(orgId ? { organization_id: orgId } : {}),
        })

      if (insertError) throw insertError
      setSubmitting(false)
      return true
    } catch (err) {
      setError(translateError(err as Error))
      setSubmitting(false)
      return false
    }
  }, [profileId, orgId, supabase])

  return {
    occupiedSlots,
    loading,
    error,
    submitReservation,
    submitting,
    fetchSlots,
  }
}
