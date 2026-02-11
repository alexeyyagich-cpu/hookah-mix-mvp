import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Тарифы',
  description: 'Выберите подходящий тариф Hookah Torus. Free для начала, Pro для активных заведений, Enterprise для сетей. Управление инвентарём, статистика, API доступ.',
  keywords: [
    'тарифы кальянной',
    'hookah management pricing',
    'управление кальянной стоимость',
    'Pro тариф',
    'Enterprise',
  ],
  openGraph: {
    title: 'Тарифы | Hookah Torus',
    description: 'Выберите подходящий тариф для управления кальянной',
    url: 'https://hookah-torus.com/pricing',
  },
  alternates: {
    canonical: '/pricing',
  },
}

// FAQ Schema for rich snippets
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Могу ли я отменить подписку?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Да, вы можете отменить подписку в любой момент. Доступ сохранится до конца оплаченного периода.",
      },
    },
    {
      "@type": "Question",
      name: "Какие способы оплаты доступны?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Мы принимаем банковские карты (Visa, Mastercard), PayPal и банковские переводы.",
      },
    },
    {
      "@type": "Question",
      name: "Есть ли пробный период для Pro?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Да, для новых пользователей доступен 14-дневный пробный период Pro без ограничений.",
      },
    },
    {
      "@type": "Question",
      name: "Могу ли я перейти на другой тариф?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Да, вы можете повысить или понизить тариф в любой момент. При повышении разница будет пропорционально списана.",
      },
    },
    {
      "@type": "Question",
      name: "Что будет с моими данными при понижении тарифа?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ваши данные сохранятся, но доступ к старой истории и дополнительным позициям в инвентаре будет ограничен.",
      },
    },
    {
      "@type": "Question",
      name: "Как работает пробный период?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "После регистрации вы получаете 14 дней Pro-доступа. Карта не требуется, отмена автоматическая.",
      },
    },
  ],
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {children}
    </>
  )
}
