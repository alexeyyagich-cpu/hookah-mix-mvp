'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import type { KdsOrder, KdsOrderStatus, KdsOrderType, KdsOrderItem } from '@/types/database'

// Demo KDS orders
const DEMO_KDS_ORDERS: KdsOrder[] = [
  {
    id: 'demo-kds-1',
    profile_id: 'demo',
    created_by: null,
    table_id: '1',
    table_name: 'Стол 1',
    guest_name: 'Tomasz K.',
    type: 'bar',
    items: [
      { name: 'Мохито', quantity: 2, details: null },
      { name: 'Негрони', quantity: 1, details: null },
    ],
    status: 'new',
    notes: null,
    created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    completed_at: null,
  },
  {
    id: 'demo-kds-2',
    profile_id: 'demo',
    created_by: null,
    table_id: '3',
    table_name: 'VIP',
    guest_name: 'Max W.',
    type: 'hookah',
    items: [
      {
        name: 'Supernova (50%) + Pinkman (50%)',
        quantity: 1,
        details: '20г, Phunnel Large',
        hookah_data: {
          tobaccos: [
            { tobacco_id: 'ds1', brand: 'Darkside', flavor: 'Supernova', percent: 50, color: '#06B6D4' },
            { tobacco_id: 'mh1', brand: 'Musthave', flavor: 'Pinkman', percent: 50, color: '#EC4899' },
          ],
          total_grams: 20,
          bowl_name: 'Phunnel Large',
          bowl_id: null,
          heat_setup: { coals: 3, packing: 'semi-dense' },
          strength: 'strong',
          compatibility_score: 85,
        },
      },
    ],
    status: 'new',
    notes: null,
    created_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    completed_at: null,
  },
  {
    id: 'demo-kds-3',
    profile_id: 'demo',
    created_by: null,
    table_id: '5',
    table_name: 'Барная стойка',
    guest_name: 'Lena S.',
    type: 'bar',
    items: [
      { name: 'Джин-Тоник', quantity: 2, details: null },
    ],
    status: 'preparing',
    notes: null,
    created_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    completed_at: null,
  },
  {
    id: 'demo-kds-4',
    profile_id: 'demo',
    created_by: null,
    table_id: '1',
    table_name: 'Стол 1',
    guest_name: 'Tomasz K.',
    type: 'hookah',
    items: [
      {
        name: 'Cane Mint (60%) + Bananapapa (40%)',
        quantity: 1,
        details: '18г, Phunnel Medium',
        hookah_data: {
          tobaccos: [
            { tobacco_id: 'tg1', brand: 'Tangiers', flavor: 'Cane Mint', percent: 60, color: '#10B981' },
            { tobacco_id: 'ds2', brand: 'Darkside', flavor: 'Bananapapa', percent: 40, color: '#FACC15' },
          ],
          total_grams: 18,
          bowl_name: 'Phunnel Medium',
          bowl_id: null,
          heat_setup: { coals: 3, packing: 'semi-dense' },
          strength: 'medium',
          compatibility_score: 78,
        },
      },
    ],
    status: 'preparing',
    notes: null,
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    completed_at: null,
  },
  {
    id: 'demo-kds-5',
    profile_id: 'demo',
    created_by: null,
    table_id: '5',
    table_name: 'Барная стойка',
    guest_name: 'Lena S.',
    type: 'bar',
    items: [
      { name: 'Мохито', quantity: 1, details: null },
    ],
    status: 'ready',
    notes: null,
    created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    completed_at: null,
  },
]

export interface CreateKdsOrderInput {
  table_id: string | null
  table_name: string | null
  guest_name: string | null
  type: KdsOrderType
  items: KdsOrderItem[]
  notes: string | null
}

interface UseKDSReturn {
  orders: KdsOrder[]
  loading: boolean
  error: string | null
  createOrder: (order: CreateKdsOrderInput) => Promise<KdsOrder | null>
  updateStatus: (orderId: string, newStatus: KdsOrderStatus) => Promise<boolean>
  cancelOrder: (orderId: string) => Promise<boolean>
  refresh: () => Promise<void>
}

