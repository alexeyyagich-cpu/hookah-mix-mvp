import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Калькулятор миксов',
  description: 'Создавайте идеальные миксы табака для кальяна. Выбирайте из 40+ вкусов от Musthave, Darkside, Tangiers, Black Burn и других брендов. Расчёт крепости и рекомендации по забивке.',
  keywords: [
    'калькулятор миксов кальяна',
    'микс табака',
    'hookah mix calculator',
    'Musthave',
    'Darkside',
    'Tangiers',
    'крепость табака',
  ],
  openGraph: {
    title: 'Калькулятор миксов | Hookah Torus',
    description: 'Создавайте идеальные миксы табака для кальяна с расчётом крепости',
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
