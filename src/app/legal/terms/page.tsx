import type { Metadata } from 'next'
import TermsContent from './TermsContent'

export const metadata: Metadata = {
  title: 'Terms of Service — Hookah Torus',
  description: 'Terms and conditions for using the Hookah Torus platform.',
  alternates: { canonical: 'https://hookahtorus.com/legal/terms' },
  openGraph: {
    title: 'Terms of Service — Hookah Torus',
    description: 'Terms and conditions for using the Hookah Torus platform.',
    url: 'https://hookahtorus.com/legal/terms',
  },
}

export default function TermsPage() {
  return <TermsContent />
}
