'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { useModules } from '@/lib/hooks/useModules'
import { useRole, ORG_ROLE_LABELS, type Permission } from '@/lib/hooks/useRole'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
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
  IconShop,
  IconFloor,
  IconLock,
  IconUsers,
  IconStar,
  IconCalendar,
  IconBar,
  IconCocktail,
  IconMenuList,
  IconCoin,
  IconTrendUp,
  IconTimer,
} from '@/components/Icons'

interface NavItem {
  name: string
  href: string
  Icon: React.ComponentType<{ size?: number }>
  permission: Permission
  proOnly?: boolean
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
  const { profile, signOut } = useAuth()
  const { tier, isFreeTier } = useSubscription()
  const { organization } = useOrganizationContext()
  const { orgRole, hasPermission, isOwner, isStaff } = useRole()
  const { modules } = useModules()

  const navigationGroups: NavGroup[] = [
    {
      label: null,
      items: [
        { name: t.overview, href: '/dashboard', Icon: IconDashboard, permission: 'dashboard.view' },
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
      label: t.managementGroup,
      items: [
        { name: t.floorPlan, href: '/floor', Icon: IconFloor, permission: 'sessions.view' },
        { name: t.reservations, href: '/floor/reservations', Icon: IconCalendar, permission: 'sessions.view' },
        { name: t.kdsOrders, href: '/kds', Icon: IconMenuList, permission: 'sessions.create' },
        { name: t.shifts, href: '/shifts', Icon: IconTimer, permission: 'sessions.create' },
        { name: t.statistics, href: '/statistics', Icon: IconChart, permission: 'statistics.view' },
        { name: t.pnlReports, href: '/reports', Icon: IconTrendUp, permission: 'statistics.view' },
      ],
    },
    {
      label: t.otherGroup,
      items: [
        { name: t.reviews, href: '/reviews', Icon: IconStar, permission: 'dashboard.view' },
        { name: t.marketplace, href: '/marketplace', Icon: IconShop, permission: 'marketplace.view', proOnly: true },
        { name: t.team, href: '/settings/team', Icon: IconUsers, permission: 'team.view' },
        { name: t.settings, href: '/settings', Icon: IconSettings, permission: 'settings.view' },
      ],
    },
  ]

  // Build flat list of all items for active-state matching
  const allItems = navigationGroups.flatMap(g => g.items)

  // Filter groups and items by role permissions and active modules
  const filteredGroups = navigationGroups
    .filter(group => {
      // Hide entire group if its module is inactive
      if (group.module && !modules.includes(group.module)) return false
      return true
    })
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (!hasPermission(item.permission)) return false
        if (item.module && !modules.includes(item.module)) return false
        if (item.href === '/settings/team' && !isOwner) return false
        if (item.href === '/settings' && isStaff) return false
        return true
      }),
    }))
    .filter(group => group.items.length > 0)

  const roleLabels = ORG_ROLE_LABELS[orgRole]
  const roleName = roleLabels ? (locale === 'de' ? roleLabels.de : roleLabels.label) : orgRole

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="p-4 border-b border-[var(--color-border)]">
        <Link href="/mix" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
            <video
              autoPlay
              loop
              muted
              playsInline
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
        <div className="mt-2 flex flex-wrap gap-2">
          {/* Role badge */}
          <span
            className="badge"
            style={{
              background: isOwner
                ? 'linear-gradient(135deg, var(--color-primary) 0%, #ec4899 100%)'
                : 'var(--color-bgHover)',
              color: isOwner ? 'white' : 'var(--color-text)',
            }}
          >
            {roleLabels?.emoji} {roleName}
          </span>
          {/* Subscription badge - only for owners */}
          {isOwner && (
            <span className={`badge ${isFreeTier ? 'badge-warning' : 'badge-success'}`}>
              {tier.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Navigation - grouped by section */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {filteredGroups.map((group, gi) => (
          <div key={group.label || gi}>
            {group.label && (
              <div className="px-4 pt-2 pb-1 text-[10px] font-semibold text-[var(--color-textMuted)] uppercase tracking-widest">
                {group.label}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href ||
                  (pathname.startsWith(item.href + '/') &&
                   !allItems.some(n => n.href !== item.href && n.href.startsWith(item.href) && pathname.startsWith(n.href)))
                const Icon = item.Icon
                const isLocked = item.proOnly && isFreeTier && isOwner

                if (isLocked) {
                  return (
                    <Link
                      key={item.name}
                      href="/pricing"
                      onClick={() => setMobileOpen(false)}
                      aria-label={t.proOnlyLabel(item.name)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--color-textMuted)] opacity-60 hover:bg-[var(--color-bgHover)] transition-all"
                    >
                      <Icon size={18} aria-hidden="true" />
                      {item.name}
                      <IconLock size={14} className="ml-auto" aria-hidden="true" />
                    </Link>
                  )
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                        : 'text-[var(--color-textMuted)] hover:bg-[var(--color-bgHover)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    <Icon size={18} aria-hidden="true" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Upgrade Banner */}
      {isFreeTier && (
        <div className="p-4 border-t border-[var(--color-border)]">
          <Link
            href="/pricing"
            className="block p-4 rounded-xl bg-gradient-to-r from-[var(--color-primary)]/20 to-purple-500/20 border border-[var(--color-primary)]/30 hover:border-[var(--color-primary)] transition-colors"
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
        <button
          onClick={() => signOut()}
          aria-label={t.logoutLabel}
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
      <button
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
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        role="dialog"
        aria-label={t.openNav}
        aria-modal="true"
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-[var(--color-bgCard)] border-r border-[var(--color-border)] flex flex-col transform transition-transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          aria-label={t.closeNav}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[var(--color-bgHover)]"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <NavContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-72 bg-[var(--color-bgCard)] border-r border-[var(--color-border)] flex-col">
        <NavContent />
      </aside>
    </>
  )
}
