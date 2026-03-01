'use client'

import { useTranslation } from '@/lib/i18n'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import GeneralSection from '@/components/settings/GeneralSection'
import SubscriptionSection from '@/components/settings/SubscriptionSection'
import VenueSection from '@/components/settings/VenueSection'
import NotificationsSection from '@/components/settings/NotificationsSection'
import IntegrationsSection from '@/components/settings/IntegrationsSection'
import AccountSection from '@/components/settings/AccountSection'

export default function SettingsPage() {
  const ts = useTranslation('settings')

  const sections = [
    { id: 'general', label: ts.sectionGeneral },
    { id: 'subscription', label: ts.sectionSubscription },
    { id: 'venue', label: ts.sectionVenue },
    { id: 'notifications', label: ts.sectionNotifications },
    { id: 'integrations', label: ts.sectionIntegrations },
    { id: 'account', label: ts.sectionAccount },
  ]

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <ErrorBoundary sectionName="Settings">
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{ts.title}</h1>
        <p className="text-[var(--color-textMuted)]">
          {ts.subtitle}
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {sections.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => scrollTo(s.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap text-[var(--color-textMuted)] hover:bg-[var(--color-bgHover)] hover:text-[var(--color-text)] transition-colors"
          >
            {s.label}
          </button>
        ))}
      </div>

      <GeneralSection />
      <SubscriptionSection />
      <VenueSection />
      <NotificationsSection />
      <IntegrationsSection />
      <AccountSection />
    </div>
    </ErrorBoundary>
  )
}
