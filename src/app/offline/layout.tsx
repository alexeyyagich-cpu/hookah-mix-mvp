import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Offline — Hookah Torus',
  description: 'You are currently offline. Check your internet connection and try again.',
  robots: { index: false, follow: false },
}

export default function OfflineLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
