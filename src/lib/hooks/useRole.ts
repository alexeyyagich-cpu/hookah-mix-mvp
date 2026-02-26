'use client'

import { useMemo } from 'react'
import { useAuth } from '@/lib/AuthContext'
import type { OrgRole } from '@/types/database'

// Permission definitions for each feature
export type Permission =
  | 'dashboard.view'
  | 'inventory.view'
  | 'inventory.edit'
  | 'sessions.view'
  | 'sessions.create'
  | 'statistics.view'
  | 'marketplace.view'
  | 'marketplace.order'
  | 'settings.view'
  | 'settings.edit'
  | 'team.view'
  | 'team.manage'
  | 'billing.view'
  | 'guests.view'
  | 'guests.manage'
  | 'bowls.view'
  | 'bowls.edit'
  | 'bar.view'
  | 'bar.edit'
  | 'bar.sales'
  | 'kds.hookah'
  | 'kds.bar'
  | 'kds.kitchen'
  | 'floor.view'
  | 'floor.edit'
  | 'pos.view'
  | 'reviews.view'
  | 'reservations.view'

// Org-role-based permissions matrix (5 granular roles)
const ORG_ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = {
  owner: [
    'dashboard.view',
    'inventory.view', 'inventory.edit',
    'sessions.view', 'sessions.create',
    'statistics.view',
    'marketplace.view', 'marketplace.order',
    'settings.view', 'settings.edit',
    'team.view', 'team.manage',
    'billing.view',
    'guests.view', 'guests.manage',
    'bowls.view', 'bowls.edit',
    'bar.view', 'bar.edit', 'bar.sales',
    'kds.hookah', 'kds.bar', 'kds.kitchen',
    'floor.view', 'floor.edit',
    'pos.view',
    'reviews.view', 'reservations.view',
  ],
  manager: [
    'dashboard.view',
    'inventory.view', 'inventory.edit',
    'sessions.view', 'sessions.create',
    'statistics.view',
    'marketplace.view', 'marketplace.order',
    'guests.view', 'guests.manage',
    'bowls.view', 'bowls.edit',
    'bar.view', 'bar.edit', 'bar.sales',
    'kds.hookah', 'kds.bar', 'kds.kitchen',
    'floor.view', 'floor.edit',
    'pos.view',
    'reviews.view', 'reservations.view',
  ],
  hookah_master: [
    'dashboard.view',
    'inventory.view',
    'sessions.view', 'sessions.create',
    'guests.view', 'guests.manage',
    'bowls.view',
    'kds.hookah',
    'floor.view',
    'reviews.view', 'reservations.view',
  ],
  bartender: [
    'dashboard.view',
    'bar.view', 'bar.sales',
    'kds.bar',
    'floor.view',
  ],
  cook: [
    'kds.kitchen',
    'dashboard.view',
  ],
}

// Fallback: map legacy profile.role to OrgRole for users not yet in an org
const LEGACY_ROLE_FALLBACK: Record<string, OrgRole> = {
  owner: 'owner',
  staff: 'hookah_master',
  guest: 'cook',
}

export interface UseRoleReturn {
  orgRole: OrgRole
  isOwner: boolean
  isManager: boolean
  isHookahMaster: boolean
  isBartender: boolean
  isCook: boolean
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
  canEditInventory: boolean
  canViewStatistics: boolean
  canManageTeam: boolean
  canAccessMarketplace: boolean
}

/**
 * useRole reads the user's org role and computes permissions.
 *
 * Accepts orgRole from useOrganizationContext(). Falls back to legacy
 * profile.role mapping for users not yet in an organization.
 */
export function useRole(orgRoleOverride?: OrgRole | null): UseRoleReturn {
  const { profile } = useAuth()

  const orgRole: OrgRole = orgRoleOverride
    || LEGACY_ROLE_FALLBACK[profile?.role || 'guest']
    || 'cook'

  const permissions = useMemo(() => {
    return new Set(ORG_ROLE_PERMISSIONS[orgRole])
  }, [orgRole])

  const hasPermission = (permission: Permission): boolean => {
    return permissions.has(permission)
  }

  const hasAnyPermission = (perms: Permission[]): boolean => {
    return perms.some(p => permissions.has(p))
  }

  const hasAllPermissions = (perms: Permission[]): boolean => {
    return perms.every(p => permissions.has(p))
  }

  return {
    orgRole,
    isOwner: orgRole === 'owner',
    isManager: orgRole === 'manager',
    isHookahMaster: orgRole === 'hookah_master',
    isBartender: orgRole === 'bartender',
    isCook: orgRole === 'cook',
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canEditInventory: hasPermission('inventory.edit'),
    canViewStatistics: hasPermission('statistics.view'),
    canManageTeam: hasPermission('team.manage'),
    canAccessMarketplace: hasPermission('marketplace.view'),
  }
}

export const ORG_ROLE_LABELS: Record<OrgRole, { label: string; en: string; de: string; emoji: string }> = {
  owner: { label: 'Owner', en: 'Owner', de: 'Inhaber', emoji: '👑' },
  manager: { label: 'Manager', en: 'Manager', de: 'Manager', emoji: '📋' },
  hookah_master: { label: 'Hookah Master', en: 'Hookah Master', de: 'Shisha-Meister', emoji: '🔥' },
  bartender: { label: 'Bartender', en: 'Bartender', de: 'Barkeeper', emoji: '🍸' },
  cook: { label: 'Chef', en: 'Chef', de: 'Koch', emoji: '👨‍🍳' },
}
