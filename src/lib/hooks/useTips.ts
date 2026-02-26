'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useAuth } from '@/lib/AuthContext'
import type { StaffProfile, Tip } from '@/types/database'

const DEMO_STAFF: StaffProfile[] = [
  {
    id: 'sp1',
    profile_id: 'demo',
    org_member_id: 'm1',
    display_name: 'Alex',
    photo_url: null,
    tip_slug: 'alex-demo',
    is_tip_enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sp2',
    profile_id: 'demo',
    org_member_id: 'm2',
    display_name: 'Maria',
    photo_url: null,
    tip_slug: 'maria-demo',
    is_tip_enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const D = 24 * 60 * 60 * 1000
const DEMO_TIPS: Tip[] = [
  {
    id: 't1', staff_profile_id: 'sp1', amount: 5, currency: 'EUR',
    stripe_payment_intent_id: null, status: 'completed',
    payer_name: 'John', message: 'Great service!',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 't2', staff_profile_id: 'sp1', amount: 10, currency: 'EUR',
    stripe_payment_intent_id: null, status: 'completed',
    payer_name: null, message: null,
    created_at: new Date(Date.now() - 1 * D).toISOString(),
  },
  {
    id: 't3', staff_profile_id: 'sp2', amount: 8, currency: 'EUR',
    stripe_payment_intent_id: null, status: 'completed',
    payer_name: 'Anna', message: 'Amazing cocktails, thank you!',
    created_at: new Date(Date.now() - 1 * D - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 't4', staff_profile_id: 'sp2', amount: 5, currency: 'EUR',
    stripe_payment_intent_id: null, status: 'completed',
    payer_name: 'Max', message: null,
    created_at: new Date(Date.now() - 2 * D).toISOString(),
  },
  {
    id: 't5', staff_profile_id: 'sp1', amount: 15, currency: 'EUR',
    stripe_payment_intent_id: null, status: 'completed',
    payer_name: 'Tomasz K.', message: 'VIP service, perfect evening!',
    created_at: new Date(Date.now() - 3 * D).toISOString(),
  },
  {
    id: 't6', staff_profile_id: 'sp2', amount: 3, currency: 'EUR',
    stripe_payment_intent_id: null, status: 'completed',
    payer_name: null, message: null,
    created_at: new Date(Date.now() - 4 * D).toISOString(),
  },
]

interface UseTipsReturn {
  staffProfiles: StaffProfile[]
  tips: Tip[]
  loading: boolean
  createStaffProfile: (memberId: string, displayName: string) => Promise<StaffProfile | null>
  updateStaffProfile: (id: string, updates: Partial<StaffProfile>) => Promise<boolean>
  toggleTipEnabled: (id: string) => Promise<boolean>
  getTipsForStaff: (staffProfileId: string) => Tip[]
  getTipStats: (staffProfileId: string) => { total: number; count: number; avgTip: number }
}

export function useTips(): UseTipsReturn {
  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>([])
  const [tips, setTips] = useState<Tip[]>([])
  const [loading, setLoading] = useState(true)
  const { user, isDemoMode } = useAuth()
  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  useEffect(() => {
    if (isDemoMode) {
      setStaffProfiles(DEMO_STAFF)
      setTips(DEMO_TIPS)
      setLoading(false)
      return
    }

    if (!user || !supabase) {
      setLoading(false)
      return
    }

    const fetch = async () => {
      const [{ data: profiles }, { data: tipsData }] = await Promise.all([
        supabase.from('staff_profiles').select('id, profile_id, org_member_id, display_name, photo_url, tip_slug, is_tip_enabled, created_at, updated_at').eq('profile_id', user.id),
        supabase.from('tips').select('id, staff_profile_id, amount, currency, stripe_payment_intent_id, status, payer_name, message, created_at').in(
          'staff_profile_id',
          (await supabase.from('staff_profiles').select('id').eq('profile_id', user.id)).data?.map(p => p.id) || []
        ).order('created_at', { ascending: false }).limit(100),
      ])

      if (profiles) setStaffProfiles(profiles)
      if (tipsData) setTips(tipsData)
      setLoading(false)
    }

    fetch()
  }, [user, isDemoMode, supabase])

  const createStaffProfile = useCallback(async (memberId: string, displayName: string): Promise<StaffProfile | null> => {
    const slug = displayName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-' + Math.random().toString(36).slice(2, 6)

    if (isDemoMode) {
      const profile: StaffProfile = {
        id: `demo-sp-${Date.now()}`,
        profile_id: 'demo',
        org_member_id: memberId,
        display_name: displayName,
        photo_url: null,
        tip_slug: slug,
        is_tip_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setStaffProfiles(prev => [...prev, profile])
      return profile
    }

    if (!user || !supabase) return null

    const { data, error } = await supabase
      .from('staff_profiles')
      .insert({
        profile_id: user.id,
        org_member_id: memberId,
        display_name: displayName,
        tip_slug: slug,
      })
      .select()
      .single()

    if (error) return null
    setStaffProfiles(prev => [...prev, data])
    return data
  }, [user, isDemoMode, supabase])

  const updateStaffProfile = useCallback(async (id: string, updates: Partial<StaffProfile>): Promise<boolean> => {
    if (isDemoMode) {
      setStaffProfiles(prev => prev.map(p =>
        p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
      ))
      return true
    }

    if (!user || !supabase) return false

    const { error } = await supabase
      .from('staff_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return false
    setStaffProfiles(prev => prev.map(p =>
      p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
    ))
    return true
  }, [user, isDemoMode, supabase])

  const toggleTipEnabled = useCallback(async (id: string): Promise<boolean> => {
    const profile = staffProfiles.find(p => p.id === id)
    if (!profile) return false
    return updateStaffProfile(id, { is_tip_enabled: !profile.is_tip_enabled })
  }, [staffProfiles, updateStaffProfile])

  const getTipsForStaff = useCallback((staffProfileId: string): Tip[] => {
    return tips.filter(t => t.staff_profile_id === staffProfileId)
  }, [tips])

  const getTipStats = useCallback((staffProfileId: string) => {
    const staffTips = tips.filter(t => t.staff_profile_id === staffProfileId && t.status === 'completed')
    const total = staffTips.reduce((s, t) => s + t.amount, 0)
    return {
      total,
      count: staffTips.length,
      avgTip: staffTips.length > 0 ? total / staffTips.length : 0,
    }
  }, [tips])

  return {
    staffProfiles,
    tips,
    loading,
    createStaffProfile,
    updateStaffProfile,
    toggleTipEnabled,
    getTipsForStaff,
    getTipStats,
  }
}
