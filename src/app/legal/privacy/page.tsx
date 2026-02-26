import type { Metadata } from 'next'
import PrivacyContent from './PrivacyContent'

export const metadata: Metadata = {
  title: 'Privacy Policy — Hookah Torus',
  description: 'How Hookah Torus collects, uses, and protects your personal data.',
  alternates: { canonical: 'https://hookahtorus.com/legal/privacy' },
  openGraph: {
    title: 'Privacy Policy — Hookah Torus',
    description: 'How Hookah Torus collects, uses, and protects your personal data.',
    url: 'https://hookahtorus.com/legal/privacy',
  },
}

export default function PrivacyPage() {
  return <PrivacyContent />
}
