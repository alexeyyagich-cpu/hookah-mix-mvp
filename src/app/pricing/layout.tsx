import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — Plans for Every Hookah Lounge',
  description: '14-day free trial, no card required. Core plan from €79/month for single locations, Multi from €149/month for chains. All-in-one hookah lounge management.',
  keywords: [
    'hookah software pricing',
    'hookah management plans',
    'lounge management cost',
    'hookah lounge SaaS',
    'shisha bar software',
  ],
  openGraph: {
    title: 'Hookah Torus Pricing — Plans for Every Lounge',
    description: '14-day free trial. Core €79/mo, Multi €149/mo. All-in-one hookah lounge management.',
    url: 'https://hookahtorus.com/pricing',
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
      name: "Is there a free trial?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, new users get a 14-day trial with full access to all Core features. No credit card required.",
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
        text: "Your data is preserved. Multi features (CRM, waiter tablet, financial reports) become read-only on Core plan.",
      },
    },
    {
      "@type": "Question",
      name: "How does the free trial work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "After signing up you get 14 days of full access. No credit card required. After the trial, choose Core (€79/mo) or Multi (€149/mo).",
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') }}
      />
      {children}
    </>
  )
}
