'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { useModules } from '@/lib/hooks/useModules'
import { useRole, ORG_ROLE_LABELS, type Permission } from '@/lib/hooks/useRole'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import { useSidebarBadges } from '@/lib/SidebarBadgeContext'
import { useTranslation, useLocale } from '@/lib/i18n'
import type { AppModule } from '@/types/database'
import {
  IconDashboard,
  IconInventory,
  IconBowl,
  IconSession,
  IconChart,
  IconSettings,
  IconCalculator,
  IconLogout,
  IconFloor,
  IconLock,
  IconUsers,
  IconStar,
  IconBar,
  IconCocktail,
  IconMenuList,
  IconCoin,
  IconTrendUp,
  IconTimer,
  IconPercent,
  IconCrown,
  IconWaiter,
} from '@/components/Icons'

interface NavItem {
  name: string
  href: string
  Icon: React.ComponentType<{ size?: number }>
  permission: Permission | Permission[]
  proOnly?: boolean
  ownerOnly?: boolean
  module?: AppModule
}

interface NavGroup {
  label: string | null // null = no header
  module?: AppModule // hide entire group if module inactive
  items: NavItem[]
}

export function Sidebar() {
  const t = useTranslation('nav')
  const tc = useTranslation('common')
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { locale } = useLocale()
  const { profile, signOut, isSuperAdmin } = useAuth()
  const { tier, isTrialTier, isMultiTier, isEnterpriseTier, needsUpgrade } = useSubscription()
  const { organization, orgRole: contextOrgRole } = useOrganizationContext()
  const { orgRole, hasPermission, hasAnyPermission, isOwner } = useRole(contextOrgRole)
  const { modules } = useModules()
  const badges = useSidebarBadges()

  // Close mobile sidebar on Escape key
  useEffect(() => {
    if (!mobileOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen])

  // Swipe-to-close mobile sidebar
  const touchStartX = useRef(0)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    if (deltaX < -60) setMobileOpen(false)
  }, [])

  // Collapsible groups — persisted in localStorage (scoped to user)
  const sidebarKey = profile?.id ? `sidebar-collapsed-${profile.id}` : 'sidebar-collapsed'
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const stored = localStorage.getItem(sidebarKey)
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch { return new Set() }
  })

  // Re-sync when profile loads (initial render may not have user ID)
  useEffect(() => {
    if (!profile?.id) return
    try {
      const stored = localStorage.getItem(`sidebar-collapsed-${profile.id}`)
      if (stored) setCollapsedGroups(new Set(JSON.parse(stored)))
    } catch {}
  }, [profile?.id])

  const toggleGroup = useCallback((label: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      try { localStorage.setItem(sidebarKey, JSON.stringify([...next])) } catch {}
      return next
    })
  }, [sidebarKey])

  const navigationGroups: NavGroup[] = useMemo(() => [
    {
      label: null,
      items: [
        { name: t.overview, href: '/dashboard', Icon: IconDashboard, permission: 'dashboard.view' },
        { name: t.bossDashboard, href: '/boss', Icon: IconCrown, permission: 'dashboard.view', ownerOnly: true, proOnly: true },
      ],
    },
    {
      label: t.operationsGroup,
      items: [
        { name: t.floorPlan, href: '/floor', Icon: IconFloor, permission: 'floor.view' },
        { name: t.kdsOrders, href: '/kds', Icon: IconMenuList, permission: ['sessions.create', 'kds.kitchen'] },
        { name: t.waiter, href: '/waiter', Icon: IconWaiter, permission: 'sessions.create', proOnly: true },
        { name: t.shifts, href: '/shifts', Icon: IconTimer, permission: 'sessions.create' },
      ],
    },
    {
      label: t.hookahGroup,
      module: 'hookah',
      items: [
        { name: t.inventory, href: '/inventory', Icon: IconInventory, permission: 'inventory.view', module: 'hookah' },
        { name: t.bowls, href: '/bowls', Icon: IconBowl, permission: 'bowls.view', module: 'hookah' },
        { name: t.sessions, href: '/sessions', Icon: IconSession, permission: 'sessions.view', module: 'hookah' },
        { name: t.mixCalculator, href: '/mix', Icon: IconCalculator, permission: 'dashboard.view', module: 'hookah' },
      ],
    },
    {
      label: t.barGroup,
      module: 'bar',
      items: [
        { name: t.warehouse, href: '/bar/inventory', Icon: IconBar, permission: 'bar.view', module: 'bar' },
        { name: t.recipes, href: '/bar/recipes', Icon: IconCocktail, permission: 'bar.view', module: 'bar' },
        { name: t.menu, href: '/bar/menu', Icon: IconMenuList, permission: 'bar.view', module: 'bar' },
        { name: t.sales, href: '/bar/sales', Icon: IconCoin, permission: 'bar.sales', module: 'bar' },
      ],
    },
    {
      label: t.analyticsGroup,
      items: [
        { name: t.statistics, href: '/statistics', Icon: IconChart, permission: 'statistics.view' },
        { name: t.pnlReports, href: '/reports', Icon: IconTrendUp, permission: 'statistics.view' },
        { name: t.reviews, href: '/reviews', Icon: IconStar, permission: 'dashboard.view' },
      ],
    },
    {
      label: t.businessGroup,
      items: [
        { name: t.guestsCRM, href: '/guests', Icon: IconUsers, permission: 'sessions.view', proOnly: true },
        { name: t.promotions, href: '/promotions', Icon: IconPercent, permission: 'sessions.view', proOnly: true },
      ],
    },
    {
      label: t.settingsGroup,
      items: [
        { name: t.team, href: '/settings/team', Icon: IconUsers, permission: 'team.view' },
        { name: t.settings, href: '/settings', Icon: IconSettings, permission: 'settings.view' },
      ],
    },
    // Super-admin section — only visible to platform admins
    ...(isSuperAdmin ? [{
      label: t.adminGroup,
      items: [
        { name: t.adminDashboard, href: '/admin', Icon: IconCrown, permission: 'dashboard.view' as Permission },
        { name: t.adminOrganizations, href: '/admin/organizations', Icon: IconUsers, permission: 'dashboard.view' as Permission },
        { name: t.adminAnalytics, href: '/admin/analytics', Icon: IconChart, permission: 'dashboard.view' as Permission },
        { name: t.adminSystem, href: '/admin/system', Icon: IconSettings, permission: 'dashboard.view' as Permission },
      ],
    }] : []),
  ], [t, isSuperAdmin])

  // Build flat list of all items for active-state matching
  const allItems = useMemo(() => navigationGroups.flatMap(g => g.items), [navigationGroups])

  // Filter groups and items by role permissions and active modules
  const filteredGroups = useMemo(() => navigationGroups
    .filter(group => {
      // Hide entire group if its module is inactive
      if (group.module && !modules.includes(group.module)) return false
      return true
    })
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        const hasAccess = Array.isArray(item.permission)
          ? hasAnyPermission(item.permission)
          : hasPermission(item.permission)
        if (!hasAccess) return false
        if (item.module && !modules.includes(item.module)) return false
        if (item.ownerOnly && !isOwner) return false
        if (item.href === '/settings/team' && !isOwner) return false
        if (item.href === '/settings' && !hasPermission('settings.view')) return false
        return true
      }),
    }))
    .filter(group => group.items.length > 0),
  [navigationGroups, modules, hasPermission, hasAnyPermission, isOwner])

  const filteredGroupsRef = useRef(filteredGroups)
  filteredGroupsRef.current = filteredGroups

  // Auto-expand group if it contains the active page
  useEffect(() => {
    for (const group of filteredGroupsRef.current) {
      if (!group.label) continue
      const hasActive = group.items.some(item =>
        pathname === item.href || pathname.startsWith(item.href + '/')
      )
      if (hasActive && collapsedGroups.has(group.label)) {
        setCollapsedGroups(prev => {
          const next = new Set(prev)
          next.delete(group.label!)
          try { localStorage.setItem(sidebarKey, JSON.stringify([...next])) } catch {}
          return next
        })
      }
    }
  }, [pathname, collapsedGroups])

  const roleLabels = ORG_ROLE_LABELS[orgRole]
  const roleName = roleLabels ? (locale === 'de' ? roleLabels.de : roleLabels.label) : orgRole

  // Rendered as JSX variable (not a component) to preserve scroll position on re-render
  const navContent = (
    <>
      {/* Logo */}
      <div className="p-4 border-b border-[var(--color-border)]">
        <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              poster="/images/torus-logo.png"
              className="w-full h-full object-cover"
            >
              <source src="/images/logo-animated.mp4" type="video/mp4" />
            </video>
          </div>
          <div>
            <div className="font-bold">Hookah Torus</div>
            <div className="text-xs text-[var(--color-textMuted)]">{t.home}</div>
          </div>
        </Link>
      </div>

      {/* Business Info + Role */}
      <div className="p-4 border-b border-[var(--color-border)]">
        <div className="text-sm font-medium truncate">
          {organization?.name || profile?.business_name || t.defaultBusiness}
        </div>
        <div className="text-xs text-[var(--color-textMuted)] mt-1">
          {profile?.owner_name || t.defaultUser}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {/* Role badge */}
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border"
            style={{
              borderColor: isOwner ? 'var(--color-primary)' : 'var(--color-border)',
              color: isOwner ? 'var(--color-primary)' : 'var(--color-textMuted)',
              background: isOwner ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)' : 'transparent',
            }}
          >
            {roleLabels?.emoji} {roleName}
          </span>
          {/* Subscription badge - only for owners */}
          {isOwner && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${
              isTrialTier
                ? 'border-[var(--color-warning)]/40 text-[var(--color-warning)] bg-[var(--color-warning)]/10'
                : 'border-[var(--color-success)]/40 text-[var(--color-success)] bg-[var(--color-success)]/10'
            }`}>
              {tier.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Navigation - grouped by section */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {filteredGroups.map((group, gi) => {
          const isCollapsed = group.label ? collapsedGroups.has(group.label) : false
          return (
          <div key={group.label || gi}>
            {group.label && (
              <button
                type="button"
                onClick={() => toggleGroup(group.label!)}
                aria-expanded={!isCollapsed}
                className="w-full flex items-center justify-between px-4 pt-2 pb-1 text-[10px] font-semibold text-[var(--color-textMuted)] uppercase tracking-widest hover:text-[var(--color-text)] transition-colors"
              >
                {group.label}
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
            <div
              className="space-y-0.5 overflow-hidden transition-all duration-200"
              style={{ maxHeight: isCollapsed ? 0 : '500px', opacity: isCollapsed ? 0 : 1 }}
            >
              {group.items.map((item) => {
                const isActive = pathname === item.href ||
                  (pathname.startsWith(item.href + '/') &&
                   !allItems.some(n => n.href !== item.href && n.href.startsWith(item.href) && pathname.startsWith(n.href)))
                const Icon = item.Icon
                const isLocked = item.proOnly && !isMultiTier && !isEnterpriseTier && isOwner

                if (isLocked) {
                  return (
                    <Link
                      key={item.name}
                      href="/pricing"
                      onClick={() => setMobileOpen(false)}
                      aria-label={t.proOnlyLabel(item.name)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--color-textMuted)] opacity-60 hover:bg-[var(--color-bgHover)] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                    >
                      <Icon size={18} aria-hidden="true" />
                      {item.name}
                      <IconLock size={14} className="ml-auto" aria-hidden="true" />
                    </Link>
                  )
                }

                const badgeCount = badges[item.href] || 0

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${
                      isActive
                        ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] border-l-[3px] border-[var(--color-primary)] pl-[calc(1rem-3px)]'
                        : 'text-[var(--color-textMuted)] hover:bg-[var(--color-bgHover)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    <Icon size={18} aria-hidden="true" />
                    {item.name}
                    {badgeCount > 0 && (
                      <span className={`ml-auto min-w-[20px] h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
                          : 'bg-[var(--color-danger)] text-white'
                      }`}>
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
          )
        })}
      </nav>

      {/* Upgrade Banner — shown for trial users */}
      {isTrialTier && (
        <div className="p-4 border-t border-[var(--color-border)]">
          <Link
            href="/pricing"
            className={`block p-4 rounded-xl border transition-colors ${
              needsUpgrade
                ? 'bg-[var(--color-danger)]/10 border-[var(--color-danger)]/30 hover:border-[var(--color-danger)]'
                : 'bg-gradient-to-r from-[var(--color-primary)]/20 to-purple-500/20 border-[var(--color-primary)]/30 hover:border-[var(--color-primary)]'
            }`}
          >
            <div className="text-sm font-semibold mb-1">{t.upgradeToPro}</div>
            <div className="text-xs text-[var(--color-textMuted)]">
              {t.upgradeDescription}
            </div>
          </Link>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="p-3 border-t border-[var(--color-border)]">
        <button type="button"
          onClick={() => signOut()}
          aria-label={t.logoutLabel}
          data-testid="sidebar-logout"
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--color-textMuted)] hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)] transition-colors"
        >
          <IconLogout size={18} aria-hidden="true" />
          {t.logout}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile menu button */}
      <button type="button"
        onClick={() => setMobileOpen(true)}
        aria-label={t.openNav}
        aria-expanded={mobileOpen}
        className="lg:hidden fixed top-4 left-4 z-40 p-3 rounded-xl bg-[var(--color-bgCard)] border border-[var(--color-border)] shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        role="dialog"
        aria-label={t.openNav}
        aria-modal="true"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-[var(--color-bgCard)] border-r border-[var(--color-border)] flex flex-col transform transition-transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button type="button"
          onClick={() => setMobileOpen(false)}
          aria-label={t.closeNav}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[var(--color-bgHover)]"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-72 bg-[var(--color-bgCard)] border-r border-[var(--color-border)] flex-col">
        {navContent}
      </aside>
    </>
  )
}
