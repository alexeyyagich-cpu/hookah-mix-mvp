'use client'

import { useMemo } from 'react'
import { useAuth } from '@/lib/AuthContext'
import type { OrgRole, UserRole } from '@/types/database'

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

// New org-role-based permissions matrix (5 granular roles)
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
  ],
}

// Legacy role mapping (backward compat during migration)
const LEGACY_ROLE_TO_ORG: Record<UserRole, OrgRole> = {
  owner: 'owner',
  staff: 'hookah_master',
  guest: 'cook', // guests get minimal permissions in dashboard context
}

// Navigation items configuration for each role
export interface NavItem {
  name: string
  href: string
  icon: string
  permission: Permission
}

export const NAV_ITEMS: NavItem[] = [
  { name: 'Обзор', href: '/dashboard', icon: 'dashboard', permission: 'dashboard.view' },
  { name: 'Инвентарь', href: '/inventory', icon: 'inventory', permission: 'inventory.view' },
  { name: 'Маркетплейс', href: '/marketplace', icon: 'shop', permission: 'marketplace.view' },
  { name: 'Чаши', href: '/bowls', icon: 'bowl', permission: 'bowls.view' },
  { name: 'Сессии', href: '/sessions', icon: 'session', permission: 'sessions.view' },
  { name: 'Статистика', href: '/statistics', icon: 'chart', permission: 'statistics.view' },
  { name: 'Команда', href: '/settings/team', icon: 'team', permission: 'team.view' },
  { name: 'Настройки', href: '/settings', icon: 'settings', permission: 'settings.view' },
]

export interface UseRoleReturn {
  /** Legacy role from profiles (backward compat) */
  role: UserRole
  /** New org role from org_members */
  orgRole: OrgRole
  isOwner: boolean
  isManager: boolean
  isHookahMaster: boolean
  isBartender: boolean
  isCook: boolean
  isStaff: boolean
  isGuest: boolean
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
  allowedNavItems: NavItem[]
  canEditInventory: boolean
  canViewStatistics: boolean
  canManageTeam: boolean
  canAccessMarketplace: boolean
}

/**
 * useRole reads the user's role and computes permissions.
 *
 * During migration: reads from profile.role and maps to OrgRole via LEGACY_ROLE_TO_ORG.
 * After migration: will read directly from org_members via useOrganizationContext.
 *
 * Accepts an optional orgRole override for when useOrganization data is available.
 */
export function useRole(orgRoleOverride?: OrgRole | null): UseRoleReturn {
  const { profile } = useAuth()

  const legacyRole: UserRole = profile?.role || 'guest'

  // Use orgRole from org_members if available, otherwise map from legacy role
  const orgRole: OrgRole = orgRoleOverride || LEGACY_ROLE_TO_ORG[legacyRole]

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

  const allowedNavItems = useMemo(() => {
    return NAV_ITEMS.filter(item => permissions.has(item.permission))
  }, [permissions])

  return {
    role: legacyRole,
    orgRole,
    isOwner: orgRole === 'owner',
    isManager: orgRole === 'manager',
    isHookahMaster: orgRole === 'hookah_master',
    isBartender: orgRole === 'bartender',
    isCook: orgRole === 'cook',
    isStaff: legacyRole === 'staff',
    isGuest: legacyRole === 'guest',
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    allowedNavItems,
    canEditInventory: hasPermission('inventory.edit'),
    canViewStatistics: hasPermission('statistics.view'),
    canManageTeam: hasPermission('team.manage'),
    canAccessMarketplace: hasPermission('marketplace.view'),
  }
}

// Role display labels — supports both legacy and new org roles
export const ROLE_LABELS: Record<UserRole, { ru: string; emoji: string }> = {
  owner: { ru: 'Владелец', emoji: '👑' },
  staff: { ru: 'Кальянщик', emoji: '🔥' },
  guest: { ru: 'Гость', emoji: '👤' },
}

export const ORG_ROLE_LABELS: Record<OrgRole, { ru: string; en: string; de: string; emoji: string }> = {
  owner: { ru: 'Владелец', en: 'Owner', de: 'Inhaber', emoji: '👑' },
  manager: { ru: 'Менеджер', en: 'Manager', de: 'Manager', emoji: '📋' },
  hookah_master: { ru: 'Кальянщик', en: 'Hookah Master', de: 'Shisha-Meister', emoji: '🔥' },
  bartender: { ru: 'Бармен', en: 'Bartender', de: 'Barkeeper', emoji: '🍸' },
  cook: { ru: 'Повар', en: 'Cook', de: 'Koch', emoji: '👨‍🍳' },
}