export function useKDS(): UseKDSReturn {
  const [orders, setOrders] = useState<KdsOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, profile, isDemoMode } = useAuth()
  const { organizationId, locationId } = useOrganizationContext()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])
  const lastNewCountRef = useRef(0)
  const audioUnlockedRef = useRef(false)

  // Effective profile ID: staff uses owner's ID for venue grouping
  const effectiveProfileId = useMemo(() => {
    if (profile?.role === 'staff' && profile.owner_profile_id) {
      return profile.owner_profile_id
    }
    return user?.id || null
  }, [user, profile])

  const playBeep = useCallback(() => {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.15)
      setTimeout(() => ctx.close(), 200)
    } catch {
      // AudioContext may not be available
    }
  }, [])

  // Unlock audio on first user interaction
  useEffect(() => {
    const unlock = () => {
      audioUnlockedRef.current = true
      document.removeEventListener('click', unlock)
      document.removeEventListener('touchstart', unlock)
    }
    document.addEventListener('click', unlock)
    document.addEventListener('touchstart', unlock)
    return () => {
      document.removeEventListener('click', unlock)
      document.removeEventListener('touchstart', unlock)
    }
  }, [])

  // Demo mode
  useEffect(() => {
    if (isDemoMode && user) {
      setOrders(DEMO_KDS_ORDERS)
      lastNewCountRef.current = DEMO_KDS_ORDERS.filter(o => o.status === 'new').length
      setLoading(false)
    }
  }, [isDemoMode, user])

  const fetchOrders = useCallback(async () => {
    if (!effectiveProfileId || !supabase) {
      setOrders([])
      setLoading(false)
      return
    }

    setError(null)

    const { data, error: fetchError } = await supabase
      .from('kds_orders')
      .select('*')
      .eq(organizationId ? 'organization_id' : 'profile_id', organizationId || effectiveProfileId)
      .not('status', 'in', '("served","cancelled")')
      .order('created_at', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setOrders([])
      setLoading(false)
      return
    }

    const newOrders = data || []
    const newCount = newOrders.filter(o => o.status === 'new').length

    // Play beep if new orders arrived
    if (newCount > lastNewCountRef.current && audioUnlockedRef.current) {
      playBeep()
    }
    lastNewCountRef.current = newCount

    setOrders(newOrders)
    setLoading(false)
  }, [effectiveProfileId, supabase, playBeep, organizationId])

  // Initial fetch + polling
  useEffect(() => {
    if (isDemoMode) return

    fetchOrders()

    const interval = setInterval(fetchOrders, 10000)
    return () => clearInterval(interval)
  }, [fetchOrders, isDemoMode])

  const createOrder = useCallback(async (input: CreateKdsOrderInput): Promise<KdsOrder | null> => {
    if (!effectiveProfileId) return null

    const orderData = {
      profile_id: effectiveProfileId,
      created_by: user?.id || effectiveProfileId,
      ...(organizationId ? { organization_id: organizationId, location_id: locationId } : {}),
      table_id: input.table_id,
      table_name: input.table_name,
      guest_name: input.guest_name,
      type: input.type,
      items: input.items,
      notes: input.notes,
    }

    if (isDemoMode || !supabase) {
      const newOrder: KdsOrder = {
        ...orderData,
        id: `demo-kds-${Date.now()}`,
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
      }
      setOrders(prev => [...prev, newOrder])
      lastNewCountRef.current += 1
      return newOrder
    }

    const { data, error: insertError } = await supabase
      .from('kds_orders')
      .insert(orderData)
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      return null
    }

    setOrders(prev => [...prev, data])
    lastNewCountRef.current += 1
    return data
  }, [effectiveProfileId, isDemoMode, supabase, organizationId, locationId])

  const updateStatus = useCallback(async (orderId: string, newStatus: KdsOrderStatus): Promise<boolean> => {
    const now = new Date().toISOString()
    const isCompleted = newStatus === 'served' || newStatus === 'cancelled'

    if (isDemoMode || !supabase) {
      setOrders(prev => {
        if (isCompleted) {
          return prev.filter(o => o.id !== orderId)
        }
        return prev.map(o =>
          o.id === orderId
            ? { ...o, status: newStatus, updated_at: now }
            : o
        )
      })
      if (newStatus === 'served' || newStatus === 'cancelled') {
        lastNewCountRef.current = orders.filter(o => o.status === 'new' && o.id !== orderId).length
      }
      return true
    }

    const updates: Record<string, unknown> = {
      status: newStatus,
      updated_at: now,
    }
    if (isCompleted) {
      updates.completed_at = now
    }

    const { error: updateError } = await supabase
      .from('kds_orders')
      .update(updates)
      .eq('id', orderId)

    if (updateError) {
      setError(updateError.message)
      return false
    }

    setOrders(prev => {
      if (isCompleted) {
        return prev.filter(o => o.id !== orderId)
      }
      return prev.map(o =>
        o.id === orderId
          ? { ...o, status: newStatus, updated_at: now }
          : o
      )
    })

    return true
  }, [isDemoMode, supabase, orders])

  const cancelOrder = useCallback(async (orderId: string): Promise<boolean> => {
    return updateStatus(orderId, 'cancelled')
  }, [updateStatus])

  return {
    orders,
    loading,
    error,
    createOrder,
    updateStatus,
    cancelOrder,
    refresh: fetchOrders,
  }
}
