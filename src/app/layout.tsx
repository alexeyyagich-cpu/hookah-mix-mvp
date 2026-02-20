import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/ThemeContext";
import { AuthProvider } from "@/lib/AuthContext";
import { LocaleProviderBridge } from "@/lib/i18n/LocaleProviderBridge";
import CookieConsent from "@/components/CookieConsent";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Hookah Torus | Mix Calculator & Lounge Management",
    template: "%s | Hookah Torus",
  },
  description: "Create perfect tobacco mixes with AI recommendations. Manage inventory, track sessions, and delight your guests. The complete B2B platform for hookah lounges.",
  keywords: [
    "hookah mix calculator",
    "tobacco mix builder",
    "hookah lounge management",
    "shisha inventory tracker",
    "AI mix recommendations",
    "hookah business software",
    "lounge management platform",
    "hookah session tracking",
  ],
  authors: [{ name: "Hookah Torus" }],
  creator: "Hookah Torus",
  publisher: "Hookah Torus",
  metadataBase: new URL("https://hookahtorus.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://hookahtorus.com",
    siteName: "Hookah Torus",
    title: "Hookah Torus | Mix Calculator & Lounge Management",
    description: "Create perfect tobacco mixes with AI recommendations. The complete B2B platform for hookah lounges.",
    // images auto-generated from opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: "Hookah Torus | Mix Calculator & Lounge Management",
    description: "Create perfect tobacco mixes with AI recommendations",
    // images auto-generated from twitter-image.tsx
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://hookahtorus.com/#website",
      url: "https://hookahtorus.com",
      name: "Hookah Torus",
      description: "Mix calculator and hookah lounge management platform",
      publisher: {
        "@id": "https://hookahtorus.com/#organization",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://hookahtorus.com/#organization",
      name: "Hookah Torus",
      url: "https://hookahtorus.com",
      logo: {
        "@type": "ImageObject",
        url: "https://hookahtorus.com/images/logo.png",
        width: 512,
        height: 512,
      },
      contactPoint: {
        "@type": "ContactPoint",
        email: "htorus@hookahtorus.com",
        contactType: "customer support",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://hookahtorus.com/#app",
      name: "Hookah Torus",
      description: "AI-powered hookah mix calculator and lounge management platform",
      url: "https://hookahtorus.com",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
        description: "Free tier available",
      },
      featureList: [
        "Mix Calculator",
        "AI Recommendations",
        "Inventory Management",
        "Session Tracking",
        "Guest Preferences",
        "Statistics & Analytics",
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#F59E0B" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <LocaleProviderBridge>
            <ThemeProvider>
              {children}
              <CookieConsent />
            </ThemeProvider>
          </LocaleProviderBridge>
        </AuthProvider>
      </body>
    </html>
  );
}
