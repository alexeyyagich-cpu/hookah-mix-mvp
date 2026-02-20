import type { Metadata } from 'next'
import ImpressumContent from './ImpressumContent'

export const metadata: Metadata = {
  title: 'Impressum — Hookah Torus',
}

export default function ImpressumPage() {
  return <ImpressumContent />
}
