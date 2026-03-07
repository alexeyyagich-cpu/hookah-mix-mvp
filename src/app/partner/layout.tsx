import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Partner Program — Hookah Torus',
  description: 'Earn recurring commissions by recommending Hookah Torus to hookah lounges. 20% revenue share for 24 months per referred venue.',
  keywords: [
    'hookah software partner',
    'hookah torus affiliate',
    'hookah supplier partner program',
    'shisha software referral',
    'hookah lounge management partner',
  ],
  openGraph: {
    title: 'Partner Program — Hookah Torus',
    description: 'Earn 20% recurring commission for 24 months per referred hookah lounge.',
    url: 'https://hookahtorus.com/partner',
  },
  alternates: {
    canonical: '/partner',
  },
}

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
