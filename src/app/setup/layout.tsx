import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Настройка кальяна',
  description: 'Рекомендации по настройке кальяна: выбор чаши, количество углей, время прогрева. Оптимальная забивка для разных миксов табака.',
  keywords: [
    'настройка кальяна',
    'забивка табака',
    'hookah setup',
    'выбор чаши',
    'угли для кальяна',
  ],
  openGraph: {
    title: 'Настройка кальяна | Hookah Torus',
    description: 'Рекомендации по настройке кальяна для идеального курения',
    url: 'https://hookah-torus.com/setup',
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
