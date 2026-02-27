'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Toaster, toast } from 'sonner'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { OrganizationProvider } from '@/lib/OrganizationContext'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { CommandPalette } from '@/components/dashboard/CommandPalette'
import { PageTitle } from '@/components/dashboard/PageTitle'
import { BrandLoader } from '@/components/BrandLoader'
import { useInventory } from '@/lib/hooks/useInventory'
import { useNotificationSettings } from '@/lib/hooks/useNotificationSettings'
import { useOnboarding } from '@/lib/hooks/useOnboarding'
import { useTranslation } from '@/lib/i18n'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import { InstallBanner } from '@/components/InstallBanner'
import { TrialBanner } from '@/components/dashboard/TrialBanner'
import { OnlineStatusProvider } from '@/lib/offline/useOnlineStatus'
import { SidebarBadgeProvider, useSetSidebarBadge } from '@/lib/SidebarBadgeContext'
import { OfflineIndicator } from '@/components/OfflineIndicator'

function PageProgressBar() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const previousPathRef = useRef(pathname)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const innerTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (previousPathRef.current !== pathname) {
      previousPathRef.current = pathname
      // Start progress
      setVisible(true)
      setProgress(30)
      clearTimeout(timerRef.current)
      clearTimeout(innerTimerRef.current)
      timerRef.current = setTimeout(() => {
        setProgress(70)
        timerRef.current = setTimeout(() => {
          setProgress(100)
          innerTimerRef.current = setTimeout(() => {
            setVisible(false)
            setProgress(0)
          }, 200)
        }, 200)
      }, 100)
    }
    return () => { clearTimeout(timerRef.current); clearTimeout(innerTimerRef.current) }
  }, [pathname])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px]">
      <div
        className="h-full bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)]"
        style={{
          width: `${progress}%`,
          transition: progress === 0 ? 'none' : 'width 0.3s ease',
        }}
      />
    </div>
  )
}

function OnboardingCheck({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { shouldShowOnboarding, loading } = useOnboarding()

  useEffect(() => {
    // Don't redirect if still loading or already on onboarding page
    if (loading || pathname === '/onboarding') return

    // Redirect to onboarding if not completed
    if (shouldShowOnboarding) {
      router.push('/onboarding')
    }
  }, [loading, shouldShowOnboarding, pathname, router])

  // Show loader while checking onboarding status
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]">
        <BrandLoader size="lg" />
      </div>
    )
  }

  // If should show onboarding and not on onboarding page, don't render children
  if (shouldShowOnboarding && pathname !== '/onboarding') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]">
        <BrandLoader size="lg" />
      </div>
    )
  }

  return <>{children}</>
}

function LowStockNotifier() {
  const { inventory } = useInventory()
  const { settings } = useNotificationSettings()
  const tc = useTranslation('common')
  const hasShownRef = useRef(false)
  const setBadge = useSetSidebarBadge()

  const threshold = settings?.low_stock_threshold || 50
  const lowStockCount = inventory.filter(item =>
    item.quantity_grams < threshold
  ).length

  // Update sidebar badge for inventory
  useEffect(() => {
    setBadge('/inventory', lowStockCount)
  }, [lowStockCount, setBadge])

  useEffect(() => {
    // Only show once per session
    if (hasShownRef.current || !settings?.low_stock_enabled) return

    const lowStockItems = inventory.filter(item =>
      item.quantity_grams < threshold && item.quantity_grams > 0
    )
    const outOfStockItems = inventory.filter(item => item.quantity_grams <= 0)

    if (outOfStockItems.length > 0) {
      toast.error(tc.lowStock.outOfStock.replace('{count}', String(outOfStockItems.length)), {
        description: outOfStockItems.slice(0, 3).map(i => `${i.brand} ${i.flavor}`).join(', ') +
          (outOfStockItems.length > 3 ? '...' : ''),
        duration: 6000,
      })
      hasShownRef.current = true
    } else if (lowStockItems.length > 0) {
      toast.warning(tc.lowStock.lowStock.replace('{count}', String(lowStockItems.length)), {
        description: lowStockItems.slice(0, 3).map(i => `${i.brand} ${i.flavor} (${i.quantity_grams.toFixed(0)}${tc.grams})`).join(', ') +
          (lowStockItems.length > 3 ? '...' : ''),
        duration: 5000,
      })
      hasShownRef.current = true
    }
  }, [inventory, settings, tc, threshold])

  return null
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isOnboarding = pathname === '/onboarding'

  return (
    <div className="min-h-screen bg-[var(--color-bg)] relative">
      {/* Global background slot - pages can inject backgrounds here via portal or we check pathname */}
      <div id="page-background" className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />
      {!isOnboarding && <Sidebar />}
      {!isOnboarding && <CommandPalette />}
      <PageTitle />
      <main className={isOnboarding ? '' : 'lg:pl-72 relative'} style={{ zIndex: 1 }}>
        {!isOnboarding && <InstallBanner />}
        {!isOnboarding && <TrialBanner />}
        <div className={isOnboarding ? '' : 'p-4 pt-16 lg:p-8 lg:pt-8'}>
          {children}
        </div>
      </main>
      <PageProgressBar />
      {!isOnboarding && <LowStockNotifier />}
      <OfflineIndicator />
      <ServiceWorkerRegistration />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--color-bgCard)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
          },
        }}
      />
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <OrganizationProvider>
        <SidebarBadgeProvider>
          <OnlineStatusProvider>
            <OnboardingCheck>
              <DashboardContent>{children}</DashboardContent>
            </OnboardingCheck>
          </OnlineStatusProvider>
        </SidebarBadgeProvider>
      </OrganizationProvider>
    </AuthGuard>
  )
}
