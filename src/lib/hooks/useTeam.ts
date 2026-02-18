'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/AuthContext'
import type { Profile, StaffInvitation } from '@/types/database'

// Demo staff for testing
const DEMO_STAFF: Profile[] = [
  {
    id: 'demo-staff-1',
    business_name: null,
    owner_name: 'Marek Zielinski',
    phone: '+48 512 345 678',
    address: null,
    logo_url: null,
    subscription_tier: 'free',
    subscription_expires_at: null,
    role: 'staff',
    owner_profile_id: 'demo-user-id',
    venue_slug: null,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    onboarding_completed: true,
    onboarding_skipped: false,
    onboarding_step: null,
    active_modules: ['hookah'],
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-staff-2',
    business_name: null,
    owner_name: 'Laura Fischer',
    phone: '+49 170 987 6543',
    address: null,
    logo_url: null,
    subscription_tier: 'free',
    subscription_expires_at: null,
    role: 'staff',
    owner_profile_id: 'demo-user-id',
    venue_slug: null,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    onboarding_completed: true,
    onboarding_skipped: false,
    onboarding_step: null,
    active_modules: ['hookah'],
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

const DEMO_INVITATIONS: StaffInvitation[] = [
  {
    id: 'demo-inv-1',
    owner_profile_id: 'demo-user-id',
    email: 'new.staff@example.com',
    token: 'demo-token-123',
    role: 'staff',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    accepted_at: null,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export interface UseTeamReturn {
  staff: Profile[]
  invitations: StaffInvitation[]
  loading: boolean
  error: string | null
  inviteStaff: (email: string) => Promise<{ success: boolean; error?: string }>
  removeStaff: (staffId: string) => Promise<{ success: boolean; error?: string }>
  cancelInvitation: (invitationId: string) => Promise<{ success: boolean; error?: string }>
  resendInvitation: (invitationId: string) => Promise<{ success: boolean; error?: string }>
  refresh: () => Promise<void>
}

export function useTeam(): UseTeamReturn {
  const { user, profile, isDemoMode } = useAuth()
  const [staff, setStaff] = useState<Profile[]>([])
  const [invitations, setInvitations] = useState<StaffInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const loadTeam = useCallback(async () => {
    if (!user || !profile) {
      setLoading(false)
      return
    }

    // Demo mode
    if (isDemoMode) {
      setStaff(DEMO_STAFF)
      setInvitations(DEMO_INVITATIONS)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Load staff members (profiles with owner_profile_id = current user)
      const { data: staffData, error: staffError } = await supabase
        .from('profiles')
        .select('*')
        .eq('owner_profile_id', user.id)
        .eq('role', 'staff')
        .order('created_at', { ascending: false })

      if (staffError) throw staffError

      // Load pending invitations
      const { data: invData, error: invError } = await supabase
        .from('staff_invitations')
        .select('*')
        .eq('owner_profile_id', user.id)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (invError) throw invError

      setStaff(staffData || [])
      setInvitations(invData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team')
    } finally {
      setLoading(false)
    }
  }, [user, profile, isDemoMode, supabase])

  useEffect(() => {
    loadTeam()
  }, [loadTeam])

  const inviteStaff = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' }

    // Demo mode
    if (isDemoMode) {
      const newInvitation: StaffInvitation = {
        id: `demo-inv-${Date.now()}`,
        owner_profile_id: user.id,
        email,
        token: `demo-token-${Date.now()}`,
        role: 'staff',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        accepted_at: null,
        created_at: new Date().toISOString(),
      }
      setInvitations(prev => [newInvitation, ...prev])
      return { success: true }
    }

    try {
      // Check if already invited
      const { data: existing } = await supabase
        .from('staff_invitations')
        .select('id')
        .eq('owner_profile_id', user.id)
        .eq('email', email.toLowerCase())
        .is('accepted_at', null)
        .single()

      if (existing) {
        return { success: false, error: 'Приглашение уже отправлено' }
      }

      // Check if already staff
      const { data: existingStaff } = await supabase
        .from('profiles')
        .select('id')
        .eq('owner_profile_id', user.id)
        .eq('role', 'staff')
        // In production, would also check by email
        .single()

      if (existingStaff) {
        return { success: false, error: 'Пользователь уже в команде' }
      }

      // Generate invite token
      const token = crypto.randomUUID()

      const { error } = await supabase
        .from('staff_invitations')
        .insert({
          owner_profile_id: user.id,
          email: email.toLowerCase(),
          token,
          role: 'staff',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })

      if (error) throw error

      // In production, would send email here
      await loadTeam()
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to invite' }
    }
  }

  const removeStaff = async (staffId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' }

    // Demo mode
    if (isDemoMode) {
      setStaff(prev => prev.filter(s => s.id !== staffId))
      return { success: true }
    }

    try {
      // Remove owner_profile_id reference (don't delete the profile)
      const { error } = await supabase
        .from('profiles')
        .update({ owner_profile_id: null, role: 'owner' })
        .eq('id', staffId)
        .eq('owner_profile_id', user.id)

      if (error) throw error

      await loadTeam()
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to remove' }
    }
  }

  const cancelInvitation = async (invitationId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' }

    // Demo mode
    if (isDemoMode) {
      setInvitations(prev => prev.filter(i => i.id !== invitationId))
      return { success: true }
    }

    try {
      const { error } = await supabase
        .from('staff_invitations')
        .delete()
        .eq('id', invitationId)
        .eq('owner_profile_id', user.id)

      if (error) throw error

      await loadTeam()
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to cancel' }
    }
  }

  const resendInvitation = async (invitationId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' }

    // Demo mode
    if (isDemoMode) {
      setInvitations(prev =>
        prev.map(i =>
          i.id === invitationId
            ? { ...i, expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }
            : i
        )
      )
      return { success: true }
    }

    try {
      const { error } = await supabase
        .from('staff_invitations')
        .update({
          token: crypto.randomUUID(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', invitationId)
        .eq('owner_profile_id', user.id)

      if (error) throw error

      // In production, would resend email here
      await loadTeam()
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to resend' }
    }
  }

  return {
    staff,
    invitations,
    loading,
    error,
    inviteStaff,
    removeStaff,
    cancelInvitation,
    resendInvitation,
    refresh: loadTeam,
  }
}
