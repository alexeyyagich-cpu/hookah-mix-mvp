'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/AuthContext'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import type { OrgMember, InviteToken, OrgRole } from '@/types/database'

// Demo team members for presentation
const D = 24 * 60 * 60 * 1000
const DEMO_MEMBERS: OrgMember[] = [
  {
    id: 'demo-member-owner',
    organization_id: 'demo-org-id',
    location_id: null,
    user_id: 'demo-user-id',
    role: 'owner',
    display_name: 'Demo User',
    is_active: true,
    created_at: new Date(Date.now() - 90 * D).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-member-1',
    organization_id: 'demo-org-id',
    location_id: 'demo-location-id',
    user_id: 'demo-staff-1',
    role: 'hookah_master',
    display_name: 'Marek Zielinski',
    is_active: true,
    created_at: new Date(Date.now() - 45 * D).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-member-2',
    organization_id: 'demo-org-id',
    location_id: 'demo-location-id',
    user_id: 'demo-staff-2',
    role: 'bartender',
    display_name: 'Laura Fischer',
    is_active: true,
    created_at: new Date(Date.now() - 30 * D).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-member-3',
    organization_id: 'demo-org-id',
    location_id: 'demo-location-id',
    user_id: 'demo-staff-3',
    role: 'manager',
    display_name: 'Oksana Koval',
    is_active: true,
    created_at: new Date(Date.now() - 14 * D).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-member-4',
    organization_id: 'demo-org-id',
    location_id: 'demo-location-id',
    user_id: 'demo-staff-4',
    role: 'cook',
    display_name: 'Tomasz Nowak',
    is_active: true,
    created_at: new Date(Date.now() - 5 * D).toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const DEMO_INVITATIONS: InviteToken[] = [
  {
    id: 'demo-inv-1',
    organization_id: 'demo-org-id',
    location_id: 'demo-location-id',
    email: 'new.bartender@example.com',
    role: 'bartender',
    token: 'demo-token-123',
    invited_by: 'demo-user-id',
    expires_at: new Date(Date.now() + 5 * D).toISOString(),
    accepted_at: null,
    accepted_by: null,
    created_at: new Date(Date.now() - 2 * D).toISOString(),
  },
]

export interface UseTeamReturn {
  /** All org members (excluding current user) */
  members: OrgMember[]
  /** Pending invite tokens */
  invitations: InviteToken[]
  loading: boolean
  error: string | null
  inviteMember: (email: string, role: OrgRole, locationId?: string | null) => Promise<{ success: boolean; error?: string }>
  removeMember: (memberId: string) => Promise<{ success: boolean; error?: string }>
  updateMemberRole: (memberId: string, newRole: OrgRole) => Promise<{ success: boolean; error?: string }>
  cancelInvitation: (invitationId: string) => Promise<{ success: boolean; error?: string }>
  resendInvitation: (invitationId: string) => Promise<{ success: boolean; error?: string }>
  refresh: () => Promise<void>
  // Legacy compat aliases
  staff: OrgMember[]
  inviteStaff: (email: string) => Promise<{ success: boolean; error?: string }>
  removeStaff: (staffId: string) => Promise<{ success: boolean; error?: string }>
}

export function useTeam(): UseTeamReturn {
  const { user, isDemoMode } = useAuth()
  const { organizationId } = useOrganizationContext()
  const [members, setMembers] = useState<OrgMember[]>([])
  const [invitations, setInvitations] = useState<InviteToken[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const loadTeam = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    // Demo mode
    if (isDemoMode) {
      setMembers(DEMO_MEMBERS.filter(m => m.user_id !== 'demo-user-id'))
      setInvitations(DEMO_INVITATIONS)
      setLoading(false)
      return
    }

    if (!organizationId) {
      // Legacy mode — no org yet
      setMembers([])
      setInvitations([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Load org members (excluding current user)
      const { data: memberData, error: memberErr } = await supabase
        .from('org_members')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .neq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (memberErr) throw memberErr

      // Load pending invitations
      const { data: invData, error: invErr } = await supabase
        .from('invite_tokens')
        .select('*')
        .eq('organization_id', organizationId)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (invErr) throw invErr

      setMembers((memberData || []) as OrgMember[])
      setInvitations((invData || []) as InviteToken[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team')
    } finally {
      setLoading(false)
    }
  }, [user, isDemoMode, organizationId, supabase])

  useEffect(() => {
    loadTeam()
  }, [loadTeam])

  const inviteMember = async (
    email: string,
    role: OrgRole,
    locationId?: string | null
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user || !organizationId) return { success: false, error: 'Not authenticated' }

    // Demo mode
    if (isDemoMode) {
      const newInvitation: InviteToken = {
        id: `demo-inv-${Date.now()}`,
        organization_id: 'demo-org-id',
        location_id: locationId || 'demo-location-id',
        email,
        role,
        token: `demo-token-${Date.now()}`,
        invited_by: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        accepted_at: null,
        accepted_by: null,
        created_at: new Date().toISOString(),
      }
      setInvitations(prev => [newInvitation, ...prev])
      return { success: true }
    }

    try {
      // Check if already invited
      const { data: existing } = await supabase
        .from('invite_tokens')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('email', email.toLowerCase())
        .is('accepted_at', null)
        .single()

      if (existing) {
        return { success: false, error: 'Приглашение уже отправлено' }
      }

      // Insert invite token
      const { error } = await supabase
        .from('invite_tokens')
        .insert({
          organization_id: organizationId,
          location_id: locationId || null,
          email: email.toLowerCase(),
          role,
          invited_by: user.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })

      if (error) throw error

      // Send invite email via API
      try {
        await fetch('/api/invite/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.toLowerCase(), role, organizationId }),
        })
      } catch {
        // Email sending is best-effort — invite still created
      }

      await loadTeam()
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to invite' }
    }
  }

  const removeMember = async (memberId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !organizationId) return { success: false, error: 'Not authenticated' }

    // Demo mode
    if (isDemoMode) {
      setMembers(prev => prev.filter(m => m.id !== memberId))
      return { success: true }
    }

    try {
      // Deactivate member (soft delete)
      const { error } = await supabase
        .from('org_members')
        .update({ is_active: false })
        .eq('id', memberId)
        .eq('organization_id', organizationId)

      if (error) throw error

      await loadTeam()
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to remove' }
    }
  }

  const updateMemberRole = async (memberId: string, newRole: OrgRole): Promise<{ success: boolean; error?: string }> => {
    if (!user || !organizationId) return { success: false, error: 'Not authenticated' }

    if (isDemoMode) {
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m))
      return { success: true }
    }

    try {
      const { error } = await supabase
        .from('org_members')
        .update({ role: newRole })
        .eq('id', memberId)
        .eq('organization_id', organizationId)

      if (error) throw error

      await loadTeam()
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update role' }
    }
  }

  const cancelInvitation = async (invitationId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !organizationId) return { success: false, error: 'Not authenticated' }

    // Demo mode
    if (isDemoMode) {
      setInvitations(prev => prev.filter(i => i.id !== invitationId))
      return { success: true }
    }

    try {
      const { error } = await supabase
        .from('invite_tokens')
        .delete()
        .eq('id', invitationId)
        .eq('organization_id', organizationId)

      if (error) throw error

      await loadTeam()
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to cancel' }
    }
  }

  const resendInvitation = async (invitationId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !organizationId) return { success: false, error: 'Not authenticated' }

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
        .from('invite_tokens')
        .update({
          token: crypto.randomUUID(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', invitationId)
        .eq('organization_id', organizationId)

      if (error) throw error

      await loadTeam()
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to resend' }
    }
  }

  return {
    members,
    invitations,
    loading,
    error,
    inviteMember,
    removeMember,
    updateMemberRole,
    cancelInvitation,
    resendInvitation,
    refresh: loadTeam,
    // Legacy compat aliases
    staff: members,
    inviteStaff: (email: string) => inviteMember(email, 'hookah_master'),
    removeStaff: removeMember,
  }
}
