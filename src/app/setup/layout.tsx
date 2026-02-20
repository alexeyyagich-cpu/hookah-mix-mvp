import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hookah Setup',
  description: 'Hookah setup recommendations: bowl selection, coal count, heat management. Optimal packing for different tobacco mixes.',
  keywords: [
    'hookah setup guide',
    'tobacco packing tips',
    'hookah bowl selection',
    'hookah coal management',
    'shisha heat management',
  ],
  openGraph: {
    title: 'Hookah Setup | Hookah Torus',
    description: 'Setup recommendations for the perfect hookah session',
    url: 'https://hookahtorus.com/setup',
  },
  alternates: {
    canonical: '/setup',
  },
}

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
