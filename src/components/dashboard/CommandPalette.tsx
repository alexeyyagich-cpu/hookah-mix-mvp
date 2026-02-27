'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useRole, type Permission } from '@/lib/hooks/useRole'
import { useOrganizationContext } from '@/lib/hooks/useOrganization'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { useModules } from '@/lib/hooks/useModules'
import { useTranslation } from '@/lib/i18n'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock'
import type { AppModule } from '@/types/database'
import {
  IconDashboard,
  IconInventory,
  IconBowl,
  IconSession,
  IconChart,
  IconSettings,
  IconCalculator,
  IconFloor,
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

interface SearchItem {
  name: string
  href: string
  Icon: React.ComponentType<{ size?: number }>
  group?: string
  permission: Permission | Permission[]
  proOnly?: boolean
  ownerOnly?: boolean
  module?: AppModule
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const paletteRef = useRef<HTMLDivElement>(null)
  const focusTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const router = useRouter()

  const t = useTranslation('nav')
  const tc = useTranslation('common')
  useFocusTrap(paletteRef, open)
  useBodyScrollLock(open)
  const { orgRole } = useOrganizationContext()
  const { hasPermission, hasAnyPermission, isOwner } = useRole(orgRole)
  const { isFreeTier } = useSubscription()
  const { modules } = useModules()

  const allItems: SearchItem[] = [
    { name: t.overview, href: '/dashboard', Icon: IconDashboard, permission: 'dashboard.view' },
    { name: t.bossDashboard, href: '/boss', Icon: IconCrown, permission: 'dashboard.view', ownerOnly: true, proOnly: true, group: t.overview },
    { name: t.floorPlan, href: '/floor', Icon: IconFloor, permission: 'floor.view', group: t.operationsGroup },
    { name: t.kdsOrders, href: '/kds', Icon: IconMenuList, permission: ['sessions.create', 'kds.kitchen'], group: t.operationsGroup },
    { name: t.waiter, href: '/waiter', Icon: IconWaiter, permission: 'sessions.create', proOnly: true, group: t.operationsGroup },
    { name: t.shifts, href: '/shifts', Icon: IconTimer, permission: 'sessions.create', group: t.operationsGroup },
    { name: t.inventory, href: '/inventory', Icon: IconInventory, permission: 'inventory.view', module: 'hookah', group: t.hookahGroup },
    { name: t.bowls, href: '/bowls', Icon: IconBowl, permission: 'bowls.view', module: 'hookah', group: t.hookahGroup },
    { name: t.sessions, href: '/sessions', Icon: IconSession, permission: 'sessions.view', module: 'hookah', group: t.hookahGroup },
    { name: t.mixCalculator, href: '/mix', Icon: IconCalculator, permission: 'dashboard.view', module: 'hookah', group: t.hookahGroup },
    { name: t.warehouse, href: '/bar/inventory', Icon: IconBar, permission: 'bar.view', module: 'bar', group: t.barGroup },
    { name: t.recipes, href: '/bar/recipes', Icon: IconCocktail, permission: 'bar.view', module: 'bar', group: t.barGroup },
    { name: t.menu, href: '/bar/menu', Icon: IconMenuList, permission: 'bar.view', module: 'bar', group: t.barGroup },
    { name: t.sales, href: '/bar/sales', Icon: IconCoin, permission: 'bar.sales', module: 'bar', group: t.barGroup },
    { name: t.statistics, href: '/statistics', Icon: IconChart, permission: 'statistics.view', group: t.analyticsGroup },
    { name: t.pnlReports, href: '/reports', Icon: IconTrendUp, permission: 'statistics.view', group: t.analyticsGroup },
    { name: t.reviews, href: '/reviews', Icon: IconStar, permission: 'dashboard.view', group: t.analyticsGroup },
    { name: t.guestsCRM, href: '/guests', Icon: IconUsers, permission: 'sessions.view', proOnly: true, group: t.businessGroup },
    { name: t.promotions, href: '/promotions', Icon: IconPercent, permission: 'sessions.view', proOnly: true, group: t.businessGroup },
    { name: t.team, href: '/settings/team', Icon: IconUsers, permission: 'team.view', ownerOnly: true, group: t.settingsGroup },
    { name: t.settings, href: '/settings', Icon: IconSettings, permission: 'settings.view', group: t.settingsGroup },
  ]

  // Filter by permissions (memoized)
  const accessibleItems = useMemo(() => allItems.filter(item => {
    const hasAccess = Array.isArray(item.permission)
      ? hasAnyPermission(item.permission)
      : hasPermission(item.permission)
    if (!hasAccess) return false
    if (item.module && !modules.includes(item.module)) return false
    if (item.ownerOnly && !isOwner) return false
    if (item.proOnly && isFreeTier) return false
    return true
  }), [allItems, hasPermission, hasAnyPermission, modules, isOwner, isFreeTier])

  // Filter by query (memoized)
  const filtered = useMemo(() => query.trim()
    ? accessibleItems.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        (item.group && item.group.toLowerCase().includes(query.toLowerCase()))
      )
    : accessibleItems
  , [query, accessibleItems])

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      focusTimerRef.current = setTimeout(() => inputRef.current?.focus(), 50)
    }
    return () => { clearTimeout(focusTimerRef.current) }
  }, [open])

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return
    const items = listRef.current.querySelectorAll('[data-cmd-item]')
    items[selectedIndex]?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  const navigate = useCallback((href: string) => {
    setOpen(false)
    router.push(href)
  }, [router])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault()
      navigate(filtered[selectedIndex].href)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }, [filtered, selectedIndex, navigate])

  // Reset index when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div ref={paletteRef} role="dialog" aria-modal="true" className="relative w-full max-w-lg mx-4 bg-[var(--color-bgCard)] rounded-2xl border border-[var(--color-border)] shadow-2xl overflow-hidden animate-fadeInUp">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
          <svg className="w-5 h-5 text-[var(--color-textMuted)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tc.commandPalette.placeholder}
            data-testid="command-palette-input"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-[var(--color-textMuted)]"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-textMuted)] bg-[var(--color-bgHover)] rounded border border-[var(--color-border)]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--color-textMuted)]">
              {tc.commandPalette.noResults}
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.Icon
              return (
                <button
                  key={item.href}
                  type="button"
                  data-cmd-item
                  onClick={() => navigate(item.href)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                    idx === selectedIndex
                      ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                      : 'text-[var(--color-text)] hover:bg-[var(--color-bgHover)]'
                  }`}
                >
                  <Icon size={18} />
                  <span className="flex-1 text-left">{item.name}</span>
                  {item.group && (
                    <span className={`text-xs ${idx === selectedIndex ? 'opacity-70' : 'text-[var(--color-textMuted)]'}`}>
                      {item.group}
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-[var(--color-border)] flex items-center gap-4 text-[10px] text-[var(--color-textMuted)]">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-[var(--color-bgHover)] rounded border border-[var(--color-border)]">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-[var(--color-bgHover)] rounded border border-[var(--color-border)]">↵</kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-[var(--color-bgHover)] rounded border border-[var(--color-border)]">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  )
}
