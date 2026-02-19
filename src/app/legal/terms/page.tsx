import type { Metadata } from 'next'
import TermsContent from './TermsContent'

export const metadata: Metadata = {
  title: 'Условия использования — Hookah Torus',
}

export default function TermsPage() {
  return <TermsContent />
}
