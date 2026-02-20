import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Choose the right Hookah Torus plan. Free to get started, Pro for active lounges, Enterprise for chains. Inventory management, analytics, API access.',
  keywords: [
    'hookah software pricing',
    'hookah management plans',
    'lounge management cost',
    'Pro plan',
    'Enterprise hookah',
  ],
  openGraph: {
    title: 'Pricing | Hookah Torus',
    description: 'Choose the right plan for your hookah lounge management',
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
      name: "Can I cancel my subscription?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, you can cancel your subscription at any time. Access remains until the end of the paid period.",
      },
    },
    {
      "@type": "Question",
      name: "What payment methods are available?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We accept credit cards (Visa, Mastercard), PayPal, and bank transfers.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a free trial for Pro?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, new users get a 14-day Pro trial with no restrictions.",
      },
    },
    {
      "@type": "Question",
      name: "Can I switch to a different plan?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, you can upgrade or downgrade your plan at any time. When upgrading, the difference is prorated.",
      },
    },
    {
      "@type": "Question",
      name: "What happens to my data if I downgrade?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Your data is preserved, but access to older history and additional inventory slots will be limited.",
      },
    },
    {
      "@type": "Question",
      name: "How does the free trial work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "After signing up you get 14 days of Pro access. No credit card required, cancellation is automatic.",
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
