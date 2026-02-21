import type { Metadata } from 'next'
import TermsContent from './TermsContent'

export const metadata: Metadata = {
  title: 'Terms of Service — Hookah Torus',
}

export default function TermsPage() {
  return <TermsContent />
}
