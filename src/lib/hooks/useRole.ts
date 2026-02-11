'use client'

import { useMemo } from 'react'
import { useAuth } from '@/lib/AuthContext'
import type { UserRole } from '@/types/database'

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
  | 'guests.view'
  | 'guests.manage'
  | 'bowls.view'
  | 'bowls.edit'

// Role-based permissions matrix
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    'dashboard.view',
    'inventory.view',
    'inventory.edit',
    'sessions.view',
    'sessions.create',
    'statistics.view',
    'marketplace.view',
    'marketplace.order',
    'settings.view',
    'settings.edit',
    'team.view',
    'team.manage',
    'guests.view',
    'guests.manage',
    'bowls.view',
    'bowls.edit',
  ],
  staff: [
    'dashboard.view',
    'inventory.view',
    // inventory.edit - NO
    'sessions.view',
    'sessions.create',
    // statistics.view - NO
    // marketplace - NO
    // settings - NO
    // team - NO
    'guests.view',
    'guests.manage',
    'bowls.view',
    // bowls.edit - NO
  ],
  guest: [
    // Guests only access menu via /menu/[slug]
    // No dashboard permissions
  ],
}

// Navigation items configuration for each role
export interface NavItem {
  name: string
  href: string
  icon: string // Icon name reference
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
  role: UserRole
  isOwner: boolean
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

export function useRole(): UseRoleReturn {
  const { profile } = useAuth()

  const role: UserRole = profile?.role || 'guest'

  const permissions = useMemo(() => {
    return new Set(ROLE_PERMISSIONS[role])
  }, [role])

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
    role,
    isOwner: role === 'owner',
    isStaff: role === 'staff',
    isGuest: role === 'guest',
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    allowedNavItems,
    // Convenience shortcuts
    canEditInventory: hasPermission('inventory.edit'),
    canViewStatistics: hasPermission('statistics.view'),
    canManageTeam: hasPermission('team.manage'),
    canAccessMarketplace: hasPermission('marketplace.view'),
  }
}

// Role display labels
export const ROLE_LABELS: Record<UserRole, { ru: string; emoji: string }> = {
  owner: { ru: 'Владелец', emoji: '👑' },
  staff: { ru: 'Кальянщик', emoji: '🔥' },
  guest: { ru: 'Гость', emoji: '👤' },
}
