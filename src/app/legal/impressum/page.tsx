import type { Metadata } from 'next'
import ImpressumContent from './ImpressumContent'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export const metadata: Metadata = {
  title: 'Impressum — Hookah Torus',
  description: 'Legal notice and company information for Hookah Torus.',
  alternates: { canonical: 'https://hookahtorus.com/legal/impressum' },
  openGraph: {
    title: 'Impressum — Hookah Torus',
    description: 'Legal notice and company information for Hookah Torus.',
    url: 'https://hookahtorus.com/legal/impressum',
  },
}

export default function ImpressumPage() {
  return <ErrorBoundary sectionName="Impressum"><ImpressumContent /></ErrorBoundary>
}
