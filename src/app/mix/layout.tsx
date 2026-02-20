import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mix Calculator',
  description: 'Create perfect hookah tobacco mixes. Choose from 40+ flavors by Musthave, Darkside, Tangiers, Black Burn and more. Strength calculation and packing recommendations.',
  keywords: [
    'hookah mix calculator',
    'tobacco mix builder',
    'shisha flavor combinations',
    'Musthave',
    'Darkside',
    'Tangiers',
    'tobacco strength calculator',
  ],
  openGraph: {
    title: 'Mix Calculator | Hookah Torus',
    description: 'Create perfect hookah tobacco mixes with strength calculation and packing tips',
    url: 'https://hookah-torus.com/mix',
  },
  alternates: {
    canonical: '/mix',
  },
}

export default function MixLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
