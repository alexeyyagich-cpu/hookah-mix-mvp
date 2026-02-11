'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useSubscription } from '@/lib/hooks/useSubscription'
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
  IconLock,
} from '@/components/Icons'

interface NavItem {
  name: string
  href: string
  Icon: React.ComponentType<{ size?: number }>
  proOnly?: boolean
}

const navigation: NavItem[] = [
  { name: 'Обзор', href: '/dashboard', Icon: IconDashboard },
  { name: 'Инвентарь', href: '/inventory', Icon: IconInventory },
  { name: 'Маркетплейс', href: '/marketplace', Icon: IconShop, proOnly: true },
  { name: 'Чаши', href: '/bowls', Icon: IconBowl },
  { name: 'Сессии', href: '/sessions', Icon: IconSession },
  { name: 'Статистика', href: '/statistics', Icon: IconChart },
  { name: 'Настройки', href: '/settings', Icon: IconSettings },
]

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const { tier, isFreeTier } = useSubscription()

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

      {/* Business Info */}
      <div className="p-4 border-b border-[var(--color-border)]">
        <div className="text-sm font-medium truncate">
          {profile?.business_name || 'Мое заведение'}
        </div>
        <div className="text-xs text-[var(--color-textMuted)] mt-1">
          {profile?.owner_name || 'Владелец'}
        </div>
        <div className="mt-2">
          <span className={`badge ${isFreeTier ? 'badge-warning' : 'badge-success'}`}>
            {tier.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.Icon
          const isLocked = item.proOnly && isFreeTier

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
