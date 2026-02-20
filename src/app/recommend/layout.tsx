import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Mix Recommendations',
  description: 'Get personalized tobacco mix recommendations based on your preferences. AI picks the perfect flavor combination for your hookah.',
  keywords: [
    'AI hookah recommendations',
    'tobacco mix suggestions',
    'personalized hookah mix',
    'shisha flavor recommendations',
    'hookah AI assistant',
  ],
  openGraph: {
    title: 'AI Mix Recommendations | Hookah Torus',
    description: 'Personalized AI-powered tobacco mix recommendations for hookah',
    url: 'https://hookahtorus.com/recommend',
  },
  alternates: {
    canonical: '/recommend',
  },
}

export default function RecommendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
