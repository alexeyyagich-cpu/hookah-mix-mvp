import type { Metadata } from 'next'
import WiderrufContent from './WiderrufContent'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export const metadata: Metadata = {
  title: 'Widerrufsbelehrung — Hookah Torus',
  description: 'Widerrufsbelehrung für digitale Dienstleistungen von Hookah Torus gemäß §§ 355-356 BGB.',
  alternates: { canonical: 'https://hookahtorus.com/legal/widerruf' },
  openGraph: {
    title: 'Widerrufsbelehrung — Hookah Torus',
    description: 'Widerrufsbelehrung für digitale Dienstleistungen von Hookah Torus gemäß §§ 355-356 BGB.',
    url: 'https://hookahtorus.com/legal/widerruf',
  },
}

export default function WiderrufPage() {
  return <ErrorBoundary sectionName="Widerruf"><WiderrufContent /></ErrorBoundary>
}
