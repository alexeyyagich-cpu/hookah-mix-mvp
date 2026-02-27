'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import type { Reservation, ReservationStatus } from '@/types/database'

// Demo reservations
const DEMO_RESERVATIONS: Reservation[] = [
  {
    id: '1',
    profile_id: 'demo',
    table_id: '3',
    guest_name: 'Tomasz Kowalski',
    guest_phone: '+48 512 345 678',
    guest_count: 4,
    reservation_date: new Date().toISOString().split('T')[0],
    reservation_time: '19:00',
    duration_minutes: 120,
    status: 'confirmed',
    notes: 'Birthday party',
    source: 'online',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    profile_id: 'demo',
    table_id: null,
    guest_name: 'Anna Nowak',
    guest_phone: '+48 601 987 654',
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
    guest_name: 'Max Weber',
    guest_phone: null,
    guest_count: 6,
    reservation_date: new Date().toISOString().split('T')[0],
    reservation_time: '21:00',
    duration_minutes: 180,
    status: 'confirmed',
    notes: 'VIP zone',
    source: 'phone',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    profile_id: 'demo',
    table_id: null,
    guest_name: 'Katarzyna Zielinska',
    guest_phone: '+48 505 123 456',
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

export function useReservations(): UseReservationsReturn {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user, isDemoMode } = useAuth()
  const { organizationId, locationId } = useOrganizationContext()
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
      let query = supabase
        .from('reservations')
        .select('*')
        .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

      if (organizationId && locationId) {
        query = query.eq('location_id', locationId)
      }

      const { data, error: fetchError } = await query
        .order('reservation_date', { ascending: true })
        .order('reservation_time', { ascending: true })

      if (fetchError) throw fetchError
      setReservations(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reservations')
    }

    setLoading(false)
  }, [user, supabase, organizationId, locationId])

  useEffect(() => {
    if (!isDemoMode) {
      fetchReservations()
    }
  }, [fetchReservations, isDemoMode])

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
      setError(err instanceof Error ? err.message : 'Failed to create reservation')
      return null
    }
  }, [user, supabase, isDemoMode, organizationId, locationId])

  const updateStatus = useCallback(async (id: string, status: ReservationStatus) => {
    if (isDemoMode) {
      setReservations(prev => prev.map(r =>
        r.id === id ? { ...r, status } : r
      ))
      return
    }

    if (!user || !supabase) return

    const previousReservations = reservations
    setReservations(prev => prev.map(r =>
      r.id === id ? { ...r, status } : r
    ))

    try {
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ status })
        .eq('id', id)
        .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

      if (updateError) throw updateError
    } catch (err) {
      setReservations(previousReservations)
      setError(err instanceof Error ? err.message : 'Failed to update status')
    }
  }, [user, supabase, isDemoMode, organizationId, reservations])

  const assignTable = useCallback(async (id: string, tableId: string | null) => {
    if (isDemoMode) {
      setReservations(prev => prev.map(r =>
        r.id === id ? { ...r, table_id: tableId } : r
      ))
      return
    }

    if (!user || !supabase) return

    const previousReservations = reservations
    setReservations(prev => prev.map(r =>
      r.id === id ? { ...r, table_id: tableId } : r
    ))

    try {
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ table_id: tableId })
        .eq('id', id)
        .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

      if (updateError) throw updateError
    } catch (err) {
      setReservations(previousReservations)
      setError(err instanceof Error ? err.message : 'Failed to assign table')
    }
  }, [user, supabase, isDemoMode, organizationId, reservations])

  const deleteReservation = useCallback(async (id: string) => {
    if (isDemoMode) {
      setReservations(prev => prev.filter(r => r.id !== id))
      return
    }

    if (!user || !supabase) return

    const previousReservations = reservations
    setReservations(prev => prev.filter(r => r.id !== id))

    try {
      const { error: deleteError } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id)
        .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || user.id)

      if (deleteError) throw deleteError
    } catch (err) {
      setReservations(previousReservations)
      setError(err instanceof Error ? err.message : 'Failed to delete reservation')
    }
  }, [user, supabase, isDemoMode, organizationId, reservations])

  return {
    reservations,
    loading,
    error,
    createReservation,
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
      setError(err instanceof Error ? err.message : 'Failed to load time slots')
    }
    setLoading(false)
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
      setError(err instanceof Error ? err.message : 'Failed to create reservation')
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
