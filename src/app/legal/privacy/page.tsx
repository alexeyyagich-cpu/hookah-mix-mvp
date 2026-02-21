import type { Metadata } from 'next'
import PrivacyContent from './PrivacyContent'

export const metadata: Metadata = {
  title: 'Privacy Policy — Hookah Torus',
}

export default function PrivacyPage() {
  return <PrivacyContent />
}
