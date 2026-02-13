'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { useRole, ROLE_LABELS, type Permission } from '@/lib/hooks/useRole'
import {
  IconDashboard,
  IconInventory,
  IconBowl,
  IconSession,
  IconChart,
  IconSettings,
  IconCalculator,
  IconLogout,
  IconSmoke,
  IconShop,
  IconFloor,
  IconLock,
  IconUsers,
  IconStar,
  IconCalendar,
} from '@/components/Icons'

interface NavItem {
  name: string
  href: string
  Icon: React.ComponentType<{ size?: number }>
  permission: Permission
  proOnly?: boolean
}

// Navigation items with required permissions
const navigation: NavItem[] = [
  { name: 'Обзор', href: '/dashboard', Icon: IconDashboard, permission: 'dashboard.view' },
  { name: 'Инвентарь', href: '/inventory', Icon: IconInventory, permission: 'inventory.view' },
  { name: 'План зала', href: '/floor', Icon: IconFloor, permission: 'sessions.view' },
  { name: 'Бронирования', href: '/floor/reservations', Icon: IconCalendar, permission: 'sessions.view' },
  { name: 'Отзывы', href: '/reviews', Icon: IconStar, permission: 'dashboard.view' },
  { name: 'Маркетплейс', href: '/marketplace', Icon: IconShop, permission: 'marketplace.view', proOnly: true },
  { name: 'Чаши', href: '/bowls', Icon: IconBowl, permission: 'bowls.view' },
  { name: 'Сессии', href: '/sessions', Icon: IconSession, permission: 'sessions.view' },
  { name: 'Статистика', href: '/statistics', Icon: IconChart, permission: 'statistics.view' },
  { name: 'Команда', href: '/settings/team', Icon: IconUsers, permission: 'team.view' },
  { name: 'Настройки', href: '/settings', Icon: IconSettings, permission: 'settings.view' },
]

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const { tier, isFreeTier } = useSubscription()
  const { role, hasPermission, isOwner, isStaff } = useRole()

  // Filter navigation items by role permissions
  const filteredNavigation = navigation.filter(item => {
    // Check if user has permission for this item
    if (!hasPermission(item.permission)) return false
    // Team page only for owners
    if (item.href === '/settings/team' && !isOwner) return false
    // Settings main page - hide for staff (they don't have settings.view)
    if (item.href === '/settings' && isStaff) return false
    return true
  })

  const roleInfo = ROLE_LABELS[role]

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
            <div className="text-xs text-[var(--color-textMuted)]">← На главную</div>
          </div>
        </Link>
      </div>

      {/* Business Info + Role */}
      <div className="p-4 border-b border-[var(--color-border)]">
        <div className="text-sm font-medium truncate">
          {profile?.business_name || 'Мое заведение'}
        </div>
        <div className="text-xs text-[var(--color-textMuted)] mt-1">
          {profile?.owner_name || 'Пользователь'}
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
            {roleInfo.emoji} {roleInfo.ru}
          </span>
          {/* Subscription badge - only for owners */}
          {isOwner && (
            <span className={`badge ${isFreeTier ? 'badge-warning' : 'badge-success'}`}>
              {tier.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Navigation - filtered by role */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => {
          // Exact match, or prefix match only if no other nav item is a more specific match
          const isActive = pathname === item.href ||
            (pathname.startsWith(item.href + '/') &&
             !filteredNavigation.some(n => n.href !== item.href && n.href.startsWith(item.href) && pathname.startsWith(n.href)))
          const Icon = item.Icon
          const isLocked = item.proOnly && isFreeTier && isOwner

          if (isLocked) {
            return (
              <Link
                key={item.name}
                href="/pricing"
                onClick={() => setMobileOpen(false)}
                aria-label={`${item.name} — доступно в Pro тарифе`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--color-textMuted)] opacity-60 hover:bg-[var(--color-bgHover)] transition-all"
              >
                <Icon size={20} aria-hidden="true" />
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                  : 'text-[var(--color-textMuted)] hover:bg-[var(--color-bgHover)] hover:text-[var(--color-text)]'
              }`}
            >
              <Icon size={20} aria-hidden="true" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Upgrade Banner */}
      {isFreeTier && (
        <div className="p-4 border-t border-[var(--color-border)]">
          <Link
            href="/pricing"
            className="block p-4 rounded-xl bg-gradient-to-r from-[var(--color-primary)]/20 to-purple-500/20 border border-[var(--color-primary)]/30 hover:border-[var(--color-primary)] transition-colors"
          >
            <div className="text-sm font-semibold mb-1">Обновить до Pro</div>
            <div className="text-xs text-[var(--color-textMuted)]">
              Безлимитный инвентарь и полная статистика
            </div>
          </Link>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="p-3 border-t border-[var(--color-border)] space-y-1">
        <Link
          href="/mix"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--color-textMuted)] hover:bg-[var(--color-bgHover)] hover:text-[var(--color-text)] transition-colors"
        >
          <IconCalculator size={20} aria-hidden="true" />
          Калькулятор миксов
        </Link>
        <button
          onClick={() => signOut()}
          aria-label="Выйти из аккаунта"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--color-textMuted)] hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)] transition-colors"
        >
          <IconLogout size={20} aria-hidden="true" />
          Выйти
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Открыть меню навигации"
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
        aria-label="Меню навигации"
        aria-modal="true"
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-[var(--color-bgCard)] border-r border-[var(--color-border)] flex flex-col transform transition-transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Закрыть меню навигации"
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
