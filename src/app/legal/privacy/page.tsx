import type { Metadata } from 'next'
import PrivacyContent from './PrivacyContent'

export const metadata: Metadata = {
  title: 'Политика конфиденциальности — Hookah Torus',
}

export default function PrivacyPage() {
  return <PrivacyContent />
}
