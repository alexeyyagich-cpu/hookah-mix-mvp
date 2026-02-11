import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Рекомендации миксов',
  description: 'Получите персональные рекомендации миксов табака на основе ваших предпочтений. AI подберёт идеальное сочетание вкусов для вашего кальяна.',
  keywords: [
    'AI рекомендации кальяна',
    'подбор микса табака',
    'персональный микс',
    'рекомендации табака',
    'hookah recommendations',
  ],
  openGraph: {
    title: 'AI Рекомендации миксов | Hookah Torus',
    description: 'Персональные рекомендации миксов табака на основе AI',
    url: 'https://hookah-torus.com/recommend',
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
