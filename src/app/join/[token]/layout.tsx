import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Join Team — Hookah Torus',
  description: 'You have been invited to join a team on Hookah Torus. Accept your invitation to get started.',
  openGraph: {
    title: 'Join Team — Hookah Torus',
    description: 'You have been invited to join a team on Hookah Torus.',
    type: 'website',
  },
  robots: { index: false, follow: false },
}

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return children
}
