'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'

const ROUTE_TO_NAV_KEY: Record<string, string> = {
  '/dashboard': 'overview',
  '/boss': 'bossDashboard',
  '/floor': 'floorPlan',
  '/kds': 'kdsOrders',
  '/waiter': 'waiter',
  '/shifts': 'shifts',
  '/inventory': 'inventory',
  '/bowls': 'bowls',
  '/sessions': 'sessions',
  '/mix': 'mixCalculator',
  '/bar/inventory': 'warehouse',
  '/bar/recipes': 'recipes',
  '/bar/menu': 'menu',
  '/bar/sales': 'sales',
  '/statistics': 'statistics',
  '/reports': 'pnlReports',
  '/reviews': 'reviews',
  '/guests': 'guestsCRM',
  '/promotions': 'promotions',
  '/settings/team': 'team',
  '/settings': 'settings',
}

export function PageTitle() {
  const pathname = usePathname()
  const t = useTranslation('nav')

  useEffect(() => {
    // Find the most specific matching route (longer paths first)
    const sorted = Object.keys(ROUTE_TO_NAV_KEY).sort((a, b) => b.length - a.length)
    const match = sorted.find(route => pathname === route || pathname.startsWith(route + '/'))

    if (match) {
      const key = ROUTE_TO_NAV_KEY[match] as keyof typeof t
      const title = t[key]
      if (typeof title === 'string') {
        document.title = `${title} | Hookah Torus`
      }
    } else {
      document.title = 'Hookah Torus'
    }
  }, [pathname, t])

  return null
}
