import type { Metadata } from 'next'
import CookiesContent from './CookiesContent'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export const metadata: Metadata = {
  title: 'Cookie-Richtlinie — Hookah Torus',
  description: 'Informationen zur Verwendung von Cookies auf Hookah Torus gemäß TTDSG § 25 und DSGVO.',
  alternates: { canonical: 'https://hookahtorus.com/legal/cookies' },
  openGraph: {
    title: 'Cookie-Richtlinie — Hookah Torus',
    description: 'Informationen zur Verwendung von Cookies auf Hookah Torus gemäß TTDSG § 25 und DSGVO.',
    url: 'https://hookahtorus.com/legal/cookies',
  },
}

export default function CookiesPage() {
  return <ErrorBoundary sectionName="Cookies"><CookiesContent /></ErrorBoundary>
}
