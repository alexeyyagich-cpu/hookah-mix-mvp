'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import type { Promotion, PromoType, PromoRules, Guest } from '@/types/database'

const DEMO_PROMOTIONS: Promotion[] = [
  {
    id: 'promo-1',
    profile_id: 'demo',
    name: 'Happy Hour',
    type: 'happy_hour',
    rules: { discount_percent: 20, start_hour: 14, end_hour: 17 },
    is_active: true,
    valid_from: null,
    valid_until: null,
    usage_count: 45,
    max_uses: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'promo-2',
    profile_id: 'demo',
    name: '5th Hookah Free',
    type: 'nth_free',
    rules: { nth_visit: 5, discount_percent: 100 },
    is_active: true,
    valid_from: null,
    valid_until: null,
    usage_count: 12,
    max_uses: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'promo-3',
    profile_id: 'demo',
    name: 'Birthday Discount',
    type: 'birthday',
    rules: { discount_percent: 30 },
    is_active: true,
    valid_from: null,
    valid_until: null,
    usage_count: 8,
    max_uses: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'promo-4',
    profile_id: 'demo',
    name: 'Weekend Special',
    type: 'custom_discount',
    rules: { discount_percent: 15, days_of_week: [5, 6] },
    is_active: false,
    valid_from: null,
    valid_until: null,
    usage_count: 20,
    max_uses: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

interface UsePromotionsReturn {
  promotions: Promotion[]
  activePromos: Promotion[]
  loading: boolean
  createPromo: (promo: { name: string; type: PromoType; rules: PromoRules; max_uses?: number | null }) => Promise<boolean>
  updatePromo: (id: string, updates: Partial<Promotion>) => Promise<boolean>
  deletePromo: (id: string) => Promise<boolean>
  toggleActive: (id: string) => Promise<boolean>
  getApplicablePromos: (guest?: Guest | null) => Promotion[]
}

export function usePromotions(): UsePromotionsReturn {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const { user, isDemoMode } = useAuth()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  useEffect(() => {
    if (isDemoMode) {
      setPromotions(DEMO_PROMOTIONS)
      setLoading(false)
      return
    }

    if (!user || !supabase) {
      setLoading(false)
      return
    }

    const fetch = async () => {
      const { data } = await supabase
        .from('promotions')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })

      if (data) setPromotions(data)
      setLoading(false)
    }

    fetch()
  }, [user, isDemoMode, supabase])

  const activePromos = useMemo(() => {
    const now = new Date()
    return promotions.filter(p => {
      if (!p.is_active) return false
      if (p.valid_from && new Date(p.valid_from) > now) return false
      if (p.valid_until && new Date(p.valid_until) < now) return false
      if (p.max_uses && p.usage_count >= p.max_uses) return false
      return true
    })
  }, [promotions])

  const createPromo = useCallback(async (promo: { name: string; type: PromoType; rules: PromoRules; max_uses?: number | null }): Promise<boolean> => {
    if (isDemoMode) {
      const newPromo: Promotion = {
        id: `demo-promo-${Date.now()}`,
        profile_id: 'demo',
        name: promo.name,
        type: promo.type,
        rules: promo.rules,
        is_active: true,
        valid_from: null,
        valid_until: null,
        usage_count: 0,
        max_uses: promo.max_uses || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setPromotions(prev => [newPromo, ...prev])
      return true
    }

    if (!user || !supabase) return false

    const { data, error } = await supabase
      .from('promotions')
      .insert({
        profile_id: user.id,
        name: promo.name,
        type: promo.type,
        rules: promo.rules,
        max_uses: promo.max_uses || null,
      })
      .select()
      .single()

    if (error) return false
    setPromotions(prev => [data, ...prev])
    return true
  }, [user, isDemoMode, supabase])

  const updatePromo = useCallback(async (id: string, updates: Partial<Promotion>): Promise<boolean> => {
    if (isDemoMode) {
      setPromotions(prev => prev.map(p =>
        p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
      ))
      return true
    }

    if (!user || !supabase) return false

    const { error } = await supabase
      .from('promotions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('profile_id', user.id)

    if (error) return false
    setPromotions(prev => prev.map(p =>
      p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
    ))
    return true
  }, [user, isDemoMode, supabase])

  const deletePromo = useCallback(async (id: string): Promise<boolean> => {
    if (isDemoMode) {
      setPromotions(prev => prev.filter(p => p.id !== id))
      return true
    }

    if (!user || !supabase) return false

    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id)
      .eq('profile_id', user.id)

    if (error) return false
    setPromotions(prev => prev.filter(p => p.id !== id))
    return true
  }, [user, isDemoMode, supabase])

  const toggleActive = useCallback(async (id: string): Promise<boolean> => {
    const promo = promotions.find(p => p.id === id)
    if (!promo) return false
    return updatePromo(id, { is_active: !promo.is_active })
  }, [promotions, updatePromo])

  const getApplicablePromos = useCallback((guest?: Guest | null): Promotion[] => {
    const now = new Date()
    const hour = now.getHours()
    const dayOfWeek = now.getDay()

    return activePromos.filter(promo => {
      switch (promo.type) {
        case 'happy_hour':
          return hour >= (promo.rules.start_hour || 0) && hour < (promo.rules.end_hour || 24)
        case 'nth_free':
          return guest ? (guest.visit_count + 1) % (promo.rules.nth_visit || 5) === 0 : false
        case 'birthday':
          return false // Needs guest birthday field
        case 'custom_discount':
          if (promo.rules.days_of_week && !promo.rules.days_of_week.includes(dayOfWeek)) return false
          return true
        default:
          return true
      }
    })
  }, [activePromos])

  return {
    promotions,
    activePromos,
    loading,
    createPromo,
    updatePromo,
    deletePromo,
    toggleActive,
    getApplicablePromos,
  }
}
