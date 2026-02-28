'use client'

import dynamic from 'next/dynamic'
import { useAuth } from '@/lib/AuthContext'
import { useModules } from '@/lib/hooks/useModules'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { useTranslation } from '@/lib/i18n'
const HookahSection = dynamic(
  () => import('@/components/dashboard/sections/HookahSection').then(m => m.HookahSection),
  { loading: () => <div className="skeleton h-64 rounded-xl" /> }
)
const BarSection = dynamic(
  () => import('@/components/dashboard/sections/BarSection').then(m => m.BarSection),
  { loading: () => <div className="skeleton h-64 rounded-xl" /> }
)
import { FloorStatusWidget } from '@/components/dashboard/sections/FloorStatusWidget'
import { QuickStartCard } from '@/components/dashboard/QuickStartCard'
import { ControlDashboard } from '@/components/dashboard/sections/ControlDashboard'
import {
  IconCalculator,
  IconSettings,
} from '@/components/Icons'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { PageBackground } from '@/components/ui/PageBackground'
import Link from 'next/link'

export default function DashboardPage() {
  const { profile } = useAuth()
  const { isHookahActive, isBarActive } = useModules()
  const { isTrialTier } = useSubscription()
  const th = useTranslation('hookah')
  const tc = useTranslation('common')

  const isCombined = isHookahActive && isBarActive

  return (
    <div className="space-y-8 relative">
      <PageBackground image="/images/dashboard-bg.jpg" />

      {/* Setup recovery banner for users who skipped onboarding */}
      {profile?.onboarding_skipped && !profile.business_type && (
        <Link
          href="/settings"
          className="block p-4 rounded-xl bg-gradient-to-r from-[var(--color-warning)]/20 to-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 hover:border-[var(--color-warning)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <IconSettings size={20} className="text-[var(--color-warning)] shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-semibold">{th.setupBannerTitle}</div>
              <div className="text-xs text-[var(--color-textMuted)]">{th.setupBannerDesc}</div>
            </div>
          </div>
        </Link>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {th.hello(profile?.owner_name || th.defaultOwner)}
          </h1>
          <p className="text-[var(--color-textMuted)]">
            {th.businessOverview(profile?.business_name || th.defaultBusiness)}
          </p>
        </div>
        {isHookahActive && (
          <Link href="/mix" className="btn btn-primary flex items-center gap-2">
            <IconCalculator size={18} />
            {th.mixCalculator}
          </Link>
        )}
      </div>

      {/* Quick Start Checklist */}
      <ErrorBoundary sectionName="Quick Start">
        <QuickStartCard />
      </ErrorBoundary>

      {/* Floor Status — always visible */}
      <ErrorBoundary sectionName="Floor Status">
        <FloorStatusWidget />
      </ErrorBoundary>

      {/* Control Panel — financial overview */}
      <ErrorBoundary sectionName="Control Dashboard">
        <ControlDashboard />
      </ErrorBoundary>

      {/* Hookah Section */}
      {isHookahActive && (
        <div>
          {isCombined && (
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🔥</span> {th.dashboardTitle}
            </h2>
          )}
          <ErrorBoundary sectionName="Hookah Section">
            <HookahSection />
          </ErrorBoundary>
        </div>
      )}

      {/* Bar Section */}
      {isBarActive && (
        <div>
          {isCombined && (
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🍸</span> {tc.modules.bar}
            </h2>
          )}
          <ErrorBoundary sectionName="Bar Section">
            <BarSection />
          </ErrorBoundary>
        </div>
      )}

      {/* Upgrade Banner */}
      {isTrialTier && (
        <div className="card p-6 bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-primary)]/5 border-[var(--color-primary)]/30">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2">{th.upgradeToPro}</h3>
              <p className="text-[var(--color-textMuted)]">
                {th.upgradeDesc}
              </p>
            </div>
            <Link href="/pricing" className="btn btn-primary whitespace-nowrap">
              {th.upgradePlan}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
